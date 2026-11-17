import { PageHeader } from "@/components/common/app-shell";
import { SiteControlsPanel } from "@/components/admin/site-controls";
import { requireAdmin } from "@/server/auth/session";
import { getSystemSettings } from "@/server/settings";
import { quotaPeriod } from "@/server/scans/free-quota";
import { prisma } from "@/server/db";

export default async function SiteControlsPage() {
  await requireAdmin();
  const st = await getSystemSettings();
  const period = quotaPeriod(st.freeScanMode === "UNLIMITED" ? "DAILY" : st.freeScanMode) ?? "total";
  const [devices, exhausted] = await Promise.all([
    prisma.freeScanUsage.count({ where: { period, used: { gt: 0 } } }),
    st.freeScanMode === "UNLIMITED" ? 0 : prisma.freeScanUsage.count({ where: { period, used: { gte: Math.max(1, st.freeScanLimit) } } }),
  ]);
  return (
    <>
      <PageHeader eyebrow="Platform" title="Site controls" description="Open or close client sign-in and registration, show or hide pricing, and choose how many free checks people get before paying." />
      <div className="max-w-4xl">
        <SiteControlsPanel
          initial={{ loginEnabled: st.loginEnabled, registrationEnabled: st.registrationEnabled, pricingVisible: st.pricingVisible, freeScanMode: st.freeScanMode, freeScanLimit: st.freeScanLimit, anonymousIpDailyLimit: st.anonymousIpDailyLimit }}
          today={{ devices, exhausted }}
        />
      </div>
    </>
  );
}
