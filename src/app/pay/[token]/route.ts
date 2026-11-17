import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { clientIp } from "@/server/http";
import { hitRateLimit } from "@/server/rate-limit";
import { hmac } from "@/server/crypto";
import { clickCheckoutUrl, intentByToken, logPaymentEvent } from "@/server/payments/service";
import { mockPaymentsEnabled } from "@/server/payments/config";
import { mockCheckoutPage, payPage, statusPage } from "@/server/payments/pages";

// Target of the payment QR code. While the code is valid it forwards the phone
// straight to Click's payment page for this exact amount and order.
export async function GET(_req: Request, ctx: RouteContext<"/pay/[token]">) {
  const ip = clientIp(await headers());
  const rl = await hitRateLimit(`pay:open:${hmac(ip)}`, 60, 600);
  if (!rl.ok) return payPage("Too many requests", "<h1>Too many requests</h1><p>Please wait a few minutes and scan again.</p>", 429);
  const { token } = await ctx.params;
  const intent = await intentByToken(token);
  if (!intent) return payPage("Not found", "<h1>Payment not found</h1><p>This QR code is not valid.</p>", 404);
  if (intent.status !== "PENDING") return statusPage(intent.status);

  if (intent.mock) {
    if (!mockPaymentsEnabled()) return payPage("Unavailable", "<h1>Payment unavailable</h1><p>Test payments are disabled.</p>", 503);
    return mockCheckoutPage({ token, planName: intent.plan.name, amount: intent.amount, currency: intent.currency, provider: intent.provider, expiresAt: intent.expiresAt });
  }
  if (intent.provider === "CLICK") {
    const url = clickCheckoutUrl(intent);
    await logPaymentEvent({ intentId: intent.id, provider: "CLICK", kind: "REDIRECT", request: { ip }, response: { url } });
    return NextResponse.redirect(url, 302);
  }
  return payPage("Unavailable", "<h1>Card payments are not available yet</h1><p>Please pay with Click or contact support.</p>", 503);
}
