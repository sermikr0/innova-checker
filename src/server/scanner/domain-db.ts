import { parse as parseDomain } from "tldts";
import { bareHost } from "./net/ip-policy";
import { hostMatchesDomain } from "./util";

// Pure matching logic for the domain-intelligence database (whitelist / blacklist /
// suspicious). Storage lives in src/server/domain-intel; this module only decides
// whether a record applies to a URL.

export type ListType = "WHITELIST" | "BLACKLIST" | "SUSPICIOUS";
export type MatchScope = "DOMAIN" | "HOST" | "URL";

export interface DomainRecordRef {
  id: string;
  domain: string;
  listType: ListType;
  scope: MatchScope;
  trustStatus: string;
  platformName: string | null;
  companyName: string | null;
  category: string | null;
  officialUrl: string | null;
  verificationSource: string | null;
  verifiedAt: string | null;
  notes: string | null;
}

export interface DomainDbMatch {
  url: string;
  host: string;
  /** How the record matched: exact host, a safe parent-domain match, or an exact URL. */
  matchType: "exact" | "subdomain" | "url";
  record: DomainRecordRef;
}

export interface DomainDbLookup {
  /** Returns every ACTIVE record that applies to the URL (any list). */
  lookup(url: string): Promise<DomainDbMatch[]>;
}

/** Canonical form used for storage and lookup: lower-case ASCII host, no trailing dot or "www." for DOMAIN scope. */
export function normalizeRecordDomain(input: string, scope: MatchScope): string {
  const raw = input.trim();
  if (scope === "URL") {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
    u.hash = "";
    return u.toString();
  }
  let host = raw.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "").split(/[/?#]/)[0].replace(/:\d+$/, "");
  host = bareHost(new URL(`https://${host}`).hostname);
  return host;
}

export function isValidRecordDomain(domain: string, scope: MatchScope): boolean {
  if (scope === "URL") return /^https?:\/\//.test(domain);
  const p = parseDomain(domain, { allowPrivateDomains: true });
  return !!p.domain || !!p.isIp;
}

/** Candidate keys to query for a host: the host itself and every parent domain. */
export function lookupKeys(host: string): string[] {
  const h = bareHost(host);
  const labels = h.split(".");
  const keys: string[] = [];
  for (let i = 0; i < labels.length - 1; i++) keys.push(labels.slice(i).join("."));
  if (labels.length === 1) keys.push(h);
  return keys;
}

/**
 * Parent-domain matching is only "safe" when no hosting-platform boundary sits
 * between the host and the record (e.g. a record for example.com must not cover
 * attacker.example.com.s3.amazonaws.com, and a record for a platform must not cover
 * its customers' subdomains unless the record says so).
 */
function safeParentMatch(host: string, domain: string): boolean {
  if (!hostMatchesDomain(host, domain) || host === domain) return false;
  const priv = parseDomain(host, { allowPrivateDomains: true });
  if (priv.isPrivate && priv.publicSuffix && priv.publicSuffix !== domain && hostMatchesDomain(priv.publicSuffix, domain)) {
    return false;
  }
  return true;
}

export function matchRecords(url: string, records: DomainRecordRef[]): DomainDbMatch[] {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return [];
  }
  const host = bareHost(u.hostname);
  const noHash = (() => {
    const c = new URL(u.toString());
    c.hash = "";
    return c.toString();
  })();
  const out: DomainDbMatch[] = [];
  for (const r of records) {
    if (r.scope === "URL") {
      if (noHash === r.domain || (r.domain.endsWith("/") && noHash.startsWith(r.domain))) out.push({ url, host, matchType: "url", record: r });
    } else if (host === r.domain) {
      out.push({ url, host, matchType: "exact", record: r });
    } else if (r.scope === "DOMAIN" && safeParentMatch(host, r.domain)) {
      out.push({ url, host, matchType: "subdomain", record: r });
    }
  }
  // Most specific first: URL > exact host > closest parent domain.
  const rank = (m: DomainDbMatch) => (m.matchType === "url" ? 0 : m.matchType === "exact" ? 1 : 2);
  return out.sort((a, b) => rank(a) - rank(b) || b.record.domain.length - a.record.domain.length);
}

export function pick(matches: DomainDbMatch[], list: ListType): DomainDbMatch | null {
  return matches.find((m) => m.record.listType === list) ?? null;
}
