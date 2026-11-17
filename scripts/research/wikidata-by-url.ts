// Second evidence pass: finds Wikidata items whose official website (P856) is exactly
// one of the URL variants of an unverified domain. Updates logistics-whitelist.json in place.
import fs from "node:fs/promises";
import path from "node:path";

const UA = "InnovaChecker-DomainResearch/1.0 (+https://innovanetworks.uz; security research)";
const FILE = path.join(__dirname, "..", "..", "prisma/data/logistics-whitelist.json");

type Rec = { domain: string; trustStatus: string; verificationSource: string; verifiedAt: string; evidence: Record<string, unknown> };

function variants(d: string) {
  const out: string[] = [];
  for (const proto of ["https", "http"]) for (const host of [d, `www.${d}`]) for (const slash of ["", "/"]) out.push(`<${proto}://${host}${slash}>`);
  return out;
}

async function main() {
  const recs = JSON.parse(await fs.readFile(FILE, "utf8")) as Rec[];
  const todo = recs.filter((r) => r.trustStatus !== "VERIFIED_OFFICIAL");
  const query = `SELECT ?site ?item ?itemLabel WHERE { VALUES ?site { ${todo.flatMap((r) => variants(r.domain)).join(" ")} } ?item wdt:P856 ?site . SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }`;
  const res = await fetch("https://query.wikidata.org/sparql", {
    method: "POST",
    headers: { "user-agent": UA, accept: "application/sparql-results+json", "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ query, format: "json" }).toString(),
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) throw new Error(`SPARQL HTTP ${res.status}`);
  const j = (await res.json()) as { results: { bindings: { site: { value: string }; item: { value: string }; itemLabel: { value: string } }[] } };
  const now = new Date().toISOString();
  let n = 0;
  for (const b of j.results.bindings) {
    const host = new URL(b.site.value).hostname.replace(/^www\./, "");
    const r = todo.find((x) => x.domain === host);
    if (!r || r.trustStatus === "VERIFIED_OFFICIAL") continue;
    const id = b.item.value.split("/").pop();
    r.trustStatus = "VERIFIED_OFFICIAL";
    r.verificationSource = `Wikidata ${id} (${b.itemLabel.value}) official website P856 = ${b.site.value} — https://www.wikidata.org/wiki/${id}`;
    r.verifiedAt = now;
    r.evidence = { ...r.evidence, wikidata: { id, label: b.itemLabel.value, officialWebsite: [b.site.value] } };
    n++;
    console.log(`✓ ${r.domain} ← ${id} ${b.itemLabel.value}`);
  }
  await fs.writeFile(FILE, `${JSON.stringify(recs, null, 2)}\n`);
  console.log(`${n} more verified via exact P856 match; ${recs.filter((r) => r.trustStatus !== "VERIFIED_OFFICIAL").length} still unverified.`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
