import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { VerdictBadge } from "@/components/scan/verdict";
import { formatDateTime } from "@/lib/format";
import type { VerdictKey } from "@/lib/verdict";

export type ScanRow = { id: string; normalizedUrl: string; domain: string; verdict: string | null; riskScore: number | null; status: string; createdAt: Date; user?: { email: string } | null };

const STATUS_CLS: Record<string, string> = {
  COMPLETED: "text-v-safe",
  FAILED: "text-v-malicious",
  SCANNING: "text-orange",
  PENDING: "text-muted-foreground",
};

export function ScanTable({ scans, hrefBase, showUser = false }: { scans: ScanRow[]; hrefBase: string; showUser?: boolean }) {
  return (
    <div className="surface overflow-x-auto rounded-2xl">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] text-xs text-muted-foreground">
            <th className="px-5 py-3.5 font-medium">URL</th>
            {showUser && <th className="px-4 py-3.5 font-medium">User</th>}
            <th className="px-4 py-3.5 font-medium">Verdict</th>
            <th className="px-4 py-3.5 font-medium">Risk</th>
            <th className="px-4 py-3.5 font-medium">Status</th>
            <th className="px-4 py-3.5 font-medium">Scanned</th>
            <th className="px-4 py-3.5" />
          </tr>
        </thead>
        <tbody>
          {scans.map((s) => (
            <tr key={s.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.015]">
              <td className="max-w-[340px] px-5 py-3.5">
                <Link href={`${hrefBase}/${s.id}`} className="block truncate font-mono text-[12.5px] text-white hover:text-orange">{s.normalizedUrl}</Link>
                <span className="text-xs text-muted-foreground">{s.domain}</span>
              </td>
              {showUser && <td className="px-4 py-3.5 text-[13px] text-white/75">{s.user?.email ?? "Anonymous"}</td>}
              <td className="px-4 py-3.5">{s.verdict ? <VerdictBadge verdict={s.verdict as VerdictKey} size="sm" /> : <span className="text-muted-foreground">—</span>}</td>
              <td className="px-4 py-3.5 font-mono text-[13px] text-white/85 tabular-nums">{s.riskScore ?? "—"}</td>
              <td className={`px-4 py-3.5 text-xs font-medium ${STATUS_CLS[s.status] ?? ""}`}>{s.status.toLowerCase()}</td>
              <td className="px-4 py-3.5 text-[13px] whitespace-nowrap text-white/70">{formatDateTime(s.createdAt)}</td>
              <td className="px-4 py-3.5 text-right">
                <Link href={`${hrefBase}/${s.id}`} className="inline-flex items-center gap-1 text-xs text-orange hover:underline">View report <ChevronRight className="size-3.5" /></Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pages, makeHref }: { page: number; pages: number; makeHref: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-muted-foreground">Page {page} of {pages}</span>
      <div className="flex gap-2">
        {page > 1 ? <Link href={makeHref(page - 1)} className="rounded-lg border border-white/10 px-3 py-1.5 text-white hover:bg-white/5">Previous</Link> : <span className="rounded-lg border border-white/5 px-3 py-1.5 text-white/30">Previous</span>}
        {page < pages ? <Link href={makeHref(page + 1)} className="rounded-lg border border-white/10 px-3 py-1.5 text-white hover:bg-white/5">Next</Link> : <span className="rounded-lg border border-white/5 px-3 py-1.5 text-white/30">Next</span>}
      </div>
    </div>
  );
}
