import { ApiError, assertSameOrigin, jsonOk, route } from "@/server/http";
import { getSession } from "@/server/auth/session";
import { prisma } from "@/server/db";

export const POST = route<RouteContext<"/api/payments/intents/[id]/cancel">>(async (req, ctx) => {
  assertSameOrigin(req);
  const session = await getSession();
  if (!session) throw new ApiError(401, "UNAUTHENTICATED", "Sign in first.");
  const { id } = await ctx.params;
  const r = await prisma.paymentIntent.updateMany({ where: { id: id.slice(0, 40), userId: session.user.id, status: "PENDING" }, data: { status: "CANCELLED", cancelledAt: new Date(), failureReason: "Cancelled by user" } });
  return jsonOk({ ok: true, cancelled: r.count > 0 });
});
