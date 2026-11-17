import Link from "next/link";
import { Info } from "lucide-react";
import { PageHeader } from "@/components/common/app-shell";
import { ScanBox } from "@/components/scan/scan-box";
import { ScanTable } from "@/components/dashboard/scan-table";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth/session";
import { getActiveSubscription, remainingDays } from "@/server/subscriptions/service";
import { readPreferences } from "@/lib/preferences";
import { hasUnlimitedAccess } from "@/lib/roles";
import { getSiteAccess, getSystemSettings } from "@/server/settings";
import { freeScansLeft } from "@/server/scans/free-quota";
import { freePolicyLong, freePolicyShort } from "@/lib/site-access";
import { getLocale, getT } from "@/i18n/server";
import { dashboardText } from "@/i18n/messages/dashboard";

export default async function ScannerPage() {
  const s = await requireUser("/dashboard/scanner");
  const [sub, user, recent] = await Promise.all([
    getActiveSubscription(s.user.id),
    prisma.user.findUniqueOrThrow({ where: { id: s.user.id }, select: { preferences: true } }),
    prisma.scan.findMany({ where: { userId: s.user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  const prefs = readPreferences(user.preferences);
  const unlimited = hasUnlimitedAccess(s.user.role);
  const [access, system] = await Promise.all([getSiteAccess(), getSystemSettings()]);
  // Without a subscription the free allowance applies, counted on this device.
  const device = !unlimited && !sub && s.deviceId ? await prisma.device.findUnique({ where: { id: s.deviceId }, select: { fingerprintHash: true } }) : null;
  const left = !unlimited && !sub ? await freeScansLeft(system, device?.fingerprintHash ?? null) : null;
  const [t, locale] = await Promise.all([getT(dashboardText), getLocale()]);
  const daily = access.freeMode === "DAILY";
  const plansLink = access.pricing ? <Link href="/pricing" className="text-orange hover:underline">{t.viewPlans}</Link> : <Link href="/contact" className="text-orange hover:underline">{t.contactUs}</Link>;
  return (
    <>
      <PageHeader eyebrow={t.scanner.eyebrow} title={t.scanner.title} description={t.scanner.description} />
      {!unlimited && !sub && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-v-suspicious/30 bg-v-suspicious/[0.06] p-4 text-sm text-white/85">
          <Info className="mt-0.5 size-5 shrink-0 text-v-suspicious" />
          <p>
            {left === null ? (
              <><strong className="text-white">{t.freePlan} · {freePolicyShort(access, locale).toLowerCase()}.</strong> {freePolicyLong(access, locale)}</>
            ) : left > 0 ? (
              <><strong className="text-white">{t.freePlan} · {t.scanner.freeLeft(left, access.freeLimit, daily)}.</strong> {freePolicyLong(access, locale)}</>
            ) : (
              <><strong className="text-white">{t.scanner.freeUsed(access.freeLimit, daily)}</strong> {daily && access.freeLimit > 0 ? t.scanner.renewAt : ""}</>
            )}{" "}
            {plansLink} {t.scanner.orContactAdmin}
          </p>
        </div>
      )}
      {unlimited ? <p className="mb-4 text-sm font-medium text-v-trusted">{t.unlimitedAccess} · {t.noLimits}</p> : sub && <p className="mb-4 text-sm text-muted-foreground">{sub.plan.name} · {t.scanner.daysRemaining(remainingDays(sub))}</p>}
      <div className="surface rounded-3xl p-5 sm:p-8">
        <ScanBox variant="dashboard" signedIn reportBase="/dashboard/history" autoOpen={prefs.autoOpenReport} access={{ login: access.login, register: access.register, pricing: access.pricing, note: freePolicyShort(access, locale) }} />
      </div>
      {recent.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-[15px] font-semibold text-white">{t.recentScans}</h2>
          <ScanTable scans={recent} hrefBase="/dashboard/history" />
        </div>
      )}
    </>
  );
}
