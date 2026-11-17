import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getLocale, getT } from "@/i18n/server";
import { payPagesText } from "@/i18n/messages/pay-pages";
import { clientIp } from "@/server/http";
import { hitRateLimit } from "@/server/rate-limit";
import { hmac } from "@/server/crypto";
import { clickCheckoutUrl, intentByToken, logPaymentEvent } from "@/server/payments/service";
import { mockPaymentsEnabled } from "@/server/payments/config";
import { messagePage, mockCheckoutPage, statusPage } from "@/server/payments/pages";

// Target of the payment QR code. While the code is valid it forwards the phone
// straight to Click's payment page for this exact amount and order.
export async function GET(_req: Request, ctx: RouteContext<"/pay/[token]">) {
  const locale = await getLocale();
  const t = await getT(payPagesText);
  const ip = clientIp(await headers());
  const rl = await hitRateLimit(`pay:open:${hmac(ip)}`, 60, 600);
  if (!rl.ok) return messagePage(t.tooMany, 429, locale);
  const { token } = await ctx.params;
  const intent = await intentByToken(token);
  if (!intent) return messagePage(t.notFound, 404, locale);
  if (intent.status !== "PENDING") return statusPage(intent.status, locale);

  if (intent.mock) {
    if (!mockPaymentsEnabled()) return messagePage(t.mockDisabled, 503, locale);
    return mockCheckoutPage({ token, planName: intent.plan.name, amount: intent.amount, currency: intent.currency, provider: intent.provider, expiresAt: intent.expiresAt }, locale);
  }
  if (intent.provider === "CLICK") {
    const url = clickCheckoutUrl(intent);
    await logPaymentEvent({ intentId: intent.id, provider: "CLICK", kind: "REDIRECT", request: { ip }, response: { url } });
    return NextResponse.redirect(url, 302);
  }
  return messagePage(t.cardUnavailable, 503, locale);
}
