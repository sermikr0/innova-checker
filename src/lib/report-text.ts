import { MODULE_LABELS, MODULE_ORDER, type ReportDTO } from "./report-types";
import { VERDICTS, isBlacklisted, isDeadLink, labelFor, noticeFor, type VerdictKey } from "./verdict";

export const REPORT_DISCLAIMER =
  "No automated scanner can guarantee that a website is 100% safe. Attackers change content, serve different pages to different visitors and use brand-new infrastructure. Use this report as one input to your judgement and follow your company's security policy.";

/** Plain-text rendering used by "Copy Report". */
export function reportToText(r: ReportDTO): string {
  const v = r.verdict ? (VERDICTS[r.verdict as VerdictKey] ? labelFor(r.verdict as VerdictKey, isBlacklisted(r)) : r.verdict) : "—";
  const lines: string[] = [];
  lines.push("INNOVA CHECKER — URL SECURITY REPORT");
  lines.push("=".repeat(40));
  lines.push(`Verdict:      ${v}`);
  lines.push(`Risk score:   ${r.riskScore ?? "—"}/100 (${r.riskLevel ?? "—"})`);
  lines.push(`Scanned URL:  ${r.normalizedUrl}`);
  if (r.finalUrl && r.finalUrl !== r.normalizedUrl) lines.push(`Final URL:    ${r.finalUrl}`);
  lines.push(`Domain:       ${r.domain}`);
  lines.push(`Scanned at:   ${r.completedAt ?? r.createdAt}`);
  lines.push(`Duration:     ${r.durationMs != null ? `${(r.durationMs / 1000).toFixed(1)} s` : "—"}`);
  lines.push(`Coverage:     ${r.confidence ?? "—"}%`);
  lines.push(`Report ID:    ${r.id}`);
  lines.push("");
  if (r.summary) lines.push(`Summary: ${r.summary}`, "");
  lines.push(`>>> ${noticeFor((r.verdict ?? "INCONCLUSIVE") as VerdictKey, isDeadLink(r), isBlacklisted(r))}`, "");
  if (r.domainDb) {
    lines.push(`Domain intelligence: ${r.domainDb.reason}`);
    for (const m of r.domainDb.matches) lines.push(`  - ${m.record.listType} ${m.record.domain} (${m.record.trustStatus}) — source: ${m.record.verificationSource ?? "—"}; verified ${m.record.verifiedAt ?? "—"}`);
    lines.push("");
  }
  for (const m of MODULE_ORDER) {
    const fs = r.findings.filter((f) => f.module === m);
    if (!fs.length) continue;
    lines.push(`## ${MODULE_LABELS[m]}`);
    for (const f of fs) lines.push(`- [${f.status}] ${f.title}: ${f.result}${f.weight ? ` (risk +${f.weight})` : ""}`);
    lines.push("");
  }
  if (r.recommendations.length) {
    lines.push("## Security recommendations");
    r.recommendations.forEach((rec, i) => lines.push(`${i + 1}. ${rec}`));
    lines.push("");
  }
  lines.push(`Disclaimer: ${REPORT_DISCLAIMER}`);
  return lines.join("\n");
}
