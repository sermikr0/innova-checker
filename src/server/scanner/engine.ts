import { analyzeContent } from "./modules/content";
import { analyzeDns, type DnsData } from "./modules/dns-records";
import { analyzeDomain } from "./modules/domain";
import { analyzeDownload } from "./modules/download";
import { followRedirects, type RedirectData } from "./modules/redirects";
import { analyzeTls } from "./modules/tls";
import { analyzeUrl } from "./modules/url-analysis";
import { runIntel } from "./intel/providers";
import { normalizeInputUrl, type NormalizedUrl } from "./normalize";
import { buildRecommendations } from "./recommendations";
import { scoreFindings } from "./scoring";
import type {
  AnalysisReport,
  Finding,
  IntelResult,
  LookupCache,
  ModuleKey,
  ModuleRun,
  ModuleRunStatus,
  ProviderKeys,
  ScannerSettings,
  StageKey,
} from "./types";
import { MODULE_KEYS } from "./types";
import type { SafeResponse } from "./net/safe-http";
import { pick, type DomainDbLookup, type DomainDbMatch } from "./domain-db";
import type { DomainDbSummary, Verdict } from "./types";
import { domainParts, makeFinding, userContentPlatform } from "./util";
import { FREE_HOSTING_SUFFIXES } from "./data/defaults";

export interface EngineDeps {
  cache: LookupCache;
  keys: ProviderKeys;
  virusTotalPerMinute?: number;
  /** Whitelist / blacklist / suspicious database. Optional so the CLI works without a DB. */
  domainDb?: DomainDbLookup;
  onStage?: (stage: StageKey) => void | Promise<void>;
}

class ModuleTimeout extends Error {
  constructor(key: string, ms: number) {
    super(`${key} module exceeded the remaining scan time (${ms} ms)`);
  }
}

function withTimeout<T>(p: Promise<T>, ms: number, key: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new ModuleTimeout(key, ms)), Math.max(1, ms));
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

const MODULE_TITLES: Record<ModuleKey, string> = {
  url: "URL analysis",
  domain: "Domain intelligence",
  dns: "DNS records",
  tls: "SSL/TLS certificate",
  redirects: "Redirect analysis",
  content: "Website content analysis",
  download: "File download analysis",
  intel: "Threat intelligence",
};

const INTEL_WEIGHTS: Record<string, { malicious: number; suspicious: number }> = {
  googleSafeBrowsing: { malicious: 100, suspicious: 30 },
  virusTotal: { malicious: 90, suspicious: 25 },
  urlhaus: { malicious: 95, suspicious: 30 },
  phishTank: { malicious: 95, suspicious: 30 },
  abuseIpdb: { malicious: 20, suspicious: 12 },
};

function intelToFinding(r: IntelResult): Finding {
  const w = INTEL_WEIGHTS[r.provider] ?? { malicious: 60, suspicious: 20 };
  const map = {
    MALICIOUS: { status: "FAIL", severity: "CRITICAL", weight: w.malicious },
    SUSPICIOUS: { status: "WARN", severity: "MEDIUM", weight: w.suspicious },
    CLEAN: { status: "PASS", severity: "NONE", weight: 0 },
    UNKNOWN: { status: "INFO", severity: "NONE", weight: 0 },
    NOT_CONFIGURED: { status: "NOT_CONFIGURED", severity: "NONE", weight: 0 },
    DISABLED: { status: "SKIPPED", severity: "NONE", weight: 0 },
    UNAVAILABLE: { status: "UNAVAILABLE", severity: "NONE", weight: 0 },
    ERROR: { status: "ERROR", severity: "NONE", weight: 0 },
  } as const;
  const m = map[r.status];
  return makeFinding("intel", {
    code: `INTEL_${r.provider.replace(/([A-Z])/g, "_$1").toUpperCase()}`,
    title: r.providerName,
    status: m.status,
    severity: m.severity,
    weight: m.weight,
    result: r.summary,
    explanation:
      r.status === "NOT_CONFIGURED"
        ? `${r.providerName} was not consulted because no API key is configured. This check was not performed.`
        : r.status === "DISABLED"
          ? `${r.providerName} is disabled in the scanner configuration.`
          : r.status === "UNAVAILABLE" || r.status === "ERROR"
            ? `${r.providerName} could not be queried, so its verdict is missing from this report.`
            : `Verdict reported by ${r.providerName}.`,
    evidence: r.details,
    source: r.providerName,
  });
}

