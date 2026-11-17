import { headers } from "next/headers";
import { prisma } from "@/server/db";
import { audit } from "@/server/audit";
import { sha256 } from "@/server/crypto";
import { assertIpNotBlocked } from "@/server/auth/ip-block";
import { ApiError, assertSameOrigin, clientIp, jsonOk, readJson, route, userAgent } from "@/server/http";
import { getSystemSettings } from "@/server/settings";
import { hashPassword } from "@/server/auth/password";
import { resetPasswordSchema } from "@/lib/validation";
import { getT } from "@/i18n/server";
import { authErrorsText } from "@/i18n/messages/auth-errors";
import { validationText } from "@/i18n/messages/validation";

export const POST = route(async (req) => {
  assertSameOrigin(req);
  await assertIpNotBlocked(clientIp(await headers()));
  const body = await readJson(req, resetPasswordSchema);
  const settings = await getSystemSettings();
  const [msg, tv] = await Promise.all([getT(authErrorsText), getT(validationText)]);
  if (body.password.length < settings.passwordMinLength) throw new ApiError(400, "VALIDATION", tv.passwordMin(settings.passwordMinLength), { fields: { password: tv.passwordMin(settings.passwordMinLength) } });

  const t = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(body.token) }, include: { user: true } });
  if (!t || t.usedAt || t.expiresAt < new Date() || !t.user.isActive) throw new ApiError(400, "INVALID_TOKEN", msg.invalidToken);

  const now = new Date();
  await prisma.$transaction([
    prisma.user.update({ where: { id: t.userId }, data: { passwordHash: await hashPassword(body.password), passwordChangedAt: now } }),
    prisma.passwordResetToken.update({ where: { id: t.id }, data: { usedAt: now } }),
    prisma.session.updateMany({ where: { userId: t.userId, revokedAt: null }, data: { revokedAt: now } }),
  ]);
  const h = await headers();
  await audit({ actor: t.user, action: "USER_PASSWORD_RESET", targetType: "User", targetId: t.userId, targetLabel: t.user.email, ip: clientIp(h), userAgent: userAgent(h) });
  return jsonOk({ ok: true, redirect: "/login?reset=1" });
});
