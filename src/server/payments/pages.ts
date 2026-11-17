// Minimal server-rendered pages for the phone that scanned the QR code. They
// need no session and no script: the phone is usually not signed in.

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function payPage(title: string, body: string, status = 200): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} · Innova Checker</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b0d;color:#f4f4f5;font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:16px}
.card{max-width:420px;width:100%;border:1px solid rgba(255,255,255,.08);border-radius:20px;background:#141416;padding:28px}
h1{font-size:20px;margin:0 0 8px}p{color:#a1a1aa;margin:8px 0}.amt{font-size:28px;font-weight:600;color:#fff;margin:16px 0 4px}
button{width:100%;height:46px;border:0;border-radius:12px;font-weight:600;font-size:15px;cursor:pointer;margin-top:10px}
.pay{background:#ff6b00;color:#fff}.cancel{background:#27272a;color:#e4e4e7}.tag{display:inline-block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#ff6b00}</style></head>
<body><main class="card">${body}</main></body></html>`;
  return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "referrer-policy": "no-referrer" } });
}

export function statusPage(status: string): Response {
  if (status === "PAID") return payPage("Payment received", `<span class="tag">Innova Checker</span><h1>Payment received</h1><p>Your subscription is now active on the device that showed this QR code. You can close this page.</p>`);
  if (status === "EXPIRED") return payPage("QR code expired", `<span class="tag">Innova Checker</span><h1>This QR code has expired</h1><p>Payment codes are valid for a few minutes only. Go back to Innova Checker on your computer and generate a new QR code.</p>`, 410);
  if (status === "PREPARED") return payPage("Payment in progress", `<span class="tag">Innova Checker</span><h1>Payment in progress</h1><p>This payment is already being processed. Finish it in the payment app.</p>`, 409);
  return payPage("Payment closed", `<span class="tag">Innova Checker</span><h1>This payment is closed</h1><p>It was cancelled or replaced by a newer QR code. Generate a new one on your computer.</p>`, 410);
}

export function mockCheckoutPage(input: { token: string; planName: string; amount: number; currency: string; provider: string; expiresAt: Date }): Response {
  const amount = input.currency === "USD" ? `$${(input.amount / 100).toFixed(2)}` : `${new Intl.NumberFormat("en-US").format(input.amount)} UZS`;
  const action = `/api/payments/mock/${esc(input.token)}`;
  return payPage("Test checkout", `<span class="tag">Test mode · ${esc(input.provider === "CLICK" ? "Click" : "Visa / Mastercard")}</span><h1>${esc(input.planName)}</h1>
<p class="amt">${esc(amount)}</p><p>Simulated payment for local testing. No money is charged. Valid until ${esc(input.expiresAt.toISOString().slice(11, 19))} UTC.</p>
<form method="post" action="${action}"><input type="hidden" name="outcome" value="pay"><button class="pay" type="submit">Pay (simulate success)</button></form>
<form method="post" action="${action}"><input type="hidden" name="outcome" value="cancel"><button class="cancel" type="submit">Cancel (simulate failure)</button></form>`);
}
