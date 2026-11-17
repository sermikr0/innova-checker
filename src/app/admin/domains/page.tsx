import Link from "next/link";
import { Download, History, Search, Trash2 } from "lucide-react";
import type { DomainListType, Prisma } from "@/generated/prisma/client";
import { PageHeader } from "@/components/common/app-shell";
import { ConfirmButton } from "@/components/common/confirm-button";
import { Pagination } from "@/components/dashboard/scan-table";
import { DomainJobButtons, DomainRecordDialog, ImportCsvDialog, ReviewButtons } from "@/components/admin/domain-forms";
import { JobStatus } from "@/components/admin/job-status";
import { prisma } from "@/server/db";
import { domainIntelCounts } from "@/server/domain-intel/service";
import { formatDate } from "@/lib/format";
import { deleteDomainRecordAction } from "../actions";
import { getLocale, getT } from "@/i18n/server";
import { adminDomainsText } from "@/i18n/messages/admin-domains";

const TABS = [{ key: "WHITELIST" }, { key: "BLACKLIST" }, { key: "SUSPICIOUS" }, { key: "PENDING" }] as const;
const SIZE = 50;
const LIST_CLS: Record<string, string> = { WHITELIST: "text-v-trusted", BLACKLIST: "text-v-malicious", SUSPICIOUS: "text-v-high" };

