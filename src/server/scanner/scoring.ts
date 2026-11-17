import type { Finding, IntelResult, ScannerSettings, ScoreBreakdown, Verdict } from "./types";

// Risk model: each finding carries a weight (0-100) that is scaled by the
// administrator's category multiplier. Weights are combined as independent
// probabilities, 1 - Π(1 - w), so many weak signals add up but never exceed 100
// and a single strong signal dominates.

export interface ScoreResult {
  riskScore: number;
  verdict: Verdict;
  riskLevel: string;
  confidence: number;
  summary: string;
  breakdown: ScoreBreakdown;
}

export function riskLevelFor(score: number): string {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High";
  if (score >= 35) return "Medium";
  if (score >= 15) return "Low";
  return "Minimal";
}

export function scoreFindings(
  findings: Finding[],
  intel: IntelResult[],
  settings: ScannerSettings,
  ctx: { reachable: boolean; modulesOk: number; modulesEnabled: number },
): ScoreResult {
  const contributions = findings
    .filter((f) => f.weight > 0)
    .map((f) => {
      const mult = settings.weights[f.module] ?? 1;
      return { code: f.code, module: f.module, title: f.title, weight: f.weight, effective: Math.min(100, Math.round(f.weight * mult)) };
    })
    .filter((c) => c.effective > 0)
    .sort((a, b) => b.effective - a.effective);

  const combined = 1 - contributions.reduce((acc, c) => acc * (1 - c.effective / 100), 1);
  let riskScore = Math.round(combined * 100);

  const intelMalicious = intel.some((i) => i.status === "MALICIOUS");
  const scored = findings.filter((f) => f.weight > 0);
  const criticalCount = scored.filter((f) => f.severity === "CRITICAL").length;
  const highCount = scored.filter((f) => f.severity === "HIGH").length;
  const providersConfigured = intel.filter((i) => !["NOT_CONFIGURED", "DISABLED"].includes(i.status)).length;
  const providersRun = intel.filter((i) => ["CLEAN", "MALICIOUS", "SUSPICIOUS", "UNKNOWN"].includes(i.status)).length;
  const moduleCoverage = ctx.modulesEnabled ? ctx.modulesOk / ctx.modulesEnabled : 0;
  const confidence = Math.round(70 * moduleCoverage + 30 * (providersRun / Math.max(intel.length, 1)));

  let verdict: Verdict;
  if (intelMalicious) {
    riskScore = Math.max(riskScore, 92);
    verdict = "MALICIOUS";
  } else if (riskScore >= 80 && criticalCount > 0) {
    verdict = "MALICIOUS";
  } else if (riskScore >= 60) {
    verdict = "HIGH_RISK";
  } else if (riskScore >= 35) {
    verdict = "SUSPICIOUS";
  } else if (!ctx.reachable || moduleCoverage < 0.5) {
    verdict = "INCONCLUSIVE";
  } else if (riskScore >= 15) {
    verdict = "LOW_RISK";
  } else {
    verdict = "SAFE";
  }

  const nx = findings.find((f) => f.code === "DNS_RESOLUTION" && f.status === "FAIL" && f.evidence?.nxdomain === true)?.evidence;
  const deadLinkSummary = nx
    ? `${String(nx.host)} does not exist on the internet (no DNS record${(nx.confirmedBy as string[] | undefined)?.length ? ", confirmed by public DNS" : ""}), so there is no website to analyze. The link is dead, mistyped or was taken down.${nx.zoneExists ? ` Whoever controls ${String(nx.zone)} can switch this address on at any time, so do not trust it if it came in a message.` : ""}`
    : null;

  const top = contributions.slice(0, 3).map((c) => c.title.toLowerCase());
  const maliciousIntel = intel.filter((i) => i.status === "MALICIOUS").map((i) => i.providerName);
  const summary =
    verdict === "MALICIOUS" && maliciousIntel.length
      ? `Listed as malicious by ${maliciousIntel.join(", ")}. Do not open this link.`
      : verdict === "MALICIOUS"
        ? `Strong phishing/malware indicators: ${top.join("; ")}. Do not open this link.`
        : verdict === "HIGH_RISK"
          ? `Several serious warning signs: ${top.join("; ")}. Treat this link as dangerous.`
          : verdict === "SUSPICIOUS"
            ? `Some warning signs were found: ${top.join("; ")}. Verify the sender before opening.`
            : verdict === "INCONCLUSIVE" && deadLinkSummary
              ? deadLinkSummary
              : verdict === "INCONCLUSIVE"
              ? "The site could not be fully analyzed (unreachable or most checks unavailable). Absence of findings is not evidence of safety."
              : verdict === "LOW_RISK"
                ? `No serious threats found; minor observations: ${top.join("; ") || "none"}.`
                : providersConfigured === 0
                  ? "No threats found by local analysis. No threat-intelligence providers are configured, so reputation feeds were not consulted."
                  : "No threats found by local analysis or the configured threat-intelligence providers.";

  return {
    riskScore,
    verdict,
    riskLevel: riskLevelFor(riskScore),
    confidence,
    summary,
    breakdown: {
      rawScore: Math.round(combined * 100),
      contributions,
      intelMalicious,
      criticalCount,
      highCount,
      reachable: ctx.reachable,
      coverage: { modulesOk: ctx.modulesOk, modulesEnabled: ctx.modulesEnabled, providersRun, providersConfigured },
    },
  };
}
