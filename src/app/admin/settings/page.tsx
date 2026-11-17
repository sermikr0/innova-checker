import { PageHeader } from "@/components/common/app-shell";
import { SystemSettingsForm } from "@/components/admin/settings-forms";
import { PasswordForm } from "@/components/dashboard/account-forms";
import { requireAdmin } from "@/server/auth/session";
import { getSystemSettings } from "@/server/settings";

export default async function AdminSettings() {
  const s = await requireAdmin();
  const st = await getSystemSettings();
  return (
    <>
      <PageHeader eyebrow="Platform" title="Settings" description="Website, security policies and maintenance mode. Saved settings apply immediately." />
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <SystemSettingsForm initial={{ siteName: st.siteName, supportEmail: st.supportEmail, sessionTtlHours: st.sessionTtlHours, loginMaxAttempts: st.loginMaxAttempts, loginLockoutMinutes: st.loginLockoutMinutes, ipBlockMinutes: st.ipBlockMinutes, paymentWindowSeconds: st.paymentWindowSeconds, passwordMinLength: st.passwordMinLength, deviceRemovalsPer30Days: st.deviceRemovalsPer30Days, allowUserDeviceRemoval: st.allowUserDeviceRemoval, noSubscriptionDeviceLimit: st.noSubscriptionDeviceLimit, maintenanceMode: st.maintenanceMode, maintenanceMessage: st.maintenanceMessage }} />
        <div className="space-y-5">
          <section className="surface rounded-2xl p-6"><h2 className="text-[15px] font-semibold text-white">Change admin password</h2><p className="mt-1 mb-5 text-xs text-muted-foreground">Signed in as {s.user.email}. Other sessions are signed out.</p><PasswordForm /></section>
          <section className="surface rounded-2xl p-6 text-sm text-white/75">
            <h2 className="mb-2 text-[15px] font-semibold text-white">Managed elsewhere</h2>
            <ul className="list-inside list-disc space-y-1 text-[13px]">
              <li>Client sign-in, registration, pricing visibility and free checks: Site controls</li>
              <li>Users, devices and sessions: Users</li>
              <li>Plans, prices and device limits: Plans & pricing</li>
              <li>Whitelist / blacklist: Domain intelligence</li>
              <li>Modules, providers, risk scoring: Scanner</li>
              <li>API keys and SMTP: server environment variables</li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
