// Collects logistics-themed phishing domains (postal / parcel / courier /
// freight lures) from public threat-intelligence feeds into
// prisma/data/logistics-threats-<date>.json.
//
// Evidence rules:
//   BLACKLIST  (CONFIRMED_MALICIOUS) — listed by a curated source (CERT Polska,
//              OpenPhish, phishunt.io, Unit 42) or by at least two independent feeds.
//   SUSPICIOUS (SUSPECTED)           — listed by a single aggregator only.
// Hosts on user-content platforms (pages.dev, vercel.app, …) are recorded with
// HOST scope so the platform itself is never listed. Official and whitelisted
// domains are excluded.
//
// Usage: npx tsx scripts/research/collect-logistics-threats.ts <feed-dir> <whitelist.txt> <existing.txt>
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { domainParts, userContentPlatform } from "../../src/server/scanner/util";
import { DEFAULT_BRANDS, FREE_HOSTING_SUFFIXES } from "../../src/server/scanner/data/defaults";
import { EXTRA_PLATFORMS, THROWAWAY_TLDS, matchLogistics as matchRule } from "../../src/server/threat-intel/logistics";

const [feedDir, whitelistFile, existingFile] = process.argv.slice(2);
if (!feedDir || !whitelistFile || !existingFile) {
  console.error("usage: collect-logistics-threats.ts <feed-dir> <whitelist.txt> <existing.txt>");
  process.exit(2);
}

type Source = { id: string; name: string; url: string; curated: boolean };
const SOURCES: Record<string, Source> = {
  certpl: { id: "certpl", name: "CERT Polska warning list", url: "https://hole.cert.pl/domains/v2/domains.json", curated: true },
  openphish: { id: "openphish", name: "OpenPhish community feed", url: "https://raw.githubusercontent.com/openphish/public_feed/refs/heads/main/feed.txt", curated: true },
  phishunt: { id: "phishunt", name: "phishunt.io feed", url: "https://phishunt.io/feed.txt", curated: true },
  unit42: { id: "unit42", name: "Palo Alto Unit 42 smishing IOCs", url: "https://github.com/PaloAltoNetworks/Unit42-timely-threat-intel", curated: true },
  phishdb: { id: "phishdb", name: "Phishing.Database (ACTIVE)", url: "https://github.com/mitchellkrogza/Phishing.Database", curated: false },
  phisharmy: { id: "phisharmy", name: "Phishing Army extended blocklist", url: "https://phishing.army/download/phishing_army_blocklist_extended.txt", curated: false },
};

// ── Exclusions ───────────────────────────────────────────────────────────────
const official = new Set<string>([
  ...readFileSync(whitelistFile, "utf8").split(/\r?\n/).map((s) => s.trim().toLowerCase()).filter(Boolean),
  ...DEFAULT_BRANDS.flatMap((b) => b.domains),
]);
const existing = new Set(readFileSync(existingFile, "utf8").split(/\r?\n/).map((s) => s.trim().toLowerCase()).filter(Boolean));
const isOfficial = (host: string) => [...official].some((d) => host === d || host.endsWith(`.${d}`));

// ── Feed parsing ─────────────────────────────────────────────────────────────
type Hit = { host: string; source: string; url?: string; seen?: string };
const hits: Hit[] = [];
const hostOf = (raw: string): string | null => {
  const v = raw.trim();
  if (!v || v.startsWith("#")) return null;
  try {
    const h = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `http://${v}`).hostname.toLowerCase().replace(/\.$/, "");
    return /^[a-z0-9.-]+$/.test(h) && h.includes(".") && !/^\d+\.\d+\.\d+\.\d+$/.test(h) ? h : null;
  } catch {
    return null;
  }
};
const read = (f: string) => readFileSync(path.join(feedDir, f), "utf8");

for (const row of JSON.parse(read("certpl.json")) as { DomainAddress: string; InsertDate: string; DeleteDate: string | null }[]) {
  if (row.DeleteDate) continue;
  const h = hostOf(row.DomainAddress);
  if (h) hits.push({ host: h, source: "certpl", seen: row.InsertDate });
}
for (const [file, source] of [["openphish.txt", "openphish"], ["phishunt.txt", "phishunt"]] as const) {
  for (const line of read(file).split(/\r?\n/)) {
    const h = hostOf(line);
    if (h) hits.push({ host: h, source, url: line.trim().slice(0, 300) });
  }
}
for (const file of ["u42-2025-03-06-IOCs-for-smishing-activity.txt", "u42-2025-04-23-IOCs-for-smishing-activity-update.txt", "u42-2025-08-13-IOCs-for-Smishing-activity.txt", "u42-2025-10-02-IOCs-for-updated-smishing-URL-tactics.txt"]) {
  for (const m of read(file).matchAll(/\b((?:[a-z0-9-]+\[?\.\]?)+[a-z]{2,})\b/gi)) {
    const h = hostOf(m[1].replace(/\[\.\]/g, "."));
    if (h && !/(github|linkedin|x\.com|bleepingcomputer|wikipedia|ic3\.gov|paloaltonetworks)/.test(h)) hits.push({ host: h, source: "unit42" });
  }
}
for (const [file, source] of [["phishdb-domains.txt", "phishdb"], ["phishing-army.txt", "phisharmy"]] as const) {
  for (const line of read(file).split(/\r?\n/)) {
    const h = hostOf(line);
    if (h) hits.push({ host: h, source });
  }
}

