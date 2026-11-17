// Verifies candidate logistics domains with independent evidence and writes
// prisma/data/logistics-whitelist.json (consumed by the seed and the admin import).
//
// Evidence, strongest first:
//   1. Wikidata "official website" (P856) of the company/platform entity lists the domain.
//   2. The domain redirects to an already-verified official domain AND shares its
//      authoritative nameservers.
//   3. The already-verified parent's official website links to the domain.
// Candidates without such evidence are emitted as UNVERIFIED (pending admin review),
// never as trusted.
//
// Usage: npx tsx scripts/research/verify-logistics-domains.ts
import fs from "node:fs/promises";
import path from "node:path";
import { promises as dns } from "node:dns";

type Candidate = {
  domain: string;
  platformName: string;
  companyName: string;
  category: string;
  wikidata?: string;
  parent?: string;
  brandKeywords: string[];
  notes?: string;
};

type Evidence = {
  wikidata?: { id: string; label: string; officialWebsite: string[] };
  live?: { status: number; finalUrl: string; title: string | null } | { error: string };
  nameservers?: string[];
  parentRedirect?: boolean;
  parentLinks?: boolean;
  sharedNameservers?: boolean;
};

const UA = "InnovaChecker-DomainResearch/1.0 (+https://innovanetworks.uz; security research)";
const ROOT = path.join(__dirname, "..", "..");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function hostOf(u: string): string {
  try {
    return new URL(u).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function covers(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function wikidataLookup(name: string, domain: string): Promise<Evidence["wikidata"] | null> {
  const s = (await getJson(`https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=7&search=${encodeURIComponent(name)}`)) as { search?: { id: string; label: string }[] };
  const ids = (s.search ?? []).map((x) => x.id);
  if (!ids.length) return null;
  const e = (await getJson(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims|labels&languages=en&ids=${ids.join("|")}`)) as {
    entities: Record<string, { labels?: { en?: { value: string } }; claims?: { P856?: { mainsnak: { datavalue?: { value: string } } }[] } }>;
  };
  for (const id of ids) {
    const ent = e.entities[id];
    const sites = (ent?.claims?.P856 ?? []).map((c) => c.mainsnak.datavalue?.value).filter((v): v is string => !!v);
    if (sites.some((u) => covers(hostOf(u), domain) || covers(domain, hostOf(u)))) {
      return { id, label: ent.labels?.en?.value ?? id, officialWebsite: sites };
    }
  }
  return null;
}

async function live(domain: string): Promise<Evidence["live"] & { html?: string }> {
  try {
    const res = await fetch(`https://${domain}/`, { headers: { "user-agent": UA, accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(25000) });
    const html = (await res.text()).slice(0, 800_000);
    const title = /<title[^>]*>([^<]{0,200})<\/title>/i.exec(html)?.[1]?.replace(/\s+/g, " ").trim() ?? null;
    return { status: res.status, finalUrl: res.url, title, html };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

async function nameservers(domain: string): Promise<string[]> {
  try {
    return (await dns.resolveNs(domain)).map((n) => n.toLowerCase()).sort();
  } catch {
    return [];
  }
}

async function main() {
  const candidates = JSON.parse(await fs.readFile(path.join(ROOT, "prisma/data/logistics-candidates.json"), "utf8")) as Candidate[];
  const verifiedAt = new Date().toISOString();
  const results: Record<string, { c: Candidate; ev: Evidence; html?: string; trust: string; source: string; officialUrl: string }> = {};

  // Pass 1: entities with Wikidata evidence and live checks.
  for (const c of candidates) {
    const ev: Evidence = {};
    if (c.wikidata) {
      try {
        ev.wikidata = (await wikidataLookup(c.wikidata, c.domain)) ?? undefined;
      } catch (e) {
        console.warn(`  wikidata ${c.domain}: ${(e as Error).message}`);
      }
      await sleep(250);
    }
    const l = await live(c.domain);
    const { html, ...liveInfo } = l as typeof l & { html?: string };
    ev.live = liveInfo as Evidence["live"];
    ev.nameservers = await nameservers(c.domain);
    let trust = "UNVERIFIED";
    let source = "";
    if (ev.wikidata) {
      trust = "VERIFIED_OFFICIAL";
      source = `Wikidata ${ev.wikidata.id} (${ev.wikidata.label}) official website P856 = ${ev.wikidata.officialWebsite.join(", ")} — https://www.wikidata.org/wiki/${ev.wikidata.id}`;
    }
    const finalUrl = "finalUrl" in liveInfo ? (liveInfo as { finalUrl: string }).finalUrl : `https://${c.domain}/`;
    results[c.domain] = { c, ev, html, trust, source, officialUrl: finalUrl };
    console.log(`${trust === "VERIFIED_OFFICIAL" ? "✓" : "·"} ${c.domain.padEnd(24)} wikidata=${ev.wikidata?.id ?? "-"} live=${"status" in liveInfo ? (liveInfo as { status: number }).status : "ERR"} final=${hostOf(finalUrl)}`);
  }

  // Pass 2: children of verified parents (redirect + shared NS, or linked from the parent's site).
  for (const r of Object.values(results)) {
    if (r.trust === "VERIFIED_OFFICIAL" || !r.c.parent) continue;
    const parent = results[r.c.parent];
    if (!parent || parent.trust !== "VERIFIED_OFFICIAL") continue;
    const finalHost = hostOf(r.officialUrl);
    r.ev.parentRedirect = covers(finalHost, r.c.parent);
    r.ev.sharedNameservers = !!r.ev.nameservers?.length && r.ev.nameservers.join() === parent.ev.nameservers?.join();
    r.ev.parentLinks = !!parent.html && new RegExp(`(https?:)?//([a-z0-9-]+\\.)*${r.c.domain.replace(/\./g, "\\.")}`, "i").test(parent.html);
    if (r.ev.parentRedirect && r.ev.sharedNameservers) {
      r.trust = "VERIFIED_OFFICIAL";
      r.source = `Redirects to verified official ${r.c.parent} (https://${r.c.domain}/ → ${r.officialUrl}) and uses the same authoritative nameservers (${r.ev.nameservers?.join(", ")}); parent verified via ${parent.source.split(" — ")[0]}`;
    } else if (r.ev.parentLinks) {
      r.trust = "VERIFIED_OFFICIAL";
      r.source = `Linked from the verified official website ${parent.officialUrl} (parent verified via ${parent.source.split(" — ")[0]})`;
    } else if (r.ev.parentRedirect) {
      r.source = `Redirects to ${r.c.parent} but nameservers differ; manual verification required`;
    }
    console.log(`${r.trust === "VERIFIED_OFFICIAL" ? "✓" : "·"} ${r.c.domain.padEnd(24)} via parent ${r.c.parent}: redirect=${r.ev.parentRedirect} sharedNS=${r.ev.sharedNameservers} linked=${r.ev.parentLinks}`);
  }

  const out = Object.values(results).map((r) => ({
    domain: r.c.domain,
    platformName: r.c.platformName,
    companyName: r.c.companyName,
    category: r.c.category,
    officialUrl: r.officialUrl,
    brandKeywords: r.c.brandKeywords,
    trustStatus: r.trust,
    verificationSource: r.source || "No independent evidence found automatically; requires manual verification by an administrator.",
    verifiedAt,
    notes: [r.c.notes, "title" in (r.ev.live ?? {}) && (r.ev.live as { title: string | null }).title ? `Live title: "${(r.ev.live as { title: string }).title}"` : null].filter(Boolean).join(" · ") || null,
    evidence: r.ev,
  }));
  await fs.writeFile(path.join(ROOT, "prisma/data/logistics-whitelist.json"), `${JSON.stringify(out, null, 2)}\n`);
  const v = out.filter((o) => o.trustStatus === "VERIFIED_OFFICIAL").length;
  console.log(`\n${v}/${out.length} verified; ${out.length - v} need manual review. Written to prisma/data/logistics-whitelist.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