export default async function AdminDomains({ searchParams }: PageProps<"/admin/domains">) {
  const sp = await searchParams;
  const txt = await getT(adminDomainsText);
  const t = txt.page;
  const locale = await getLocale();
  const tab = TABS.find((tb) => tb.key === sp.tab)?.key ?? "WHITELIST";
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase().slice(0, 200) : "";
  const trust = typeof sp.trust === "string" ? sp.trust : "";
  const origin = typeof sp.origin === "string" ? sp.origin : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.DomainRecordWhereInput = {
    ...(tab === "PENDING" ? { status: "PENDING" } : { listType: tab as DomainListType, status: { in: ["ACTIVE", "REJECTED"] } }),
    ...(q ? { OR: [{ domain: { contains: q } }, { platformName: { contains: q, mode: "insensitive" } }, { companyName: { contains: q, mode: "insensitive" } }, { category: { contains: q, mode: "insensitive" } }] } : {}),
    ...(trust ? { trustStatus: trust as Prisma.EnumDomainTrustStatusFilter["equals"] } : {}),
    ...(origin === "feed" ? { origin: { startsWith: "FEED:" } } : origin ? { origin } : {}),
  };
  const [counts, total, rows, jobs] = await Promise.all([
    domainIntelCounts(),
    prisma.domainRecord.count({ where }),
    prisma.domainRecord.findMany({ where, orderBy: [{ status: "asc" }, { domain: "asc" }], skip: (page - 1) * SIZE, take: SIZE, include: { submittedBy: { select: { email: true } } } }),
    prisma.jobRun.findMany({ orderBy: { startedAt: "desc" }, take: 6 }),
  ]);
  const qs = (extra: Record<string, string>) => new URLSearchParams({ tab, ...(q ? { q } : {}), ...(trust ? { trust } : {}), ...(origin ? { origin } : {}), ...extra }).toString();
  const countFor = (k: string) => (k === "WHITELIST" ? counts.whitelist : k === "BLACKLIST" ? counts.blacklist : k === "SUSPICIOUS" ? counts.suspicious : counts.pending);
  return (
    <>
      <PageHeader eyebrow={t.eyebrow} title={t.title} description={t.description} actions={<><a href={`/api/admin/domains/export?${new URLSearchParams(tab === "PENDING" ? { status: "PENDING" } : { list: tab })}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white hover:bg-white/[0.07]"><Download className="size-4" /> {t.exportCsv}</a><ImportCsvDialog /><DomainRecordDialog defaultList={tab === "PENDING" ? "SUSPICIOUS" : (tab as "WHITELIST")} /></>} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tb) => <Link key={tb.key} href={`/admin/domains?tab=${tb.key}`} className={`rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 ${tab === tb.key ? "bg-orange/15 text-white ring-orange/40" : "text-white/70 ring-white/10 hover:bg-white/5"}`}>{t.tabs[tb.key]} ({countFor(tb.key)})</Link>)}
        </div>
        <DomainJobButtons />
      </div>
      <JobStatus key={jobs.map((j) => `${j.id}:${j.status}`).join(",")} initial={jobs.map((j) => ({ id: j.id, name: j.name, status: j.status, trigger: j.trigger, summary: (j.summary ?? null) as Record<string, unknown> | null, error: j.error, startedAt: j.startedAt.toISOString(), finishedAt: j.finishedAt?.toISOString() ?? null }))} />
      <form method="get" className="surface mb-5 grid gap-3 rounded-2xl p-4 sm:grid-cols-[1fr_200px_200px_auto]">
        <input type="hidden" name="tab" value={tab} />
        <label className="relative"><span className="sr-only">{txt.search}</span><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" /><input name="q" defaultValue={q} placeholder={t.searchPlaceholder} className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] pr-3 pl-9 text-sm text-white outline-none focus:border-orange/60" /></label>
        <select name="trust" defaultValue={trust} aria-label={t.trustStatus} className="h-10 rounded-xl border border-white/10 bg-[#141418] px-3 text-sm text-white"><option value="">{t.anyTrust}</option><option value="VERIFIED_OFFICIAL">{txt.trust.VERIFIED_OFFICIAL}</option><option value="CONFIRMED_MALICIOUS">{txt.trust.CONFIRMED_MALICIOUS}</option><option value="SUSPECTED">{txt.trust.SUSPECTED}</option><option value="UNVERIFIED">{txt.trust.UNVERIFIED}</option></select>
        <select name="origin" defaultValue={origin} aria-label={t.origin} className="h-10 rounded-xl border border-white/10 bg-[#141418] px-3 text-sm text-white"><option value="">{t.anyOrigin}</option><option value="SEED_RESEARCH">{t.origins.SEED_RESEARCH}</option><option value="ADMIN">{t.origins.ADMIN}</option><option value="IMPORT">{t.origins.IMPORT}</option><option value="USER_SUBMISSION">{t.origins.USER_SUBMISSION}</option><option value="feed">{t.origins.feed}</option></select>
        <button type="submit" className="btn-orange h-10 rounded-xl px-4 text-sm font-semibold">{txt.filter}</button>
      </form>
      <p className="mb-3 text-xs text-muted-foreground">{t.records(total)}</p>
      <div className="surface overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead><tr className="border-b border-white/[0.06] text-xs text-muted-foreground"><th className="px-5 py-3.5 font-medium">{t.domain}</th><th className="px-4 py-3.5 font-medium">{t.platformCategory}</th><th className="px-4 py-3.5 font-medium">{t.trustCol}</th><th className="w-[34%] px-4 py-3.5 font-medium">{t.source}</th><th className="px-4 py-3.5 font-medium">{t.checked}</th><th className="px-4 py-3.5" /></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">{t.empty}</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-white/[0.04] align-top last:border-0">
                <td className="px-5 py-3.5">
                  <span className="font-mono text-[12.5px] break-all text-white">{r.domain}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground"><span className={LIST_CLS[r.listType]}>{r.listType.toLowerCase()}</span> · {r.scope.toLowerCase()} · {r.status.toLowerCase()} · {r.origin.toLowerCase()}{r.submittedBy ? t.by(r.submittedBy.email) : ""}</span>
                </td>
                <td className="px-4 py-3.5 text-[13px] text-white/80">{r.platformName ?? "—"}<span className="block text-xs text-muted-foreground">{r.category ?? ""}</span></td>
                <td className="px-4 py-3.5 text-xs text-white/75">{r.trustStatus.replace(/_/g, " ").toLowerCase()}</td>
                <td className="px-4 py-3.5 text-xs leading-relaxed break-words text-white/70">{r.verificationSource ?? <span className="text-v-suspicious">{t.noSource}</span>}{r.verifiedAt && <span className="block text-muted-foreground">{t.verified(formatDate(r.verifiedAt, locale))}</span>}{r.notes && <span className="mt-1 block text-muted-foreground">{r.notes.slice(0, 200)}</span>}</td>
                <td className="px-4 py-3.5 text-xs text-white/70">{r.revalidationStatus ? <span className={r.revalidationStatus === "OK" ? "text-v-safe" : "text-v-suspicious"}>{r.revalidationStatus.toLowerCase()}</span> : "—"}{r.lastRevalidatedAt && <span className="block text-muted-foreground">{formatDate(r.lastRevalidatedAt, locale)}</span>}</td>
                <td className="px-4 py-3.5">
                  <span className="flex flex-wrap justify-end gap-1.5">
                    {r.status === "PENDING" && <ReviewButtons id={r.id} />}
                    <DomainRecordDialog record={{ id: r.id, domain: r.domain, listType: r.listType, scope: r.scope, status: r.status, trustStatus: r.trustStatus, platformName: r.platformName ?? "", companyName: r.companyName ?? "", officialUrl: r.officialUrl ?? "", category: r.category ?? "", brandKeywords: r.brandKeywords, verificationSource: r.verificationSource ?? "", verifiedAt: r.verifiedAt?.toISOString().slice(0, 10) ?? "", notes: r.notes ?? "" }} />
                    <Link href={`/admin/domains/${r.id}`} className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 px-2.5 text-xs text-white/80 hover:bg-white/5"><History className="size-3.5" /> {t.history}</Link>
                    <ConfirmButton action={deleteDomainRecordAction.bind(null, r.id)} title={t.deleteTitle(r.domain)} description={t.deleteText} confirmLabel={t.delete} destructive className="h-8 border border-v-malicious/30 px-2.5 text-xs text-v-malicious hover:bg-v-malicious/10"><Trash2 className="size-3.5" /></ConfirmButton>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={Math.ceil(total / SIZE)} makeHref={(p) => `/admin/domains?${qs({ page: String(p) })}`} />
    </>
  );
}
