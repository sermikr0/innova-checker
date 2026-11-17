import { notFound } from "next/navigation";
import { ReportView } from "@/components/scan/report-view";
import { ScanFailed } from "@/components/scan/scan-failed";
import { ScanPending } from "@/components/scan/scan-pending";
import { ReportDomainButton } from "@/components/dashboard/report-domain-button";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth/session";
import { toReportDTO } from "@/server/scans/dto";
import { getFullReport } from "@/server/scans/service";
import { readPreferences } from "@/lib/preferences";

export default async function HistoryReportPage({ params }: PageProps<"/dashboard/history/[id]">) {
  const s = await requireUser("/dashboard/history");
  const { id } = await params;
  const report = await getFullReport(id);
  if (!report || (report.scan.userId !== s.user.id && s.user.role !== "SUPER_ADMIN")) notFound();
  if (report.scan.status === "PENDING" || report.scan.status === "SCANNING") return <ScanPending id={id} url={report.scan.normalizedUrl} />;
  if (report.scan.status === "FAILED" || !report.result) return <ScanFailed url={report.scan.normalizedUrl} message={report.scan.errorMessage} scanAgainHref="/dashboard/scanner" />;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: s.user.id }, select: { preferences: true } });
  return (
    <div className="-mx-4 -my-8 sm:-mx-6 lg:-mx-10">
      <ReportView report={toReportDTO(report)} backHref="/dashboard/history" scanAgainHref="/dashboard/scanner" defaultExpanded={readPreferences(user.preferences).reportDetail === "full"} extraActions={<ReportDomainButton key="report-domain" domain={report.scan.domain} />} />
    </div>
  );
}
