import { notFound } from "next/navigation";
import { PageHeader } from "@/components/common/app-shell";
import { ScanTable } from "@/components/dashboard/scan-table";
import { EditUserForm, RevokeDeviceButton, UnlimitedAccessButton, UserAccountActions } from "@/components/admin/user-forms";
import { ROLE_LABELS, hasUnlimitedAccess } from "@/lib/roles";
import { AssignSubscriptionDialog, ManageSubscription } from "@/components/admin/subscription-forms";
import { prisma } from "@/server/db";
import { userDevices } from "@/server/dashboard";
import { getCurrentSubscription, remainingDays } from "@/server/subscriptions/service";
import { formatDate, formatDateTime, timeAgo } from "@/lib/format";

export default async function AdminUserDetail({ params }: PageProps<"/admin/users/[id]">) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();
  const [sub, plans, devices, scans, history, scanCount] = await Promise.all([
    getCurrentSubscription(id),
    prisma.subscriptionPlan.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, deviceLimit: true } }),
    userDevices(id, null),
    prisma.scan.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.subscriptionHistory.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 15, include: { actor: { select: { email: true } } } }),
    prisma.scan.count({ where: { userId: id } }),
  ]);
  const active = devices.filter((d) => d.signedIn).length;
  return (
    <>
      <PageHeader eyebrow={`User · joined ${formatDate(user.createdAt)} · last login ${user.lastLoginAt ? timeAgo(user.lastLoginAt) : "never"}`} title={user.fullName} description={`${user.email} · ${user.companyName} · ${ROLE_LABELS[user.role]} · ${user.isActive ? "active" : "deactivated"}`} />
      <div className="mb-6 flex flex-wrap gap-2">
        {user.role !== "SUPER_ADMIN" && <UnlimitedAccessButton userId={user.id} email={user.email} unlimited={user.role === "UNLIMITED"} />}
        <UserAccountActions userId={user.id} isActive={user.isActive} email={user.email} />
      </div>
      {hasUnlimitedAccess(user.role) && <p className="-mt-3 mb-6 text-sm text-v-trusted">This account has unlimited access: no subscription, device limit or scan quota is applied.</p>}
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <section className="surface rounded-2xl p-6"><h2 className="mb-4 text-[15px] font-semibold text-white">Edit user</h2><EditUserForm user={{ id: user.id, fullName: user.fullName, email: user.email, companyName: user.companyName, role: user.role }} /></section>
        <section className="surface rounded-2xl p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-white">Subscription</h2>
              <p className="mt-1 text-sm text-white/75">{sub ? `${sub.plan.name} · ${sub.status.toLowerCase()} · ${formatDate(sub.startsAt)} → ${formatDate(sub.expiresAt)} · ${remainingDays(sub)} day(s) left · devices ${active}/${sub.deviceLimit}` : "No current subscription"}</p>
            </div>
            <AssignSubscriptionDialog plans={plans} fixedUser={{ id: user.id, email: user.email }} />
          </div>
          {sub && <ManageSubscription sub={{ id: sub.id, status: sub.status, planId: sub.planId, deviceLimit: sub.deviceLimit, expiresAt: sub.expiresAt.toISOString() }} plans={plans} />}
        </section>
      </div>

      <section className="mt-5">
        <h2 className="mb-3 text-[15px] font-semibold text-white">Devices ({active} signed in)</h2>
        <div className="surface overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="border-b border-white/[0.06] text-xs text-muted-foreground"><th className="px-5 py-3 font-medium">Device</th><th className="px-4 py-3 font-medium">State</th><th className="px-4 py-3 font-medium">Sessions</th><th className="px-4 py-3 font-medium">Last seen</th><th className="px-4 py-3 font-medium">IP</th><th className="px-4 py-3" /></tr></thead>
            <tbody>
              {devices.length === 0 && <tr><td colSpan={6} className="px-5 py-6 text-center text-muted-foreground">No devices registered.</td></tr>}
              {devices.map((d) => (
                <tr key={d.id} className="border-b border-white/[0.04] last:border-0">
                  <td className="px-5 py-3 text-white">{d.label}<span className="block text-xs text-muted-foreground">registered {formatDateTime(d.createdAt)}</span></td>
                  <td className="px-4 py-3 text-xs">{d.revokedAt ? <span className="text-v-malicious">revoked ({d.revokedReason?.toLowerCase()})</span> : d.signedIn ? <span className="text-v-safe">signed in</span> : <span className="text-muted-foreground">signed out</span>}</td>
                  <td className="px-4 py-3 text-white/75">{d.sessions.length}</td>
                  <td className="px-4 py-3 text-white/75">{timeAgo(d.lastSeenAt)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-white/70">{d.lastIp ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{!d.revokedAt && <RevokeDeviceButton userId={user.id} deviceId={d.id} label={d.label} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-5">
        <h2 className="mb-3 text-[15px] font-semibold text-white">Scan history ({scanCount})</h2>
        {scans.length ? <ScanTable scans={scans} hrefBase="/scan" /> : <p className="text-sm text-muted-foreground">No scans.</p>}
      </section>

      <section className="mt-5">
        <h2 className="mb-3 text-[15px] font-semibold text-white">Subscription history</h2>
        <ol className="surface divide-y divide-white/[0.05] rounded-2xl">
          {history.length === 0 && <li className="px-5 py-4 text-sm text-muted-foreground">No subscription changes.</li>}
          {history.map((h) => (
            <li key={h.id} className="flex flex-wrap justify-between gap-3 px-5 py-3 text-[13px]">
              <span><span className="font-medium text-white">{h.action.replace(/_/g, " ").toLowerCase()}</span> <span className="text-muted-foreground">{[h.fromPlanName !== h.toPlanName && h.fromPlanName ? `${h.fromPlanName} → ${h.toPlanName}` : h.toPlanName, h.fromStatus !== h.toStatus && h.fromStatus ? `${h.fromStatus} → ${h.toStatus}` : null, h.toExpiresAt ? `expires ${formatDate(h.toExpiresAt)}` : null, h.note].filter(Boolean).join(" · ")}</span></span>
              <span className="text-xs text-muted-foreground">{h.actor?.email ?? "system"} · {formatDateTime(h.createdAt)}</span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
