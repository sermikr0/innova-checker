import { getSession } from "@/server/auth/session";
import { consentWhere } from "@/server/consent/admin";
import { prisma } from "@/server/db";

// CSV of Terms-of-Use acceptances (Super Admin only), e.g. as evidence for a dispute.

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
  const rows = await prisma.clientConsent.findMany({
    where: consentWhere({ q: sp.get("q") ?? undefined, status: sp.get("status") ?? undefined }),
    orderBy: { acceptedAt: "desc" },
    take: 100_000,
    select: { id: true, fullName: true, email: true, emailVerifiedAt: true, termsVersion: true, acceptedAt: true, locale: true, ipAddress: true, country: true, userAgent: true, lastSeenAt: true, user: { select: { email: true, companyName: true } }, _count: { select: { scans: true } } },
  });
  const head = ["accepted_at_utc", "full_name", "email", "email_confirmed_at_utc", "terms_version", "language", "ip_address", "country", "user_agent", "account_email", "company", "checks", "last_seen_utc", "consent_id"];
  const lines = [head.join(","), ...rows.map((r) => [r.acceptedAt, r.fullName, r.email, r.emailVerifiedAt, r.termsVersion, r.locale, r.ipAddress, r.country, r.userAgent, r.user?.email, r.user?.companyName, r._count.scans, r.lastSeenAt, r.id].map(cell).join(","))];
  const name = `innova-terms-acceptances-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(`﻿${lines.join("\r\n")}\r\n`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${name}"`, "cache-control": "no-store" } });
}
