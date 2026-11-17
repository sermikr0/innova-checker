import zlib from "node:zlib";

// Public threat-intelligence sources collected every run. "curated" sources
// list phishing confirmed by a CERT, a verification community or a vendor and
// are imported in full; "aggregator" sources and newly registered domains only
// contribute logistics-themed entries, at a lower trust level.

export type SourceKind = "curated" | "aggregator" | "nrd";
export type Item = { host: string; url?: string; seen?: string; target?: string };
export interface Source {
  id: string;
  name: string;
  url: string;
  kind: SourceKind;
  category: string;
  fetch: () => Promise<Item[]>;
}

const UA = "InnovaChecker-ThreatIntel/1.0 (+https://innovanetworks.uz)";
const MAX_BYTES = 80 * 1024 * 1024;

async function download(url: string, timeoutMs = 180_000): Promise<Buffer> {
  const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(timeoutMs), redirect: "follow" });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_BYTES) {
      await reader.cancel();
      throw new Error("Feed larger than 80 MB");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export function hostOf(raw: string): string | null {
  const v = raw.trim();
  if (!v || v.startsWith("#") || v.startsWith("!")) return null;
  try {
    const h = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `http://${v}`).hostname.toLowerCase().replace(/\.$/, "");
    return /^[a-z0-9.-]+$/.test(h) && h.includes(".") && !/^\d+\.\d+\.\d+\.\d+$/.test(h) && h.length <= 253 ? h : null;
  } catch {
    return null;
  }
}

const lines = (b: Buffer) => b.toString("utf8").split(/\r?\n/);
const hostsFrom = (b: Buffer): Item[] => lines(b).flatMap((l) => {
  const h = hostOf(l.replace(/^0\.0\.0\.0\s+|^127\.0\.0\.1\s+/, ""));
  return h ? [{ host: h }] : [];
});
const urlsFrom = (b: Buffer): Item[] => lines(b).flatMap((l) => {
  const url = l.trim();
  const h = /^https?:\/\//i.test(url) ? hostOf(url) : null;
  return h ? [{ host: h, url: url.slice(0, 2000) }] : [];
});

/** Minimal reader for a single-file deflate ZIP (the whoisds daily archive). */
export function unzipFirst(zip: Buffer): Buffer {
  const eocd = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error("Not a ZIP archive");
  const cd = zip.readUInt32LE(eocd + 16);
  if (zip.readUInt32LE(cd) !== 0x02014b50) throw new Error("Bad central directory");
  const method = zip.readUInt16LE(cd + 10);
  const compressed = zip.readUInt32LE(cd + 20);
  const local = zip.readUInt32LE(cd + 42);
  const nameLen = zip.readUInt16LE(local + 26);
  const extraLen = zip.readUInt16LE(local + 28);
  const data = zip.subarray(local + 30 + nameLen + extraLen, local + 30 + nameLen + extraLen + compressed);
  if (method === 0) return Buffer.from(data);
  if (method !== 8) throw new Error(`Unsupported ZIP method ${method}`);
  return zlib.inflateRawSync(data, { maxOutputLength: 64 * 1024 * 1024 });
}

function csvRows(text: string): string[][] {
  // PhishTank's CSV has no embedded newlines; quoted commas are handled.
  return text.split(/\r?\n/).filter(Boolean).map((line) => {
    const out: string[] = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') q = !q;
      else if (c === "," && !q) {
        out.push(cur);
        cur = "";
      } else cur += c;
    }
    out.push(cur);
    return out;
  });
}

