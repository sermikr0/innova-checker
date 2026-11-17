import { headers } from "next/headers";
import { getSession } from "@/server/auth/session";
import { getLocale, getT } from "@/i18n/server";
import { adminText } from "@/i18n/messages/admin";

// Swagger UI for the API (Super Admin only). The CSP nonce issued by the proxy
// is applied to the two scripts so the page works under the strict policy.
export async function GET() {
  const s = await getSession();
  const t = (await getT(adminText)).apiDocs;
  if (!s || s.user.role !== "SUPER_ADMIN") return new Response(t.notFound, { status: 404 });
  const locale = await getLocale();
  const nonce = (await headers()).get("x-nonce") ?? "";
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${t.title}</title><link rel="stylesheet" href="/api/docs/assets/swagger-ui.css">
<style>body{margin:0;background:#fafafa}.topbar{display:none}.back{display:block;padding:10px 20px;background:#0b0b0d;color:#ff8a3d;font:14px system-ui;text-decoration:none}</style></head>
<body><a class="back" href="/admin">${t.back}</a><div id="swagger"></div>
<script nonce="${nonce}" src="/api/docs/assets/swagger-ui-bundle.js"></script>
<script nonce="${nonce}">window.ui = SwaggerUIBundle({ url: "/api/openapi.json", dom_id: "#swagger", deepLinking: true, withCredentials: true, tryItOutEnabled: false });</script>
</body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
