import { cookies, headers } from "next/headers";
import { prisma } from "@/server/db";
import { audit } from "@/server/audit";
import { hmac } from "@/server/crypto";
import { ApiError, assertSameOrigin, clientCountry, clientIp, jsonOk, readJson, route, userAgent } from "@/server/http";
import { hitRateLimit } from "@/server/rate-limit";
import { getSystemSettings } from "@/server/settings";
import { hashPassword } from "@/server/auth/password";
import { DEVICE_COOKIE, cookieOptions } from "@/server/auth/cookies";
import { resolveDeviceForLogin } from "@/server/auth/devices";
import { requireFingerprint } from "@/server/auth/fingerprint";
import { assertIpNotBlocked } from "@/server/auth/ip-block";
import { createSession } from "@/server/auth/session";
import { claimAnonymousScans } from "@/server/scans/service";
import { z } from "zod";
import { registerSchema } from "@/lib/validation";
import { recordRegistrationConsent } from "@/server/consent/service";
import { consentText } from "@/i18n/messages/consent";
import { TERMS_VERSION } from "@/i18n/messages/legal-types";
import { getLocale, getT } from "@/i18n/server";
import { authErrorsText } from "@/i18n/messages/auth-errors";
import { validationText } from "@/i18n/messages/validation";

export const POST = route(async (req) => {
  assertSameOrigin(req);
  const settings = await getSystemSettings();
  const [t, tv] = await Promise.all([getT(authErrorsText), getT(validationText)]);
  if (!settings.registrationEnabled || !settings.loginEnabled) throw new ApiError(403, "REGISTRATION_DISABLED", t.registrationDisabled);
  // The Terms of Use checkbox is required; acceptance is recorded with the account.
  const body = await readJson(req, registerSchema.and(z.object({ acceptTerms: z.boolean().optional(), termsVersion: z.string().max(40).optional() })));
  const locale = await getLocale();
  if (body.acceptTerms !== true) throw new ApiError(400, "TERMS_NOT_ACCEPTED", consentText[locale].errors.acceptRequired);
  if (body.termsVersion !== TERMS_VERSION) throw new ApiError(409, "TERMS_UPDATED", consentText[locale].errors.staleTerms);
  if (body.password.length < settings.passwordMinLength) {
    throw new ApiError(400, "VALIDATION", tv.passwordMin(settings.passwordMinLength), { fields: { password: tv.passwordMin(settings.passwordMinLength) } });
  }
  const h = await headers();
  const ip = clientIp(h);
  await assertIpNotBlocked(ip);
  const ua = userAgent(h);
  const fp = requireFingerprint(h);
  const rl = await hitRateLimit(`register:${hmac(ip)}`, 10, 3600);
  if (!rl.ok) throw new ApiError(429, "RATE_LIMITED", t.registerRateLimited);

  const exists = await prisma.user.findUnique({ where: { email: body.email }, select: { id: true } });
  if (exists) throw new ApiError(409, "EMAIL_TAKEN", t.emailTaken, { fields: { email: t.emailTakenField } });

  const user = await prisma.user.create({
    data: { email: body.email, fullName: body.fullName, companyName: body.companyName, passwordHash: await hashPassword(body.password) },
  });
  await audit({ actor: user, action: "USER_REGISTERED", targetType: "User", targetId: user.id, targetLabel: user.email, ip, userAgent: ua });
  await recordRegistrationConsent(user.id, { fullName: user.fullName, email: user.email, locale, ip, country: clientCountry(h), userAgent: ua, fingerprintHash: fp.hash });

  const jar = await cookies();
  const { device, browserToken } = await resolveDeviceForLogin({ user, browserToken: jar.get(DEVICE_COOKIE)?.value ?? null, fingerprintHash: fp.hash, ip, userAgent: ua });
  await createSession({ userId: user.id, deviceId: device.id });
  if (browserToken) jar.set(DEVICE_COOKIE, browserToken, cookieOptions(365 * 24 * 3600));
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await claimAnonymousScans(user.id);
  return jsonOk({ ok: true, redirect: "/dashboard" }, { status: 201 });
});
