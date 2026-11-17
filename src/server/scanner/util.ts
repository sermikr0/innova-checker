import { parse as parseDomain } from "tldts";
import type { BrandProfile, CheckStatus, Finding, ModuleKey, ScannerSettings, Severity } from "./types";
import { nowIso } from "./types";

export const SOURCE_HEURISTICS = "Innova Checker heuristics";

export function makeFinding(
  module: ModuleKey,
  f: {
    code: string;
    title: string;
    status: CheckStatus;
    severity?: Severity;
    weight?: number;
    result: string;
    explanation: string;
    evidence?: Record<string, unknown>;
    source?: string;
  },
): Finding {
  return {
    module,
    code: f.code,
    title: f.title,
    status: f.status,
    severity: f.severity ?? "NONE",
    weight: Math.max(0, Math.min(100, Math.round(f.weight ?? 0))),
    result: f.result,
    explanation: f.explanation,
    evidence: f.evidence,
    source: f.source ?? SOURCE_HEURISTICS,
    checkedAt: nowIso(),
  };
}

export interface DomainParts {
  host: string;
  /** ICANN registrable domain (what RDAP/WHOIS know about). */
  registrable: string | null;
  /** Registrable domain when private suffixes (webflow.io, github.io...) count as TLDs. */
  tenant: string | null;
  publicSuffix: string | null;
  subdomain: string;
  isIp: boolean;
  tld: string | null;
}

export function domainParts(host: string): DomainParts {
  const icann = parseDomain(host, { allowPrivateDomains: false });
  const priv = parseDomain(host, { allowPrivateDomains: true });
  return {
    host,
    registrable: icann.domain ?? null,
    tenant: priv.domain ?? null,
    publicSuffix: icann.publicSuffix ?? null,
    subdomain: icann.subdomain ?? "",
    isIp: !!icann.isIp,
    tld: icann.publicSuffix ? icann.publicSuffix.split(".").pop() ?? null : null,
  };
}

export function hostMatchesDomain(host: string, domain: string): boolean {
  const h = host.toLowerCase();
  const d = domain.toLowerCase().replace(/^\*\./, "");
  return h === d || h.endsWith(`.${d}`);
}

export function isOfficialFor(host: string, brand: BrandProfile): boolean {
  return brand.domains.some((d) => hostMatchesDomain(host, d));
}

// Cloud object storage and app-hosting endpoints whose subdomains are customer-controlled.
const USER_CONTENT_PATTERNS = [
  /(^|\.)s3[.-]([a-z0-9-]+[.-])?website[.-][a-z0-9-]+\.amazonaws\.com$/,
  /(^|\.)s3([.-][a-z0-9-]+)?\.amazonaws\.com$/,
  /\.compute(-1)?\.amazonaws\.com$/,
  /\.elb\.amazonaws\.com$/,
  /\.execute-api\.[a-z0-9-]+\.amazonaws\.com$/,
  /\.lambda-url\.[a-z0-9-]+\.on\.aws$/,
  /\.(blob|web|file)\.core\.windows\.net$/,
  /\.cloudapp\.(azure\.com|net)$/,
  /\.r2\.(dev|cloudflarestorage\.com)$/,
];

/** Hosting platform / cloud storage suffix the host lives on, if any. */
export function userContentPlatform(host: string, platformSuffixes: string[]): string | null {
  const h = host.toLowerCase();
  const listed = platformSuffixes.find((s) => h !== s && hostMatchesDomain(h, s));
  if (listed) return listed;
  const re = USER_CONTENT_PATTERNS.find((r) => r.test(h));
  if (re) return parseDomain(h, { allowPrivateDomains: true }).publicSuffix ?? h.split(".").slice(-3).join(".");
  const priv = parseDomain(h, { allowPrivateDomains: true });
  if (priv.isPrivate && priv.publicSuffix && priv.publicSuffix !== h) return priv.publicSuffix;
  return null;
}

/** The part of the host chosen by whoever registered it (strips public and platform suffixes). */
export function ownedHostPart(host: string): string {
  const priv = parseDomain(host, { allowPrivateDomains: true });
  const suffix = priv.publicSuffix;
  if (!suffix || suffix === host) return host;
  return host.slice(0, -(suffix.length + 1));
}

/**
 * Official brand domain? Customer-controlled subdomains of cloud and hosting
 * platforms (S3 buckets, *.sharepoint.com, *.github.io ...) never count.
 */
export function officialBrandFor(host: string, settings: ScannerSettings, platformSuffixes: string[] = []): BrandProfile | null {
  if (userContentPlatform(host, platformSuffixes)) return null;
  return settings.brandDomains.find((b) => isOfficialFor(host, b)) ?? null;
}

export function isTrustedHost(host: string, settings: ScannerSettings, platformSuffixes: string[] = []): boolean {
  if (userContentPlatform(host, platformSuffixes)) return false;
  return settings.trustedDomains.some((d) => hostMatchesDomain(host, d)) || officialBrandFor(host, settings) !== null;
}

/** Looks like machine-generated gibberish (e.g. "sfvnooyf-ijndgf"). */
export function looksRandom(label: string): boolean {
  const parts = label.toLowerCase().split(/[-_.\d]+/).filter((p) => p.length >= 6);
  return parts.some((p) => /[bcdfghjklmnpqrstvwxz]{5,}/.test(p) || (p.length >= 8 && (p.match(/[aeiou]/g) ?? []).length / p.length < 0.15));
}

