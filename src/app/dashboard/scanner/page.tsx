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

export default async function ScannerPage() {
  const s = await requireUser("/dashboard/scanner");
  const [sub, user, recent] = await Promise.all([
    getActiveSubscription(s.user.id),
    prisma.user.findUniqueOrThrow({ where: { id: s.user.id }, select: { preferences: true } }),
    prisma.scan.findMany({ where: { userId: s.user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  const prefs = readPreferences(user.preferences);
  const unlimited = hasUnlimitedAccess(s.user.role);
  return (
    <>
      <PageHeader eyebrow="Analyze a link" title="URL Scanner" description="Paste a link from an e-mail, Telegram or WhatsApp message. It is analyzed on our servers; your browser never opens it." />
      {!unlimited && !sub && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-v-suspicious/30 bg-v-suspicious/[0.06] p-4 text-sm text-white/85">
          <Info className="mt-0.5 size-5 shrink-0 text-v-suspicious" />
          <p>You need an active subscription to scan URLs. <Link href="/pricing" className="text-orange hover:underline">View plans</Link> or contact your administrator to activate one.</p>
        </div>
      )}
      {unlimited ? <p className="mb-4 text-sm font-medium text-v-trusted">Unlimited access · no subscription, device or scan limits</p> : sub && <p className="mb-4 text-sm text-muted-foreground">{sub.plan.name} · {remainingDays(sub)} day(s) remaining</p>}
      <div className="surface rounded-3xl p-5 sm:p-8">
        <ScanBox variant="dashboard" signedIn reportBase="/dashboard/history" autoOpen={prefs.autoOpenReport} />
      </div>
      {recent.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-[15px] font-semibold text-white">Recent scans</h2>
          <ScanTable scans={recent} hrefBase="/dashboard/history" />
        </div>
      )}
    </>
  );
}