/**
 * Runs a complete analysis of one URL. Pure with respect to the database: callers
 * provide configuration, API keys and a lookup cache, and persist the report.
 */
export async function analyze(input: string | NormalizedUrl, settings: ScannerSettings, deps: EngineDeps): Promise<AnalysisReport> {
  const startedAt = Date.now();
  const deadline = startedAt + settings.scanTimeoutMs;
  const remaining = () => Math.max(500, deadline - Date.now());
  const abort = new AbortController();
  const abortTimer = setTimeout(() => abort.abort(), settings.scanTimeoutMs);

  const n = typeof input === "string" ? normalizeInputUrl(input) : input;
  const host = n.url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  const findings: Finding[] = [];
  const runs: ModuleRun[] = [];
  const stage = async (s: StageKey) => {
    try {
      await deps.onStage?.(s);
    } catch {
      /* progress reporting must never break a scan */
    }
  };

  const run = async <T extends { findings: Finding[]; status: string }>(key: ModuleKey, fn: () => Promise<T> | T): Promise<T | null> => {
    if (!settings.modules[key]) {
      runs.push({ key, status: "disabled", durationMs: 0 });
      findings.push(makeFinding(key, { code: `${key.toUpperCase()}_DISABLED`, title: MODULE_TITLES[key], status: "SKIPPED", result: "Module disabled", explanation: "This analysis module is disabled by an administrator, so its checks were not performed." }));
      return null;
    }
    const t = Date.now();
    try {
      const r = await withTimeout(Promise.resolve(fn()), remaining(), key);
      findings.push(...r.findings);
      runs.push({ key, status: r.status as ModuleRunStatus, durationMs: Date.now() - t });
      return r;
    } catch (e) {
      runs.push({ key, status: "error", durationMs: Date.now() - t, note: (e as Error).message });
      findings.push(makeFinding(key, { code: `${key.toUpperCase()}_ERROR`, title: MODULE_TITLES[key], status: "ERROR", result: "Check failed", explanation: `The ${MODULE_TITLES[key].toLowerCase()} module did not complete: ${(e as Error).message}`, source: "Innova Checker" }));
      return null;
    }
  };

  try {
    // 1. Static URL analysis (instant)
    const urlRes = await run("url", () => ({ ...analyzeUrl(n, settings), status: "ok" }));
    await stage("validate");

    // Instant verdict input: domain-intelligence database lookup for the submitted URL.
    let dbAvailable = !!deps.domainDb;
    const dbMatches: DomainDbMatch[] = [];
    if (deps.domainDb) {
      try {
        dbMatches.push(...(await deps.domainDb.lookup(n.normalized)));
      } catch {
        dbAvailable = false;
      }
    }

    // 2. Network modules in parallel
    const dnsP = run("dns", () => analyzeDns({ host, timeoutMs: settings.requestTimeoutMs })).then(async (r) => {
      await stage("domain");
      return r;
    });
    const domainP = run("domain", () => analyzeDomain({ host, settings, cache: deps.cache, timeoutMs: Math.min(settings.requestTimeoutMs, 8000) })).then(async (r) => {
      await stage("reputation");
      return r;
    });
    const tlsP = run("tls", () => analyzeTls({ url: n.url, timeoutMs: settings.requestTimeoutMs })).then(async (r) => {
      await stage("ssl");
      return r;
    });
    const fetchP = run("redirects", () => followRedirects({ url: n.url, settings, signal: abort.signal })).then(async (r) => {
      await stage("redirects");
      return r;
    });

    const fetchRes = await fetchP;
    const response: SafeResponse | null = fetchRes?.response ?? null;
    const finalUrl = fetchRes?.data.finalUrl ?? null;

    // An http:// link that the server itself upgrades to HTTPS on the same site is routine.
    if (n.url.protocol === "http:" && finalUrl?.startsWith("https:")) {
      const from = domainParts(host);
      const to = domainParts(new URL(finalUrl).hostname);
      const scheme = findings.find((f) => f.code === "URL_SCHEME");
      if (scheme && (from.tenant ?? from.host) === (to.tenant ?? to.host)) {
        Object.assign(scheme, { status: "INFO", severity: "NONE", weight: 0, result: "HTTP, upgraded to HTTPS by the server", explanation: "The link uses plain HTTP, but the site immediately redirects to its HTTPS version." });
      }
    }

    // Every host the redirect chain touched is checked against the database too.
    if (deps.domainDb && dbAvailable && fetchRes?.data.chain) {
      const seenHosts = new Set([host]);
      for (const hop of fetchRes.data.chain) {
        try {
          const h = new URL(hop.location ?? hop.url).hostname.toLowerCase();
          const target = hop.location ?? hop.url;
          if (seenHosts.has(h) && target !== finalUrl) continue;
          seenHosts.add(h);
          dbMatches.push(...(await deps.domainDb.lookup(target)));
        } catch {
          /* unparsable hop */
        }
      }
    }

    // 3. Content / download analysis on the final response
    const contentRes = response && finalUrl ? await run("content", () => analyzeContent({ response, finalUrl, settings })) : await run("content", () => ({ data: null, findings: [makeFinding("content", { code: "CONTENT_ANALYZED", title: "Website content", status: "SKIPPED", result: "Page not retrieved", explanation: "Content analysis needs the page to be reachable." })], status: "skipped" }));
    const downloadRes = await run("download", () => analyzeDownload({ response, finalUrl }));
    await stage("content");

    // Final destination gets the same URL heuristics when it is a different site.
    if (finalUrl && settings.modules.url) {
      const a = domainParts(host);
      const b = domainParts(new URL(finalUrl).hostname);
      if ((a.tenant ?? a.host) !== (b.tenant ?? b.host)) {
        try {
          const fn = normalizeInputUrl(finalUrl);
          findings.push(...analyzeUrl(fn, settings, { prefix: "FINAL_", titlePrefix: "Final destination: ", onlyIssues: true }).findings);
        } catch {
          /* final URL may be internal or invalid; redirect findings already cover it */
        }
      }
    }

    const dnsRes = await dnsP;
    // 4. Threat intelligence (needs resolved IPs and the download hash)
    let intel: IntelResult[] = [];
    await run("intel", async () => {
      const dnsData = dnsRes?.data as DnsData | undefined;
      const ips = [...(dnsData?.a.map((x) => x.address) ?? []), ...(dnsData?.aaaa.map((x) => x.address) ?? [])];
      if (!ips.length && response?.remoteAddress) ips.push(response.remoteAddress);
      intel = await runIntel({
        url: n.normalized,
        finalUrl,
        host,
        ips,
        fileSha256: downloadRes?.data.sha256 ?? null,
        keys: deps.keys,
        settings,
        timeoutMs: Math.min(settings.requestTimeoutMs, 10000),
        cache: deps.cache,
        virusTotalPerMinute: deps.virusTotalPerMinute,
      });
      const ran = intel.some((i) => ["CLEAN", "MALICIOUS", "SUSPICIOUS", "UNKNOWN"].includes(i.status));
      return { findings: intel.map(intelToFinding), status: ran ? "ok" : "unavailable" };
    });
    await stage("intel");

    const [domainRes, tlsRes] = await Promise.all([domainP, tlsP]);

    // 5. Score
    const enabled = MODULE_KEYS.filter((k) => settings.modules[k] && k !== "intel");
    const okStatuses: ModuleRunStatus[] = ["ok", "partial"];
    const modulesOk = runs.filter((r) => r.key !== "intel" && okStatuses.includes(r.status)).length;
    const reachable = !!response;
    const domainDb = applyDomainDb({
      findings, dbMatches, dbAvailable, settings, host, finalUrl, intel, reachable,
      finalResponse: response,
      chain: fetchRes?.data.chain ?? [],
      cnames: (dnsRes?.data as DnsData | undefined)?.cname ?? [],
      isDownload: !!(downloadRes?.data as { isDownload?: boolean } | undefined)?.isDownload,
    });
    const scored = scoreFindings(findings, intel, settings, { reachable, modulesOk, modulesEnabled: enabled.length });
    applyDomainDbVerdict(scored, domainDb);
    const completedAt = Date.now();

    return {
      inputUrl: typeof input === "string" ? input : n.normalized,
      normalizedUrl: n.normalized,
      finalUrl,
      host,
      registrableDomain: domainParts(host).registrable,
      verdict: scored.verdict,
      riskScore: scored.riskScore,
      riskLevel: scored.riskLevel,
      confidence: scored.confidence,
      summary: scored.summary,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
      durationMs: completedAt - startedAt,
      findings,
      intel,
      modules: MODULE_KEYS.map((k) => runs.find((r) => r.key === k) ?? { key: k, status: "skipped" as const, durationMs: 0 }),
      scoring: scored.breakdown,
      recommendations: buildRecommendations(scored.verdict, findings, settings),
      domainDb,
      data: {
        urlAnalysis: urlRes?.data ?? null,
        domainInfo: domainRes?.data ?? null,
        dnsRecords: dnsRes?.data ?? null,
        tlsInfo: tlsRes?.data ?? null,
        redirects: (fetchRes?.data as RedirectData | undefined) ?? null,
        content: contentRes?.data ?? null,
        download: downloadRes?.data ?? null,
      },
    };
  } finally {
    clearTimeout(abortTimer);
  }
}

