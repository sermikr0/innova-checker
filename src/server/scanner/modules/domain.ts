import net from "node:net";
import type { Finding, LookupCache, ScannerSettings } from "../types";
import { guardedLookup } from "../net/safe-http";
import { FREE_HOSTING_SUFFIXES } from "../data/defaults";
import { domainParts, globMatch, hostMatchesDomain, makeFinding, officialBrandFor, userContentPlatform } from "../util";

// Domain intelligence: registration data from RDAP (IANA bootstrap) with a WHOIS
// (port 43) fallback for TLDs without RDAP. Registries that publish no creation
// date (.de, .eu) or no lookup service at all (.az, .tj) fall back to the first
// time the domain was seen on the public web, so every TLD gets an age signal.
// Plus local reputation rules.

export interface DomainInfo {
  domain: string | null;
  source: "RDAP" | "WHOIS" | null;
  sourceServer: string | null;
  registrar: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  expiresAt: string | null;
  ageDays: number | null;
  status: string[];
  nameservers: string[];
  dnssec: boolean | null;
  platformDomain: boolean;
  /** Earliest public trace of the domain when the registry gives no creation date. */
  firstSeen: { date: string; source: string } | null;
  error: string | null;
}

const IANA_BOOTSTRAP = "https://data.iana.org/rdap/dns.json";
const DAY = 86_400_000;

