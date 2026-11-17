"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import { audit, type AuditAction } from "@/server/audit";
import { guard, type ActionResult } from "@/server/actions";
import { ApiError, clientIp, userAgent } from "@/server/http";
import { ProviderKeyError, fetchVirusTotalQuota, refreshVirusTotalQuota, removeProviderKey, resolveProviderKeys, saveProviderKey } from "@/server/integrations";
import { getSession } from "@/server/auth/session";
import { hashPassword } from "@/server/auth/password";
import { revokeDevice } from "@/server/auth/devices";
import { unblockIp } from "@/server/auth/ip-block";
import { invalidateSettingsCache, scannerCreateData } from "@/server/settings";
import { DEFAULT_SCANNER_SETTINGS } from "@/server/scanner/data/defaults";
import { MODULE_KEYS } from "@/server/scanner/types";
import {
  assignSubscription,
  changePlan,
  expireLapsed,
  extendSubscription,
  setExpiry,
  setSubscriptionStatus,
  updateDeviceLimit,
} from "@/server/subscriptions/service";
import {
  createDomainRecord,
  deleteDomainRecord,
  importCsv,
  reviewDomainRecord,
  revalidateDomains,
  startJob,
  syncThreatFeeds,
  updateDomainRecord,
} from "@/server/domain-intel/service";
import { emailSchema, passwordSchema } from "@/lib/validation";

async function admin() {
  const s = await getSession();
  if (!s || s.user.role !== "SUPER_ADMIN") throw new ApiError(403, "FORBIDDEN", "Super Admin access required.");
  return s.user;
}

async function log(actor: { id: string; email: string }, action: AuditAction, target: { type?: string; id?: string; label?: string }, metadata?: Record<string, unknown>) {
  const h = await headers();
  await audit({ actor, action, targetType: target.type, targetId: target.id, targetLabel: target.label, metadata, ip: clientIp(h), userAgent: userAgent(h) });
}

const id = z.string().min(1).max(64);
const optionalText = (max: number) => z.string().trim().max(max).optional().nullable().transform((v) => (v ? v : null));

// ─── Users ────────────────────────────────────────────────────────────────────

const UserCreate = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: emailSchema,
  companyName: z.string().trim().min(2).max(160),
  role: z.enum(["USER", "UNLIMITED", "SUPER_ADMIN"]),
  password: passwordSchema,
});

export async function createUserAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return guard(async () => {
    const actor = await admin();
    const d = UserCreate.parse(input);
    if (await prisma.user.findUnique({ where: { email: d.email } })) return { ok: false, error: "A user with this e-mail already exists.", fields: { email: "Already in use." } };
    const u = await prisma.user.create({ data: { fullName: d.fullName, email: d.email, companyName: d.companyName, role: d.role, passwordHash: await hashPassword(d.password) } });
    await log(actor, "USER_CREATED", { type: "User", id: u.id, label: u.email }, { role: d.role });
    return { ok: true, message: "User created", data: { id: u.id } };
  });
}

const UserUpdate = z.object({ id, fullName: z.string().trim().min(2).max(120), email: emailSchema, companyName: z.string().trim().min(2).max(160), role: z.enum(["USER", "UNLIMITED", "SUPER_ADMIN"]) });

export async function updateUserAction(input: unknown): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    const d = UserUpdate.parse(input);
    const before = await prisma.user.findUniqueOrThrow({ where: { id: d.id } });
    if (before.id === actor.id && d.role !== "SUPER_ADMIN") return { ok: false, error: "You cannot remove your own Super Admin role." };
    const clash = await prisma.user.findUnique({ where: { email: d.email } });
    if (clash && clash.id !== d.id) return { ok: false, error: "Another user already uses this e-mail.", fields: { email: "Already in use." } };
    await prisma.user.update({ where: { id: d.id }, data: { fullName: d.fullName, email: d.email, companyName: d.companyName, role: d.role } });
    await log(actor, before.role !== d.role ? "USER_ROLE_CHANGED" : "USER_UPDATED", { type: "User", id: d.id, label: d.email }, { from: { email: before.email, role: before.role }, to: { email: d.email, role: d.role } });
    return { ok: true, message: "User updated" };
  });
}

