// Third evidence pass: English Wikipedia article infobox "website"/"url" field.
import fs from "node:fs/promises";
import path from "node:path";

const UA = "InnovaChecker-DomainResearch/1.0 (+https://innovanetworks.uz; security research)";
const FILE = path.join(__dirname, "..", "..", "prisma/data/logistics-whitelist.json");
type Rec = { domain: string; platformName: string; companyName: string; trustStatus: string; verificationSource: string; verifiedAt: string; evidence: Record<string, unknown> };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function api(params: Record<string, string>) {
  const u = `https://en.wikipedia.org/w/api.php?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`;
  const res = await fetch(u, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function infoboxSites(wikitext: string): string[] {
  const out: string[] = [];
  for (const m of wikitext.matchAll(/\|\s*(?:website|url|homepage)\s*=\s*([^\n]+)/gi)) {
    for (const u of m[1].matchAll(/(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)/gi)) out.push(u[1].toLowerCase());
  }
  return out;
}

async function main() {
  const recs = JSON.parse(await fs.readFile(FILE, "utf8")) as Rec[];
  const now = new Date().toISOString();
  for (const r of recs.filter((x) => x.trustStatus !== "VERIFIED_OFFICIAL")) {
    const queries = [...new Set([r.platformName.replace(/\s*\(.*\)$/, ""), r.companyName.replace(/,? (Inc\.|LLC|Corp\.?|Limited)$/i, "")])];
    let hit: { title: string; site: string } | null = null;
    for (const q of queries) {
      try {
        const s = (await api({ action: "query", list: "search", srsearch: q, srlimit: "4" })) as { query: { search: { title: string }[] } };
        for (const { title } of s.query.search) {
          const p = (await api({ action: "parse", page: title, prop: "wikitext", section: "0" })) as { parse?: { wikitext: string } };
          const sites = infoboxSites(p.parse?.wikitext ?? "");
          const site = sites.find((x) => x === r.domain || x.endsWith(`.${r.domain}`));
          if (site) {
            hit = { title, site };
            break;
          }
          await sleep(150);
        }
      } catch (e) {
        console.warn(`  ${r.domain}: ${(e as Error).message}`);
      }
      if (hit) break;
    }
    if (hit) {
      const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.title.replace(/ /g, "_"))}`;
      r.trustStatus = "VERIFIED_OFFICIAL";
      r.verificationSource = `English Wikipedia article "${hit.title}" infobox website = ${hit.site} — ${url}`;
      r.verifiedAt = now;
      r.evidence = { ...r.evidence, wikipedia: { title: hit.title, website: hit.site, url } };
      console.log(`✓ ${r.domain} ← ${hit.title}`);
    } else {
      console.log(`· ${r.domain}`);
    }
  }
  await fs.writeFile(FILE, `${JSON.stringify(recs, null, 2)}\n`);
  console.log(`${recs.filter((r) => r.trustStatus === "VERIFIED_OFFICIAL").length}/${recs.length} verified.`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
