import { prisma } from "@/server/db";
import { jsonError, route } from "@/server/http";
import { getSession } from "@/server/auth/session";
import { historyWhere } from "@/server/history";

function esc(v: unknown) {
  const s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export const GET = route(async (req) => {
  const s = await getSession();
  if (!s) return jsonError(401, "UNAUTHENTICATED", "Log in to export your history.");
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const rows = await prisma.scan.findMany({ where: historyWhere(s.user.id, sp), orderBy: { createdAt: "desc" }, take: 10000 });
  const header = ["id", "url", "final_url", "domain", "verdict", "risk_score", "status", "scanned_at"];
  const body = rows.map((r) => [r.id, r.normalizedUrl, r.finalUrl, r.domain, r.verdict, r.riskScore, r.status, r.createdAt].map(esc).join(","));
  return new Response(`${[header.join(","), ...body].join("\n")}\n`, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="innova-checker-history-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" },
  });
});