// ── Aggregate per listed name (registrable domain, or tenant host on platforms) ─
type Entry = { domain: string; scope: "DOMAIN" | "HOST"; brand: string; group: string; sources: Set<string>; sampleHosts: Set<string>; sampleUrl?: string; firstSeen?: string };
const entries = new Map<string, Entry>();
let excludedOfficial = 0;
for (const hit of hits) {
  const m = matchRule(hit.host);
  if (!m) continue;
  const rule = m.rule;
  if (isOfficial(hit.host)) {
    excludedOfficial++;
    continue;
  }
  const parts = domainParts(hit.host);
  const platform = userContentPlatform(hit.host, [...FREE_HOSTING_SUFFIXES, ...EXTRA_PLATFORMS]);
  const onPrivateSuffix = !!parts.tenant && parts.tenant !== parts.registrable;
  const regLabel = (parts.registrable ?? "").split(".")[0] ?? "";
  // A brand that appears only in the subdomain of an ordinary-looking domain
  // usually means a compromised or third-party site: list that host only.
  const attackerOwned = m.inRegistrable || regLabel.startsWith("com-") || THROWAWAY_TLDS.has(parts.tld ?? "");
  const scope: "DOMAIN" | "HOST" = platform || onPrivateSuffix || !attackerOwned ? "HOST" : "DOMAIN";
  const domain = scope === "HOST" ? (platform || onPrivateSuffix ? (parts.tenant && !platform ? parts.tenant : hit.host) : hit.host.replace(/^www\./, "")) : (parts.registrable ?? hit.host);
  if (!domain || isOfficial(domain) || EXTRA_PLATFORMS.includes(domain)) continue;
  const e = entries.get(domain) ?? { domain, scope, brand: rule.brand, group: rule.group, sources: new Set(), sampleHosts: new Set() };
  e.sources.add(hit.source);
  if (e.sampleHosts.size < 3) e.sampleHosts.add(hit.host);
  if (hit.url && !e.sampleUrl) e.sampleUrl = hit.url;
  if (hit.seen && (!e.firstSeen || hit.seen < e.firstSeen)) e.firstSeen = hit.seen;
  entries.set(domain, e);
}

const fetchedAt = new Date().toISOString();
const out = [...entries.values()]
  .filter((e) => !existing.has(e.domain))
  .map((e) => {
    const confirmed = [...e.sources].some((s) => SOURCES[s].curated) || e.sources.size >= 2;
    return {
      domain: e.domain,
      scope: e.scope,
      listType: confirmed ? "BLACKLIST" : "SUSPICIOUS",
      trustStatus: confirmed ? "CONFIRMED_MALICIOUS" : "SUSPECTED",
      brand: e.brand,
      category: e.group === "freight" ? "Freight & trucking phishing" : "Postal / parcel delivery phishing",
      sources: [...e.sources].map((s) => SOURCES[s].name),
      sourceUrls: [...e.sources].map((s) => SOURCES[s].url),
      sampleHosts: [...e.sampleHosts],
      sampleUrl: e.sampleUrl ?? null,
      firstSeen: e.firstSeen ?? null,
      fetchedAt,
    };
  })
  .sort((a, b) => (a.listType === b.listType ? a.domain.localeCompare(b.domain) : a.listType === "BLACKLIST" ? -1 : 1));

const outFile = path.join("prisma", "data", `logistics-threats-${fetchedAt.slice(0, 10)}.json`);
writeFileSync(outFile, `${JSON.stringify({ generatedAt: fetchedAt, rules: "BLACKLIST = curated source or >=2 feeds; SUSPICIOUS = single aggregator", sources: Object.values(SOURCES), records: out }, null, 1)}\n`);

const count = (pred: (r: (typeof out)[number]) => boolean) => out.filter(pred).length;
console.log(`hits=${hits.length} matched=${entries.size} excludedOfficialHits=${excludedOfficial} alreadyInDb=${entries.size - out.length}`);
console.log(`new: BLACKLIST=${count((r) => r.listType === "BLACKLIST")} SUSPICIOUS=${count((r) => r.listType === "SUSPICIOUS")} HOST-scope=${count((r) => r.scope === "HOST")}`);
const byBrand = new Map<string, number>();
for (const r of out.filter((r) => r.listType === "BLACKLIST")) byBrand.set(r.brand, (byBrand.get(r.brand) ?? 0) + 1);
console.log([...byBrand.entries()].sort((a, b) => b[1] - a[1]).map(([b, n]) => `  ${n}\t${b}`).join("\n"));
console.log(`→ ${outFile}`);
