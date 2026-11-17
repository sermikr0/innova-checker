import type { ReportDTO } from "@/lib/report-types";
import { PROVIDER_NAMES } from "@/lib/report-types";
import { riskLevelFor } from "../scanner/scoring";
import type { FullReport } from "./service";

export function toReportDTO(r: FullReport): ReportDTO {
  const { scan, result, findings, intel } = r;
  const scoring = (result?.scoring ?? null) as ReportDTO["scoring"] & { riskLevel?: string };
  return {
    id: scan.id,
    inputUrl: scan.inputUrl,
    normalizedUrl: scan.normalizedUrl,
    finalUrl: scan.finalUrl,
    domain: scan.domain,
    registrableDomain: scan.registrableDomain,
    status: scan.status,
    verdict: scan.verdict,
    riskScore: scan.riskScore,
    riskLevel: scoring?.riskLevel ?? (scan.riskScore != null ? riskLevelFor(scan.riskScore) : null),
    confidence: scan.confidence,
    createdAt: scan.createdAt.toISOString(),
    startedAt: scan.startedAt?.toISOString() ?? null,
    completedAt: scan.completedAt?.toISOString() ?? null,
    durationMs: scan.durationMs,
    errorMessage: scan.errorMessage,
    summary: result?.summary ?? null,
    recommendations: Array.isArray(result?.recommendations) ? (result.recommendations as string[]) : [],
    modules: Array.isArray(result?.modules) ? (result.modules as ReportDTO["modules"]) : [],
    scoring,
    data: {
      urlAnalysis: result?.urlAnalysis ?? null,
      domainInfo: result?.domainInfo ?? null,
      dnsRecords: result?.dnsRecords ?? null,
      tlsInfo: result?.tlsInfo ?? null,
      redirects: result?.redirects ?? null,
      content: result?.content ?? null,
      download: result?.download ?? null,
    },
    domainDb: (result?.domainDbMatch ?? null) as ReportDTO["domainDb"],
    findings: findings.map((f) => ({
      id: f.id,
      module: f.module,
      code: f.code,
      title: f.title,
      status: f.status,
      severity: f.severity,
      weight: f.weight,
      result: f.result,
      explanation: f.explanation,
      evidence: f.evidence,
      source: f.source,
      checkedAt: f.checkedAt.toISOString(),
    })),
    intel: intel.map((i) => ({
      provider: i.provider,
      providerName: PROVIDER_NAMES[i.provider] ?? i.provider,
      status: i.status,
      summary: i.summary,
      details: i.details,
      latencyMs: i.latencyMs,
      checkedAt: i.checkedAt.toISOString(),
    })),
  };
}