/** Grants or removes unlimited usage (no subscription, device or scan limits) for a regular user. */
export async function setUnlimitedAccessAction(userId: string, unlimited: boolean): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    const u = await prisma.user.findUniqueOrThrow({ where: { id: id.parse(userId) } });
    if (u.role === "SUPER_ADMIN") return { ok: false, error: "Super Admins already have unlimited access. Change their role in the edit form if needed." };
    const role = unlimited ? "UNLIMITED" : "USER";
    if (u.role === role) return { ok: true, message: unlimited ? "Already unlimited" : "Already a regular user" };
    await prisma.user.update({ where: { id: u.id }, data: { role } });
    await log(actor, "USER_ROLE_CHANGED", { type: "User", id: u.id, label: u.email }, { from: u.role, to: role });
    return { ok: true, message: unlimited ? `${u.email} now has unlimited access` : `Unlimited access removed from ${u.email}` };
  });
}

export async function setUserActiveAction(userId: string, active: boolean): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    if (userId === actor.id && !active) return { ok: false, error: "You cannot deactivate your own account." };
    const u = await prisma.user.update({ where: { id: id.parse(userId) }, data: { isActive: active } });
    if (!active) await prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await log(actor, active ? "USER_ACTIVATED" : "USER_DEACTIVATED", { type: "User", id: u.id, label: u.email });
    return { ok: true, message: active ? "Account activated" : "Account deactivated and signed out" };
  });
}

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    if (userId === actor.id) return { ok: false, error: "You cannot delete your own account." };
    const u = await prisma.user.findUniqueOrThrow({ where: { id: id.parse(userId) } });
    await log(actor, "USER_DELETED", { type: "User", id: u.id, label: u.email }, { role: u.role, company: u.companyName });
    await prisma.user.delete({ where: { id: u.id } });
    return { ok: true, message: "User deleted" };
  });
}

export async function adminResetPasswordAction(userId: string, password: string): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    const pw = passwordSchema.parse(password);
    const now = new Date();
    const u = await prisma.user.update({ where: { id: id.parse(userId) }, data: { passwordHash: await hashPassword(pw), passwordChangedAt: now } });
    await prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } });
    await log(actor, "USER_PASSWORD_RESET", { type: "User", id: u.id, label: u.email }, { byAdmin: true });
    return { ok: true, message: "Password reset; the user was signed out everywhere" };
  });
}

export async function adminRevokeDeviceAction(userId: string, deviceId: string): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    const h = await headers();
    await revokeDevice({ deviceId: id.parse(deviceId), userId: id.parse(userId), actor, reason: "ADMIN", ip: clientIp(h), userAgent: userAgent(h) });
    return { ok: true, message: "Device revoked" };
  });
}

export async function adminRevokeSessionsAction(userId: string): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    const r = await prisma.session.updateMany({ where: { userId: id.parse(userId), revokedAt: null }, data: { revokedAt: new Date() } });
    await log(actor, "SESSION_REVOKED", { type: "User", id: userId }, { count: r.count });
    return { ok: true, message: `Signed out ${r.count} session(s)` };
  });
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

const date = z.string().min(8).max(40).transform((v, ctx) => {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) {
    ctx.addIssue({ code: "custom", message: "Invalid date" });
    return z.NEVER;
  }
  return d;
});

const Assign = z.object({ userId: id, planId: id, startsAt: date.optional(), expiresAt: date.optional(), deviceLimit: z.coerce.number().int().min(1).max(1000).optional(), note: z.string().trim().max(500).optional() });

export async function assignSubscriptionAction(input: unknown): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    const d = Assign.parse(input);
    const sub = await assignSubscription({ ...d, actor });
    const u = await prisma.user.findUnique({ where: { id: d.userId }, select: { email: true } });
    await log(actor, "SUBSCRIPTION_ASSIGNED", { type: "Subscription", id: sub.id, label: u?.email }, { plan: sub.plan.name, expiresAt: sub.expiresAt });
    return { ok: true, message: `${sub.plan.name} assigned` };
  });
}

export async function changePlanAction(subId: string, planId: string, recomputeExpiry: boolean): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    const sub = await changePlan(id.parse(subId), id.parse(planId), { recomputeExpiry, actor });
    await log(actor, "SUBSCRIPTION_CHANGED", { type: "Subscription", id: sub.id }, { plan: sub.plan.name, recomputeExpiry });
    return { ok: true, message: "Plan changed" };
  });
}

