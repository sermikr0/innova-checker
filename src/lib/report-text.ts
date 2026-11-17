import type { Locale } from "@/i18n/config";
import { reportText } from "@/i18n/messages/report";
import { MODULE_LABELS, MODULE_ORDER, type ReportDTO } from "./report-types";
import { VERDICTS, checkStatusLabel, isBlacklisted, isDeadLink, labelFor, noticeFor, type VerdictKey } from "./verdict";

/** English disclaimer (the PDF export stays English). */
export const REPORT_DISCLAIMER = reportText.en.disclaimer;

function lookup(map: object, key: string): string | undefined {
  return (map as Record<string, string | undefined>)[key];
}

/** Plain-text rendering used by "Copy Report", in the interface language. */
export function reportToText(r: ReportDTO, locale: Locale = "en"): string {
  const t = reportText[locale];
  const c = t.copy;
  const v = r.verdict ? (VERDICTS[r.verdict as VerdictKey] ? labelFor(r.verdict as VerdictKey, isBlacklisted(r), locale) : r.verdict) : "—";
  const level = r.riskLevel != null ? (lookup(t.riskLevels, r.riskLevel) ?? r.riskLevel) : "—";
  const width = Math.max(...[c.verdict, c.riskScore, c.scannedUrl, c.finalUrl, c.domain, c.scannedAt, c.duration, c.coverage, c.reportId].map((l) => l.length)) + 2;
  const row = (label: string, value: string) => `${label.padEnd(width)}${value}`;
  const lines: string[] = [];
  lines.push(c.title);
  lines.push("=".repeat(40));
  lines.push(row(c.verdict, v));
  lines.push(row(c.riskScore, `${r.riskScore ?? "—"}/100 (${level})`));
  lines.push(row(c.scannedUrl, r.normalizedUrl));
  if (r.finalUrl && r.finalUrl !== r.normalizedUrl) lines.push(row(c.finalUrl, r.finalUrl));
  lines.push(row(c.domain, r.domain));
  lines.push(row(c.scannedAt, r.completedAt ?? r.createdAt));
  lines.push(row(c.duration, r.durationMs != null ? c.seconds((r.durationMs / 1000).toFixed(1)) : "—"));
  lines.push(row(c.coverage, `${r.confidence ?? "—"}%`));
  lines.push(row(c.reportId, r.id));
  lines.push("");
  if (r.summary) lines.push(`${c.summary} ${r.summary}`, "");
  lines.push(`>>> ${noticeFor((r.verdict ?? "INCONCLUSIVE") as VerdictKey, isDeadLink(r), isBlacklisted(r), locale)}`, "");
  if (r.domainDb) {
    lines.push(`${c.domainDb} ${r.domainDb.reason}`);
    for (const m of r.domainDb.matches) {
      const list = lookup(t.db.listType, m.record.listType) ?? m.record.listType;
      const trust = lookup(c.trust, m.record.trustStatus) ?? m.record.trustStatus;
      lines.push(`  - ${c.dbMatch(list, m.record.domain, trust, m.record.verificationSource ?? "—", m.record.verifiedAt ?? "—")}`);
    }
    lines.push("");
  }
  for (const m of MODULE_ORDER) {
    const fs = r.findings.filter((f) => f.module === m);
    if (!fs.length) continue;
    lines.push(`## ${lookup(t.modules, m) ?? MODULE_LABELS[m]}`);
    for (const f of fs) {
      // English keeps the raw status code ([FAIL]); other languages show the translated label.
      const status = locale === "en" ? f.status : checkStatusLabel(f.status, locale).toUpperCase();
      lines.push(`- [${status}] ${f.title}: ${f.result}${f.weight ? c.risk(f.weight) : ""}`);
    }
    lines.push("");
  }
  if (r.recommendations.length) {
    lines.push(c.recommendations);
    r.recommendations.forEach((rec, i) => lines.push(`${i + 1}. ${rec}`));
    lines.push("");
  }
  lines.push(`${c.disclaimer} ${t.disclaimer}`);
  return lines.join("\n");
}
