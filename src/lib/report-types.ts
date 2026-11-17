// Serializable report shape shared by the server (DTO builder, PDF) and client views.

export interface FindingDTO {
  id: string;
  module: string;
  code: string;
  title: string;
  status: string;
  severity: string;
  weight: number;
  result: string;
  explanation: string;
  evidence: unknown;
  source: string;
  checkedAt: string;
}

export interface IntelDTO {
  provider: string;
  providerName: string;
  status: string;
  summary: string;
  details: unknown;
  latencyMs: number | null;
  checkedAt: string;
}

export interface ReportDTO {
  id: string;
  inputUrl: string;
  normalizedUrl: string;
  finalUrl: string | null;
  domain: string;
  registrableDomain: string | null;
  status: string;
  verdict: string | null;
  riskScore: number | null;
  riskLevel: string | null;
  confidence: number | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
  summary: string | null;
  recommendations: string[];
  modules: { key: string; status: string; durationMs: number; note?: string }[];
  scoring: {
    contributions?: { code: string; module: string; title: string; weight: number; effective: number }[];
    coverage?: { modulesOk: number; modulesEnabled: number; providersRun: number; providersConfigured: number };
    reachable?: boolean;
  } | null;
  // Module payloads are loosely typed on purpose: older reports keep rendering
  // even if the engine adds fields later.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  data: {
    urlAnalysis: any;
    domainInfo: any;
    dnsRecords: any;
    tlsInfo: any;
    redirects: any;
    content: any;
    download: any;
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
  findings: FindingDTO[];
  intel: IntelDTO[];
  domainDb: {
    decision: string;
    reason: string;
    matches: { url: string; host: string; matchType: string; record: { id: string; domain: string; listType: string; scope: string; trustStatus: string; platformName: string | null; companyName: string | null; category: string | null; officialUrl: string | null; verificationSource: string | null; verifiedAt: string | null; notes: string | null } }[];
    impersonates: { brand: string; officialDomains: string[]; via: string } | null;
  } | null;
}

export const MODULE_ORDER = ["url", "domain", "tls", "dns", "redirects", "content", "download", "intel"] as const;

export const MODULE_LABELS: Record<string, string> = {
  url: "URL Analysis",
  domain: "Domain Intelligence",
  tls: "SSL/TLS Certificate",
  dns: "DNS Records",
  redirects: "Redirect Analysis",
  content: "Website Content Analysis",
  download: "File Download Analysis",
  intel: "Threat Intelligence Results",
};

export const PROVIDER_NAMES: Record<string, string> = {
  googleSafeBrowsing: "Google Safe Browsing",
  virusTotal: "VirusTotal",
  urlhaus: "URLhaus (abuse.ch)",
  phishTank: "PhishTank",
  abuseIpdb: "AbuseIPDB",
};