export class InMemoryCache implements LookupCache {
  private store = new Map<string, { v: unknown; exp: number }>();
  async get<T>(key: string): Promise<T | null> {
    const e = this.store.get(key);
    if (!e || e.exp < Date.now()) return null;
    return e.v as T;
  }
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    this.store.set(key, { v: value, exp: Date.now() + ttlSeconds * 1000 });
  }
}

// ─── Domain-intelligence database decisions ──────────────────────────────────

const CDN_SUFFIXES = ["cloudfront.net", "akamaiedge.net", "akamai.net", "akamaized.net", "edgekey.net", "edgesuite.net", "fastly.net", "fastlylb.net", "cloudflare.net", "azureedge.net", "azurefd.net", "trafficmanager.net", "elb.amazonaws.com", "cdn77.org", "b-cdn.net", "stackpathcdn.com", "edgecastcdn.net", "googlehosted.com", "ghs.googlehosted.com"];

const IMPERSONATION_CODES = ["URL_BRAND", "FINAL_URL_BRAND", "URL_HOMOGRAPH", "FINAL_URL_HOMOGRAPH", "CONTENT_CREDENTIAL_PHISH", "CONTENT_BRAND_CLAIM"];

function recordLine(m: DomainDbMatch) {
  const r = m.record;
  return `${r.domain}${r.platformName ? ` (${r.platformName})` : ""}`;
}

