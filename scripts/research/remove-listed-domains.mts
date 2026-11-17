// Removes domains from the blacklist / suspicious list with a history entry.
// Usage: npx tsx scripts/research/remove-listed-domains.mts <domains.json> "<reason>"
import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const [file, reason] = process.argv.slice(2);
if (!file || !reason) throw new Error("usage: remove-listed-domains.mts <domains.json> <reason>");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const domains: string[] = JSON.parse(readFileSync(file, "utf8"));
const rows = await prisma.domainRecord.findMany({ where: { domain: { in: domains }, listType: { in: ["BLACKLIST", "SUSPICIOUS"] } } });
await prisma.domainRecordHistory.createMany({ data: rows.map((r) => ({ recordId: null, domain: r.domain, listType: r.listType, action: "DELETED", changes: { reason, origin: r.origin } })) });
const del = await prisma.domainRecord.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
console.log(`removed ${del.count}: ${rows.map((r) => `${r.domain}(${r.listType})`).join(", ")}`);
await prisma.$disconnect();