async function fetchJson(url: string, timeoutMs: number, accept = "application/json"): Promise<unknown> {
  const res = await fetch(url, {
    headers: { accept, "user-agent": "InnovaChecker/1.0 (+domain-intel)" },
    signal: AbortSignal.timeout(timeoutMs),
    redirect: "follow",
  });
  if (res.status === 404) throw Object.assign(new Error("Not found in registry"), { code: "NOT_FOUND" });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).host}`);
  return res.json();
}

async function rdapBaseFor(tld: string, cache: LookupCache, timeoutMs: number): Promise<string | null> {
  type Bootstrap = { services: [string[], string[]][] };
  let boot = await cache.get<Bootstrap>("rdap:bootstrap");
  if (!boot) {
    boot = (await fetchJson(IANA_BOOTSTRAP, timeoutMs)) as Bootstrap;
    await cache.set("rdap:bootstrap", boot, 24 * 3600);
  }
  for (const [tlds, urls] of boot.services) {
    if (tlds.includes(tld)) return urls.find((u) => u.startsWith("https://")) ?? urls[0] ?? null;
  }
  return null;
}

interface RdapEntity {
  roles?: string[];
  vcardArray?: [string, [string, unknown, string, unknown][]];
  entities?: RdapEntity[];
}

function vcardName(e: RdapEntity): string | null {
  const fn = e.vcardArray?.[1]?.find((x) => x[0] === "fn");
  return typeof fn?.[3] === "string" && fn[3].trim() ? (fn[3] as string).trim() : null;
}

async function queryRdap(domain: string, tld: string, cache: LookupCache, timeoutMs: number): Promise<Partial<DomainInfo> | null> {
  const base = await rdapBaseFor(tld, cache, timeoutMs);
  if (!base) return null;
  const url = `${base.replace(/\/?$/, "/")}domain/${encodeURIComponent(domain)}`;
  const j = (await fetchJson(url, timeoutMs, "application/rdap+json, application/json")) as {
    events?: { eventAction: string; eventDate: string }[];
    entities?: RdapEntity[];
    nameservers?: { ldhName?: string }[];
    status?: string[];
    secureDNS?: { delegationSigned?: boolean };
  };
  const ev = (a: string) => j.events?.find((e) => e.eventAction === a)?.eventDate ?? null;
  const registrarEntity = j.entities?.find((e) => e.roles?.includes("registrar"));
  return {
    source: "RDAP",
    sourceServer: new URL(url).host,
    registrar: registrarEntity ? vcardName(registrarEntity) : null,
    createdAt: toIso(ev("registration")),
    updatedAt: toIso(ev("last changed")),
    expiresAt: toIso(ev("expiration")),
    status: j.status ?? [],
    nameservers: (j.nameservers ?? []).map((n) => (n.ldhName ?? "").toLowerCase()).filter(Boolean),
    dnssec: j.secureDNS?.delegationSigned ?? null,
  };
}

function whoisQuery(server: string, query: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const socket = net.connect({ host: server, port: 43, lookup: guardedLookup as unknown as net.LookupFunction });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(Object.assign(new Error(`WHOIS ${server} timed out`), { code: "ETIMEDOUT" }));
    }, timeoutMs);
    socket.on("connect", () => socket.write(`${query}\r\n`));
    socket.on("data", (c: Buffer) => {
      size += c.length;
      if (size > 256 * 1024) {
        socket.destroy();
        return;
      }
      chunks.push(c);
    });
    socket.on("close", () => {
      clearTimeout(timer);
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    socket.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
  });
}

const MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

export function parseLooseDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const s = raw.trim().replace(/\s*\(.*\)$/, "");
  let m = /^(\d{1,2})[-. /]([a-z]{3})[a-z]*[-. /](\d{4})/i.exec(s);
  if (m && MONTHS[m[2].toLowerCase()] !== undefined) return new Date(Date.UTC(+m[3], MONTHS[m[2].toLowerCase()], +m[1]));
  m = /^(\d{4})(\d{2})(\d{2})(?!\d)/.exec(s); // registro.br: "19990514 #161424"
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  m = /^(\d{4})[./-](\d{2})[./-](\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(s);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0)));
  m = /^(\d{2})[./-](\d{2})[./-](\d{4})/.exec(s);
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toIso(v: string | null): string | null {
  const d = parseLooseDate(v);
  return d ? d.toISOString() : null;
}

// Registries format WHOIS differently: "Key: value", KazNIC's "Key.......: value"
// and JPRS's "a. [Key]   value". All are folded into lower-case keys.
export function whoisFields(text: string): Map<string, string[]> {
  const fields = new Map<string, string[]>();
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*[%#>]/.test(line)) continue;
    const m = /^\s*(?:[a-z]\.\s*)?\[([^\]]{2,60})\]\s+(\S.*)$/i.exec(line) ?? /^\s*([A-Za-z][\w /()-]{1,60}?)[\s.]*:\s*(\S.*)$/.exec(line);
    if (!m) continue;
    const key = m[1].toLowerCase().replace(/\s+/g, " ").trim();
    const list = fields.get(key) ?? [];
    list.push(m[2].trim());
    fields.set(key, list);
  }
  return fields;
}

function pick(fields: Map<string, string[]>, labels: string[]): string | null {
  for (const l of labels) {
    const v = fields.get(l)?.[0];
    if (v) return v;
  }
  return null;
}

const CREATED = ["creation date", "created on", "created", "domain created", "registered", "registered on", "registered date", "registration date", "registration time", "domain registration date", "domain create date", "record created", "commencement date", "activation date"];
const UPDATED = ["updated date", "last modified", "last updated", "last update", "last changed", "changed", "modified", "last-update"];
const EXPIRES = ["registry expiry date", "registrar registration expiration date", "expiration date", "expiry date", "expires on", "expires", "expiry", "expire date", "paid-till", "renewal date", "valid until"];
const NOT_FOUND = /no match|not found|no entries found|no data found|no object found|object does not exist|status:\s*free|domain not found/i;

// Registries that need a query suffix to answer in a parseable form.
const WHOIS_QUERY: Record<string, (domain: string) => string> = {
  jp: (d) => `${d}/e`,
};

/** WHOIS server for a TLD from IANA, or null when the registry runs none (.az, .tj). */
async function whoisServerFor(tld: string, cache: LookupCache, timeoutMs: number): Promise<string | null> {
  const cached = await cache.get<{ server: string | null }>(`whois:srv:${tld}`);
  if (cached) return cached.server;
  const iana = await whoisQuery("whois.iana.org", tld, timeoutMs);
  // [ \t]* rather than \s*: an empty "whois:" line must not swallow the next line.
  const server = /^whois:[ \t]*(\S+)/im.exec(iana)?.[1] ?? null;
  await cache.set(`whois:srv:${tld}`, { server }, 7 * 24 * 3600);
  return server;
}

async function queryWhois(domain: string, tld: string, server: string, timeoutMs: number): Promise<Partial<DomainInfo> | null> {
  const text = await whoisQuery(server, (WHOIS_QUERY[tld] ?? ((d: string) => d))(domain), timeoutMs);
  if (NOT_FOUND.test(text)) {
    throw Object.assign(new Error("Domain not found in WHOIS"), { code: "NOT_FOUND" });
  }
  const fields = whoisFields(text);
  const nameservers = ["name server", "nserver", "nameservers", "nameserver", "name servers"]
    .flatMap((k) => fields.get(k) ?? [])
    .map((v) => v.split(/\s+/)[0].toLowerCase().replace(/\.$/, ""))
    .filter((n) => n && n !== "not.defined");
  const statusLine = pick(fields, ["domain status", "status", "state"]);
  return {
    source: "WHOIS",
    sourceServer: server,
    registrar: pick(fields, ["registrar", "sponsoring registrar", "current registrar", "registrar name"]),
    createdAt: toIso(pick(fields, CREATED)),
    updatedAt: toIso(pick(fields, UPDATED)),
    expiresAt: toIso(pick(fields, EXPIRES)),
    status: statusLine ? [statusLine] : [],
    nameservers: [...new Set(nameservers)],
    dnssec: null,
  };
}

// First public trace of a domain: the Internet Archive's earliest capture and
// the earliest certificate in Certificate Transparency logs. Either is a lower
// bound on the domain's age, available for every TLD. Only the bare domain is
// sent, never the scanned URL.
async function waybackFirstCapture(domain: string, timeoutMs: number): Promise<string | null> {
  const rows = (await fetchJson(`https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(domain)}&limit=1&fl=timestamp&output=json`, timeoutMs)) as string[][];
  const ts = rows?.[1]?.[0];
  if (!ts || !/^\d{14}$/.test(ts)) return null;
  return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}T${ts.slice(8, 10)}:${ts.slice(10, 12)}:${ts.slice(12, 14)}Z`;
}

