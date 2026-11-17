import crypto from "node:crypto";
import type { IntelResult, IntelStatus, LookupCache, ProviderId, ProviderKeys, ScannerSettings } from "../types";
import { nowIso } from "../types";

// Threat-intelligence adapters. Each provider is independent: it can be disabled by
// an administrator, is "Not configured" without an API key, and reports
// "Unavailable"/"Error" honestly when the upstream call fails. No provider result is
// ever synthesised.

export interface IntelContext {
  url: string;
  finalUrl: string | null;
  host: string;
  ips: string[];
  fileSha256: string | null;
  keys: ProviderKeys;
  settings: ScannerSettings;
  timeoutMs: number;
  /** Shared cache so repeated lookups do not burn provider quota. */
  cache?: LookupCache;
  /** VirusTotal requests allowed per minute by the configured key (public API: 4). */
  virusTotalPerMinute?: number;
}

interface Outcome {
  status: IntelStatus;
  summary: string;
  details?: Record<string, unknown>;
}

export interface ThreatIntelProvider {
  id: ProviderId;
  name: string;
  /** What the provider is queried with, shown in the admin health view. */
  scope: string;
  isConfigured(keys: ProviderKeys): boolean;
  check(ctx: IntelContext): Promise<Outcome>;
}

class HttpStatusError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

async function http(url: string, init: RequestInit & { timeoutMs: number }): Promise<Response> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(init.timeoutMs), redirect: "follow" });
  return res;
}