export async function extendSubscriptionAction(subId: string, value: number, unit: "DAY" | "MONTH" | "YEAR"): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    const sub = await extendSubscription(id.parse(subId), z.coerce.number().int().parse(value), z.enum(["DAY", "MONTH", "YEAR"]).parse(unit), actor);
    await log(actor, "SUBSCRIPTION_EXTENDED", { type: "Subscription", id: sub.id }, { by: `${value} ${unit}`, expiresAt: sub.expiresAt });
    return { ok: true, message: "Subscription extended" };
  });
}

export async function setExpiryAction(subId: string, expiresAt: string): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    const sub = await setExpiry(id.parse(subId), date.parse(expiresAt), actor);
    await log(actor, "SUBSCRIPTION_EXPIRY_SET", { type: "Subscription", id: sub.id }, { expiresAt: sub.expiresAt });
    return { ok: true, message: "Expiration date updated" };
  });
}

export async function setSubscriptionStatusAction(subId: string, status: "ACTIVE" | "SUSPENDED" | "CANCELLED"): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    const st = z.enum(["ACTIVE", "SUSPENDED", "CANCELLED"]).parse(status);
    const sub = await setSubscriptionStatus(id.parse(subId), st, actor);
    await log(actor, st === "ACTIVE" ? "SUBSCRIPTION_ACTIVATED" : st === "SUSPENDED" ? "SUBSCRIPTION_SUSPENDED" : "SUBSCRIPTION_DEACTIVATED", { type: "Subscription", id: sub.id }, { status: st });
    return { ok: true, message: `Subscription ${st === "ACTIVE" ? "activated" : st === "SUSPENDED" ? "suspended" : "deactivated"}` };
  });
}

export async function updateDeviceLimitAction(subId: string, limit: number): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    const sub = await updateDeviceLimit(id.parse(subId), z.coerce.number().int().parse(limit), actor);
    await log(actor, "SUBSCRIPTION_CHANGED", { type: "Subscription", id: sub.id }, { deviceLimit: sub.deviceLimit });
    return { ok: true, message: "Device limit updated" };
  });
}

export async function expireLapsedAction(): Promise<ActionResult> {
  return guard(async () => {
    await admin();
    const n = await expireLapsed();
    return { ok: true, message: `${n} lapsed subscription(s) marked expired` };
  });
}

// ─── Plans & pricing ──────────────────────────────────────────────────────────

const Plan = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,40}$/, "Use lowercase letters, digits and dashes."),
  description: z.string().trim().min(5).max(400),
  durationValue: z.coerce.number().int().min(1).max(120),
  durationUnit: z.enum(["DAY", "MONTH", "YEAR"]),
  priceUzs: z.coerce.number().int().min(0).max(1_000_000_000),
  priceUsdCents: z.coerce.number().int().min(0).max(100_000_000).default(0),
  deviceLimit: z.coerce.number().int().min(1).max(1000),
  features: z.array(z.string().trim().min(1).max(160)).max(20),
  isActive: z.boolean(),
  isRecommended: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(1000),
});

async function onlyOneRecommended(tx: Prisma.TransactionClient, keepId: string) {
  await tx.subscriptionPlan.updateMany({ where: { isRecommended: true, NOT: { id: keepId } }, data: { isRecommended: false } });
}

export async function createPlanAction(input: unknown): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    const d = Plan.parse(input);
    if (await prisma.subscriptionPlan.findUnique({ where: { slug: d.slug } })) return { ok: false, error: "Slug already in use.", fields: { slug: "Already in use." } };
    const p = await prisma.$transaction(async (tx) => {
      const p = await tx.subscriptionPlan.create({ data: d });
      if (d.isRecommended) await onlyOneRecommended(tx, p.id);
      return p;
    });
    await log(actor, "PLAN_CREATED", { type: "SubscriptionPlan", id: p.id, label: p.name }, d);
    return { ok: true, message: "Plan created" };
  });
}

