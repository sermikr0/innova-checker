import { headers } from "next/headers";
import { z } from "zod";
import { ApiError, assertSameOrigin, clientCountry, clientIp, jsonOk, readJson, route, userAgent } from "@/server/http";
import { hmac } from "@/server/crypto";
import { hitRateLimit } from "@/server/rate-limit";
import { getSystemSettings } from "@/server/settings";
import { getSession } from "@/server/auth/session";
import { requireFingerprint } from "@/server/auth/fingerprint";
import { assertIpNotBlocked } from "@/server/auth/ip-block";
import { checkEmail, normalizeFullName, startConsent } from "@/server/consent/service";
import { getLocale } from "@/i18n/server";
import { consentText } from "@/i18n/messages/consent";
import { TERMS_VERSION } from "@/i18n/messages/legal-types";

const Body = z.object({ fullName: z.string().max(200), email: z.string().max(320), accept: z.boolean(), termsVersion: z.string().max(40) });

/** Accept the Terms of Use with first and last name and e-mail; sends the e-mail code. */
export const POST = route(async (req) => {
  assertSameOrigin(req);
  const h = await headers();
  const ip = clientIp(h);
  await assertIpNotBlocked(ip);
  const locale = await getLocale();
  const t = consentText[locale].errors;
  const body = await readJson(req, Body);
  const fp = requireFingerprint(h);
  if (!body.accept) throw new ApiError(400, "TERMS_NOT_ACCEPTED", t.acceptRequired, { fields: { accept: t.acceptRequired } });
  if (body.termsVersion !== TERMS_VERSION) throw new ApiError(409, "TERMS_UPDATED", t.staleTerms);

  const perIp = await hitRateLimit(`consent:start:${hmac(ip)}`, 12, 3600);
  if (!perIp.ok) throw new ApiError(429, "RATE_LIMITED", t.tooMany);

  const session = await getSession();
  const fullName = normalizeFullName(body.fullName);
  if (!fullName) throw new ApiError(400, "VALIDATION", t.nameInvalid, { fields: { fullName: t.nameInvalid } });
  // Signed-in users confirm the e-mail of their account.
  const checked = await checkEmail(session ? session.user.email : body.email);
  if ("problem" in checked) {
    const msg = checked.problem === "disposable" ? t.emailDisposable : checked.problem === "no-mail" ? t.emailNoMail : t.emailInvalid;
    throw new ApiError(400, "VALIDATION", msg, { fields: { email: msg } });
  }
  const perEmail = await hitRateLimit(`consent:start:mail:${hmac(checked.email)}`, 6, 3600);
  if (!perEmail.ok) throw new ApiError(429, "RATE_LIMITED", t.tooMany);

  const result = await startConsent(await getSystemSettings(), { fullName, email: checked.email, session, locale, ip, country: clientCountry(h), userAgent: userAgent(h), fingerprintHash: fp.hash });
  return jsonOk(result);
});