async function ctFirstCertificate(domain: string, timeoutMs: number): Promise<string | null> {
  // Busy domains have tens of megabytes of certificates; such a domain is old
  // anyway and always archived, so the download is capped instead of finished.
  const res = await fetch(`https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`, { headers: { accept: "application/json", "user-agent": "InnovaChecker/1.0 (+domain-intel)" }, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} from crt.sh`);
  const reader = res.body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 1_500_000) {
      await reader.cancel();
      return null;
    }
    parts.push(value);
  }
  const certs = JSON.parse(Buffer.concat(parts).toString("utf8")) as { not_before?: string }[];
  const dates = (Array.isArray(certs) ? certs : []).map((c) => (c.not_before ? Date.parse(`${c.not_before}Z`) : NaN)).filter((t) => Number.isFinite(t));
  return dates.length ? new Date(Math.min(...dates)).toISOString() : null;
}

async function firstSeenOnWeb(domain: string, cache: LookupCache, timeoutMs: number): Promise<{ date: string; source: string } | null> {
  const key = `history:${domain}`;
  const cached = await cache.get<{ hit: { date: string; source: string } | null }>(key);
  if (cached) return cached.hit;
  const budget = Math.min(timeoutMs, 6000);
  // Certificate logs are only asked when the archive knows nothing: phishing
  // domains are rarely archived but always need a certificate for HTTPS.
  const [wb] = await Promise.allSettled([waybackFirstCapture(domain, budget)]);
  const [ct] = wb.status === "fulfilled" && wb.value ? [{ status: "fulfilled" as const, value: null }] : await Promise.allSettled([ctFirstCertificate(domain, Math.min(budget, 5000))]);
  const found = [
    wb.status === "fulfilled" && wb.value ? { date: wb.value, source: "Internet Archive (first capture)" } : null,
    ct.status === "fulfilled" && ct.value ? { date: ct.value, source: "Certificate Transparency (first certificate, crt.sh)" } : null,
  ].filter((x): x is { date: string; source: string } => !!x);
  const hit = found.sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
  // A miss is only cached when both sources actually answered.
  if (hit) await cache.set(key, { hit }, 7 * 24 * 3600);
  else if (wb.status === "fulfilled" && ct.status === "fulfilled") await cache.set(key, { hit: null }, 6 * 3600);
  return hit;
}

export async function analyzeDomain(ctx: {
  host: string;
  settings: ScannerSettings;
  cache: LookupCache;
  timeoutMs: number;
}): Promise<{ data: DomainInfo; findings: Finding[]; status: "ok" | "unavailable" | "skipped" }> {
  const { host, settings, cache, timeoutMs } = ctx;
  const parts = domainParts(host);
  const findings: Finding[] = [];
  const data: DomainInfo = {
    domain: parts.registrable,
    source: null,
    sourceServer: null,
    registrar: null,
    createdAt: null,
    updatedAt: null,
    expiresAt: null,
    ageDays: null,
    status: [],
    nameservers: [],
    dnssec: null,
    platformDomain: !!parts.tenant && parts.tenant !== parts.registrable,
    firstSeen: null,
    error: null,
  };

  // Local reputation rules run regardless of registry availability.
  const official = officialBrandFor(host, settings, FREE_HOSTING_SUFFIXES);
  const trusted = userContentPlatform(host, FREE_HOSTING_SUFFIXES) ? undefined : settings.trustedDomains.find((d) => hostMatchesDomain(host, d));
  const pattern = settings.suspiciousDomainPatterns.find((p) => globMatch(p, host));
  if (official || trusted) {
    findings.push(makeFinding("domain", { code: "REPUTATION_LIST", title: "Innova reputation lists", status: "PASS", result: official ? `Official ${official.brand} domain` : "On the trusted-domain list", explanation: "The domain is on Innova Checker's list of known legitimate domains. Content and threat-intelligence checks still run.", evidence: { match: official?.brand ?? trusted } }));
  } else if (pattern) {
    findings.push(makeFinding("domain", { code: "REPUTATION_LIST", title: "Innova reputation lists", status: "FAIL", severity: "HIGH", weight: 40, result: `Matches suspicious pattern "${pattern}"`, explanation: "The host matches a pattern on Innova Checker's suspicious-domain list maintained by your administrators.", evidence: { pattern } }));
  } else {
    findings.push(makeFinding("domain", { code: "REPUTATION_LIST", title: "Innova reputation lists", status: "PASS", result: "No match", explanation: "The host does not match any administrator-defined suspicious-domain pattern." }));
  }

  // Government portals often live on a public suffix itself (gov.sg, gob.mx):
  // the registry still holds a record for that name.
  const registrable = parts.registrable ?? (!parts.isIp && host.includes(".") ? host : null);
  if (parts.isIp || !registrable) {
    findings.push(makeFinding("domain", { code: "DOMAIN_REGISTRATION", title: "Domain registration data", status: "SKIPPED", result: parts.isIp ? "IP address — no domain registration" : "No registrable domain", explanation: "Registration data applies to domain names only. IP reputation is covered by threat intelligence (AbuseIPDB) when configured." }));
    return { data, findings, status: "skipped" };
  }
  data.domain = registrable;

  const tld = parts.publicSuffix?.split(".").pop() ?? "";
  const tenantSite = data.platformDomain || !!userContentPlatform(host, FREE_HOSTING_SUFFIXES);
  let info: Partial<DomainInfo> | null = null;
  let notFound = false;
  let noRegistryService = false;
  let rdapBase: string | null = null;
  try {
    rdapBase = await rdapBaseFor(tld, cache, timeoutMs);
    if (rdapBase) info = await queryRdap(registrable, tld, cache, timeoutMs);
  } catch (e) {
    if ((e as { code?: string }).code === "NOT_FOUND") notFound = true;
    else data.error = `RDAP: ${(e as Error).message}`;
  }
  if (!info && !notFound) {
    try {
      const server = await whoisServerFor(tld, cache, timeoutMs);
      if (server) info = await queryWhois(registrable, tld, server, timeoutMs);
      else if (!rdapBase) noRegistryService = true;
    } catch (e) {
      if ((e as { code?: string }).code === "NOT_FOUND") notFound = true;
      else data.error = [data.error, `WHOIS: ${(e as Error).message || (e as { code?: string }).code || "failed"}`].filter(Boolean).join("; ");
    }
  }

  if (notFound) {
    findings.push(makeFinding("domain", { code: "DOMAIN_REGISTRATION", title: "Domain registration data", status: "FAIL", severity: "MEDIUM", weight: 15, result: "Not registered", explanation: `The registry reports that ${registrable} is not registered. The link cannot lead to a legitimate site; it may be a typo, a taken-down phishing domain or a lure for a domain the attacker plans to register.` , source: "RDAP / WHOIS registry" }));
    return { data, findings, status: "ok" };
  }

  if (info) Object.assign(data, info);
  const created = data.createdAt ? new Date(data.createdAt) : null;
  data.ageDays = created ? Math.floor((Date.now() - created.getTime()) / DAY) : null;
  if (data.ageDays === null && !tenantSite) data.firstSeen = await firstSeenOnWeb(registrable, cache, timeoutMs).catch(() => null);
  const source = info ? `${data.source} (${data.sourceServer})` : "RDAP / WHOIS";

  if (info) {
    findings.push(makeFinding("domain", { code: "DOMAIN_REGISTRATION", title: "Domain registration data", status: "INFO", result: [data.registrar && `Registrar: ${data.registrar}`, data.createdAt && `created ${data.createdAt.slice(0, 10)}`].filter(Boolean).join(", ") || "Retrieved", explanation: data.createdAt ? "Registration details as published by the registry." : "Registration details as published by the registry. This registry does not publish the creation date, so domain age comes from the domain's public history instead.", evidence: { registrar: data.registrar, createdAt: data.createdAt, updatedAt: data.updatedAt, expiresAt: data.expiresAt, status: data.status, nameservers: data.nameservers }, source }));
  } else {
    findings.push(makeFinding("domain", {
      code: "DOMAIN_REGISTRATION",
      title: "Domain registration data",
      status: noRegistryService ? "INFO" : "UNAVAILABLE",
      result: noRegistryService ? `.${tld} registry offers no public lookup` : "Registry lookup unavailable",
      explanation: noRegistryService
        ? `The .${tld} registry publishes no RDAP or WHOIS service, so registrar and creation date cannot be read for any .${tld} domain. Domain age comes from the domain's public history instead.`
        : "Neither RDAP nor WHOIS returned registration data for this domain right now. Domain age comes from the domain's public history instead.",
      evidence: { error: data.error },
      source,
    }));
  }

  if (tenantSite) {
    findings.push(makeFinding("domain", { code: "DOMAIN_AGE", title: "Domain age", status: "INFO", result: `${registrable} is ${data.ageDays ?? "?"} days old`, explanation: `${host} is a tenant site on ${registrable}. The registration age belongs to the hosting platform, not to whoever published this page, so it says nothing about the page's trustworthiness.`, evidence: { platform: registrable, ageDays: data.ageDays }, source }));
  } else if (data.ageDays !== null) {
    const a = data.ageDays;
    const [status, severity, weight, label] =
      a < 7 ? (["FAIL", "HIGH", 38, "registered in the last 7 days"] as const)
      : a < 30 ? (["FAIL", "HIGH", 28, "registered in the last 30 days"] as const)
      : a < 120 ? (["WARN", "MEDIUM", 15, "less than 4 months old"] as const)
      : a < 365 ? (["INFO", "LOW", 5, "less than a year old"] as const)
      : (["PASS", "NONE", 0, "established domain"] as const);
    findings.push(makeFinding("domain", { code: "DOMAIN_AGE", title: "Domain age", status, severity, weight, result: `${a} days (${label})`, explanation: a < 120 ? "Most phishing domains are used within days or weeks of registration. A very young domain sending business links is a strong warning sign, especially for invoices, tracking or payment pages." : a < 365 ? "The domain is relatively young. That is not suspicious on its own." : "The domain has been registered for more than a year.", evidence: { createdAt: data.createdAt, ageDays: a }, source }));
  } else if (data.firstSeen) {
    // A lower bound on age: weighted a little below registry age because a
    // domain can exist for a while before it is archived or gets a certificate.
    const a = Math.floor((Date.now() - new Date(data.firstSeen.date).getTime()) / DAY);
    const since = data.firstSeen.date.slice(0, 10);
    const [status, severity, weight, label] =
      a < 30 ? (["FAIL", "HIGH", 22, `first seen ${a} days ago`] as const)
      : a < 120 ? (["WARN", "MEDIUM", 12, `first seen ${a} days ago`] as const)
      : a < 365 ? (["INFO", "LOW", 4, `on the web since ${since}`] as const)
      : (["PASS", "NONE", 0, `on the web since ${since}`] as const);
    findings.push(makeFinding("domain", { code: "DOMAIN_AGE", title: "Domain age", status, severity, weight, result: `${label} (${a} days)`, explanation: a < 120 ? "The registry gives no creation date, and the earliest public trace of this domain is very recent. New domains sending business links are a strong warning sign, especially for invoices, tracking or payment pages." : "The registry gives no creation date, but the domain has a public history going back this far, so it is at least this old.", evidence: { firstSeen: data.firstSeen.date, ageDays: a, basis: "first-seen" }, source: data.firstSeen.source }));
  } else {
    findings.push(makeFinding("domain", { code: "DOMAIN_AGE", title: "Domain age", status: "UNAVAILABLE", result: "No creation date and no public history", explanation: "The registry publishes no creation date and the domain has no archived captures or certificates on record. Brand-new domains look like this, but so do small sites that were never archived.", source: "Registry, Internet Archive, Certificate Transparency" }));
  }

  if (!info) {
    return { data, findings, status: data.firstSeen ? "ok" : "unavailable" };
  }

  if (data.expiresAt) {
    const left = Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / DAY);
    if (left < 30) {
      findings.push(makeFinding("domain", { code: "DOMAIN_EXPIRY", title: "Registration expiry", status: "INFO", severity: "LOW", weight: 3, result: left < 0 ? "Expired" : `Expires in ${left} days`, explanation: "Short-lived registrations are typical of throw-away domains; established businesses usually renew well in advance.", source }));
    }
  }

  if (data.updatedAt && data.ageDays !== null && data.ageDays > 30) {
    const since = Math.floor((Date.now() - new Date(data.updatedAt).getTime()) / DAY);
    if (since >= 0 && since < 7) {
      findings.push(makeFinding("domain", { code: "DOMAIN_RECENT_CHANGE", title: "Recent registration changes", status: "WARN", severity: "LOW", weight: 6, result: `Registration changed ${since} day(s) ago`, explanation: "The registration record changed in the last week. This can be routine (renewal, nameserver move) but also accompanies domain hijacks and expired-domain re-registration.", evidence: { updatedAt: data.updatedAt }, source }));
    }
  }
  findings.push(makeFinding("domain", { code: "DOMAIN_HISTORY", title: "Historical WHOIS / passive DNS", status: "NOT_CONFIGURED", result: "No historical data provider configured", explanation: "Ownership and DNS history (e.g. recent owner changes) need a commercial passive-DNS or WHOIS-history feed. Only the registry's current 'last changed' date is used.", source: "—" }));

  const hold = data.status.find((s) => /hold|redemption|pending ?delete/i.test(s));
  if (hold) {
    findings.push(makeFinding("domain", { code: "DOMAIN_STATUS", title: "Registry status", status: "FAIL", severity: "HIGH", weight: 22, result: hold, explanation: "The registry has suspended or is deleting this domain (hold status). Registrars apply holds after abuse reports such as phishing take-downs, and also for non-payment. Either way, no legitimate business link should point here.", evidence: { status: data.status }, source }));
  }

  return { data, findings, status: "ok" };
}
