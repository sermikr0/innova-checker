import { notFound } from "next/navigation";
import { PageHeader } from "@/components/common/app-shell";
import { ScanTable } from "@/components/dashboard/scan-table";
import { EditUserForm, RevokeDeviceButton, UnlimitedAccessButton, UserAccountActions } from "@/components/admin/user-forms";
import { hasUnlimitedAccess } from "@/lib/roles";
import { AssignSubscriptionDialog, ManageSubscription } from "@/components/admin/subscription-forms";
import { prisma } from "@/server/db";
import { userDevices } from "@/server/dashboard";
import { getCurrentSubscription, remainingDays } from "@/server/subscriptions/service";
import { formatDate, formatDateTime, timeAgo } from "@/lib/format";
import { getLocale, getT } from "@/i18n/server";
import { adminUsersText } from "@/i18n/messages/admin-users";

export default async function AdminUserDetail({ params }: PageProps<"/admin/users/[id]">) {
  const { id } = await params;
  const txt = await getT(adminUsersText);
  const t = txt.detail;
  const locale = await getLocale();
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
      <PageHeader eyebrow={t.eyebrow(formatDate(user.createdAt, locale), user.lastLoginAt ? timeAgo(user.lastLoginAt, locale) : txt.never)} title={user.fullName} description={`${user.email} · ${user.companyName} · ${txt.roles[user.role]} · ${user.isActive ? t.active : t.deactivated}`} />
      <div className="mb-6 flex flex-wrap gap-2">
        {user.role !== "SUPER_ADMIN" && <UnlimitedAccessButton userId={user.id} email={user.email} unlimited={user.role === "UNLIMITED"} />}
        <UserAccountActions userId={user.id} isActive={user.isActive} email={user.email} />
      </div>
      {hasUnlimitedAccess(user.role) && <p className="-mt-3 mb-6 text-sm text-v-trusted">{t.unlimitedNote}</p>}
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <section className="surface rounded-2xl p-6"><h2 className="mb-4 text-[15px] font-semibold text-white">{t.editUser}</h2><EditUserForm user={{ id: user.id, fullName: user.fullName, email: user.email, companyName: user.companyName, role: user.role }} /></section>
        <section className="surface rounded-2xl p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-white">{t.subscription}</h2>
              <p className="mt-1 text-sm text-white/75">{sub ? t.subLine(sub.plan.name, sub.status.toLowerCase(), formatDate(sub.startsAt, locale), formatDate(sub.expiresAt, locale), remainingDays(sub), active, sub.deviceLimit) : t.noSubscription}</p>
            </div>
            <AssignSubscriptionDialog plans={plans} fixedUser={{ id: user.id, email: user.email }} />
          </div>
          {sub && <ManageSubscription sub={{ id: sub.id, status: sub.status, planId: sub.planId, deviceLimit: sub.deviceLimit, expiresAt: sub.expiresAt.toISOString() }} plans={plans} />}
        </section>
      </div>

      <section className="mt-5">
        <h2 className="mb-3 text-[15px] font-semibold text-white">{t.devices(active)}</h2>
        <div className="surface overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="border-b border-white/[0.06] text-xs text-muted-foreground"><th className="px-5 py-3 font-medium">{t.device}</th><th className="px-4 py-3 font-medium">{t.state}</th><th className="px-4 py-3 font-medium">{t.sessions}</th><th className="px-4 py-3 font-medium">{t.lastSeen}</th><th className="px-4 py-3 font-medium">{t.ip}</th><th className="px-4 py-3" /></tr></thead>
            <tbody>
              {devices.length === 0 && <tr><td colSpan={6} className="px-5 py-6 text-center text-muted-foreground">{t.noDevices}</td></tr>}
              {devices.map((d) => (
                <tr key={d.id} className="border-b border-white/[0.04] last:border-0">
                  <td className="px-5 py-3 text-white">{d.label}<span className="block text-xs text-muted-foreground">{t.registered(formatDateTime(d.createdAt, locale))}</span></td>
                  <td className="px-4 py-3 text-xs">{d.revokedAt ? <span className="text-v-malicious">{t.revoked(d.revokedReason?.toLowerCase())}</span> : d.signedIn ? <span className="text-v-safe">{t.signedIn}</span> : <span className="text-muted-foreground">{t.signedOut}</span>}</td>
                  <td className="px-4 py-3 text-white/75">{d.sessions.length}</td>
                  <td className="px-4 py-3 text-white/75">{timeAgo(d.lastSeenAt, locale)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-white/70">{d.lastIp ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{!d.revokedAt && <RevokeDeviceButton userId={user.id} deviceId={d.id} label={d.label} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-5">
        <h2 className="mb-3 text-[15px] font-semibold text-white">{t.scanHistory(scanCount)}</h2>
        {scans.length ? <ScanTable scans={scans} hrefBase="/scan" /> : <p className="text-sm text-muted-foreground">{t.noScans}</p>}
      </section>

      <section className="mt-5">
        <h2 className="mb-3 text-[15px] font-semibold text-white">{t.subHistory}</h2>
        <ol className="surface divide-y divide-white/[0.05] rounded-2xl">
          {history.length === 0 && <li className="px-5 py-4 text-sm text-muted-foreground">{t.noSubChanges}</li>}
          {history.map((h) => (
            <li key={h.id} className="flex flex-wrap justify-between gap-3 px-5 py-3 text-[13px]">
              <span><span className="font-medium text-white">{h.action.replace(/_/g, " ").toLowerCase()}</span> <span className="text-muted-foreground">{[h.fromPlanName !== h.toPlanName && h.fromPlanName ? `${h.fromPlanName} → ${h.toPlanName}` : h.toPlanName, h.fromStatus !== h.toStatus && h.fromStatus ? `${h.fromStatus} → ${h.toStatus}` : null, h.toExpiresAt ? t.expires(formatDate(h.toExpiresAt, locale)) : null, h.note].filter(Boolean).join(" · ")}</span></span>
              <span className="text-xs text-muted-foreground">{h.actor?.email ?? txt.system} · {formatDateTime(h.createdAt, locale)}</span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
