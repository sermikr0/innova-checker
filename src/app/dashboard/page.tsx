import Link from "next/link";
import { ArrowRight, ScanSearch } from "lucide-react";
import { PageHeader, StatCard, EmptyState } from "@/components/common/app-shell";
import { ScansAreaChart, VerdictDonut } from "@/components/dashboard/charts";
import { ScanTable } from "@/components/dashboard/scan-table";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth/session";
import { scanStats, scansPerDay } from "@/server/dashboard";
import { activeDeviceCount } from "@/server/auth/devices";
import { getCurrentSubscription, remainingDays } from "@/server/subscriptions/service";
import { formatDate } from "@/lib/format";
import { hasUnlimitedAccess } from "@/lib/roles";
import { getSiteAccess } from "@/server/settings";
import { freePolicyShort } from "@/lib/site-access";

export default async function DashboardOverview() {
  const s = await requireUser("/dashboard");
  const where = { userId: s.user.id };
  const [stats, perDay, recent, sub, devices, registered, access] = await Promise.all([
    scanStats(where),
    scansPerDay(where, 14),
    prisma.scan.findMany({ where, orderBy: { createdAt: "desc" }, take: 6 }),
    getCurrentSubscription(s.user.id),
    activeDeviceCount(s.user.id),
    prisma.device.count({ where: { userId: s.user.id, revokedAt: null } }),
    getSiteAccess(),
  ]);
  const days = remainingDays(sub);
  const totalDays = sub ? Math.max(1, Math.ceil((sub.expiresAt.getTime() - sub.startsAt.getTime()) / 86_400_000)) : 1;
  const unlimited = hasUnlimitedAccess(s.user.role);

  return (
    <>
      <PageHeader eyebrow={`${s.user.companyName} · URL security overview`} title={`Welcome, ${s.user.fullName.split(" ")[0]}`} actions={<Link href="/dashboard/scanner" className="btn-orange inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold"><ScanSearch className="size-4" /> Scan a URL</Link>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard highlight icon="Activity" label="Total scans" value={stats.total} sub="All completed scans" />
        <StatCard icon="ShieldCheck" tone="safe" label="Safe URLs" value={stats.safe} sub="Trusted, safe or low risk" />
        <StatCard icon="Activity" tone="warn" label="Suspicious URLs" value={stats.suspicious} sub="Suspicious or high risk" />
        <StatCard icon="ShieldCheck" tone="danger" label="Scam URLs" value={stats.malicious} sub="Blacklisted or confirmed scam" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="surface rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-white">Scans in the last 14 days</h2>
            <Link href="/dashboard/history" className="text-xs text-orange hover:underline">See all</Link>
          </div>
          <div className="mt-4"><ScansAreaChart data={perDay} /></div>
        </div>
        <div className="space-y-4">
          <div className="surface rounded-2xl p-6">
            <h2 className="text-[15px] font-semibold text-white">Subscription</h2>
            {unlimited ? (
              <>
                <p className="mt-3 text-lg font-semibold text-v-trusted">Unlimited access</p>
                <p className="text-xs text-muted-foreground">{s.user.role === "SUPER_ADMIN" ? "Super Admin account" : "Granted by your administrator"} · no subscription, device or scan limits</p>
              </>
            ) : sub ? (
              <>
                <p className="mt-3 text-lg font-semibold text-white">{sub.plan.name}</p>
                <p className="text-xs text-muted-foreground">{sub.status === "ACTIVE" ? `Expires ${formatDate(sub.expiresAt)}` : `Status: ${sub.status.toLowerCase()}`}</p>
                <div className="mt-4 flex items-baseline justify-between text-sm"><span className="text-white/70">Remaining</span><span className="font-semibold text-white">{days} day{days === 1 ? "" : "s"}</span></div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-orange-soft to-orange" style={{ width: `${Math.min(100, (days / totalDays) * 100)}%` }} /></div>
              </>
            ) : (
              <div className="mt-3 text-sm text-white/75">
                No active subscription. Free plan: {freePolicyShort(access).toLowerCase()}.{" "}
                {access.pricing ? <Link href="/pricing" className="text-orange hover:underline">View plans</Link> : <Link href="/contact" className="text-orange hover:underline">Contact us</Link>}
              </div>
            )}
          </div>
          <div className="surface rounded-2xl p-6">
            <h2 className="text-[15px] font-semibold text-white">Devices</h2>
            <p className="mt-3 text-3xl font-semibold text-white tabular-nums">{devices}<span className="text-base text-muted-foreground"> / {unlimited ? "∞" : sub?.status === "ACTIVE" ? sub.deviceLimit : "—"}</span></p>
            <p className="text-xs text-muted-foreground">Signed in now · {registered} registered</p>
            <Link href="/dashboard/devices" className="mt-3 inline-flex items-center gap-1 text-xs text-orange hover:underline">Manage devices <ArrowRight className="size-3" /></Link>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="surface rounded-2xl p-6">
          <h2 className="mb-5 text-[15px] font-semibold text-white">Verdict distribution</h2>
          <VerdictDonut safe={stats.safe} suspicious={stats.suspicious} malicious={stats.malicious} />
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-white">Recent scans</h2>
            <Link href="/dashboard/history" className="text-xs text-orange hover:underline">See all</Link>
          </div>
          {recent.length ? <ScanTable scans={recent} hrefBase="/dashboard/history" /> : <EmptyState icon="ScanSearch" title="No scans yet" text="Paste a suspicious link into the scanner to get your first report." action={<Link href="/dashboard/scanner" className="btn-orange inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold">Open scanner</Link>} />}
        </div>
      </div>
    </>
  );
}
