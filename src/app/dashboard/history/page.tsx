import Link from "next/link";
import { Download, Search } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/common/app-shell";
import { Pagination, ScanTable } from "@/components/dashboard/scan-table";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth/session";
import { readPreferences } from "@/lib/preferences";
import { historyWhere } from "@/server/history";

export default async function HistoryPage({ searchParams }: PageProps<"/dashboard/history">) {
  const s = await requireUser("/dashboard/history");
  const sp = await searchParams;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: s.user.id }, select: { preferences: true } });
  const size = readPreferences(user.preferences).historyPageSize;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = historyWhere(s.user.id, sp);
  const [total, scans] = await Promise.all([prisma.scan.count({ where }), prisma.scan.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * size, take: size })]);
  const qs = (p: number) => {
    const u = new URLSearchParams();
    for (const k of ["q", "verdict", "from", "to"]) if (typeof sp[k] === "string" && sp[k]) u.set(k, sp[k] as string);
    if (p > 1) u.set("page", String(p));
    return u.toString();
  };
  const exportQs = qs(1);
  return (
    <>
      <PageHeader eyebrow="Your reports" title="Scan History" description={`${total} scan(s) match your filters.`} actions={<a href={`/api/me/scans/export${exportQs ? `?${exportQs}` : ""}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white hover:bg-white/[0.07]"><Download className="size-4" /> Export CSV</a>} />
      <form className="surface mb-5 grid gap-3 rounded-2xl p-4 sm:grid-cols-2 lg:grid-cols-[1fr_180px_160px_160px_auto]" method="get">
        <label className="relative">
          <span className="sr-only">Search domain</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
          <input name="q" defaultValue={typeof sp.q === "string" ? sp.q : ""} placeholder="Search domain or URL" className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] pr-3 pl-9 text-sm text-white outline-none focus:border-orange/60" />
        </label>
        <select name="verdict" defaultValue={typeof sp.verdict === "string" ? sp.verdict : ""} className="h-10 rounded-xl border border-white/10 bg-[#141418] px-3 text-sm text-white" aria-label="Verdict">
          <option value="">All verdicts</option>
          <option value="safe">Safe / trusted</option>
          <option value="suspicious">Suspicious / high risk</option>
          <option value="malicious">Scam</option>
          <option value="inconclusive">Inconclusive</option>
        </select>
        <input type="date" name="from" defaultValue={typeof sp.from === "string" ? sp.from : ""} aria-label="From date" className="h-10 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white [color-scheme:dark]" />
        <input type="date" name="to" defaultValue={typeof sp.to === "string" ? sp.to : ""} aria-label="To date" className="h-10 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white [color-scheme:dark]" />
        <div className="flex gap-2">
          <button type="submit" className="btn-orange h-10 rounded-xl px-4 text-sm font-semibold">Filter</button>
          <Link href="/dashboard/history" className="inline-flex h-10 items-center rounded-xl border border-white/10 px-3 text-sm text-white/80 hover:bg-white/5">Reset</Link>
        </div>
      </form>
      {scans.length ? (
        <>
          <ScanTable scans={scans} hrefBase="/dashboard/history" />
          <Pagination page={page} pages={Math.ceil(total / size)} makeHref={(p) => `/dashboard/history?${qs(p)}`} />
        </>
      ) : (
        <EmptyState icon="History" title="No scans found" text="Try different filters, or scan a new URL." action={<Link href="/dashboard/scanner" className="btn-orange inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold">Open scanner</Link>} />
      )}
    </>
  );
}
