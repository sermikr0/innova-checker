import { prisma } from "@/server/db";
import { jsonError, jsonOk, route } from "@/server/http";
import { isBlacklisted, isDeadLink } from "@/lib/verdict";
import { getViewableScan } from "@/server/scans/service";

export const GET = route<RouteContext<"/api/scans/[id]">>(async (_req, ctx) => {
  const { id } = await ctx.params;
  const scan = await getViewableScan(id);
  if (!scan) return jsonError(404, "NOT_FOUND", "Scan not found.");
  const extra = scan.verdict === "INCONCLUSIVE" || scan.verdict === "MALICIOUS" ? await prisma.scanResult.findUnique({ where: { scanId: id }, select: { dnsRecords: true, domainDbMatch: true } }) : null;
  const dns = scan.verdict === "INCONCLUSIVE" ? extra?.dnsRecords : null;
  return jsonOk({
    id: scan.id,
    status: scan.status,
    stages: scan.stage ? scan.stage.split(",").filter(Boolean) : [],
    verdict: scan.verdict,
    riskScore: scan.riskScore,
    deadLink: isDeadLink({ verdict: scan.verdict, data: { dnsRecords: dns as { nxdomain?: boolean } | null } }),
    blacklisted: isBlacklisted({ verdict: scan.verdict, domainDb: extra?.domainDbMatch as { decision?: string } | null }),
    url: scan.normalizedUrl,
    error: scan.status === "FAILED" ? scan.errorMessage : null,
  });
});
