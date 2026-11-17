// Minimal server-rendered pages for the phone that scanned the QR code. They
// need no session and no script: the phone is usually not signed in.
import type { Locale } from "@/i18n/config";
import { payPagesText } from "@/i18n/messages/pay-pages";
import { formatUzs } from "@/lib/format";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function payPage(title: string, body: string, status = 200, locale: Locale = "en"): Response {
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} · Innova Checker</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b0d;color:#f4f4f5;font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:16px}
.card{max-width:420px;width:100%;border:1px solid rgba(255,255,255,.08);border-radius:20px;background:#141416;padding:28px}
h1{font-size:20px;margin:0 0 8px}p{color:#a1a1aa;margin:8px 0}.amt{font-size:28px;font-weight:600;color:#fff;margin:16px 0 4px}
button{width:100%;height:46px;border:0;border-radius:12px;font-weight:600;font-size:15px;cursor:pointer;margin-top:10px}
.pay{background:#ff6b00;color:#fff}.cancel{background:#27272a;color:#e4e4e7}.tag{display:inline-block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#ff6b00}</style></head>
<body><main class="card">${body}</main></body></html>`;
  return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "referrer-policy": "no-referrer" } });
}

/** A page with just a heading and one paragraph, in the given language. */
export function messagePage(page: { title: string; heading: string; text: string }, status: number, locale: Locale = "en", tag = false): Response {
  return payPage(page.title, `${tag ? `<span class="tag">Innova Checker</span>` : ""}<h1>${esc(page.heading)}</h1><p>${esc(page.text)}</p>`, status, locale);
}

export function statusPage(status: string, locale: Locale = "en"): Response {
  const t = payPagesText[locale];
  if (status === "PAID") return messagePage(t.paid, 200, locale, true);
  if (status === "EXPIRED") return messagePage(t.expired, 410, locale, true);
  if (status === "PREPARED") return messagePage(t.prepared, 409, locale, true);
  return messagePage(t.closed, 410, locale, true);
}

export function mockCheckoutPage(input: { token: string; planName: string; amount: number; currency: string; provider: string; expiresAt: Date }, locale: Locale = "en"): Response {
  const t = payPagesText[locale].mock;
  const amount = input.currency === "USD" ? `$${(input.amount / 100).toFixed(2)}` : formatUzs(input.amount, locale);
  const action = `/api/payments/mock/${esc(input.token)}`;
  return payPage(t.title, `<span class="tag">${esc(t.testMode)} · ${esc(input.provider === "CLICK" ? "Click" : "Visa / Mastercard")}</span><h1>${esc(input.planName)}</h1>
<p class="amt">${esc(amount)}</p><p>${esc(t.text(input.expiresAt.toISOString().slice(11, 19)))}</p>
<form method="post" action="${action}"><input type="hidden" name="outcome" value="pay"><button class="pay" type="submit">${esc(t.pay)}</button></form>
<form method="post" action="${action}"><input type="hidden" name="outcome" value="cancel"><button class="cancel" type="submit">${esc(t.cancel)}</button></form>`, 200, locale);
}
