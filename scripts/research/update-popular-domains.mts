// Builds prisma/data/popular-domains.txt ("rank,registrable" for the 200k most
// popular registrable domains) from the Tranco and Cisco Umbrella top-1M lists.
// The threat-intel guard uses it to keep popular sites off the blacklist.
// Usage: npx tsx scripts/research/update-popular-domains.ts
import { writeFileSync } from "node:fs";
import { domainParts } from "../../src/server/scanner/util";
import { unzipFirst } from "../../src/server/threat-intel/sources";
import { POPULAR_LIMIT } from "../../src/server/threat-intel/guard";

async function list(url: string): Promise<string[]> {
  const res = await fetch(url, { signal: AbortSignal.timeout(180_000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return unzipFirst(Buffer.from(await res.arrayBuffer())).toString("utf8").split(/\r?\n/);
}

const best = new Map<string, number>();
for (const url of ["https://tranco-list.eu/top-1m.csv.zip", "https://s3-us-west-1.amazonaws.com/umbrella-static/top-1m.csv.zip"]) {
  for (const line of await list(url)) {
    const [r, d] = line.trim().split(",");
    if (!d) continue;
    const reg = domainParts(d.toLowerCase()).registrable;
    if (reg && Number(r) < (best.get(reg) ?? Infinity)) best.set(reg, Number(r));
  }
}
const top = [...best.entries()].sort((a, b) => a[1] - b[1]).slice(0, POPULAR_LIMIT);
writeFileSync("prisma/data/popular-domains.txt", `${top.map(([d, r]) => `${r},${d}`).join("\n")}\n`);
console.log(`✓ prisma/data/popular-domains.txt: ${top.length} domains`);