export const SOURCES: Source[] = [
  {
    id: "CERTPL", name: "CERT Polska warning list", url: "https://hole.cert.pl/domains/v2/domains.json", kind: "curated", category: "Phishing / scam (CERT Polska)",
    fetch: async () => (JSON.parse((await download("https://hole.cert.pl/domains/v2/domains.json")).toString("utf8")) as { DomainAddress: string; InsertDate: string; DeleteDate: string | null }[])
      .filter((r) => !r.DeleteDate)
      .flatMap((r) => {
        const h = hostOf(r.DomainAddress);
        return h ? [{ host: h, seen: r.InsertDate }] : [];
      }),
  },
  {
    id: "PHISHTANK", name: "PhishTank verified online phish", url: "http://data.phishtank.com/data/online-valid.csv", kind: "curated", category: "Phishing (PhishTank, community-verified)",
    fetch: async () => {
      const rows = csvRows((await download("http://data.phishtank.com/data/online-valid.csv")).toString("utf8"));
      const head = rows.shift() ?? [];
      const col = (n: string) => head.indexOf(n);
      return rows.flatMap((r) => {
        if (r[col("verified")] !== "yes" || r[col("online")] !== "yes") return [];
        const url = r[col("url")];
        const h = hostOf(url);
        const target = r[col("target")]?.replace(/&amp;/g, "&");
        return h ? [{ host: h, url: url.slice(0, 2000), seen: r[col("verification_time")], target: target && target !== "Other" ? target : undefined }] : [];
      });
    },
  },
  { id: "OPENPHISH", name: "OpenPhish community feed", url: "https://openphish.com/feed.txt", kind: "curated", category: "Phishing (OpenPhish)", fetch: async () => urlsFrom(await download("https://openphish.com/feed.txt")) },
  { id: "PHISHUNT", name: "phishunt.io feed", url: "https://phishunt.io/feed.txt", kind: "curated", category: "Phishing (phishunt.io)", fetch: async () => urlsFrom(await download("https://phishunt.io/feed.txt")) },
  { id: "MALWAREFILTER", name: "malware-filter phishing list (PhishTank, OpenPhish, IPThreat)", url: "https://malware-filter.gitlab.io/malware-filter/phishing-filter-domains.txt", kind: "curated", category: "Phishing (malware-filter)", fetch: async () => hostsFrom(await download("https://malware-filter.gitlab.io/malware-filter/phishing-filter-domains.txt")) },
  { id: "URLHAUS", name: "URLhaus online malware hosts (via malware-filter)", url: "https://malware-filter.gitlab.io/malware-filter/urlhaus-filter-domains-online.txt", kind: "curated", category: "Malware distribution (URLhaus)", fetch: async () => hostsFrom(await download("https://malware-filter.gitlab.io/malware-filter/urlhaus-filter-domains-online.txt")) },
  { id: "PHISHDB", name: "Phishing.Database (ACTIVE)", url: "https://raw.githubusercontent.com/mitchellkrogza/Phishing.Database/master/phishing-domains-ACTIVE.txt", kind: "aggregator", category: "Phishing (aggregated list)", fetch: async () => hostsFrom(await download("https://raw.githubusercontent.com/mitchellkrogza/Phishing.Database/master/phishing-domains-ACTIVE.txt")) },
  { id: "PHISHARMY", name: "Phishing Army extended blocklist", url: "https://phishing.army/download/phishing_army_blocklist_extended.txt", kind: "aggregator", category: "Phishing (aggregated list)", fetch: async () => hostsFrom(await download("https://phishing.army/download/phishing_army_blocklist_extended.txt")) },
  { id: "SCAMLIST", name: "Jarelllama Scam Blocklist", url: "https://raw.githubusercontent.com/jarelllama/Scam-Blocklist/main/lists/wildcard_domains/scams.txt", kind: "aggregator", category: "Scam (aggregated list)", fetch: async () => hostsFrom(await download("https://raw.githubusercontent.com/jarelllama/Scam-Blocklist/main/lists/wildcard_domains/scams.txt")) },
  {
    id: "NRD", name: "Newly registered domains (whoisds.com daily list)", url: "https://www.whoisds.com/newly-registered-domains", kind: "nrd", category: "Newly registered look-alike",
    fetch: async () => {
      // Yesterday's list is complete; today's is published during the day.
      const day = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
      const key = Buffer.from(`${day}.zip`).toString("base64");
      const text = unzipFirst(await download(`https://www.whoisds.com/whois-database/newly-registered-domains/${key}/nrd`)).toString("utf8");
      return text.split(/\r?\n/).flatMap((l) => {
        const h = hostOf(l);
        return h ? [{ host: h, seen: `${day}T00:00:00Z` }] : [];
      });
    },
  },
];
