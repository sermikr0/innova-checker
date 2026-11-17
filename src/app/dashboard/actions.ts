"use server";

import { headers } from "next/headers";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import { audit } from "@/server/audit";
import { guard, type ActionResult } from "@/server/actions";
import { ApiError, clientIp, userAgent } from "@/server/http";
import { getSession, createSession } from "@/server/auth/session";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { revokeDevice } from "@/server/auth/devices";
import { getSystemSettings } from "@/server/settings";
import { submitDomain } from "@/server/domain-intel/service";
import { changePasswordSchema, profileSchema } from "@/lib/validation";
import { preferencesSchema } from "@/lib/preferences";
import { getT } from "@/i18n/server";
import { dashboardText } from "@/i18n/messages/dashboard";

/** Result messages of these actions, in the interface language. */
async function msg() {
  return (await getT(dashboardText)).actions;
}

async function me() {
  const s = await getSession();
  if (!s) throw new ApiError(401, "UNAUTHENTICATED", (await msg()).sessionExpired);
  return s;
}

async function reqMeta() {
  const h = await headers();
  return { ip: clientIp(h), userAgent: userAgent(h) };
}

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  return guard(async () => {
    const s = await me();
    const data = profileSchema.parse(input);
    await prisma.user.update({ where: { id: s.user.id }, data });
    await audit({ actor: s.user, action: "USER_UPDATED", targetType: "User", targetId: s.user.id, targetLabel: s.user.email, metadata: { self: true, fields: Object.keys(data) }, ...(await reqMeta()) });
    return { ok: true, message: (await msg()).profileUpdated };
  });
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  return guard(async (): Promise<ActionResult> => {
    const s = await me();
    const data = changePasswordSchema.parse(input);
    const settings = await getSystemSettings();
    const m = await msg();
    if (data.newPassword.length < settings.passwordMinLength) return { ok: false, error: m.minLength(settings.passwordMinLength), fields: { newPassword: m.minLength(settings.passwordMinLength) } };
    const user = await prisma.user.findUniqueOrThrow({ where: { id: s.user.id } });
    if (!(await verifyPassword(user.passwordHash, data.currentPassword))) return { ok: false, error: m.wrongCurrentPassword, fields: { currentPassword: m.incorrectPassword } };
    const now = new Date();
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(data.newPassword), passwordChangedAt: now } }),
      prisma.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: now } }),
    ]);
    // Keep this browser signed in with a fresh session; every other session is revoked.
    await createSession({ userId: user.id, deviceId: s.deviceId });
    await audit({ actor: s.user, action: "USER_PASSWORD_CHANGED", targetType: "User", targetId: user.id, targetLabel: user.email, ...(await reqMeta()) });
    return { ok: true, message: m.passwordChanged };
  });
}

export async function updatePreferencesAction(input: unknown): Promise<ActionResult> {
  return guard(async () => {
    const s = await me();
    const prefs = preferencesSchema.parse(input);
    await prisma.user.update({ where: { id: s.user.id }, data: { preferences: prefs as Prisma.InputJsonValue } });
    return { ok: true, message: (await msg()).preferencesSaved };
  });
}

export async function revokeMyDeviceAction(deviceId: string): Promise<ActionResult> {
  return guard(async () => {
    const s = await me();
    const settings = await getSystemSettings();
    const t = await getT(dashboardText);
    if (!settings.allowUserDeviceRemoval) return { ok: false, error: t.devices.removalManaged };
    if (deviceId === s.deviceId) return { ok: false, error: t.actions.useLogoutDevice };
    await revokeDevice({ deviceId: z.string().min(1).parse(deviceId), userId: s.user.id, actor: s.user, reason: "USER", ...(await reqMeta()) });
    return { ok: true, message: t.actions.deviceRemoved };
  });
}

export async function revokeMySessionAction(sessionId: string): Promise<ActionResult> {
  return guard(async () => {
    const s = await me();
    const m = await msg();
    if (sessionId === s.sessionId) return { ok: false, error: m.useLogoutSession };
    const r = await prisma.session.updateMany({ where: { id: sessionId, userId: s.user.id, revokedAt: null }, data: { revokedAt: new Date() } });
    if (!r.count) return { ok: false, error: m.sessionNotFound };
    await audit({ actor: s.user, action: "SESSION_REVOKED", targetType: "Session", targetId: sessionId, metadata: { self: true }, ...(await reqMeta()) });
    return { ok: true, message: m.sessionSignedOut };
  });
}

export async function signOutOtherSessionsAction(): Promise<ActionResult> {
  return guard(async () => {
    const s = await me();
    const r = await prisma.session.updateMany({ where: { userId: s.user.id, revokedAt: null, NOT: { id: s.sessionId } }, data: { revokedAt: new Date() } });
    await audit({ actor: s.user, action: "SESSION_REVOKED", targetType: "User", targetId: s.user.id, metadata: { self: true, count: r.count, scope: "all-other" }, ...(await reqMeta()) });
    return { ok: true, message: (await msg()).signedOutOthers(r.count) };
  });
}

export async function deleteScanHistoryAction(): Promise<ActionResult> {
  return guard(async () => {
    const s = await me();
    const r = await prisma.scan.deleteMany({ where: { userId: s.user.id } });
    return { ok: true, message: (await msg()).scansDeleted(r.count) };
  });
}

export async function deleteAccountAction(password: string): Promise<ActionResult> {
  return guard(async () => {
    const s = await me();
    const m = await msg();
    if (s.user.role === "SUPER_ADMIN") return { ok: false, error: m.superAdminNoDelete };
    const user = await prisma.user.findUniqueOrThrow({ where: { id: s.user.id } });
    if (!(await verifyPassword(user.passwordHash, z.string().max(128).parse(password)))) return { ok: false, error: m.incorrectPassword };
    await audit({ actor: null, action: "ACCOUNT_DELETED", targetType: "User", targetId: user.id, targetLabel: user.email, metadata: { self: true }, ...(await reqMeta()) });
    await prisma.user.delete({ where: { id: user.id } });
    return { ok: true, message: m.accountDeleted };
  });
}

const reportDomainSchema = (reasonMin: string) =>
  z.object({
    domain: z.string().trim().min(3).max(253),
    listType: z.enum(["BLACKLIST", "SUSPICIOUS", "WHITELIST"]),
    reason: z.string().trim().min(5, reasonMin).max(1000),
    evidenceUrl: z.string().trim().max(500).optional().or(z.literal("")),
  });

export async function reportDomainAction(input: unknown): Promise<ActionResult> {
  return guard(async () => {
    const s = await me();
    const m = await msg();
    const d = reportDomainSchema(m.reasonMin).parse(input);
    const { duplicate } = await submitDomain({ domain: d.domain, listType: d.listType, reason: d.reason, evidenceUrl: d.evidenceUrl || undefined, userId: s.user.id, userEmail: s.user.email });
    return { ok: true, message: duplicate ? m.domainKnown : m.reportThanks };
  });
}
