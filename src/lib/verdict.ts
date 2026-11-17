// Display metadata shared by server and client components. Labels here are
// English; the *For / *Label helpers return them in the interface language.
import type { Locale } from "@/i18n/config";
import { verdictText } from "@/i18n/messages/verdict";

export type VerdictKey = "TRUSTED" | "SAFE" | "LOW_RISK" | "SUSPICIOUS" | "HIGH_RISK" | "MALICIOUS" | "INCONCLUSIVE";

export const VERDICTS: Record<VerdictKey, { label: string; color: string; text: string; bg: string; ring: string; tagline: string }> = {
  TRUSTED: { label: "Trusted", color: "var(--v-trusted)", text: "text-v-trusted", bg: "bg-v-trusted/12", ring: "ring-v-trusted/30", tagline: "Verified official domain" },
  SAFE: { label: "Safe", color: "var(--v-safe)", text: "text-v-safe", bg: "bg-v-safe/12", ring: "ring-v-safe/30", tagline: "No threats detected" },
  LOW_RISK: { label: "Low Risk", color: "var(--v-low)", text: "text-v-low", bg: "bg-v-low/12", ring: "ring-v-low/30", tagline: "Minor observations only" },
  SUSPICIOUS: { label: "Suspicious", color: "var(--v-suspicious)", text: "text-v-suspicious", bg: "bg-v-suspicious/12", ring: "ring-v-suspicious/30", tagline: "Verify before opening" },
  HIGH_RISK: { label: "High Risk", color: "var(--v-high)", text: "text-v-high", bg: "bg-v-high/12", ring: "ring-v-high/30", tagline: "Treat as dangerous" },
  MALICIOUS: { label: "Scam", color: "var(--v-malicious)", text: "text-v-malicious", bg: "bg-v-malicious/12", ring: "ring-v-malicious/30", tagline: "Do not open" },
  INCONCLUSIVE: { label: "Inconclusive", color: "var(--v-inconclusive)", text: "text-v-inconclusive", bg: "bg-v-inconclusive/12", ring: "ring-v-inconclusive/30", tagline: "Could not be fully analyzed" },
};

export type CheckStatusKey = "PASS" | "INFO" | "WARN" | "FAIL" | "ERROR" | "UNAVAILABLE" | "NOT_CONFIGURED" | "SKIPPED";

export const CHECK_STATUS: Record<CheckStatusKey, { label: string; cls: string }> = {
  PASS: { label: "Pass", cls: "text-v-safe bg-v-safe/10 ring-v-safe/25" },
  INFO: { label: "Info", cls: "text-sev-info bg-sev-info/10 ring-sev-info/25" },
  WARN: { label: "Warning", cls: "text-v-suspicious bg-v-suspicious/10 ring-v-suspicious/25" },
  FAIL: { label: "Fail", cls: "text-v-malicious bg-v-malicious/10 ring-v-malicious/25" },
  ERROR: { label: "Error", cls: "text-v-malicious bg-v-malicious/10 ring-v-malicious/20" },
  UNAVAILABLE: { label: "Unavailable", cls: "text-muted-foreground bg-white/5 ring-white/10" },
  NOT_CONFIGURED: { label: "Not configured", cls: "text-muted-foreground bg-white/5 ring-white/10" },
  SKIPPED: { label: "Skipped", cls: "text-muted-foreground bg-white/5 ring-white/10" },
};

export type SeverityKey = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const SEVERITY: Record<SeverityKey, { label: string; cls: string }> = {
  CRITICAL: { label: "Critical", cls: "text-sev-critical bg-sev-critical/12 ring-sev-critical/25" },
  HIGH: { label: "High", cls: "text-sev-high bg-sev-high/12 ring-sev-high/25" },
  MEDIUM: { label: "Medium", cls: "text-sev-medium bg-sev-medium/12 ring-sev-medium/25" },
  LOW: { label: "Low", cls: "text-sev-low bg-sev-low/12 ring-sev-low/25" },
  NONE: { label: "Info", cls: "text-sev-info bg-sev-info/12 ring-sev-info/25" },
};

export const INTEL_STATUS: Record<string, { label: string; cls: string }> = {
  CLEAN: { label: "Clean", cls: "text-v-safe bg-v-safe/10 ring-v-safe/25" },
  MALICIOUS: { label: "Malicious", cls: "text-v-malicious bg-v-malicious/12 ring-v-malicious/30" },
  SUSPICIOUS: { label: "Suspicious", cls: "text-v-suspicious bg-v-suspicious/10 ring-v-suspicious/25" },
  UNKNOWN: { label: "Unknown", cls: "text-sev-info bg-sev-info/10 ring-sev-info/25" },
  NOT_CONFIGURED: { label: "Not configured", cls: "text-muted-foreground bg-white/5 ring-white/10" },
  DISABLED: { label: "Disabled", cls: "text-muted-foreground bg-white/5 ring-white/10" },
  UNAVAILABLE: { label: "Unavailable", cls: "text-muted-foreground bg-white/5 ring-white/10" },
  ERROR: { label: "Error", cls: "text-v-malicious bg-v-malicious/10 ring-v-malicious/20" },
};

