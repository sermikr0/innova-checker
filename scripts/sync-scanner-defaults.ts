// Merges new built-in scanner defaults (brands, keywords, TLDs, shorteners, patterns)
// into the database configuration without removing anything an administrator added.
// Usage: npm run scanner:sync-defaults
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { DEFAULT_SCANNER_SETTINGS as D } from "../src/server/scanner/data/defaults";
import type { BrandProfile } from "../src/server/scanner/types";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const union = (a: string[], b: string[]) => [...new Set([...a, ...b])];

async function main() {
  const row = await prisma.scannerConfiguration.findUnique({ where: { id: "default" } });
  if (!row) {
    console.log("No scanner configuration yet; run `npm run db:seed` first.");
    return;
  }
  const brands = (Array.isArray(row.brandDomains) ? row.brandDomains : []) as unknown as BrandProfile[];
  const byName = new Map(brands.map((b) => [b.brand.toLowerCase(), b]));
  let added = 0;
  for (const def of D.brandDomains) {
    const cur = byName.get(def.brand.toLowerCase());
    if (!cur) {
      byName.set(def.brand.toLowerCase(), def);
      added++;
    } else {
      cur.keywords = union(cur.keywords, def.keywords);
      // Domains removed from the defaults (user-content platforms) are dropped too.
      cur.domains = union(cur.domains, def.domains).filter((d) => !["amazonaws.com", "googleusercontent.com", "sharepoint.com", "onedrive.live.com", "dropboxusercontent.com"].includes(d));
    }
  }
  await prisma.scannerConfiguration.update({
    where: { id: "default" },
    data: {
      brandDomains: [...byName.values()] as unknown as Prisma.InputJsonValue,
      suspiciousKeywords: union(row.suspiciousKeywords, D.suspiciousKeywords),
      suspiciousTlds: union(row.suspiciousTlds, D.suspiciousTlds),
      urlShorteners: union(row.urlShorteners, D.urlShorteners),
      suspiciousDomainPatterns: union(row.suspiciousDomainPatterns, D.suspiciousDomainPatterns),
      trustedDomains: union(row.trustedDomains, D.trustedDomains),
    },
  });
  console.log(`✓ Scanner defaults merged (${added} new brand profiles).`);
}

main().finally(() => prisma.$disconnect());
