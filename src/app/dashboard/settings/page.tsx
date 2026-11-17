import Link from "next/link";
import { Download, LogOut, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/app-shell";
import { ConfirmButton } from "@/components/common/confirm-button";
import { DeleteAccountForm, PreferencesForm } from "@/components/dashboard/account-forms";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth/session";
import { getLatestSubscription, remainingDays } from "@/server/subscriptions/service";
import { readPreferences } from "@/lib/preferences";
import { formatDate } from "@/lib/format";
import { hasUnlimitedAccess } from "@/lib/roles";
import { deleteScanHistoryAction, signOutOtherSessionsAction } from "../actions";
import { getLocale, getT } from "@/i18n/server";
import { dashboardText } from "@/i18n/messages/dashboard";

export default async function SettingsPage() {
  const s = await requireUser("/dashboard/settings");
  const [user, sub, otherSessions] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: s.user.id }, select: { preferences: true } }),
    getLatestSubscription(s.user.id),
    prisma.session.count({ where: { userId: s.user.id, revokedAt: null, expiresAt: { gt: new Date() }, NOT: { id: s.sessionId } } }),
  ]);
  const [t, locale] = await Promise.all([getT(dashboardText), getLocale()]);
  const st = t.settings;
  return (
    <>
      <PageHeader eyebrow={st.eyebrow} title={st.title} description={st.description} />
      <div className="space-y-5">
        <section className="surface rounded-2xl p-6"><h2 className="text-[15px] font-semibold text-white">{st.preferences}</h2><PreferencesForm prefs={readPreferences(user.preferences)} /></section>
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="surface rounded-2xl p-6">
            <h2 className="text-[15px] font-semibold text-white">{st.security}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{st.otherSessions(otherSessions)} <Link href="/dashboard/devices" className="text-orange hover:underline">{t.manageDevices}</Link> · <Link href="/dashboard/profile" className="text-orange hover:underline">{t.changePassword}</Link></p>
            <ConfirmButton action={signOutOtherSessionsAction} title={st.signOutOthersTitle} description={st.signOutOthersDesc} confirmLabel={st.signOutOthersConfirm} className="mt-4 h-10 border border-white/10 px-4 text-white hover:bg-white/5"><LogOut className="size-4" /> {st.signOutOthersButton}</ConfirmButton>
          </section>
          <section className="surface rounded-2xl p-6">
            <h2 className="text-[15px] font-semibold text-white">{st.subscription}</h2>
            <p className="mt-2 text-sm text-white/80">{hasUnlimitedAccess(s.user.role) ? `${t.unlimitedAccess} (${t.noLimits})` : sub ? `${sub.plan.name} · ${t.subStatus[sub.status].toLowerCase()} · ${st.daysLeft(remainingDays(sub))} · ${st.expiresOn(formatDate(sub.expiresAt, locale))}` : st.noSubscription}</p>
            <Link href="/dashboard/subscription" className="mt-4 inline-flex h-10 items-center rounded-xl border border-white/10 px-4 text-sm text-white hover:bg-white/5">{st.viewSubscription}</Link>
          </section>
        </div>
        <section className="surface rounded-2xl p-6">
          <h2 className="text-[15px] font-semibold text-white">{st.yourData}</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="/api/me/scans/export" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm text-white hover:bg-white/5"><Download className="size-4" /> {st.exportHistory}</a>
            <ConfirmButton action={deleteScanHistoryAction} title={st.deleteHistoryTitle} description={st.deleteHistoryDesc} confirmLabel={st.deleteHistoryConfirm} destructive className="h-10 border border-v-malicious/30 px-4 text-v-malicious hover:bg-v-malicious/10"><Trash2 className="size-4" /> {st.deleteHistoryButton}</ConfirmButton>
          </div>
        </section>
        {s.user.role !== "SUPER_ADMIN" && (
          <section className="rounded-2xl border border-v-malicious/25 bg-v-malicious/[0.04] p-6">
            <h2 className="text-[15px] font-semibold text-v-malicious">{st.deleteAccount}</h2>
            <p className="mt-1 mb-4 text-sm text-white/70">{st.deleteAccountText}</p>
            <DeleteAccountForm />
          </section>
        )}
      </div>
    </>
  );
}
