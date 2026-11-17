import Link from "next/link";
import { CalendarClock, CreditCard, Timer } from "lucide-react";
import { PageHeader, StatCard, EmptyState } from "@/components/common/app-shell";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth/session";
import { activeDeviceCount } from "@/server/auth/devices";
import { getLatestSubscription, remainingDays } from "@/server/subscriptions/service";
import { formatDate, formatDateTime, formatUzs } from "@/lib/format";
import { hasUnlimitedAccess } from "@/lib/roles";
import { getSiteAccess } from "@/server/settings";
import { getLocale, getT } from "@/i18n/server";
import { dashboardText } from "@/i18n/messages/dashboard";

const STATUS_CLS: Record<string, string> = { ACTIVE: "text-v-safe bg-v-safe/10 ring-v-safe/25", EXPIRED: "text-v-malicious bg-v-malicious/10 ring-v-malicious/25", SUSPENDED: "text-v-suspicious bg-v-suspicious/10 ring-v-suspicious/25", CANCELLED: "text-muted-foreground bg-white/5 ring-white/10", PENDING: "text-sev-info bg-sev-info/10 ring-sev-info/25" };

export default async function SubscriptionPage() {
  const s = await requireUser("/dashboard/subscription");
  const [sub, used, history, access] = await Promise.all([
    getLatestSubscription(s.user.id),
    activeDeviceCount(s.user.id),
    prisma.subscriptionHistory.findMany({ where: { userId: s.user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    getSiteAccess(),
  ]);
  const [t, locale] = await Promise.all([getT(dashboardText), getLocale()]);
  const p = t.subscription;
  return (
    <>
      <PageHeader eyebrow={p.eyebrow} title={p.title} actions={access.pricing ? <Link href="/pricing" className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white hover:bg-white/[0.07]">{p.viewAllPlans}</Link> : undefined} />
      {hasUnlimitedAccess(s.user.role) && (
        <div className="mb-6 rounded-2xl border border-v-trusted/30 bg-v-trusted/[0.06] p-6">
          <p className="text-lg font-semibold text-v-trusted">{t.unlimitedAccess}</p>
          <p className="mt-1 text-sm text-white/75">{s.user.role === "SUPER_ADMIN" ? p.superAdminAccount : p.grantedUnlimited} {p.noSubNeeded}</p>
        </div>
      )}
      {!sub ? (
        hasUnlimitedAccess(s.user.role) ? null : access.pricing ? <EmptyState icon="CreditCard" title={p.noSubYet} text={p.buyText} action={<Link href="/dashboard/billing" className="btn-orange inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold">{p.buyCta}</Link>} /> : <EmptyState icon="CreditCard" title={p.noSubYet} text={p.notOnSaleText} action={<Link href="/contact" className="btn-orange inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold">{t.contactUs}</Link>} />
      ) : (
        <>
          <div className="surface relative overflow-hidden rounded-3xl p-6 sm:p-8">
            <div className="pointer-events-none absolute -top-20 -right-10 size-64 rounded-full bg-orange/20 blur-3xl" />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{p.currentPlan}</p>
                <h2 className="mt-1 text-3xl font-semibold text-white">{sub.plan.name}</h2>
                <p className="mt-1 text-sm text-white/70">{formatUzs(sub.plan.priceUzs, locale)} · {sub.plan.description}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${STATUS_CLS[sub.status]}`}>{t.subStatus[sub.status].toUpperCase()}</span>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon="Activity" label={p.startDate} value={<span className="text-xl">{formatDate(sub.startsAt, locale)}</span>} />
            <StatCard icon="Activity" label={p.expirationDate} value={<span className="text-xl">{formatDate(sub.expiresAt, locale)}</span>} />
            <StatCard highlight icon="Activity" label={p.remainingDays} value={remainingDays(sub)} sub={sub.status === "ACTIVE" ? p.scanningEnabled : p.scanningDisabled} />
            <StatCard icon="MonitorSmartphone" label={p.slotsUsed} value={`${used} / ${sub.deviceLimit}`} sub={p.registeredDevices} />
          </div>
        </>
      )}
      {history.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-[15px] font-semibold text-white">{p.historyTitle}</h2>
          <ol className="surface divide-y divide-white/[0.05] rounded-2xl">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm">
                <span className="flex items-center gap-3">
                  {h.action === "EXTENDED" ? <Timer className="size-4 text-orange" /> : h.action === "ASSIGNED" ? <CreditCard className="size-4 text-orange" /> : <CalendarClock className="size-4 text-orange" />}
                  <span className="text-white">{p.actions[h.action]}</span>
                  <span className="text-muted-foreground">{h.toPlanName ?? ""}{h.toExpiresAt ? ` · ${p.until(formatDate(h.toExpiresAt, locale))}` : ""}{h.note ? ` · ${h.note}` : ""}</span>
                </span>
                <span className="text-xs text-muted-foreground">{formatDateTime(h.createdAt, locale)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}
