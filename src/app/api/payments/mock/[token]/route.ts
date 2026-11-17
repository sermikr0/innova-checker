import { NextResponse } from "next/server";
import { assertSameOrigin, route } from "@/server/http";
import { env } from "@/server/env";
import { intentByToken, logPaymentEvent, simulateCardPayment } from "@/server/payments/service";
import { simulateClickPayment } from "@/server/payments/click";
import { mockPaymentsEnabled } from "@/server/payments/config";
import { payPage } from "@/server/payments/pages";

// Local test checkout. Refused unless PAYMENTS_MOCK=true on a localhost APP_URL,
// and only for intents created in test mode.
export const POST = route<RouteContext<"/api/payments/mock/[token]">>(async (req, ctx) => {
  assertSameOrigin(req);
  if (!mockPaymentsEnabled()) return payPage("Unavailable", "<h1>Test payments are disabled</h1>", 404);
  const { token } = await ctx.params;
  const intent = await intentByToken(token);
  if (!intent || !intent.mock) return payPage("Not found", "<h1>Payment not found</h1>", 404);
  const form = await req.formData();
  const outcome = form.get("outcome") === "pay" ? "pay" : "cancel";
  if (intent.provider === "CLICK") {
    const result = await simulateClickPayment(intent, outcome);
    await logPaymentEvent({ intentId: intent.id, provider: "CLICK", kind: "MOCK", request: { outcome }, response: result });
  } else {
    await simulateCardPayment(intent.id, outcome);
    await logPaymentEvent({ intentId: intent.id, provider: "CARD", kind: "MOCK", request: { outcome }, response: {} });
  }
  return NextResponse.redirect(`${env().APP_URL}/pay/${token}`, 303);
});