export async function updatePlanAction(planId: string, input: unknown): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    const d = Plan.parse(input);
    const before = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { id: id.parse(planId) } });
    const clash = await prisma.subscriptionPlan.findUnique({ where: { slug: d.slug } });
    if (clash && clash.id !== planId) return { ok: false, error: "Slug already in use.", fields: { slug: "Already in use." } };
    await prisma.$transaction(async (tx) => {
      await tx.subscriptionPlan.update({ where: { id: planId }, data: d });
      if (d.isRecommended) await onlyOneRecommended(tx, planId);
    });
    await log(actor, "PLAN_UPDATED", { type: "SubscriptionPlan", id: planId, label: d.name }, { from: { priceUzs: before.priceUzs, deviceLimit: before.deviceLimit, durationValue: before.durationValue, durationUnit: before.durationUnit, isActive: before.isActive }, to: { priceUzs: d.priceUzs, deviceLimit: d.deviceLimit, durationValue: d.durationValue, durationUnit: d.durationUnit, isActive: d.isActive } });
    return { ok: true, message: "Plan updated. Existing subscriptions keep their terms." };
  });
}

export async function deletePlanAction(planId: string): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    const p = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { id: id.parse(planId) }, include: { _count: { select: { subscriptions: true } } } });
    if (p._count.subscriptions > 0) return { ok: false, error: `This plan is used by ${p._count.subscriptions} subscription(s). Disable it instead of deleting.` };
    await prisma.subscriptionPlan.delete({ where: { id: planId } });
    await log(actor, "PLAN_DELETED", { type: "SubscriptionPlan", id: planId, label: p.name });
    return { ok: true, message: "Plan deleted" };
  });
}

const Pricing = z.object({ paymentNotice: z.string().trim().min(5).max(300), ctaLabel: z.string().trim().min(2).max(40), highlightLabel: z.string().trim().min(2).max(40), showComparison: z.boolean() });

export async function updatePricingConfigAction(input: unknown): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    const d = Pricing.parse(input);
    await prisma.pricingConfiguration.upsert({ where: { id: "default" }, update: { ...d, updatedById: actor.id }, create: { id: "default", ...d, updatedById: actor.id } });
    invalidateSettingsCache();
    await log(actor, "PRICING_SETTINGS_UPDATED", { type: "PricingConfiguration", id: "default" }, d);
    return { ok: true, message: "Pricing settings saved" };
  });
}

// ─── Domain intelligence ──────────────────────────────────────────────────────

const DomainRec = z.object({
  domain: z.string().trim().min(3).max(2000),
  listType: z.enum(["WHITELIST", "BLACKLIST", "SUSPICIOUS"]),
  scope: z.enum(["DOMAIN", "HOST", "URL"]),
  status: z.enum(["ACTIVE", "PENDING", "REJECTED"]),
  trustStatus: z.enum(["VERIFIED_OFFICIAL", "CONFIRMED_MALICIOUS", "SUSPECTED", "UNVERIFIED"]),
  platformName: optionalText(120),
  companyName: optionalText(160),
  officialUrl: optionalText(500),
  category: optionalText(120),
  brandKeywords: z.array(z.string().trim().toLowerCase().min(2).max(40)).max(20),
  verificationSource: optionalText(2000),
  verifiedAt: z.string().optional().nullable().transform((v) => (v ? new Date(v) : null)),
  notes: optionalText(2000),
});

export async function saveDomainRecordAction(recordId: string | null, input: unknown): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    const d = DomainRec.parse(input);
    if (d.verifiedAt && Number.isNaN(d.verifiedAt.getTime())) return { ok: false, error: "Invalid verification date." };
    if (recordId) await updateDomainRecord(id.parse(recordId), d, actor);
    else await createDomainRecord({ ...d, origin: "ADMIN" }, actor);
    return { ok: true, message: recordId ? "Record updated" : "Record added" };
  });
}

export async function deleteDomainRecordAction(recordId: string): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    await deleteDomainRecord(id.parse(recordId), actor);
    return { ok: true, message: "Record deleted" };
  });
}

export async function reviewDomainRecordAction(recordId: string, decision: "APPROVE" | "REJECT", note?: string): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    await reviewDomainRecord(id.parse(recordId), z.enum(["APPROVE", "REJECT"]).parse(decision), actor, note?.slice(0, 500));
    return { ok: true, message: decision === "APPROVE" ? "Approved and activated" : "Rejected" };
  });
}

export async function importDomainsCsvAction(text: string, overwrite: boolean): Promise<ActionResult<Awaited<ReturnType<typeof importCsv>>>> {
  return guard(async () => {
    const actor = await admin();
    if (text.length > 5_000_000) return { ok: false, error: "File is too large (5 MB maximum)." };
    const r = await importCsv(text, actor, { overwrite });
    return { ok: true, message: `Imported: ${r.created} new, ${r.updated} updated, ${r.skipped} skipped, ${r.pendingForMissingEvidence} set to pending (missing evidence), ${r.errors.length} error(s)`, data: r };
  });
}

