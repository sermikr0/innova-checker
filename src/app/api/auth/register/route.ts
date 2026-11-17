import { cookies, headers } from "next/headers";
import { prisma } from "@/server/db";
import { audit } from "@/server/audit";
import { hmac } from "@/server/crypto";
import { ApiError, assertSameOrigin, clientIp, jsonOk, readJson, route, userAgent } from "@/server/http";
import { hitRateLimit } from "@/server/rate-limit";
import { getSystemSettings } from "@/server/settings";
import { hashPassword } from "@/server/auth/password";
import { DEVICE_COOKIE, cookieOptions } from "@/server/auth/cookies";
import { resolveDeviceForLogin } from "@/server/auth/devices";
import { requireFingerprint } from "@/server/auth/fingerprint";
import { assertIpNotBlocked } from "@/server/auth/ip-block";
import { createSession } from "@/server/auth/session";
import { claimAnonymousScans } from "@/server/scans/service";
import { registerSchema } from "@/lib/validation";

export const POST = route(async (req) => {
  assertSameOrigin(req);
  const settings = await getSystemSettings();
  if (!settings.registrationEnabled) throw new ApiError(403, "REGISTRATION_DISABLED", "Self-registration is currently disabled. Contact Innova Networks for an account.");
  const body = await readJson(req, registerSchema);
  if (body.password.length < settings.passwordMinLength) {
    throw new ApiError(400, "VALIDATION", `Use at least ${settings.passwordMinLength} characters.`, { fields: { password: `Use at least ${settings.passwordMinLength} characters.` } });
  }
  const h = await headers();
  const ip = clientIp(h);
  await assertIpNotBlocked(ip);
  const ua = userAgent(h);
  const fp = requireFingerprint(h);
  const rl = await hitRateLimit(`register:${hmac(ip)}`, 10, 3600);
  if (!rl.ok) throw new ApiError(429, "RATE_LIMITED", "Too many sign-ups from this network. Please try again later.");

  const exists = await prisma.user.findUnique({ where: { email: body.email }, select: { id: true } });
  if (exists) throw new ApiError(409, "EMAIL_TAKEN", "An account with this e-mail already exists. Log in instead.", { fields: { email: "An account with this e-mail already exists." } });

  const user = await prisma.user.create({
    data: { email: body.email, fullName: body.fullName, companyName: body.companyName, passwordHash: await hashPassword(body.password) },
  });
  await audit({ actor: user, action: "USER_REGISTERED", targetType: "User", targetId: user.id, targetLabel: user.email, ip, userAgent: ua });

  const jar = await cookies();
  const { device, browserToken } = await resolveDeviceForLogin({ user, browserToken: jar.get(DEVICE_COOKIE)?.value ?? null, fingerprintHash: fp.hash, ip, userAgent: ua });
  await createSession({ userId: user.id, deviceId: device.id });
  if (browserToken) jar.set(DEVICE_COOKIE, browserToken, cookieOptions(365 * 24 * 3600));
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await claimAnonymousScans(user.id);
  return jsonOk({ ok: true, redirect: "/dashboard" }, { status: 201 });
});
