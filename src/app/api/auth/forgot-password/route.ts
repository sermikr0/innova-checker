import { headers } from "next/headers";
import { prisma } from "@/server/db";
import { hmac, randomToken, sha256 } from "@/server/crypto";
import { env, isProduction } from "@/server/env";
import { assertIpNotBlocked } from "@/server/auth/ip-block";
import { ApiError, assertSameOrigin, clientIp, jsonOk, readJson, route } from "@/server/http";
import { hitRateLimit } from "@/server/rate-limit";
import { sendMail } from "@/server/mailer";
import { forgotPasswordSchema } from "@/lib/validation";
import { getT } from "@/i18n/server";
import { authErrorsText } from "@/i18n/messages/auth-errors";

const TOKEN_TTL_MINUTES = 30;

export const POST = route(async (req) => {
  assertSameOrigin(req);
  const { email } = await readJson(req, forgotPasswordSchema);
  // getT reads the requester's language (ic_lang cookie, else Accept-Language); the e-mail uses it too.
  const t = await getT(authErrorsText);
  const ip = clientIp(await headers());
  await assertIpNotBlocked(ip);
  const rlIp = await hitRateLimit(`forgot:ip:${hmac(ip)}`, 10, 3600);
  const rlMail = await hitRateLimit(`forgot:mail:${email}`, 3, 3600);
  if (!rlIp.ok) throw new ApiError(429, "RATE_LIMITED", t.forgotRateLimited);

  const generic = { ok: true, message: t.resetLinkSent };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive || !rlMail.ok) return jsonOk(generic);

  const token = randomToken(32);
  await prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000), requestIp: hmac(ip) } });
  const link = `${env().APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const { delivered } = await sendMail({
    to: user.email,
    subject: t.resetEmailSubject,
    text: t.resetEmailBody(user.fullName, TOKEN_TTL_MINUTES, link),
  });
  // Without SMTP in local development the link is returned so the flow can be tested.
  if (!delivered && !isProduction() && process.env.NODE_ENV === "development") return jsonOk({ ...generic, devResetUrl: link });
  return jsonOk(generic);
});
