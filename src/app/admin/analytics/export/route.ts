import { getSession } from "@/server/auth/session";
import { parseRange, recentWhere } from "@/server/analytics";
import { prisma } from "@/server/db";

// CSV of checked links for the selected period and filters (Super Admin only).
const MAX_ROWS = 50_000;

/** Quotes a CSV cell and defuses spreadsheet formulas (=, +, -, @ at the start). */
function cell(v: unknown): string {
  let s = v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: Request) {
  const s = await getSession();
  if (!s || s.user.role !== "SUPER_ADMIN") return new Response("Not found", { status: 404 });
  const sp = new URL(req.url).searchParams;
  const range = parseRange(sp.get("range"));
  const rows = await prisma.scan.findMany({
    where: recentWhere({ range, q: sp.get("q") ?? undefined, verdict: sp.get("verdict") ?? undefined, who: sp.get("who") ?? undefined }),
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
    select: { id: true, createdAt: true, inputUrl: true, normalizedUrl: true, domain: true, status: true, verdict: true, riskScore: true, country: true, user: { select: { email: true, companyName: true } } },
  });
  const head = ["checked_at_utc", "scan_id", "url", "domain", "status", "verdict", "risk_score", "checked_by", "company", "country"];
  const lines = [head.join(","), ...rows.map((r) => [r.createdAt, r.id, r.normalizedUrl, r.domain, r.status, r.verdict, r.riskScore, r.user ? r.user.email : "visitor", r.user?.companyName, r.country].map(cell).join(","))];
  const name = `innova-link-checks-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(`﻿${lines.join("\r\n")}\r\n`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${name}"`, "cache-control": "no-store" } });
}
