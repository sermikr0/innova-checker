import { headers } from "next/headers";
import { ApiError, assertSameOrigin, clientIp, jsonOk, route } from "@/server/http";
import { hmac } from "@/server/crypto";
import { hitRateLimit } from "@/server/rate-limit";
import { getSystemSettings } from "@/server/settings";
import { assertIpNotBlocked } from "@/server/auth/ip-block";
import { consentPolicy, pendingConsent, sendCode } from "@/server/consent/service";
import { getLocale } from "@/i18n/server";
import { consentText } from "@/i18n/messages/consent";

/** Sends a new e-mail code (at most once a minute). */
export const POST = route(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(await headers());
  await assertIpNotBlocked(ip);
  const locale = await getLocale();
  const t = consentText[locale].errors;
  const rl = await hitRateLimit(`consent:resend:${hmac(ip)}`, 10, 3600);
  if (!rl.ok) throw new ApiError(429, "RATE_LIMITED", t.tooMany);
  const record = await pendingConsent();
  if (!record) throw new ApiError(400, "CONSENT_NOT_STARTED", t.noPending);
  if (record.emailVerifiedAt || !consentPolicy(await getSystemSettings()).verifyEmail) return jsonOk({ step: "done" });
  return jsonOk(await sendCode(record, locale));
});
