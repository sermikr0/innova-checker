import Link from "next/link";
import type { SubscriptionStatus } from "@/generated/prisma/client";
import { PageHeader } from "@/components/common/app-shell";
import { ConfirmButton } from "@/components/common/confirm-button";
import { AssignSubscriptionDialog } from "@/components/admin/subscription-forms";
import { prisma } from "@/server/db";
import { activeDeviceWhere } from "@/server/auth/devices";
import { expireLapsed, remainingDays } from "@/server/subscriptions/service";
import { formatDate, formatDateTime } from "@/lib/format";
import { expireLapsedAction } from "../actions";

const STATUSES: SubscriptionStatus[] = ["ACTIVE", "EXPIRED", "SUSPENDED", "CANCELLED", "PENDING"];
const CLS: Record<string, string> = { ACTIVE: "text-v-safe", EXPIRED: "text-v-malicious", SUSPENDED: "text-v-suspicious", CANCELLED: "text-muted-foreground", PENDING: "text-sev-info" };

export default async function AdminSubscriptions({ searchParams }: PageProps<"/admin/subscriptions">) {
  await expireLapsed();
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as SubscriptionStatus) ? (sp.status as SubscriptionStatus) : undefined;
  const [subs, plans, users, counts, history] = await Promise.all([
    prisma.subscription.findMany({ where: status ? { status } : {}, orderBy: { updatedAt: "desc" }, take: 200, include: { plan: true, user: { select: { id: true, email: true, companyName: true } } } }),
    prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true, deviceLimit: true } }),
    prisma.user.findMany({ where: { role: "USER", isActive: true }, orderBy: { email: "asc" }, select: { id: true, email: true }, take: 1000 }),
    prisma.subscription.groupBy({ by: ["status"], _count: true }),
    prisma.subscriptionHistory.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { email: true } }, actor: { select: { email: true } } } }),
  ]);
  const usage = await Promise.all(subs.map((s) => prisma.device.count({ where: activeDeviceWhere(s.userId) })));
  return (
    <>
      <PageHeader eyebrow="Licensing" title="Subscriptions" description="Assign, extend, suspend or change subscriptions. Payments are not integrated; all activations are manual." actions={<><ConfirmButton action={expireLapsedAction} title="Expire lapsed subscriptions now?" description="Active subscriptions past their expiration date are marked expired (this also happens automatically)." confirmLabel="Run" className="h-10 border border-white/10 px-4 text-white hover:bg-white/5">Expire lapsed</ConfirmButton><AssignSubscriptionDialog plans={plans} users={users} /></>} />
      <div className="mb-5 flex flex-wrap gap-2">
        <Link href="/admin/subscriptions" className={`rounded-full px-3 py-1.5 text-xs ring-1 ${!status ? "bg-orange/15 text-white ring-orange/40" : "text-white/70 ring-white/10 hover:bg-white/5"}`}>All</Link>
        {STATUSES.map((s) => <Link key={s} href={`/admin/subscriptions?status=${s}`} className={`rounded-full px-3 py-1.5 text-xs ring-1 ${status === s ? "bg-orange/15 text-white ring-orange/40" : "text-white/70 ring-white/10 hover:bg-white/5"}`}>{s.toLowerCase()} ({counts.find((c) => c.status === s)?._count ?? 0})</Link>)}
      </div>
      <div className="surface overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead><tr className="border-b border-white/[0.06] text-xs text-muted-foreground"><th className="px-5 py-3.5 font-medium">User</th><th className="px-4 py-3.5 font-medium">Plan</th><th className="px-4 py-3.5 font-medium">Status</th><th className="px-4 py-3.5 font-medium">Start</th><th className="px-4 py-3.5 font-medium">Expires</th><th className="px-4 py-3.5 font-medium">Remaining</th><th className="px-4 py-3.5 font-medium">Devices</th><th className="px-4 py-3.5" /></tr></thead>
          <tbody>
            {subs.length === 0 && <tr><td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">No subscriptions.</td></tr>}
            {subs.map((s, i) => (
              <tr key={s.id} className="border-b border-white/[0.04] last:border-0">
                <td className="px-5 py-3.5"><span className="text-white">{s.user.email}</span><span className="block text-xs text-muted-foreground">{s.user.companyName}</span></td>
                <td className="px-4 py-3.5 text-white/80">{s.plan.name}</td>
                <td className={`px-4 py-3.5 text-xs font-semibold ${CLS[s.status]}`}>{s.status.toLowerCase()}</td>
                <td className="px-4 py-3.5 text-white/70">{formatDate(s.startsAt)}</td>
                <td className="px-4 py-3.5 text-white/70">{formatDate(s.expiresAt)}</td>
                <td className="px-4 py-3.5 text-white/80">{remainingDays(s)} d</td>
                <td className="px-4 py-3.5 text-white/80">{usage[i]} / {s.deviceLimit}</td>
                <td className="px-4 py-3.5 text-right"><Link href={`/admin/users/${s.user.id}`} className="text-xs text-orange hover:underline">Manage</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="mt-8 mb-3 text-[15px] font-semibold text-white">Recent subscription changes</h2>
      <ol className="surface divide-y divide-white/[0.05] rounded-2xl">
        {history.map((h) => <li key={h.id} className="flex flex-wrap justify-between gap-3 px-5 py-3 text-[13px]"><span><span className="text-white">{h.user.email}</span> <span className="text-muted-foreground">{h.action.replace(/_/g, " ").toLowerCase()} · {h.toPlanName}{h.note ? ` · ${h.note}` : ""}</span></span><span className="text-xs text-muted-foreground">{h.actor?.email ?? "system"} · {formatDateTime(h.createdAt)}</span></li>)}
      </ol>
    </>
  );
}
