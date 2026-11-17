import Link from "next/link";
import { PageHeader, StatCard } from "@/components/common/app-shell";
import { ScansAreaChart, VerdictDonut } from "@/components/dashboard/charts";
import { prisma } from "@/server/db";
import { msAgo, scanStats, scansPerDay } from "@/server/dashboard";
import { domainIntelCounts } from "@/server/domain-intel/service";
import { expireLapsed } from "@/server/subscriptions/service";
import { formatDateTime, formatUzs, timeAgo } from "@/lib/format";
import { paymentsAvailable } from "@/server/subscriptions/payments";
import { quotaPressure, refreshVirusTotalQuota } from "@/server/integrations";

export default async function AdminOverview() {
  await expireLapsed();
  const since30 = msAgo(30 * 86_400_000);
  const unlimitedUsers = await prisma.user.count({ where: { role: "UNLIMITED" } });
  const [users, activeUsers, stats, perDay, activeSubs, expiredSubs, audits, domains, jobs, recentSubs] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true, lastLoginAt: { gte: since30 } } }),
    scanStats({}),
    scansPerDay({}, 14),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: "EXPIRED" } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    domainIntelCounts(),
    prisma.jobRun.findMany({ orderBy: { startedAt: "desc" }, take: 4 }),
    prisma.subscription.findMany({ where: { status: "ACTIVE" }, include: { plan: true } }),
  ]);
  const listValue = recentSubs.reduce((a, s) => a + s.plan.priceUzs, 0);
  const vtQuota = await refreshVirusTotalQuota(5 * 60_000).catch(() => null);
  const vtPressure = quotaPressure(vtQuota);
  return (
    <>
      <PageHeader eyebrow="Innova Checker · Super Admin" title="Platform overview" />
      {vtPressure.level !== "ok" && (
        <Link href="/admin/integrations" className={`mb-5 block rounded-2xl border px-5 py-4 text-sm font-semibold ${vtPressure.level === "critical" ? "border-v-malicious/40 bg-v-malicious/10 text-v-malicious" : "border-v-suspicious/40 bg-v-suspicious/10 text-v-suspicious"}`}>
          VirusTotal quota at {Math.round(vtPressure.worst * 100)}% ({vtQuota?.daily ? `daily ${vtQuota.daily.used}/${vtQuota.daily.allowed}` : ""}{vtQuota?.monthly ? `, monthly ${vtQuota.monthly.used}/${vtQuota.monthly.allowed}` : ""}). Replace the API key in Integrations →
        </Link>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard highlight icon="Users" label="Total users" value={users} sub={`${activeUsers} active in the last 30 days · ${unlimitedUsers} unlimited`} />
        <StatCard icon="Activity" label="Total scans" value={stats.total} sub={`${stats.inconclusive} inconclusive`} />
        <StatCard icon="CreditCard" tone="safe" label="Active subscriptions" value={activeSubs} sub={`${expiredSubs} expired`} />
        <StatCard icon="Database" tone="trusted" label="Domain database" value={domains.whitelist + domains.blacklist + domains.suspicious} sub={`${domains.whitelist} trusted · ${domains.blacklist} blocked · ${domains.pending} pending`} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard icon="ShieldCheck" tone="safe" label="Safe URLs" value={stats.safe} />
        <StatCard icon="Activity" tone="warn" label="Suspicious URLs" value={stats.suspicious} />
        <StatCard icon="ShieldCheck" tone="danger" label="Scam URLs" value={stats.malicious} />
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="surface rounded-2xl p-6 lg:col-span-2">
          <h2 className="text-[15px] font-semibold text-white">Platform scans, last 14 days</h2>
          <div className="mt-4"><ScansAreaChart data={perDay} /></div>
        </div>
        <div className="space-y-4">
          <div className="surface rounded-2xl p-6"><h2 className="mb-5 text-[15px] font-semibold text-white">Verdicts</h2><VerdictDonut safe={stats.safe} suspicious={stats.suspicious} malicious={stats.malicious} /></div>
          <div className="surface rounded-2xl p-6">
            <h2 className="text-[15px] font-semibold text-white">Revenue</h2>
            <p className="mt-3 text-3xl font-semibold text-white">{formatUzs(0)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{paymentsAvailable() ? "Payments enabled." : "No payment provider is integrated; no revenue is recorded."} List value of active subscriptions: {formatUzs(listValue)} (admin-assigned, not collected).</p>
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="surface rounded-2xl p-6">
          <div className="flex items-center justify-between"><h2 className="text-[15px] font-semibold text-white">Recent activity</h2><Link href="/admin/audit-logs" className="text-xs text-orange hover:underline">See all</Link></div>
          <ul className="mt-4 divide-y divide-white/[0.05]">
            {audits.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                <span className="min-w-0"><span className="font-medium text-white">{a.action.replace(/_/g, " ").toLowerCase()}</span> <span className="text-muted-foreground">{a.targetLabel ?? a.targetType ?? ""} · {a.actorEmail ?? "system"}</span></span>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="surface rounded-2xl p-6">
          <div className="flex items-center justify-between"><h2 className="text-[15px] font-semibold text-white">Domain-intelligence jobs</h2><Link href="/admin/domains" className="text-xs text-orange hover:underline">Manage</Link></div>
          {jobs.length ? (
            <ul className="mt-4 divide-y divide-white/[0.05]">
              {jobs.map((j) => (
                <li key={j.id} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                  <span><span className="font-medium text-white">{j.name}</span> <span className={j.status === "SUCCESS" ? "text-v-safe" : j.status === "FAILED" ? "text-v-malicious" : "text-orange"}>{j.status.toLowerCase()}</span> <span className="text-muted-foreground">· {j.trigger}</span></span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(j.startedAt)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-sm text-muted-foreground">No jobs have run yet.</p>}
        </div>
      </div>
    </>
  );
}
