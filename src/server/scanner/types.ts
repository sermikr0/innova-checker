// Shared types for the URL analysis engine. The engine itself is framework- and
// database-agnostic; persistence lives in src/server/scans.

export type ModuleKey =
  | "url"
  | "domain"
  | "dns"
  | "tls"
  | "redirects"
  | "content"
  | "download"
  | "intel";

export const MODULE_KEYS: ModuleKey[] = [
  "url",
  "domain",
  "dns",
  "tls",
  "redirects",
  "content",
  "download",
  "intel",
];

export type CheckStatus =
  | "PASS"
  | "INFO"
  | "WARN"
  | "FAIL"
  | "ERROR"
  | "UNAVAILABLE"
  | "NOT_CONFIGURED"
  | "SKIPPED";

export type Severity = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IntelStatus =
  | "CLEAN"
  | "MALICIOUS"
  | "SUSPICIOUS"
  | "UNKNOWN"
  | "NOT_CONFIGURED"
  | "DISABLED"
  | "UNAVAILABLE"
  | "ERROR";

export type Verdict =
  | "TRUSTED"
  | "SAFE"
  | "LOW_RISK"
  | "SUSPICIOUS"
  | "HIGH_RISK"
  | "MALICIOUS"
  | "INCONCLUSIVE";

export interface Finding {
  module: ModuleKey;
  code: string;
  title: string;
  status: CheckStatus;
  severity: Severity;
  /** Risk contribution 0-100 before category multipliers are applied. */
  weight: number;
  result: string;
  explanation: string;
  evidence?: Record<string, unknown>;
  source: string;
  checkedAt: string;
}

export type ModuleRunStatus = "ok" | "partial" | "error" | "unavailable" | "disabled" | "skipped";

export interface ModuleRun {
  key: ModuleKey;
  status: ModuleRunStatus;
  durationMs: number;
  note?: string;
}

export interface BrandProfile {
  brand: string;
  keywords: string[];
  domains: string[];
  /** True when the domains come from verified whitelist records. */
  verified?: boolean;
}

export interface ScannerSettings {
  modules: Record<ModuleKey, boolean>;
  providers: Record<ProviderId, boolean>;
  weights: Record<ModuleKey, number>;
  suspiciousKeywords: string[];
  suspiciousTlds: string[];
  urlShorteners: string[];
  suspiciousDomainPatterns: string[];
  trustedDomains: string[];
  brandDomains: BrandProfile[];
  requestTimeoutMs: number;
  scanTimeoutMs: number;
  maxRedirects: number;
  maxResponseBytes: number;
  maxDownloadBytes: number;
  userAgent: string;
  virusTotalSubmitUnknown: boolean;
}

export type ProviderId = "googleSafeBrowsing" | "virusTotal" | "urlhaus" | "phishTank" | "abuseIpdb";

export interface ProviderKeys {
  googleSafeBrowsing?: string;
  virusTotal?: string;
  urlhaus?: string;
  phishTank?: string;
  abuseIpdb?: string;
}

/** Small key/value cache used for public lookups (RDAP bootstrap etc.). */
export interface LookupCache {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
}

/** Progress stages shown in the scanning UI. */
export type StageKey = "validate" | "domain" | "reputation" | "redirects" | "ssl" | "content" | "intel";

export const STAGES: { key: StageKey; label: string }[] = [
  { key: "validate", label: "Validating URL" },
  { key: "domain", label: "Analyzing domain" },
  { key: "reputation", label: "Checking domain reputation" },
  { key: "redirects", label: "Inspecting redirects" },
  { key: "ssl", label: "Checking SSL certificate" },
  { key: "content", label: "Analyzing website content" },
  { key: "intel", label: "Checking threat intelligence" },
];

export interface IntelResult {
  provider: ProviderId;
  providerName: string;
  status: IntelStatus;
  summary: string;
  details?: Record<string, unknown>;
  latencyMs?: number;
  checkedAt: string;
}

export interface RedirectHop {
  url: string;
  status?: number;
  location?: string;
  ip?: string;
  kind: "http" | "meta-refresh" | "final" | "blocked" | "error";
  note?: string;
}

export interface AnalysisReport {
  inputUrl: string;
  normalizedUrl: string;
  finalUrl: string | null;
  host: string;
  registrableDomain: string | null;
  verdict: Verdict;
  riskScore: number;
  riskLevel: string;
  confidence: number;
  summary: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  findings: Finding[];
  intel: IntelResult[];
  modules: ModuleRun[];
  scoring: ScoreBreakdown;
  recommendations: string[];
  domainDb: DomainDbSummary;
  data: {
    urlAnalysis: unknown;
    domainInfo: unknown;
    dnsRecords: unknown;
    tlsInfo: unknown;
    redirects: unknown;
    content: unknown;
    download: unknown;
  };
}

export interface ScoreBreakdown {
  rawScore: number;
  contributions: { code: string; module: ModuleKey; title: string; weight: number; effective: number }[];
  intelMalicious: boolean;
  criticalCount: number;
  highCount: number;
  reachable: boolean;
  coverage: { modulesOk: number; modulesEnabled: number; providersRun: number; providersConfigured: number };
}

export function nowIso(): string {
  return new Date().toISOString();
}

export interface DomainDbSummary {
  decision: "BLACKLIST" | "SUSPICIOUS" | "IMPERSONATION" | "WHITELIST" | "WHITELIST_OVERRIDDEN" | "NONE" | "UNAVAILABLE";
  reason: string;
  matches: { url: string; host: string; matchType: string; record: import("./domain-db").DomainRecordRef }[];
  impersonates: { brand: string; officialDomains: string[]; via: string } | null;
}
