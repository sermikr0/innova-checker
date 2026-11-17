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

export default async function SettingsPage() {
  const s = await requireUser("/dashboard/settings");
  const [user, sub, otherSessions] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: s.user.id }, select: { preferences: true } }),
    getLatestSubscription(s.user.id),
    prisma.session.count({ where: { userId: s.user.id, revokedAt: null, expiresAt: { gt: new Date() }, NOT: { id: s.sessionId } } }),
  ]);
  return (
    <>
      <PageHeader eyebrow="Account" title="Settings" description="Preferences, sessions, data and account controls." />
      <div className="space-y-5">
        <section className="surface rounded-2xl p-6"><h2 className="text-[15px] font-semibold text-white">Preferences</h2><PreferencesForm prefs={readPreferences(user.preferences)} /></section>
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="surface rounded-2xl p-6">
            <h2 className="text-[15px] font-semibold text-white">Security & sessions</h2>
            <p className="mt-2 text-sm text-muted-foreground">{otherSessions} other active session(s). <Link href="/dashboard/devices" className="text-orange hover:underline">Manage devices</Link> · <Link href="/dashboard/profile" className="text-orange hover:underline">Change password</Link></p>
            <ConfirmButton action={signOutOtherSessionsAction} title="Sign out everywhere else?" description="Every other browser signed in to your account will be signed out." confirmLabel="Sign out others" className="mt-4 h-10 border border-white/10 px-4 text-white hover:bg-white/5"><LogOut className="size-4" /> Sign out of other sessions</ConfirmButton>
          </section>
          <section className="surface rounded-2xl p-6">
            <h2 className="text-[15px] font-semibold text-white">Subscription</h2>
            <p className="mt-2 text-sm text-white/80">{hasUnlimitedAccess(s.user.role) ? "Unlimited access (no subscription, device or scan limits)" : sub ? `${sub.plan.name} · ${sub.status.toLowerCase()} · ${remainingDays(sub)} day(s) left · expires ${formatDate(sub.expiresAt)}` : "No subscription"}</p>
            <Link href="/dashboard/subscription" className="mt-4 inline-flex h-10 items-center rounded-xl border border-white/10 px-4 text-sm text-white hover:bg-white/5">View subscription</Link>
          </section>
        </div>
        <section className="surface rounded-2xl p-6">
          <h2 className="text-[15px] font-semibold text-white">Your data</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="/api/me/scans/export" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm text-white hover:bg-white/5"><Download className="size-4" /> Export scan history (CSV)</a>
            <ConfirmButton action={deleteScanHistoryAction} title="Delete all scan history?" description="Every report in your history will be permanently deleted. This cannot be undone." confirmLabel="Delete history" destructive className="h-10 border border-v-malicious/30 px-4 text-v-malicious hover:bg-v-malicious/10"><Trash2 className="size-4" /> Delete scan history</ConfirmButton>
          </div>
        </section>
        {s.user.role !== "SUPER_ADMIN" && (
          <section className="rounded-2xl border border-v-malicious/25 bg-v-malicious/[0.04] p-6">
            <h2 className="text-[15px] font-semibold text-v-malicious">Delete account</h2>
            <p className="mt-1 mb-4 text-sm text-white/70">Permanently deletes your account, devices, sessions and scan history.</p>
            <DeleteAccountForm />
          </section>
        )}
      </div>
    </>
  );
}
