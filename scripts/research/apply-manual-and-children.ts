// Applies manually researched evidence (scripts/research/manual-evidence.json), then
// re-runs the parent checks (redirect + shared nameservers, or link from the parent's
// official site) for candidates whose parent is now verified.
import fs from "node:fs/promises";
import path from "node:path";
import { promises as dns } from "node:dns";

const ROOT = path.join(__dirname, "..", "..");
const FILE = path.join(ROOT, "prisma/data/logistics-whitelist.json");
const UA = "InnovaChecker-DomainResearch/1.0 (+https://innovanetworks.uz; security research)";
type Rec = { domain: string; trustStatus: string; verificationSource: string; verifiedAt: string; officialUrl: string; evidence: Record<string, unknown> };
type Cand = { domain: string; parent?: string };

const PARENTS: Record<string, { parent: string; pages?: string[] }> = {
  "gohighway.com": { parent: "highway.com" },
  "rmissecure.com": { parent: "truckstop.com", pages: ["https://truckstop.com/", "https://truckstop.com/product/carrier-onboarding/", "https://truckstop.com/product/rmis/"] },
  "mycarrierpackets.com": { parent: "dat.com", pages: ["https://www.dat.com/", "https://www.dat.com/carrier-onboarding"] },
  "efsllc.com": { parent: "wexinc.com", pages: ["https://www.wexinc.com/", "https://www.wexinc.com/products/fleet/efs/"] },
  "navisphere.com": { parent: "chrobinson.com", pages: ["https://www.chrobinson.com/en-us/", "https://www.chrobinson.com/en-us/carriers/"] },
};

const ns = async (d: string) => {
  try {
    return (await dns.resolveNs(d)).map((x) => x.toLowerCase()).sort();
  } catch {
    return [];
  }
};

async function fetchText(u: string): Promise<{ text: string; finalUrl: string } | null> {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA }, redirect: "follow", signal: AbortSignal.timeout(25000) });
    return { text: (await r.text()).slice(0, 1_000_000), finalUrl: r.url };
  } catch {
    return null;
  }
}

async function main() {
  const recs = JSON.parse(await fs.readFile(FILE, "utf8")) as Rec[];
  const cands = JSON.parse(await fs.readFile(path.join(ROOT, "prisma/data/logistics-candidates.json"), "utf8")) as Cand[];
  const manual = JSON.parse(await fs.readFile(path.join(__dirname, "manual-evidence.json"), "utf8")) as { domain: string; source: string }[];
  const now = new Date().toISOString();
  const by = new Map(recs.map((r) => [r.domain, r]));

  for (const m of manual) {
    const r = by.get(m.domain);
    if (!r || r.trustStatus === "VERIFIED_OFFICIAL") continue;
    r.trustStatus = "VERIFIED_OFFICIAL";
    r.verificationSource = m.source;
    r.verifiedAt = now;
    r.evidence = { ...r.evidence, manual: m.source };
    console.log(`✓ ${m.domain} (manual research)`);
  }

  for (const [domain, cfg] of Object.entries(PARENTS)) {
    const r = by.get(domain);
    const p = by.get(cfg.parent);
    if (!r || r.trustStatus === "VERIFIED_OFFICIAL" || !p || p.trustStatus !== "VERIFIED_OFFICIAL") continue;
    const [childNs, parentNs] = await Promise.all([ns(domain), ns(cfg.parent)]);
    const live = await fetchText(`https://${domain}/`);
    const finalHost = live ? new URL(live.finalUrl).hostname.replace(/^www\./, "") : "";
    const redirect = finalHost === cfg.parent || finalHost.endsWith(`.${cfg.parent}`);
    const sharedNs = childNs.length > 0 && childNs.join() === parentNs.join();
    let linkedFrom: string | null = null;
    for (const page of cfg.pages ?? [`https://${cfg.parent}/`]) {
      const t = await fetchText(page);
      if (t && new RegExp(`//([a-z0-9-]+\\.)*${domain.replace(/\./g, "\\.")}`, "i").test(t.text) && new URL(t.finalUrl).hostname.replace(/^www\./, "").endsWith(cfg.parent)) {
        linkedFrom = t.finalUrl;
        break;
      }
    }
    if (redirect && sharedNs) {
      r.trustStatus = "VERIFIED_OFFICIAL";
      r.verificationSource = `Redirects to verified official ${cfg.parent} (https://${domain}/ → ${live?.finalUrl}) and uses identical authoritative nameservers (${childNs.join(", ")}). Parent evidence: ${p.verificationSource.split(" — ")[0]}`;
    } else if (linkedFrom) {
      r.trustStatus = "VERIFIED_OFFICIAL";
      r.verificationSource = `Linked from the verified official website ${linkedFrom}. Parent evidence: ${p.verificationSource.split(" — ")[0]}`;
    }
    if (r.trustStatus === "VERIFIED_OFFICIAL") r.verifiedAt = now;
    r.evidence = { ...r.evidence, parentCheck: { parent: cfg.parent, redirect, sharedNs, childNs, parentNs, linkedFrom } };
    console.log(`${r.trustStatus === "VERIFIED_OFFICIAL" ? "✓" : "·"} ${domain} parent=${cfg.parent} redirect=${redirect} sharedNS=${sharedNs} linked=${linkedFrom ?? "no"}`);
  }
  void cands;
  await fs.writeFile(FILE, `${JSON.stringify(recs, null, 2)}\n`);
  const v = recs.filter((r) => r.trustStatus === "VERIFIED_OFFICIAL").length;
  console.log(`${v}/${recs.length} verified. Unverified: ${recs.filter((r) => r.trustStatus !== "VERIFIED_OFFICIAL").map((r) => r.domain).join(", ")}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
