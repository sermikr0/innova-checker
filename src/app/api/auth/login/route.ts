import { cookies, headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/server/db";
import { audit } from "@/server/audit";
import { hmac } from "@/server/crypto";
import { ApiError, assertSameOrigin, clientIp, jsonOk, readJson, route, userAgent } from "@/server/http";
import { clearRateLimit, hitRateLimit } from "@/server/rate-limit";
import { getSystemSettings } from "@/server/settings";
import { burnPasswordCheck, verifyPassword } from "@/server/auth/password";
import { DEVICE_COOKIE, cookieOptions } from "@/server/auth/cookies";
import { resolveDeviceForLogin } from "@/server/auth/devices";
import { requireFingerprint } from "@/server/auth/fingerprint";
import { assertIpNotBlocked, recordAuthFailure } from "@/server/auth/ip-block";
import { createSession } from "@/server/auth/session";
import { safeNextPath } from "@/server/auth/redirect";
import { claimAnonymousScans } from "@/server/scans/service";
import { loginSchema } from "@/lib/validation";
import { getT } from "@/i18n/server";
import { authErrorsText } from "@/i18n/messages/auth-errors";

const Body = loginSchema.extend({ next: z.string().max(300).optional() });

export const POST = route(async (req) => {
  assertSameOrigin(req);
  const h = await headers();
  const ip = clientIp(h);
  await assertIpNotBlocked(ip);
  const body = await readJson(req, Body);
  const ua = userAgent(h);
  const fp = requireFingerprint(h);
  const settings = await getSystemSettings();
  const t = await getT(authErrorsText);

  const perIp = await hitRateLimit(`login:ip:${hmac(ip)}`, 40, 15 * 60);
  if (!perIp.ok) throw new ApiError(429, "RATE_LIMITED", t.loginRateLimited);
  const lockKey = `login:acct:${body.email}`;
  const lockWindow = settings.loginLockoutMinutes * 60;
  const perAccount = await hitRateLimit(lockKey, settings.loginMaxAttempts, lockWindow);
  if (!perAccount.ok) {
    throw new ApiError(429, "ACCOUNT_LOCKED", t.accountLocked(Math.ceil(perAccount.retryAfterSec / 60)));
  }

  const fail = async () => {
    if (await recordAuthFailure(ip, { email: body.email, userAgent: ua })) await assertIpNotBlocked(ip);
    return new ApiError(401, "INVALID_CREDENTIALS", t.invalidCredentials);
  };
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user) {
    await burnPasswordCheck(body.password);
    await audit({ action: "USER_LOGIN_FAILED", targetType: "User", targetLabel: body.email, metadata: { reason: "unknown_email" }, ip, userAgent: ua });
    throw await fail();
  }
  if (!(await verifyPassword(user.passwordHash, body.password))) {
    await audit({ action: "USER_LOGIN_FAILED", targetType: "User", targetId: user.id, targetLabel: user.email, metadata: { reason: "bad_password" }, ip, userAgent: ua });
    throw await fail();
  }
  if (!user.isActive) throw new ApiError(403, "ACCOUNT_DISABLED", t.accountDisabled);
  // Client sign-in can be switched off in Admin → Site controls; administrators always get in.
  if (!settings.loginEnabled && user.role !== "SUPER_ADMIN") {
    await audit({ action: "USER_LOGIN_FAILED", targetType: "User", targetId: user.id, targetLabel: user.email, metadata: { reason: "login_disabled" }, ip, userAgent: ua });
    throw new ApiError(403, "LOGIN_DISABLED", t.loginDisabled);
  }

  const jar = await cookies();
  const { device, browserToken } = await resolveDeviceForLogin({ user, browserToken: jar.get(DEVICE_COOKIE)?.value ?? null, fingerprintHash: fp.hash, ip, userAgent: ua });
  await createSession({ userId: user.id, deviceId: device.id });
  if (browserToken) jar.set(DEVICE_COOKIE, browserToken, cookieOptions(365 * 24 * 3600));
  await clearRateLimit(lockKey, lockWindow);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await claimAnonymousScans(user.id);
  await audit({ actor: user, action: user.role === "SUPER_ADMIN" ? "ADMIN_LOGIN" : "USER_LOGIN", targetType: "User", targetId: user.id, targetLabel: user.email, metadata: { deviceId: device.id, device: device.label }, ip, userAgent: ua });

  const fallback = user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard";
  return jsonOk({ ok: true, redirect: safeNextPath(body.next, fallback) });
});