// Jobs run in the background (after the response) so the admin UI never blocks on them;
// progress is polled from /api/admin/jobs.
export async function runDomainJobAction(job: "revalidate" | "feeds"): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    const urlhaus = (await resolveProviderKeys()).urlhaus;
    const r =
      job === "revalidate"
        ? await startJob("domain-revalidation", `manual:${actor.email}`, (progress) => revalidateDomains({ limit: 300, onProgress: progress }), (task) => after(task))
        : await startJob("threat-feed-sync", `manual:${actor.email}`, (progress) => syncThreatFeeds({ urlhaus }, progress), (task) => after(task));
    if (!r.started) return { ok: false, error: "This job is already running. Progress is shown above the table." };
    return { ok: true, message: `${job === "revalidate" ? "Revalidation" : "Threat-feed sync"} started in the background. You can keep working.` };
  });
}

// ─── Scanner configuration ────────────────────────────────────────────────────

const lines = (max: number) => z.array(z.string().trim().toLowerCase().min(1).max(200)).max(max);
const Scanner = z.object({
  modules: z.record(z.string(), z.boolean()),
  providers: z.record(z.string(), z.boolean()),
  weights: z.record(z.string(), z.coerce.number().min(0).max(5)),
  suspiciousKeywords: lines(500),
  suspiciousTlds: lines(300),
  urlShorteners: lines(500),
  suspiciousDomainPatterns: lines(1000).refine((a) => a.every((p) => /^[a-z0-9.*?-]+$/.test(p)), "Patterns may contain only letters, digits, dots, dashes, * and ?."),
  trustedDomains: lines(1000),
  requestTimeoutMs: z.coerce.number().int().min(1000).max(30000),
  scanTimeoutMs: z.coerce.number().int().min(5000).max(120000),
  maxRedirects: z.coerce.number().int().min(0).max(15),
  maxResponseBytes: z.coerce.number().int().min(50_000).max(10_000_000),
  maxDownloadBytes: z.coerce.number().int().min(100_000).max(50_000_000),
  userAgent: z.string().trim().min(10).max(300),
  virusTotalSubmitUnknown: z.boolean(),
});

export async function updateScannerConfigAction(input: unknown): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    const d = Scanner.parse(input);
    const modules = Object.fromEntries(MODULE_KEYS.map((k) => [k, d.modules[k] ?? true]));
    const providers = Object.fromEntries(Object.keys(DEFAULT_SCANNER_SETTINGS.providers).map((k) => [k, d.providers[k] ?? true]));
    const weights = Object.fromEntries(MODULE_KEYS.map((k) => [k, d.weights[k] ?? 1]));
    await prisma.scannerConfiguration.upsert({
      where: { id: "default" },
      update: { ...d, modules, providers, weights, updatedById: actor.id },
      create: { ...scannerCreateData(), ...d, modules, providers, weights, updatedById: actor.id },
    });
    invalidateSettingsCache();
    await log(actor, "SCANNER_CONFIG_UPDATED", { type: "ScannerConfiguration", id: "default" }, { modules, providers, weights, maxRedirects: d.maxRedirects, requestTimeoutMs: d.requestTimeoutMs, scanTimeoutMs: d.scanTimeoutMs });
    return { ok: true, message: "Scanner configuration saved; it applies to the next scan" };
  });
}

export async function resetScannerDefaultsAction(): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    const data = scannerCreateData();
    await prisma.scannerConfiguration.upsert({ where: { id: "default" }, update: { ...data, id: undefined, updatedById: actor.id }, create: data });
    invalidateSettingsCache();
    await log(actor, "SCANNER_CONFIG_UPDATED", { type: "ScannerConfiguration", id: "default" }, { reset: true });
    return { ok: true, message: "Scanner configuration reset to defaults" };
  });
}

// ─── System settings ──────────────────────────────────────────────────────────