export const SCAN_STAGES = [
  { key: "validate", label: "Validating URL" },
  { key: "domain", label: "Analyzing domain" },
  { key: "reputation", label: "Checking domain reputation" },
  { key: "redirects", label: "Inspecting redirects" },
  { key: "ssl", label: "Checking SSL certificate" },
  { key: "content", label: "Analyzing website content" },
  { key: "intel", label: "Checking threat intelligence" },
] as const;

/** Short bold warning shown under every scan result. */
export const VERDICT_NOTICE: Record<VerdictKey, string> = {
  TRUSTED: "Domain trusted, but stay alert at the next steps: if this site redirects you to another website or starts a file download, check that new link again.",
  SAFE: "No threats found, but stay alert: if the site redirects you to another website or starts a file download, check that new link again.",
  LOW_RISK: "Only minor issues found. If the site redirects you elsewhere, asks for your password or starts a download, check again before continuing.",
  SUSPICIOUS: "Suspicious link: do not enter passwords or payment details and do not open downloads until the sender is verified.",
  HIGH_RISK: "High risk: this link shows strong signs of a scam. Do not open it or enter any information.",
  MALICIOUS: "SCAM: this link is malicious. Do not open it and do not enter any information.",
  INCONCLUSIVE: "Could not verify this link. Treat it as unsafe until you confirm it with the sender.",
};

/**
 * The link's host has no DNS record at all (NXDOMAIN), so there was no website
 * to analyze. Reports say so plainly instead of the generic "inconclusive".
 */
export function isDeadLink(r: { verdict: string | null; data?: { dnsRecords?: { nxdomain?: boolean } | null } | null }): boolean {
  return r.verdict === "INCONCLUSIVE" && r.data?.dnsRecords?.nxdomain === true;
}

export const DEAD_LINK_TAGLINE = "This address does not exist on the internet";
export const DEAD_LINK_NOTICE = "Dead link: this address does not exist on the internet, so there is nothing to open. If it came in a message, do not trust it and confirm the exact link with the sender.";

/** The link matched the Innova blacklist: a confirmed scam, shown as 100% scam. */
export function isBlacklisted(r: { verdict: string | null; domainDb?: { decision?: string } | null }): boolean {
  return r.verdict === "MALICIOUS" && r.domainDb?.decision === "BLACKLIST";
}

export const BLACKLIST_LABEL = "100% Scam";
export const BLACKLIST_TAGLINE = "On the Innova scam blacklist";
export const BLACKLIST_NOTICE = "100% SCAM: this address is on the Innova blacklist of confirmed phishing and scam sites. Do not open it, do not enter any information and do not download anything from it.";

export function noticeFor(verdict: VerdictKey, deadLink: boolean, blacklisted = false, locale: Locale = "en"): string {
  const t = verdictText[locale];
  return blacklisted ? t.blacklistNotice : deadLink ? t.deadLinkNotice : t.notice[verdict];
}

export function taglineFor(verdict: VerdictKey, deadLink: boolean, blacklisted = false, locale: Locale = "en"): string {
  const t = verdictText[locale];
  return blacklisted ? t.blacklistTagline : deadLink ? t.deadLinkTagline : t.tagline[verdict];
}

export function labelFor(verdict: VerdictKey, blacklisted = false, locale: Locale = "en"): string {
  const t = verdictText[locale];
  return blacklisted ? t.blacklistLabel : t.label[verdict];
}

export function checkStatusLabel(status: string, locale: Locale = "en"): string {
  return verdictText[locale].checkStatus[status as CheckStatusKey] ?? CHECK_STATUS[status as CheckStatusKey]?.label ?? status;
}

export function severityLabel(severity: string, locale: Locale = "en"): string {
  return verdictText[locale].severity[severity as SeverityKey] ?? SEVERITY[severity as SeverityKey]?.label ?? severity;
}

export function intelStatusLabel(status: string, locale: Locale = "en"): string {
  return (verdictText[locale].intelStatus as Record<string, string>)[status] ?? INTEL_STATUS[status]?.label ?? status;
}

export function stageLabel(key: string, locale: Locale = "en"): string {
  return (verdictText[locale].stages as Record<string, string>)[key] ?? SCAN_STAGES.find((s) => s.key === key)?.label ?? key;
}
