import { headers } from "next/headers";
import { prisma } from "@/server/db";
import { hmac, randomToken, sha256 } from "@/server/crypto";
import { env, isProduction } from "@/server/env";
import { assertIpNotBlocked } from "@/server/auth/ip-block";
import { ApiError, assertSameOrigin, clientIp, jsonOk, readJson, route } from "@/server/http";
import { hitRateLimit } from "@/server/rate-limit";
import { sendMail } from "@/server/mailer";
import { forgotPasswordSchema } from "@/lib/validation";

const TOKEN_TTL_MINUTES = 30;

export const POST = route(async (req) => {
  assertSameOrigin(req);
  const { email } = await readJson(req, forgotPasswordSchema);
  const ip = clientIp(await headers());
  await assertIpNotBlocked(ip);
  const rlIp = await hitRateLimit(`forgot:ip:${hmac(ip)}`, 10, 3600);
  const rlMail = await hitRateLimit(`forgot:mail:${email}`, 3, 3600);
  if (!rlIp.ok) throw new ApiError(429, "RATE_LIMITED", "Too many requests. Please try again later.");

  const generic = { ok: true, message: "If an account exists for this e-mail, a password-reset link has been sent." };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive || !rlMail.ok) return jsonOk(generic);

  const token = randomToken(32);
  await prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000), requestIp: hmac(ip) } });
  const link = `${env().APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const { delivered } = await sendMail({
    to: user.email,
    subject: "Reset your Innova Checker password",
    text: `Hello ${user.fullName},\n\nUse the link below to set a new password. It expires in ${TOKEN_TTL_MINUTES} minutes and can be used once.\n\n${link}\n\nIf you did not request this, ignore this e-mail; your password stays unchanged.\n\nInnova Checker by Innova Networks`,
  });
  // Without SMTP in local development the link is returned so the flow can be tested.
  if (!delivered && !isProduction() && process.env.NODE_ENV === "development") return jsonOk({ ...generic, devResetUrl: link });
  return jsonOk(generic);
});