const LURE_AFFIXES = [
  "my", "e", "i", "www", "secure", "login", "signin", "verify", "update", "account", "support",
  "service", "services", "online", "help", "track", "tracking", "trace", "express", "parcel",
  "delivery", "deliver", "shipping", "ship", "post", "mail", "pay", "payment", "portal", "app",
  "auth", "web", "global", "official", "center", "centre", "customs", "logistics", "freight",
  "cargo", "notice", "info", "id", "uz", "us", "eu", "team", "desk", "doc", "docs", "file",
  "files", "share", "drive", "cloud", "bill", "invoice", "check", "confirm", "status",
];

/**
 * Does a hostname/path token reference a brand keyword? Short keywords (ups, dhl, dat)
 * only match exactly or when glued to a known lure word, to avoid hits like "groups".
 */
export function tokenMatchesKeyword(token: string, keyword: string): boolean {
  const t = token.toLowerCase();
  const k = keyword.toLowerCase();
  if (!t || !k) return false;
  if (t === k) return true;
  if (t.startsWith(k) && LURE_AFFIXES.includes(t.slice(k.length))) return true;
  if (t.endsWith(k) && LURE_AFFIXES.includes(t.slice(0, t.length - k.length))) return true;
  if (k.length >= 5 && t.startsWith(k)) return true;
  // Long brand names glued to a short prefix/suffix ("avhighway", "highwayco").
  if (k.length >= 6 && t.includes(k) && t.length - k.length <= 3) return true;
  return false;
}

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function brandsMentionedInTokens(tokens: string[], settings: ScannerSettings): BrandProfile[] {
  const found: BrandProfile[] = [];
  for (const b of settings.brandDomains) {
    const kws = b.keywords.map((k) => k.replace(/[^a-z0-9]/gi, "").toLowerCase()).filter(Boolean);
    if (tokens.some((t) => kws.some((k) => tokenMatchesKeyword(t, k)))) found.push(b);
  }
  return found;
}

/** Case-insensitive glob (* and ? only) matcher; no regex input is ever accepted from admins. */
export function globMatch(pattern: string, value: string): boolean {
  const p = pattern.toLowerCase();
  const v = value.toLowerCase();
  // Iterative wildcard matching, linear in practice and immune to ReDoS.
  let pi = 0;
  let vi = 0;
  let star = -1;
  let mark = 0;
  while (vi < v.length) {
    if (pi < p.length && (p[pi] === "?" || p[pi] === v[vi])) {
      pi++;
      vi++;
    } else if (pi < p.length && p[pi] === "*") {
      star = pi++;
      mark = vi;
    } else if (star !== -1) {
      pi = star + 1;
      vi = ++mark;
    } else {
      return false;
    }
  }
  while (pi < p.length && p[pi] === "*") pi++;
  return pi === p.length;
}

/** Damerau-Levenshtein (optimal string alignment) distance, capped for speed. */
export function editDistance(a: string, b: string, cap = 3): number {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

// Unicode characters that render like ASCII letters (subset of Unicode confusables).
const CONFUSABLES: Record<string, string> = {
  "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x", "і": "i", "ј": "j",
  "ԁ": "d", "ɡ": "g", "һ": "h", "ո": "n", "ѕ": "s", "ԛ": "q", "ԝ": "w", "ӏ": "l", "ɩ": "i",
  "к": "k", "м": "m", "т": "t", "в": "b", "н": "h", "ь": "b", "ӧ": "o", "ё": "e",
  "α": "a", "ε": "e", "ι": "i", "κ": "k", "ν": "v", "ο": "o", "ρ": "p", "τ": "t", "υ": "u",
  "χ": "x", "ω": "w", "β": "b", "ı": "i", "ł": "l", "ß": "ss", "ɑ": "a", "ʏ": "y",
  "à": "a", "á": "a", "â": "a", "ä": "a", "å": "a", "ã": "a", "è": "e", "é": "e", "ê": "e",
  "ë": "e", "ì": "i", "í": "i", "î": "i", "ï": "i", "ò": "o", "ó": "o", "ô": "o", "ö": "o",
  "õ": "o", "ù": "u", "ú": "u", "û": "u", "ü": "u", "ñ": "n", "ç": "c", "ý": "y", "ÿ": "y",
};

export function unicodeSkeleton(s: string): string {
  return [...s.normalize("NFKC").toLowerCase()].map((ch) => CONFUSABLES[ch] ?? ch).join("");
}

/** ASCII look-alike folding used for typo-squatting (rn→m, 0→o, 1→l, vv→w). */
export function asciiSkeleton(s: string): string {
  return s
    .toLowerCase()
    .replace(/rn/g, "m")
    .replace(/vv/g, "w")
    .replace(/0/g, "o")
    .replace(/[1|]/g, "l")
    .replace(/5/g, "s");
}

export function scriptsIn(label: string): string[] {
  const scripts: [string, RegExp][] = [
    ["Latin", /\p{Script=Latin}/u],
    ["Cyrillic", /\p{Script=Cyrillic}/u],
    ["Greek", /\p{Script=Greek}/u],
    ["Armenian", /\p{Script=Armenian}/u],
    ["Han", /\p{Script=Han}/u],
    ["Arabic", /\p{Script=Arabic}/u],
    ["Hebrew", /\p{Script=Hebrew}/u],
  ];
  return scripts.filter(([, re]) => re.test(label)).map(([n]) => n);
}

export function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
