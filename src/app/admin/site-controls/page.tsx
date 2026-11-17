import { PageHeader } from "@/components/common/app-shell";
import { SiteControlsPanel } from "@/components/admin/site-controls";
import { requireAdmin } from "@/server/auth/session";
import { getSystemSettings } from "@/server/settings";
import { quotaPeriod } from "@/server/scans/free-quota";
import { prisma } from "@/server/db";
import { smtpConfigured } from "@/server/consent/service";
import { getT } from "@/i18n/server";
import { siteControlsText } from "@/i18n/messages/admin-site-controls";

export default async function SiteControlsPage() {
  await requireAdmin();
  const [st, t] = await Promise.all([getSystemSettings(), getT(siteControlsText)]);
  const period = quotaPeriod(st.freeScanMode === "UNLIMITED" ? "DAILY" : st.freeScanMode) ?? "total";
  const [devices, exhausted] = await Promise.all([
    prisma.freeScanUsage.count({ where: { period, used: { gt: 0 } } }),
    st.freeScanMode === "UNLIMITED" ? 0 : prisma.freeScanUsage.count({ where: { period, used: { gte: Math.max(1, st.freeScanLimit) } } }),
  ]);
  return (
    <>
      <PageHeader eyebrow={t.eyebrow} title={t.title} description={t.description} />
      <div className="max-w-4xl">
        <SiteControlsPanel
          initial={{ loginEnabled: st.loginEnabled, registrationEnabled: st.registrationEnabled, pricingVisible: st.pricingVisible, consentRequired: st.consentRequired, consentEmailVerification: st.consentEmailVerification, freeScanMode: st.freeScanMode, freeScanLimit: st.freeScanLimit, anonymousIpDailyLimit: st.anonymousIpDailyLimit }}
          today={{ devices, exhausted }}
          smtpReady={smtpConfigured()}
        />
      </div>
    </>
  );
}
