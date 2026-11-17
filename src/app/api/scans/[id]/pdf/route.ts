import { jsonError, route } from "@/server/http";
import { renderReportPdf } from "@/server/reports/pdf";
import { toReportDTO } from "@/server/scans/dto";
import { getFullReport } from "@/server/scans/service";

export const GET = route<RouteContext<"/api/scans/[id]/pdf">>(async (_req, ctx) => {
  const { id } = await ctx.params;
  const report = await getFullReport(id);
  if (!report) return jsonError(404, "NOT_FOUND", "Scan not found.");
  if (report.scan.status !== "COMPLETED" || !report.result) return jsonError(409, "NOT_READY", "The scan has not completed.");
  const bytes = await renderReportPdf(toReportDTO(report));
  const safeDomain = report.scan.domain.replace(/[^a-z0-9.-]/gi, "_").slice(0, 60);
  const date = (report.scan.completedAt ?? report.scan.createdAt).toISOString().slice(0, 10);
  return new Response(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="innova-checker-${safeDomain}-${date}.pdf"`,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
});
