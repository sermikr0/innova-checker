import Link from "next/link";
import { Download, Search } from "lucide-react";
import { PageHeader, StatCard, EmptyState } from "@/components/common/app-shell";
import { requireAdmin } from "@/server/auth/session";
import { consentStats, listConsents } from "@/server/consent/admin";
import { smtpConfigured } from "@/server/consent/service";
import { describeUserAgent } from "@/server/auth/user-agent";
import { getLocale, getT } from "@/i18n/server";
import { adminConsentsText } from "@/i18n/messages/admin-consents";
import { TERMS_VERSION } from "@/i18n/messages/legal-types";
import { LOCALE_LABELS, isLocale } from "@/i18n/config";
import { formatDateTime, formatNumber, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const flag = (code: string) => String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

export default async function ConsentsPage(props: PageProps<"/admin/consents">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const filter = { q: typeof sp.q === "string" ? sp.q : undefined, status: typeof sp.status === "string" ? sp.status : undefined };
  const [t, locale, stats, list] = await Promise.all([getT(adminConsentsText), getLocale(), consentStats(), listConsents(filter)]);
  const exportQuery = new URLSearchParams(Object.entries(filter).filter(([, v]) => !!v) as [string, string][]).toString();
  const badge = "rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1";

  return (
    <>
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
        actions={
          <a href={`/admin/consents/export?${exportQuery}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white hover:bg-white/[0.07]">
            <Download className="size-4" /> {t.exportCsv}
          </a>
        }
      />
      {!smtpConfigured() && <p className="mb-5 rounded-2xl border border-v-suspicious/30 bg-v-suspicious/[0.06] p-4 text-sm text-white/85">{t.smtpMissing}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t.total} value={formatNumber(stats.total, locale)} sub={t.withAccount(stats.withAccount)} icon="Users" highlight />
        <StatCard label={t.verified} value={formatNumber(stats.verified, locale)} icon="ShieldCheck" tone="safe" />
        <StatCard label={t.pending} value={formatNumber(stats.pending, locale)} icon="FileClock" tone="warn" />
        <StatCard label={t.last7} value={formatNumber(stats.recent, locale)} icon="BarChart3" tone="trusted" />
      </div>

      <section className="surface mt-5 rounded-2xl">
        <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-5 pb-4">
          <p className="text-xs text-muted-foreground">{t.showing(list.rows.length, list.count)}</p>
          <form method="get" className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <span className="sr-only">{t.searchLabel}</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
              <input name="q" defaultValue={filter.q ?? ""} placeholder={t.searchPlaceholder} className="h-9 w-56 rounded-xl border border-white/10 bg-white/[0.03] pr-3 pl-9 text-sm text-white outline-none focus:border-orange/60" />
            </label>
            <select name="status" defaultValue={filter.status ?? ""} aria-label={t.statusLabel} className="h-9 rounded-xl border border-white/10 bg-[#141418] px-2.5 text-sm text-white">
              <option value="">{t.all}</option>
              <option value="verified">{t.onlyVerified}</option>
              <option value="pending">{t.onlyPending}</option>
            </select>
            <button type="submit" className="btn-orange h-9 rounded-xl px-3.5 text-sm font-semibold">{t.filter}</button>
          </form>
        </div>
        {list.rows.length === 0 ? (
          <div className="border-t border-white/[0.06] p-6"><EmptyState icon="Users" title={t.empty} text={t.emptyText} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead>
                <tr className="border-y border-white/[0.06] text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">{t.colPerson}</th>
                  <th className="px-3 py-3 font-medium">{t.colEmail}</th>
                  <th className="px-3 py-3 font-medium">{t.colAccepted}</th>
                  <th className="px-3 py-3 font-medium">{t.colWhere}</th>
                  <th className="px-3 py-3 font-medium">{t.colDevice}</th>
                  <th className="px-3 py-3 text-right font-medium">{t.colChecks}</th>
                  <th className="px-5 py-3 text-right font-medium">{t.colLastSeen}</th>
                </tr>
              </thead>
              <tbody>
                {list.rows.map((c) => (
                  <tr key={c.id} className="border-b border-white/[0.04] align-top last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{c.fullName}</p>
                      {c.user ? (
                        <Link href={`/admin/users/${c.user.id}`} className="text-xs text-orange hover:underline">{t.account}{c.user.companyName ? ` · ${c.user.companyName}` : ""}</Link>
                      ) : (
                        <p className="text-xs text-muted-foreground">{t.visitor}</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-mono text-[12.5px] text-white/90">{c.email}</p>
                      <span className={cn(badge, "mt-1 inline-block", c.emailVerifiedAt ? "bg-v-safe/10 text-v-safe ring-v-safe/25" : c.codeSentAt ? "bg-v-suspicious/10 text-v-suspicious ring-v-suspicious/25" : "bg-white/5 text-white/60 ring-white/10")}>
                        {c.emailVerifiedAt ? t.verifiedBadge : c.codeSentAt ? t.pendingBadge : t.notRequiredBadge}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-white/75">
                      <p className="whitespace-nowrap">{formatDateTime(c.acceptedAt, locale)}</p>
                      <p className="mt-0.5 text-muted-foreground">{t.terms(c.termsVersion)}{c.termsVersion !== TERMS_VERSION ? ` (${t.outdated})` : ""}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-white/75">
                      <p className="font-mono">{c.ipAddress ?? "—"}</p>
                      {c.country && <p className="mt-0.5">{flag(c.country)} {c.country}</p>}
                    </td>
                    <td className="max-w-[220px] px-3 py-3 text-xs text-white/75">
                      <p className="truncate" title={c.userAgent ?? ""}>{c.userAgent ? describeUserAgent(c.userAgent) : "—"}</p>
                      <p className="mt-0.5 text-muted-foreground">{t.lang}: {isLocale(c.locale) ? LOCALE_LABELS[c.locale].name : c.locale}</p>
                    </td>
                    <td className="px-3 py-3 text-right text-white tabular-nums">{formatNumber(c._count.scans, locale)}</td>
                    <td className="px-5 py-3 text-right text-xs whitespace-nowrap text-muted-foreground">{timeAgo(c.lastSeenAt, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