function applyDomainDb(ctx: {
  findings: Finding[];
  dbMatches: DomainDbMatch[];
  dbAvailable: boolean;
  settings: ScannerSettings;
  host: string;
  finalUrl: string | null;
  intel: IntelResult[];
  reachable: boolean;
  finalResponse: SafeResponse | null;
  chain: { url: string; kind: string; location?: string }[];
  cnames: string[];
  isDownload: boolean;
}): DomainDbSummary {
  const { findings, dbMatches } = ctx;
  const source = "Innova domain-intelligence database";
  const unique = dbMatches.filter((m, i, a) => a.findIndex((x) => x.record.id === m.record.id && x.host === m.host) === i);
  const matches = unique.map((m) => ({ url: m.url, host: m.host, matchType: m.matchType, record: m.record }));

  if (!ctx.dbAvailable) {
    findings.push(makeFinding("domain", { code: "DB_LOOKUP", title: "Domain intelligence database", status: "UNAVAILABLE", result: "Database lookup unavailable", explanation: "The whitelist/blacklist database could not be queried for this scan.", source }));
    return { decision: "UNAVAILABLE", reason: "Database lookup unavailable", matches, impersonates: null };
  }

  const black = pick(unique, "BLACKLIST");
  const susp = pick(unique, "SUSPICIOUS");
  const finalHost = ctx.finalUrl ? new URL(ctx.finalUrl).hostname.toLowerCase() : ctx.host;
  const whiteFinal = unique.find((m) => m.record.listType === "WHITELIST" && m.host === finalHost) ?? null;
  const whiteStart = unique.find((m) => m.record.listType === "WHITELIST" && m.host === ctx.host) ?? null;

  // Impersonation of a verified platform (from URL/content heuristics).
  const verifiedBrands = new Map(ctx.settings.brandDomains.filter((b) => b.verified).map((b) => [b.brand, b]));
  const imp = findings.find((f) => IMPERSONATION_CODES.includes(f.code) && f.weight > 0 && typeof f.evidence?.brand === "string" && verifiedBrands.has(f.evidence.brand as string));
  // An exact whitelist match (e.g. a company's own Okta or Salesforce tenant host) beats
  // the brand-impersonation heuristic.
  const impersonates = imp && !whiteStart && !whiteFinal ? { brand: imp.evidence?.brand as string, officialDomains: verifiedBrands.get(imp.evidence?.brand as string)?.domains ?? [], via: imp.code } : null;

  if (black) {
    const r = black.record;
    findings.push(makeFinding("domain", { code: "DB_BLACKLIST", title: "Domain intelligence: blacklist", status: "FAIL", severity: "CRITICAL", weight: 100, result: `${r.trustStatus === "CONFIRMED_MALICIOUS" ? "Listed as malicious" : "Blocked by security policy"}: ${recordLine(black)}${r.category ? ` — ${r.category}` : ""}`, explanation: r.trustStatus === "CONFIRMED_MALICIOUS" ? `This ${black.matchType === "url" ? "exact URL" : black.matchType === "exact" ? "host" : "domain"} is in the Innova blacklist of confirmed malicious, phishing or impersonation infrastructure.` : `This ${black.matchType === "url" ? "exact URL" : black.matchType === "exact" ? "host" : "domain"} is blocked by Innova Networks security policy (for example as a look-alike of a verified platform). It has not been independently confirmed as malicious; see the record's source.`, evidence: { record: r, matchedHost: black.host, matchType: black.matchType }, source: `${source} — ${r.verificationSource ?? "no source recorded"}` }));
    return { decision: "BLACKLIST", reason: `Blacklist match: ${recordLine(black)}`, matches, impersonates };
  }

  if (susp) {
    const r = susp.record;
    findings.push(makeFinding("domain", { code: "DB_SUSPICIOUS", title: "Domain intelligence: suspicious list", status: "FAIL", severity: "HIGH", weight: 55, result: `Listed as suspicious: ${recordLine(susp)}${r.category ? ` — ${r.category}` : ""}`, explanation: "The domain is on the Innova list of potential impersonations and unverified look-alikes. It is treated as high risk until an administrator reviews it.", evidence: { record: r, matchedHost: susp.host, matchType: susp.matchType }, source: `${source} — ${r.verificationSource ?? "no source recorded"}` }));
  }

  if (impersonates && !susp) {
    findings.push(makeFinding("domain", { code: "DB_IMPERSONATION", title: "Domain intelligence: impersonation of a verified platform", status: "FAIL", severity: "HIGH", result: `Imitates ${impersonates.brand}; official domains are ${impersonates.officialDomains.slice(0, 4).join(", ")}`, explanation: `${impersonates.brand} is a verified platform in the whitelist, and this link imitates it without being one of its official domains. Look-alikes of verified platforms are always rated at least High Risk.`, evidence: { brand: impersonates.brand, officialDomains: impersonates.officialDomains, detectedBy: impersonates.via }, source }));
  }

  if (susp) return { decision: "SUSPICIOUS", reason: `Suspicious-list match: ${recordLine(susp)}`, matches, impersonates };
  if (impersonates) return { decision: "IMPERSONATION", reason: `Imitates verified platform ${impersonates.brand}`, matches, impersonates };

  // A link whose own domain is on the verified whitelist (and that ends on a whitelisted
  // domain) is Trusted immediately. Strictness lives in the matching: exact hosts or
  // safe subdomains only, so look-alikes never match. Only two things override it:
  // a threat-intelligence provider confirms this exact URL as malicious, or the page
  // shows a critical compromise indicator. Leaving the whitelist is handled below by
  // judging the final site on its own.
  const startIsShortener = ctx.settings.urlShorteners.some((sh) => ctx.host === sh || ctx.host.endsWith(`.${sh}`));
  const white = whiteStart || startIsShortener ? (whiteFinal ?? (!ctx.reachable ? whiteStart : null)) : null;
  if (white) {
    const r = white.record;
    const intelMalicious = ctx.intel.filter((i) => i.status === "MALICIOUS");
    const critical = findings.filter((f) => !f.code.startsWith("DB_") && f.status === "FAIL" && f.severity === "CRITICAL" && f.weight > 0);
    if (intelMalicious.length || critical.length) {
      const reasons = [...intelMalicious.map((i) => `${i.providerName} reports this URL as malicious`), ...critical.map((f) => f.title.toLowerCase())];
      findings.push(makeFinding("domain", { code: "DB_WHITELIST_WITHHELD", title: "Domain intelligence: trust withheld", status: "WARN", severity: "HIGH", result: `Official ${r.platformName ?? r.domain} domain, but this URL looks compromised`, explanation: `The domain is on the verified whitelist, but this specific URL is not trusted because ${reasons.join("; ")}. A whitelist entry never overrides evidence that a page has been compromised.`, evidence: { record: r, reasons }, source }));
      return { decision: "WHITELIST_OVERRIDDEN", reason: `Official domain, but compromised URL: ${reasons[0]}`, matches, impersonates };
    }
    // Observations that do not change the verdict but are shown to the analyst.
    const notes: string[] = [];
    if (!ctx.reachable) notes.push("the page could not be retrieved, so trust is based on the domain alone");
    if (ctx.finalUrl && !ctx.finalUrl.startsWith("https://")) notes.push("the page is served over plain HTTP");
    const tls = ctx.finalResponse?.tls;
    if (ctx.finalUrl?.startsWith("https://") && tls && (!tls.authorized || !tls.hostnameMatches)) notes.push("the TLS certificate did not fully validate");
    if (ctx.isDownload || ctx.finalResponse?.bodyKind === "binary") notes.push("the link downloads a file; check the file before opening it");
    const whitelistedHosts = new Set(unique.filter((m) => m.record.listType === "WHITELIST").map((m) => m.host));
    const offList = [...new Set(ctx.chain.flatMap((h) => [h.url, h.location]).filter(Boolean).map((u) => { try { return new URL(u as string).hostname.toLowerCase(); } catch { return ""; } }))].filter((h) => h && !whitelistedHosts.has(h) && h !== ctx.host);
    if (offList.length) notes.push(`the redirect chain passes through ${offList.slice(0, 3).join(", ")}`);
    const takeoverCname = ctx.cnames.map((c) => c.toLowerCase()).find((c) => !CDN_SUFFIXES.some((d) => c === d || c.endsWith(`.${d}`)) && userContentPlatform(c, FREE_HOSTING_SUFFIXES));
    if (finalHost === ctx.host && takeoverCname) notes.push(`the host is a CNAME to ${takeoverCname} (third-party hosting)`);
    const warnings = findings.filter((f) => !f.code.startsWith("DB_") && (f.status === "FAIL" || f.status === "WARN"));
    if (warnings.length) notes.push(`${warnings.length} analysis observation(s): ${warnings.slice(0, 3).map((f) => f.title.toLowerCase()).join("; ")}`);
    findings.push(makeFinding("domain", { code: "DB_WHITELIST", title: "Domain intelligence: whitelist", status: "PASS", result: `Verified official domain: ${recordLine(white)}`, explanation: `${white.host} ${white.matchType === "exact" ? "is" : "belongs to"} ${r.domain}, an official domain of ${r.companyName ?? r.platformName ?? "the listed company"} on the Innova verified whitelist, so the link is Trusted.${notes.length ? ` Noted, without changing the verdict: ${notes.join("; ")}.` : ""}`, evidence: { record: r, matchedHost: white.host, matchType: white.matchType, notes }, source: `${source} — ${r.verificationSource ?? ""}` }));
    return { decision: "WHITELIST", reason: `Verified official domain: ${recordLine(white)}`, matches, impersonates };
  }

  if (whiteFinal && !whiteStart) {
    findings.push(makeFinding("domain", { code: "DB_LANDS_ON_WHITELIST", title: "Domain intelligence: lands on an official domain", status: "INFO", result: `Ends on ${recordLine(whiteFinal)}, but ${ctx.host} itself is not on the whitelist`, explanation: "The submitted link is not an official domain, it only redirects to one. The redirect can be changed at any time, so the link is judged by the full analysis rather than trusted.", evidence: { record: whiteFinal.record, submittedHost: ctx.host }, source }));
  }

  if (whiteStart && ctx.finalUrl) {
    findings.push(makeFinding("domain", { code: "DB_LEAVES_WHITELIST", title: "Domain intelligence: leaves official domain", status: "WARN", severity: "MEDIUM", weight: 12, result: `Starts on ${recordLine(whiteStart)} but ends on ${new URL(ctx.finalUrl).hostname}`, explanation: "The link begins on a verified official domain and then redirects somewhere else. Attackers abuse open redirects on trusted sites this way, so the final destination is analyzed on its own merits.", evidence: { record: whiteStart.record, finalUrl: ctx.finalUrl }, source }));
  }
  findings.push(makeFinding("domain", { code: "DB_NO_MATCH", title: "Domain intelligence database", status: "INFO", result: "Not in the whitelist, blacklist or suspicious list", explanation: "The domain is unknown to the database, so the verdict is based on the full security analysis.", source }));
  return { decision: "NONE", reason: "No database match; full analysis applied", matches, impersonates };
}