const googleSafeBrowsing: ThreatIntelProvider = {
  id: "googleSafeBrowsing",
  name: "Google Safe Browsing",
  scope: "URL (original and final)",
  isConfigured: (k) => !!k.googleSafeBrowsing,
  async check(ctx) {
    const entries = [...new Set([ctx.url, ctx.finalUrl].filter(Boolean) as string[])].map((url) => ({ url }));
    const res = await http(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(ctx.keys.googleSafeBrowsing as string)}`, {
      method: "POST",
      timeoutMs: ctx.timeoutMs,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client: { clientId: "innova-checker", clientVersion: "1.0.0" },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: entries,
        },
      }),
    });
    if (!res.ok) throw new HttpStatusError(res.status, `Safe Browsing API returned HTTP ${res.status}`);
    const j = (await res.json()) as { matches?: { threatType: string; threat: { url: string } }[] };
    if (j.matches?.length) {
      const types = [...new Set(j.matches.map((m) => m.threatType))];
      return { status: "MALICIOUS", summary: `Listed as ${types.join(", ").replace(/_/g, " ").toLowerCase()}`, details: { matches: j.matches.slice(0, 5) } };
    }
    return { status: "CLEAN", summary: "Not on Google Safe Browsing lists" };
  },
};

export const VT_MALICIOUS_CONSENSUS = 5;

function vtUrlId(url: string): string {
  return Buffer.from(url).toString("base64url");
}

const virusTotal: ThreatIntelProvider = {
  id: "virusTotal",
  name: "VirusTotal",
  scope: "URL report (and file SHA-256 when a download is found)",
  isConfigured: (k) => !!k.virusTotal,
  async check(ctx) {
    const cacheKey = `vt:url:${crypto.createHash("sha256").update(`${ctx.url}|${ctx.fileSha256 ?? ""}`).digest("hex")}`;
    const cached = await ctx.cache?.get<Outcome & { at: string }>(cacheKey);
    if (cached) return { ...cached, summary: `${cached.summary} (cached ${cached.at.slice(0, 16).replace("T", " ")} UTC)` };
    const calls = ctx.fileSha256 ? 2 : 1;
    if (!takeVtSlots(calls, ctx.virusTotalPerMinute ?? 4)) {
      throw new HttpStatusError(429, `VirusTotal per-minute limit (${ctx.virusTotalPerMinute ?? 4}/min) reached; not consulted for this scan`);
    }
    const outcome = await virusTotalLookup(ctx);
    if (outcome.status !== "UNKNOWN") await ctx.cache?.set(cacheKey, { ...outcome, at: new Date().toISOString() }, 6 * 3600);
    return outcome;
  },
};

// Sliding one-minute window so a burst of scans never exceeds the key's rate limit.
const vtCalls: number[] = [];
function takeVtSlots(n: number, perMinute: number): boolean {
  const now = Date.now();
  while (vtCalls.length && now - vtCalls[0] > 60_000) vtCalls.shift();
  if (vtCalls.length + n > perMinute) return false;
  for (let i = 0; i < n; i++) vtCalls.push(now);
  return true;
}

async function virusTotalLookup(ctx: IntelContext): Promise<Outcome> {
  {
    const headers = { "x-apikey": ctx.keys.virusTotal as string, accept: "application/json" };
    const res = await http(`https://www.virustotal.com/api/v3/urls/${vtUrlId(ctx.url)}`, { headers, timeoutMs: ctx.timeoutMs });
    let urlOutcome: Outcome;
    if (res.status === 404) {
      let submitted = false;
      if (ctx.settings.virusTotalSubmitUnknown) {
        const sub = await http("https://www.virustotal.com/api/v3/urls", { method: "POST", headers: { ...headers, "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ url: ctx.url }).toString(), timeoutMs: ctx.timeoutMs });
        submitted = sub.ok;
      }
      urlOutcome = { status: "UNKNOWN", summary: submitted ? "Not previously analyzed; submitted for analysis" : "URL not present in the VirusTotal dataset", details: { submitted } };
    } else if (res.status === 429) {
      throw new HttpStatusError(429, "VirusTotal quota exceeded");
    } else if (!res.ok) {
      throw new HttpStatusError(res.status, `VirusTotal returned HTTP ${res.status}`);
    } else {
      const j = (await res.json()) as { data?: { attributes?: { last_analysis_stats?: Record<string, number>; last_analysis_date?: number; reputation?: number; categories?: Record<string, string> } } };
      const a = j.data?.attributes ?? {};
      const s = a.last_analysis_stats ?? {};
      const malicious = s.malicious ?? 0;
      const suspicious = s.suspicious ?? 0;
      const engines = Object.values(s).reduce((x, y) => x + y, 0);
      const details = { stats: s, lastAnalysis: a.last_analysis_date ? new Date(a.last_analysis_date * 1000).toISOString() : null, reputation: a.reputation, categories: a.categories };
      // A handful of detections out of ~90 engines is frequently a false positive from
      // minor vendors, so only a broad consensus counts as confirmed malicious.
      urlOutcome =
        malicious >= VT_MALICIOUS_CONSENSUS
          ? { status: "MALICIOUS", summary: `${malicious}/${engines} engines flag this URL as malicious`, details }
          : malicious >= 1 || suspicious >= 1
            ? { status: "SUSPICIOUS", summary: `${malicious} malicious and ${suspicious} suspicious verdicts out of ${engines} engines`, details }
            : { status: "CLEAN", summary: `No engine flags this URL (${engines} engines)`, details };
    }

    if (ctx.fileSha256) {
      const fr = await http(`https://www.virustotal.com/api/v3/files/${ctx.fileSha256}`, { headers, timeoutMs: ctx.timeoutMs });
      if (fr.ok) {
        const fj = (await fr.json()) as { data?: { attributes?: { last_analysis_stats?: Record<string, number>; meaningful_name?: string } } };
        const fs = fj.data?.attributes?.last_analysis_stats ?? {};
        const fm = fs.malicious ?? 0;
        const fileDetails = { sha256: ctx.fileSha256, stats: fs, name: fj.data?.attributes?.meaningful_name };
        if (fm >= VT_MALICIOUS_CONSENSUS) return { status: "MALICIOUS", summary: `Downloaded file detected by ${fm} engines`, details: { url: urlOutcome, file: fileDetails } };
        return { ...urlOutcome, details: { ...urlOutcome.details, file: fileDetails } };
      }
      return { ...urlOutcome, details: { ...urlOutcome.details, file: { sha256: ctx.fileSha256, status: fr.status === 404 ? "unknown to VirusTotal" : `HTTP ${fr.status}` } } };
    }
    return urlOutcome;
  }
}

const urlhaus: ThreatIntelProvider = {
  id: "urlhaus",
  name: "URLhaus (abuse.ch)",
  scope: "URL and host",
  isConfigured: (k) => !!k.urlhaus,
  async check(ctx) {
    const headers = { "Auth-Key": ctx.keys.urlhaus as string, "content-type": "application/x-www-form-urlencoded" };
    const res = await http("https://urlhaus-api.abuse.ch/v1/url/", { method: "POST", headers, body: new URLSearchParams({ url: ctx.url }).toString(), timeoutMs: ctx.timeoutMs });
    if (!res.ok) throw new HttpStatusError(res.status, `URLhaus returned HTTP ${res.status}`);
    const j = (await res.json()) as { query_status: string; url_status?: string; threat?: string; tags?: string[]; date_added?: string };
    if (j.query_status === "ok") {
      const online = j.url_status === "online";
      return { status: online ? "MALICIOUS" : "SUSPICIOUS", summary: `Listed (${j.threat ?? "malware"}, ${j.url_status ?? "unknown status"})`, details: { threat: j.threat, urlStatus: j.url_status, tags: j.tags, dateAdded: j.date_added } };
    }
    if (j.query_status === "no_results") {
      const hr = await http("https://urlhaus-api.abuse.ch/v1/host/", { method: "POST", headers, body: new URLSearchParams({ host: ctx.host }).toString(), timeoutMs: ctx.timeoutMs });
      if (hr.ok) {
        const hj = (await hr.json()) as { query_status: string; url_count?: string; blacklists?: Record<string, string> };
        if (hj.query_status === "ok" && Number(hj.url_count ?? 0) > 0) {
          return { status: "SUSPICIOUS", summary: `Host has ${hj.url_count} malware URL(s) on record`, details: { hostUrlCount: Number(hj.url_count), blacklists: hj.blacklists } };
        }
      }
      return { status: "CLEAN", summary: "Not listed in URLhaus" };
    }
    if (/invalid|unknown_auth|no_auth/i.test(j.query_status)) throw new HttpStatusError(401, `URLhaus: ${j.query_status}`);
    return { status: "UNKNOWN", summary: `URLhaus query status: ${j.query_status}` };
  },
};

const phishTank: ThreatIntelProvider = {
  id: "phishTank",
  name: "PhishTank",
  scope: "URL",
  isConfigured: (k) => !!k.phishTank,
  async check(ctx) {
    const res = await http("https://checkurl.phishtank.com/checkurl/", {
      method: "POST",
      timeoutMs: ctx.timeoutMs,
      headers: { "content-type": "application/x-www-form-urlencoded", "user-agent": "phishtank/innova-checker" },
      body: new URLSearchParams({ url: ctx.url, format: "json", app_key: ctx.keys.phishTank as string }).toString(),
    });
    if (res.status === 509 || res.status === 429) throw new HttpStatusError(429, "PhishTank rate limit reached");
    if (!res.ok) throw new HttpStatusError(res.status, `PhishTank returned HTTP ${res.status}`);
    const j = (await res.json()) as { results?: { in_database: boolean; verified?: boolean | string; valid?: boolean | string; phish_detail_page?: string } };
    const r = j.results;
    if (!r?.in_database) return { status: "CLEAN", summary: "Not in the PhishTank database" };
    const verified = r.verified === true || r.verified === "true";
    const valid = r.valid === true || r.valid === "true";
    if (verified && valid) return { status: "MALICIOUS", summary: "Verified phishing site", details: { detail: r.phish_detail_page } };
    return { status: "SUSPICIOUS", summary: verified ? "In database, not confirmed as valid phish" : "Reported, awaiting verification", details: { detail: r.phish_detail_page } };
  },
};

const abuseIpdb: ThreatIntelProvider = {
  id: "abuseIpdb",
  name: "AbuseIPDB",
  scope: "Resolved server IP addresses",
  isConfigured: (k) => !!k.abuseIpdb,
  async check(ctx) {
    const ips = ctx.ips.slice(0, 2);
    if (!ips.length) return { status: "UNKNOWN", summary: "No resolved IP address to check" };
    const results = [];
    for (const ip of ips) {
      const res = await http(`https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`, { headers: { Key: ctx.keys.abuseIpdb as string, accept: "application/json" }, timeoutMs: ctx.timeoutMs });
      if (res.status === 429) throw new HttpStatusError(429, "AbuseIPDB quota exceeded");
      if (!res.ok) throw new HttpStatusError(res.status, `AbuseIPDB returned HTTP ${res.status}`);
      const j = (await res.json()) as { data?: { abuseConfidenceScore?: number; totalReports?: number; isp?: string; countryCode?: string; usageType?: string; isWhitelisted?: boolean } };
      results.push({ ip, ...j.data });
    }
    const worst = results.reduce((m, r) => ((r.abuseConfidenceScore ?? 0) > (m.abuseConfidenceScore ?? 0) ? r : m), results[0]);
    const score = worst.abuseConfidenceScore ?? 0;
    // IP reputation describes the server, which is often shared hosting or a CDN, so it
    // never on its own marks a URL malicious.
    if (score >= 25) return { status: "SUSPICIOUS", summary: `IP ${worst.ip} abuse confidence ${score}% (${worst.totalReports ?? 0} reports)`, details: { results } };
    return { status: "CLEAN", summary: `IP reputation clean (max confidence ${score}%)`, details: { results } };
  },
};

export const PROVIDERS: ThreatIntelProvider[] = [googleSafeBrowsing, virusTotal, urlhaus, phishTank, abuseIpdb];

export async function runIntel(ctx: IntelContext): Promise<IntelResult[]> {
  return Promise.all(
    PROVIDERS.map(async (p): Promise<IntelResult> => {
      const base = { provider: p.id, providerName: p.name, checkedAt: nowIso() };
      if (!ctx.settings.providers[p.id]) return { ...base, status: "DISABLED", summary: "Disabled by administrator" };
      if (!p.isConfigured(ctx.keys)) return { ...base, status: "NOT_CONFIGURED", summary: "Not configured (no API key)" };
      const started = Date.now();
      try {
        const o = await p.check(ctx);
        return { ...base, ...o, latencyMs: Date.now() - started, checkedAt: nowIso() };
      } catch (e) {
        const status = e instanceof HttpStatusError ? e.status : 0;
        const timedOut = (e as Error).name === "TimeoutError" || (e as Error).name === "AbortError";
        return {
          ...base,
          status: timedOut || status === 429 || status >= 500 || status === 0 ? "UNAVAILABLE" : "ERROR",
          summary: timedOut ? "Provider did not respond in time" : (e as Error).message,
          latencyMs: Date.now() - started,
          checkedAt: nowIso(),
        };
      }
    }),
  );
}

export function providerCatalog(keys: ProviderKeys) {
  return PROVIDERS.map((p) => ({ id: p.id, name: p.name, scope: p.scope, configured: p.isConfigured(keys) }));
}
