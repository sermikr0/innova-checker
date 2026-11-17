import { headers } from "next/headers";
import { z } from "zod";
import { ApiError, assertSameOrigin, clientIp, jsonOk, readJson, route, userAgent } from "@/server/http";
import { getSession } from "@/server/auth/session";
import { requireFingerprint } from "@/server/auth/fingerprint";
import { assertIpNotBlocked } from "@/server/auth/ip-block";
import { hitRateLimit } from "@/server/rate-limit";
import { prisma } from "@/server/db";
import { createPaymentIntent } from "@/server/payments/service";

const Body = z.object({ plan: z.string().trim().min(1).max(64), provider: z.enum(["CLICK", "CARD"]) });

export const POST = route(async (req) => {
  assertSameOrigin(req);
  const h = await headers();
  const ip = clientIp(h);
  await assertIpNotBlocked(ip);
  const session = await getSession();
  if (!session) throw new ApiError(401, "UNAUTHENTICATED", "Sign in to buy a subscription.");
  if (!session.deviceId) throw new ApiError(403, "DEVICE_REQUIRED", "This session is not bound to a registered device. Please sign in again.");
  const fp = requireFingerprint(h);
  // The QR code is bound to the device that asked for it.
  const device = await prisma.device.findUnique({ where: { id: session.deviceId }, select: { fingerprintHash: true, revokedAt: true } });
  if (!device || device.revokedAt || (device.fingerprintHash && device.fingerprintHash !== fp.hash)) {
    throw new ApiError(403, "DEVICE_MISMATCH", "This browser is not the registered device for this session. Sign in again on this device.");
  }
  const rl = await hitRateLimit(`pay:intent:${session.user.id}`, 10, 600);
  if (!rl.ok) throw new ApiError(429, "RATE_LIMITED", "Too many payment attempts. Please wait a few minutes.");

  const body = await readJson(req, Body);
  const { intent, plan, link, qrSvg } = await createPaymentIntent({ userId: session.user.id, userEmail: session.user.email, deviceId: session.deviceId, planSlug: body.plan, provider: body.provider, ip, userAgent: userAgent(h) });
  return jsonOk({
    id: intent.id,
    number: intent.number,
    status: intent.status,
    provider: intent.provider,
    amount: intent.amount,
    currency: intent.currency,
    mock: intent.mock,
    plan: { slug: plan.slug, name: plan.name },
    expiresAt: intent.expiresAt.toISOString(),
    serverNow: new Date().toISOString(),
    payUrl: link,
    qrSvg,
  }, { status: 201 });
});
