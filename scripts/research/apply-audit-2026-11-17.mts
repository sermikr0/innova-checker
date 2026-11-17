// One-time cleanup from the 2026-11-17 false-positive audit: removes records the
// popularity/government guard rejects, removes carrier-owned and unproven
// domains, and whitelists carrier-owned domains with their evidence.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const ids = readFileSync(process.argv[2], "utf8").split("\n").map((s) => s.trim()).filter(Boolean);
const extra = ["dhlexpress.hu", "dhlexpress.ro", "coscofreight.com"];
const verified = JSON.parse(readFileSync("prisma/data/audit-whitelist-2026-11-17.json", "utf8")) as { records: { domain: string; platformName: string; companyName: string; officialUrl: string; evidence: string }[] };

const removeDomains = [...extra, ...verified.records.map((v) => v.domain)];
const targets = await prisma.domainRecord.findMany({ where: { OR: [{ id: { in: ids } }, { domain: { in: removeDomains }, listType: { in: ["BLACKLIST", "SUSPICIOUS"] } }] } });
for (let i = 0; i < targets.length; i += 500) {
  const chunk = targets.slice(i, i + 500);
  await prisma.domainRecordHistory.createMany({ data: chunk.map((t) => ({ recordId: null, domain: t.domain, listType: t.listType, action: "DELETED", changes: { reason: "False-positive audit 2026-11-17: popular, government or carrier-owned site", origin: t.origin } })) });
  await prisma.domainRecord.deleteMany({ where: { id: { in: chunk.map((t) => t.id) } } });
}
let whitelisted = 0;
for (const v of verified.records) {
  const exists = await prisma.domainRecord.findUnique({ where: { domain_listType: { domain: v.domain, listType: "WHITELIST" } } });
  if (exists) continue;
  const rec = await prisma.domainRecord.create({ data: { domain: v.domain, listType: "WHITELIST", scope: "DOMAIN", status: "ACTIVE", trustStatus: "VERIFIED_OFFICIAL", platformName: v.platformName, companyName: v.companyName, officialUrl: v.officialUrl, category: "Postal / parcel carrier", verificationSource: v.evidence, verifiedAt: new Date(), origin: "AUDIT", reviewedAt: new Date(), notes: "Carrier-owned domain found on third-party threat lists; verified during the 2026-11-17 false-positive audit." } });
  await prisma.domainRecordHistory.create({ data: { recordId: rec.id, domain: rec.domain, listType: "WHITELIST", action: "SEEDED", changes: { source: v.evidence } } });
  whitelisted++;
}
console.log(`removed ${targets.length} records (${targets.filter((t) => t.listType === "BLACKLIST").length} blacklist, ${targets.filter((t) => t.listType === "SUSPICIOUS").length} suspicious); whitelisted ${whitelisted}`);
await prisma.$disconnect();