const System = z.object({
  siteName: z.string().trim().min(2).max(80),
  supportEmail: emailSchema,
  freeScanLimit: z.coerce.number().int().min(0).max(100),
  anonymousIpDailyLimit: z.coerce.number().int().min(0).max(10000),
  registrationEnabled: z.boolean(),
  sessionTtlHours: z.coerce.number().int().min(1).max(24 * 90),
  loginMaxAttempts: z.coerce.number().int().min(3).max(50),
  loginLockoutMinutes: z.coerce.number().int().min(1).max(1440),
  ipBlockMinutes: z.coerce.number().int().min(1).max(60 * 24 * 30),
  paymentWindowSeconds: z.coerce.number().int().min(60).max(1800),
  passwordMinLength: z.coerce.number().int().min(1).max(64),
  deviceRemovalsPer30Days: z.coerce.number().int().min(0).max(100),
  allowUserDeviceRemoval: z.boolean(),
  noSubscriptionDeviceLimit: z.coerce.number().int().min(1).max(50),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().trim().min(5).max(400),
});

export async function updateSystemSettingsAction(input: unknown): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    const d = System.parse(input);
    const before = await prisma.systemSetting.findUnique({ where: { id: "default" } });
    await prisma.systemSetting.upsert({ where: { id: "default" }, update: { ...d, updatedById: actor.id }, create: { id: "default", ...d, updatedById: actor.id } });
    const changed = before ? Object.fromEntries(Object.entries(d).filter(([k, v]) => (before as Record<string, unknown>)[k] !== v).map(([k, v]) => [k, { from: (before as Record<string, unknown>)[k], to: v }])) : d;
    invalidateSettingsCache();
    await log(actor, "SYSTEM_SETTINGS_UPDATED", { type: "SystemSetting", id: "default" }, { changed });
    return { ok: true, message: "Settings saved" };
  });
}

export async function markMessageHandledAction(messageId: string): Promise<ActionResult> {
  return guard(async () => {
    await admin();
    await prisma.contactMessage.update({ where: { id: id.parse(messageId) }, data: { handledAt: new Date() } });
    return { ok: true, message: "Marked as handled" };
  });
}

// ─── Integrations (threat-intelligence API keys) ─────────────────────────────

const ProviderIdSchema = z.enum(["googleSafeBrowsing", "virusTotal", "urlhaus", "phishTank", "abuseIpdb"]);
const ApiKeySchema = z.string().trim().min(16, "This does not look like an API key.").max(200).regex(/^[A-Za-z0-9_\-.:]+$/, "API keys contain only letters, digits and - _ . :");

export async function saveProviderKeyAction(provider: string, apiKey: string): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    const p = ProviderIdSchema.parse(provider);
    const key = ApiKeySchema.parse(apiKey);
    let note = "saved";
    if (p === "virusTotal") {
      try {
        const q = await fetchVirusTotalQuota(key);
        note = `validated with VirusTotal (daily ${q.daily?.used ?? "?"}/${q.daily?.allowed ?? "?"})`;
      } catch (e) {
        if (e instanceof ProviderKeyError) return { ok: false, error: e.message };
        throw e;
      }
    }
    await saveProviderKey(p, key, actor.id);
    if (p === "virusTotal") await refreshVirusTotalQuota(0).catch(() => null);
    await log(actor, "INTEGRATION_KEY_UPDATED", { type: "ProviderCredential", id: p, label: p }, { keyHint: key.slice(-4) });
    return { ok: true, message: `API key ${note}. New scans use it immediately.` };
  });
}

export async function removeProviderKeyAction(provider: string): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    const p = ProviderIdSchema.parse(provider);
    await removeProviderKey(p);
    await log(actor, "INTEGRATION_KEY_REMOVED", { type: "ProviderCredential", id: p, label: p });
    return { ok: true, message: "Stored key removed. The environment variable is used if set." };
  });
}

export async function refreshVtQuotaAction(): Promise<ActionResult> {
  return guard(async () => {
    await admin();
    try {
      const q = await refreshVirusTotalQuota(0);
      if (!q) return { ok: false, error: "No VirusTotal key is configured." };
      return { ok: true, message: "Quota refreshed" };
    } catch (e) {
      if (e instanceof ProviderKeyError) return { ok: false, error: e.message };
      throw e;
    }
  });
}

// ─── Security ─────────────────────────────────────────────────────────────────

export async function unblockIpAction(blockId: string): Promise<ActionResult> {
  return guard(async () => {
    const actor = await admin();
    await unblockIp(id.parse(blockId), actor, clientIp(await headers()));
    return { ok: true, message: "IP unblocked" };
  });
}
