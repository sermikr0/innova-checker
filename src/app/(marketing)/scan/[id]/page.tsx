import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReportView } from "@/components/scan/report-view";
import { ScanFailed } from "@/components/scan/scan-failed";
import { ScanPending } from "@/components/scan/scan-pending";
import { getSession } from "@/server/auth/session";
import { toReportDTO } from "@/server/scans/dto";
import { getFullReport } from "@/server/scans/service";
import { getT } from "@/i18n/server";
import { scanText } from "@/i18n/messages/report-scan";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(scanText);
  return { title: t.metaTitle, robots: { index: false, follow: false } };
}

export default async function ScanReportPage({ params }: PageProps<"/scan/[id]">) {
  const { id } = await params;
  const report = await getFullReport(id);
  if (!report) notFound();
  const session = await getSession();
  const scanAgain = session && session.user.role !== "SUPER_ADMIN" ? "/dashboard/scanner" : "/#scan";

  if (report.scan.status === "PENDING" || report.scan.status === "SCANNING") {
    return <ScanPending id={report.scan.id} url={report.scan.normalizedUrl} />;
  }
  if (report.scan.status === "FAILED" || !report.result) {
    return <ScanFailed url={report.scan.normalizedUrl} message={report.scan.errorMessage} scanAgainHref={scanAgain} />;
  }
  return <ReportView report={toReportDTO(report)} backHref={session ? "/dashboard/history" : "/"} scanAgainHref={scanAgain} />;
}