function applyDomainDbVerdict(scored: { riskScore: number; verdict: Verdict; riskLevel: string; summary: string }, db: DomainDbSummary) {
  const level = (s: number) => (s >= 80 ? "Critical" : s >= 60 ? "High" : s >= 35 ? "Medium" : s >= 15 ? "Low" : "Minimal");
  if (db.decision === "BLACKLIST") {
    scored.verdict = "MALICIOUS";
    scored.riskScore = 100;
    const hit = db.matches.find((m) => m.record.listType === "BLACKLIST" && m.record.trustStatus === "CONFIRMED_MALICIOUS") ?? db.matches.find((m) => m.record.listType === "BLACKLIST");
    const confirmed = hit?.record.trustStatus === "CONFIRMED_MALICIOUS";
    const brand = hit?.record.platformName ? ` impersonating ${hit.record.platformName}` : "";
    const evidence = confirmed ? `It is a confirmed phishing / scam site${brand}${hit?.record.verificationSource ? `, reported by ${hit.record.verificationSource.split(" (")[0]}` : ""}.` : `It is blocked by Innova Networks security policy${brand}.`;
    scored.summary = `100% scam: ${hit?.host ?? "this address"} is on the Innova blacklist. ${evidence} Do not open this link and do not enter any information.`;
  } else if (db.decision === "SUSPICIOUS" || db.decision === "IMPERSONATION") {
    if (scored.verdict !== "MALICIOUS") {
      scored.verdict = "HIGH_RISK";
      scored.riskScore = Math.max(scored.riskScore, 65);
      scored.summary = `${db.reason}. ${scored.summary}`;
    }
  } else if (db.decision === "WHITELIST" && scored.verdict !== "MALICIOUS") {
    scored.verdict = "TRUSTED";
    scored.riskScore = Math.min(scored.riskScore, 5);
    scored.summary = `${db.reason}. No signs of compromise were found on this URL.`;
  }
  scored.riskLevel = level(scored.riskScore);
}
