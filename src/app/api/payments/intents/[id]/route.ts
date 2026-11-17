import { ApiError, jsonOk, route } from "@/server/http";
import { getSession } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { expireIntent } from "@/server/payments/service";

export const GET = route<RouteContext<"/api/payments/intents/[id]">>(async (_req, ctx) => {
  const session = await getSession();
  if (!session) throw new ApiError(401, "UNAUTHENTICATED", "Sign in first.");
  const { id } = await ctx.params;
  const found = await prisma.paymentIntent.findFirst({ where: { id: id.slice(0, 40), userId: session.user.id } });
  if (!found) throw new ApiError(404, "NOT_FOUND", "Payment not found.");
  const intent = await expireIntent(found);
  return jsonOk({ id: intent.id, status: intent.status, expiresAt: intent.expiresAt.toISOString(), serverNow: new Date().toISOString(), paidAt: intent.paidAt?.toISOString() ?? null, subscriptionId: intent.subscriptionId, failureReason: intent.failureReason });
});
