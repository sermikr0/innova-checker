import { headers } from "next/headers";
import { z } from "zod";
import { ApiError, assertSameOrigin, clientIp, jsonOk, readJson, route } from "@/server/http";
import { hmac } from "@/server/crypto";
import { hitRateLimit } from "@/server/rate-limit";
import { assertIpNotBlocked } from "@/server/auth/ip-block";
import { verifyConsentCode } from "@/server/consent/service";
import { getLocale } from "@/i18n/server";
import { consentText } from "@/i18n/messages/consent";

const Body = z.object({ code: z.string().trim().max(12) });

/** Confirms the e-mail with the 6-digit code. */
export const POST = route(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(await headers());
  await assertIpNotBlocked(ip);
  const locale = await getLocale();
  const rl = await hitRateLimit(`consent:verify:${hmac(ip)}`, 30, 600);
  if (!rl.ok) throw new ApiError(429, "RATE_LIMITED", consentText[locale].errors.tooMany);
  const body = await readJson(req, Body);
  return jsonOk(await verifyConsentCode(body.code.replace(/\s+/g, ""), locale));
});
