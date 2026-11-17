import Link from "next/link";
import { Download, Search } from "lucide-react";
import { PageHeader, StatCard, EmptyState } from "@/components/common/app-shell";
import { ScansAreaChart, VerdictDonut } from "@/components/dashboard/charts";
import { VerdictBadge } from "@/components/scan/verdict";
import { requireAdmin } from "@/server/auth/session";
import { RANGES, linkAnalytics, parseRange, recentChecks, type DomainRow, type RangeKey } from "@/server/analytics";
import { formatDateTime, formatDuration, formatNumber, timeAgo } from "@/lib/format";
import { getLocale, getT } from "@/i18n/server";
import { analyticsText } from "@/i18n/messages/admin-analytics";
import { INTL_LOCALE, type Locale } from "@/i18n/config";
import type { VerdictKey } from "@/lib/verdict";
import { cn } from "@/lib/utils";

const countryName = (code: string, locale: Locale) => {
  try {
    return new Intl.DisplayNames([INTL_LOCALE[locale], "en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
};
const flag = (code: string) => String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
const pct = (n: number, of: number) => (of ? `${Math.round((n / of) * 100)}%` : "0%");

type T = (typeof analyticsText)["en"];

function DomainTable({ rows, empty, range, t, locale }: { rows: DomainRow[]; empty: string; range: RangeKey; t: T; locale: Locale }) {
  if (!rows.length) return <p className="px-5 py-8 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] text-xs text-muted-foreground">
            <th className="px-5 py-3 font-medium">{t.colDomain}</th>
            <th className="px-3 py-3 text-right font-medium">{t.colChecks}</th>
            <th className="px-3 py-3 text-right font-medium">{t.colPeople}</th>
            <th className="px-3 py-3 font-medium">{t.colLatest}</th>
            <th className="px-5 py-3 text-right font-medium">{t.colLastChecked}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.domain} className="border-b border-white/[0.04] last:border-0">
              <td className="max-w-[260px] truncate px-5 py-3 font-mono text-[13px] text-white" title={r.domain}>
                <Link href={`/admin/analytics?range=${range}&q=${encodeURIComponent(r.domain)}#recent`} className="hover:text-orange">{r.domain}</Link>
              </td>
              <td className="px-3 py-3 text-right text-white tabular-nums">{formatNumber(r.checks, locale)}</td>
              <td className="px-3 py-3 text-right text-white/70 tabular-nums">{formatNumber(r.people, locale)}</td>
              <td className="px-3 py-3">{r.lastVerdict ? <VerdictBadge verdict={r.lastVerdict as VerdictKey} size="sm" /> : <span className="text-xs text-muted-foreground">—</span>}</td>
              <td className="px-5 py-3 text-right text-xs whitespace-nowrap text-muted-foreground">{timeAgo(r.lastAt, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function LinkAnalyticsPage(props: PageProps<"/admin/analytics">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const range = parseRange(sp.range);
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  const filter = { range, q: str(sp.q), verdict: str(sp.verdict), who: str(sp.who) };
  const [a, recent, t, locale] = await Promise.all([linkAnalytics(range), recentChecks(filter, 100), getT(analyticsText), getLocale()]);
  const n = (v: number) => formatNumber(v, locale);
  const completed = a.verdicts.safe + a.verdicts.suspicious + a.verdicts.malicious + a.verdicts.inconclusive;
  const peak = Math.max(1, ...a.hours);
  const exportQuery = new URLSearchParams(Object.entries(filter).filter(([, v]) => !!v) as [string, string][]).toString();
  const tab = (r: RangeKey) => cn("h-9 rounded-xl px-3.5 text-sm transition-colors inline-flex items-center", r === range ? "bg-orange/15 font-medium text-white ring-1 ring-orange/40" : "text-white/65 hover:bg-white/5 hover:text-white");

  return (
    <>
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
        actions={
          <a href={`/admin/analytics/export?${exportQuery}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white hover:bg-white/[0.07]">
            <Download className="size-4" /> {t.exportCsv}
          </a>
        }
      />

      <nav className="mb-6 flex flex-wrap gap-1.5" aria-label={t.period}>
        {(Object.keys(RANGES) as RangeKey[]).map((r) => (
          <Link key={r} href={`/admin/analytics?range=${r}`} className={tab(r)} aria-current={r === range ? "page" : undefined}>{t.ranges[r]}</Link>
        ))}
      </nav>

      {a.totals.total === 0 ? (
        <EmptyState icon="BarChart3" title={t.emptyTitle} text={t.emptyText} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={t.linksChecked} value={n(a.totals.total)} sub={t.failedAvg(a.totals.failed, formatDuration(a.totals.avgMs, locale))} icon="ScanSearch" highlight />
            <StatCard label={t.domains} value={n(a.totals.domains)} sub={t.perDomain((a.totals.total / Math.max(1, a.totals.domains)).toFixed(1))} icon="Database" />
            <StatCard label={t.scamCaught} value={n(a.verdicts.malicious)} sub={t.scamSub(pct(a.verdicts.malicious, completed), n(a.verdicts.suspicious))} icon="ShieldBan" tone="danger" />
            <StatCard label={t.people} value={n(a.totals.users + a.totals.visitors)} sub={t.peopleSub(a.totals.users, a.totals.visitors)} icon="Users" tone="trusted" />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
            <section className="surface rounded-2xl p-6">
              <h2 className="text-[15px] font-semibold text-white">{t.perDay}</h2>
              <p className="mt-1 mb-4 text-xs text-muted-foreground">{t.perDayHint(a.chartDays)}</p>
              <ScansAreaChart data={a.perDay} />
            </section>
            <section className="surface rounded-2xl p-6">
              <h2 className="mb-5 text-[15px] font-semibold text-white">{t.results}</h2>
              <VerdictDonut safe={a.verdicts.safe + a.verdicts.inconclusive} suspicious={a.verdicts.suspicious} malicious={a.verdicts.malicious} />
              <div className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-white/70">{t.signedIn}</span><span className="text-white tabular-nums">{n(a.totals.registered)} · {pct(a.totals.registered, a.totals.total)}</span></div>
                <div className="flex justify-between"><span className="text-white/70">{t.visitors}</span><span className="text-white tabular-nums">{n(a.totals.anonymous)} · {pct(a.totals.anonymous, a.totals.total)}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-orange" style={{ width: pct(a.totals.registered, a.totals.total) }} /></div>
                {a.verdicts.inconclusive > 0 && <p className="text-xs text-muted-foreground">{t.inconclusiveNote(a.verdicts.inconclusive)}</p>}
              </div>
            </section>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <section className="surface rounded-2xl">
              <div className="px-5 pt-5 pb-3">
                <h2 className="text-[15px] font-semibold text-white">{t.topDomains}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{t.topDomainsHint}</p>
              </div>
              <DomainTable rows={a.topDomains} empty={t.noChecks} range={range} t={t} locale={locale} />
            </section>
            <section className="surface rounded-2xl">
              <div className="px-5 pt-5 pb-3">
                <h2 className="text-[15px] font-semibold text-white">{t.riskyDomains}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{t.riskyDomainsHint}</p>
              </div>
              <DomainTable rows={a.topRisky} empty={t.noRisky} range={range} t={t} locale={locale} />
            </section>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <section className="surface rounded-2xl p-6">
              <h2 className="mb-4 text-[15px] font-semibold text-white">{t.countries}</h2>
              {a.countries.length ? (
                <ul className="space-y-2.5 text-sm">
                  {a.countries.map((c) => (
                    <li key={c.country} className="flex items-center gap-2.5">
                      <span aria-hidden>{flag(c.country)}</span>
                      <span className="flex-1 truncate text-white/80">{countryName(c.country, locale)}</span>
                      <span className="text-white tabular-nums">{n(c.checks)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{t.countriesEmpty}</p>
              )}
            </section>
            <section className="surface rounded-2xl p-6">
              <h2 className="text-[15px] font-semibold text-white">{t.hours}</h2>
              <p className="mt-1 mb-4 text-xs text-muted-foreground">{t.hoursHint}</p>
              <div className="flex h-32 items-end gap-[3px]">
                {a.hours.map((count, h) => (
                  <div key={h} className="group relative flex-1" title={t.hourTitle(String(h).padStart(2, "0"), count)}>
                    <div className="w-full rounded-t bg-orange/70 group-hover:bg-orange" style={{ height: `${Math.max(2, (count / peak) * 128)}px` }} />
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>
            </section>
            <section className="surface rounded-2xl p-6">
              <h2 className="mb-4 text-[15px] font-semibold text-white">{t.topUsers}</h2>
              {a.topUsers.length ? (
                <ul className="space-y-2.5 text-sm">
                  {a.topUsers.map((u, i) => (
                    <li key={u.user?.id ?? i} className="flex items-center gap-2.5">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-white/85">{u.user?.email ?? t.deletedUser}</span>
                        {u.user?.companyName && <span className="block truncate text-xs text-muted-foreground">{u.user.companyName}</span>}
                      </span>
                      <span className="text-white tabular-nums">{n(u.checks)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{t.topUsersEmpty}</p>
              )}
            </section>
          </div>
        </>
      )}

      <section id="recent" className="surface mt-5 scroll-mt-6 rounded-2xl">
        <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-5 pb-4">
          <div>
            <h2 className="text-[15px] font-semibold text-white">{t.checkedLinks}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t.checkedLinksHint(t.ranges[range])}</p>
          </div>
          <form method="get" action="/admin/analytics#recent" className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="range" value={range} />
            <label className="relative">
              <span className="sr-only">{t.searchLabel}</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
              <input name="q" defaultValue={filter.q ?? ""} placeholder={t.searchPlaceholder} className="h-9 w-52 rounded-xl border border-white/10 bg-white/[0.03] pr-3 pl-9 text-sm text-white outline-none focus:border-orange/60" />
            </label>
            <select name="verdict" defaultValue={filter.verdict ?? ""} aria-label={t.verdictLabel} className="h-9 rounded-xl border border-white/10 bg-[#141418] px-2.5 text-sm text-white">
              <option value="">{t.allResults}</option>
              <option value="scam">{t.fScam}</option>
              <option value="risky">{t.fRisky}</option>
              <option value="safe">{t.fSafe}</option>
              <option value="inconclusive">{t.fInconclusive}</option>
            </select>
            <select name="who" defaultValue={filter.who ?? ""} aria-label={t.whoLabel} className="h-9 rounded-xl border border-white/10 bg-[#141418] px-2.5 text-sm text-white">
              <option value="">{t.everyone}</option>
              <option value="registered">{t.fRegistered}</option>
              <option value="visitors">{t.fVisitors}</option>
            </select>
            <button type="submit" className="btn-orange h-9 rounded-xl px-3.5 text-sm font-semibold">{t.filter}</button>
          </form>
        </div>
        {recent.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-y border-white/[0.06] text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">{t.colTime}</th>
                  <th className="px-3 py-3 font-medium">{t.colLink}</th>
                  <th className="px-3 py-3 font-medium">{t.colResult}</th>
                  <th className="px-3 py-3 text-right font-medium">{t.colRisk}</th>
                  <th className="px-3 py-3 font-medium">{t.colBy}</th>
                  <th className="px-5 py-3 font-medium">{t.colCountry}</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-5 py-3 text-xs whitespace-nowrap text-muted-foreground" title={formatDateTime(s.createdAt, locale)}>{timeAgo(s.createdAt, locale)}</td>
                    <td className="max-w-[380px] px-3 py-3">
                      <Link href={`/scan/${s.id}`} className="block truncate font-mono text-[12.5px] text-white hover:text-orange" title={`${s.normalizedUrl} — ${t.openReport}`}>{s.normalizedUrl}</Link>
                    </td>
                    <td className="px-3 py-3">
                      {s.verdict ? <VerdictBadge verdict={s.verdict as VerdictKey} size="sm" /> : <span className="text-xs text-muted-foreground">{s.status.toLowerCase()}</span>}
                    </td>
                    <td className="px-3 py-3 text-right text-white tabular-nums">{s.riskScore ?? "—"}</td>
                    <td className="max-w-[220px] truncate px-3 py-3 text-white/75">{s.user ? s.user.email : s.consent ? <span title={s.consent.email}>{s.consent.fullName} <span className="text-muted-foreground">· {s.consent.email}</span></span> : <span className="text-muted-foreground">{t.visitor}</span>}</td>
                    <td className="px-5 py-3 text-white/75">{s.country ? <span title={countryName(s.country, locale)}>{flag(s.country)} {s.country}</span> : <span className="text-muted-foreground">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="border-t border-white/[0.06] px-5 py-10 text-center text-sm text-muted-foreground">{t.noMatch}</p>
        )}
      </section>
    </>
  );
}
