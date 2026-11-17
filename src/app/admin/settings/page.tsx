import { PageHeader } from "@/components/common/app-shell";
import { SystemSettingsForm } from "@/components/admin/settings-forms";
import { PasswordForm } from "@/components/dashboard/account-forms";
import { requireAdmin } from "@/server/auth/session";
import { getSystemSettings } from "@/server/settings";
import { getT } from "@/i18n/server";
import { adminText } from "@/i18n/messages/admin";

export default async function AdminSettings() {
  const s = await requireAdmin();
  const st = await getSystemSettings();
  const t = (await getT(adminText)).settings;
  return (
    <>
      <PageHeader eyebrow={t.eyebrow} title={t.title} description={t.description} />
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <SystemSettingsForm initial={{ siteName: st.siteName, supportEmail: st.supportEmail, sessionTtlHours: st.sessionTtlHours, loginMaxAttempts: st.loginMaxAttempts, loginLockoutMinutes: st.loginLockoutMinutes, ipBlockMinutes: st.ipBlockMinutes, paymentWindowSeconds: st.paymentWindowSeconds, passwordMinLength: st.passwordMinLength, deviceRemovalsPer30Days: st.deviceRemovalsPer30Days, allowUserDeviceRemoval: st.allowUserDeviceRemoval, noSubscriptionDeviceLimit: st.noSubscriptionDeviceLimit, maintenanceMode: st.maintenanceMode, maintenanceMessage: st.maintenanceMessage }} />
        <div className="space-y-5">
          <section className="surface rounded-2xl p-6"><h2 className="text-[15px] font-semibold text-white">{t.changePassword}</h2><p className="mt-1 mb-5 text-xs text-muted-foreground">{t.signedInAs(s.user.email)}</p><PasswordForm /></section>
          <section className="surface rounded-2xl p-6 text-sm text-white/75">
            <h2 className="mb-2 text-[15px] font-semibold text-white">{t.managedElsewhere}</h2>
            <ul className="list-inside list-disc space-y-1 text-[13px]">
              {t.managedList.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
