import "server-only";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "../db";
import { randomToken, sha256 } from "../crypto";
import { clientIp, userAgent } from "../http";
import { getSystemSettings } from "../settings";
import { SESSION_COOKIE, cookieOptions } from "./cookies";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  companyName: string;
  role: "SUPER_ADMIN" | "UNLIMITED" | "USER";
};

export type CurrentSession = {
  sessionId: string;
  deviceId: string | null;
  user: SessionUser;
  expiresAt: Date;
};

const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

/** Reads and validates the session cookie. Memoised per request. */
export const getSession = cache(async (): Promise<CurrentSession | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const s = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true, device: true },
  });
  const now = Date.now();
  if (!s || s.revokedAt || s.expiresAt.getTime() <= now) return null;
  if (!s.user.isActive) return null;
  if (s.device && s.device.revokedAt) return null;
  if (s.user.passwordChangedAt && s.createdAt < s.user.passwordChangedAt) return null;

  if (now - s.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    const h = await headers();
    const ip = clientIp(h);
    await prisma.session.update({ where: { id: s.id }, data: { lastSeenAt: new Date(), ipAddress: ip } }).catch(() => {});
    if (s.deviceId) await prisma.device.update({ where: { id: s.deviceId }, data: { lastSeenAt: new Date(), lastIp: ip } }).catch(() => {});
  }
  return {
    sessionId: s.id,
    deviceId: s.deviceId,
    expiresAt: s.expiresAt,
    user: { id: s.user.id, email: s.user.email, fullName: s.user.fullName, companyName: s.user.companyName, role: s.user.role },
  };
});

export async function createSession(input: { userId: string; deviceId: string | null }): Promise<void> {
  const h = await headers();
  const settings = await getSystemSettings();
  const token = randomToken(32);
  const ttl = settings.sessionTtlHours * 3600;
  await prisma.session.create({
    data: { tokenHash: sha256(token), userId: input.userId, deviceId: input.deviceId, ipAddress: clientIp(h), userAgent: userAgent(h), expiresAt: new Date(Date.now() + ttl * 1000) },
  });
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(ttl));
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.updateMany({ where: { tokenHash: sha256(token), revokedAt: null }, data: { revokedAt: new Date() } });
  jar.delete(SESSION_COOKIE);
}

/** For server components/layouts: redirects to /login when signed out. */
export async function requireUser(nextPath?: string): Promise<CurrentSession> {
  const s = await getSession();
  if (!s) redirect(`/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`);
  return s;
}

/** For admin pages: hides the admin area entirely from non-admins. */
export async function requireAdmin(): Promise<CurrentSession> {
  const s = await getSession();
  if (!s) redirect("/login?next=/admin");
  if (s.user.role !== "SUPER_ADMIN") notFound();
  return s;
}
