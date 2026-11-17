// Stores a provider API key from a file in the database (encrypted), so the plaintext
// file can be deleted. Usage: npx tsx scripts/import-provider-key.ts virusTotal ./virustotal.txt
import "dotenv/config";
import fs from "node:fs";
import crypto from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const [provider, file] = process.argv.slice(2);
const PROVIDERS = ["googleSafeBrowsing", "virusTotal", "urlhaus", "phishTank", "abuseIpdb"];
if (!PROVIDERS.includes(provider) || !file) {
  console.error(`usage: tsx scripts/import-provider-key.ts <${PROVIDERS.join("|")}> <file>`);
  process.exit(2);
}
const key = fs.readFileSync(file, "utf8").trim();
if (!/^[A-Za-z0-9_\-.:]{16,200}$/.test(key)) {
  console.error("The file does not contain a single API key.");
  process.exit(1);
}
const secret = process.env.SECRETS_ENCRYPTION_KEY
  ? Buffer.from(process.env.SECRETS_ENCRYPTION_KEY, "hex")
  : Buffer.from(crypto.hkdfSync("sha256", process.env.IP_HASH_SECRET ?? "", "innova-checker", "provider-credentials", 32));
const iv = crypto.randomBytes(12);
const c = crypto.createCipheriv("aes-256-gcm", secret, iv);
const ct = Buffer.concat([c.update(key, "utf8"), c.final()]);
const ciphertext = `v1:${Buffer.concat([iv, c.getAuthTag(), ct]).toString("base64")}`;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
prisma.providerCredential
  .upsert({ where: { provider }, update: { ciphertext, keyHint: key.slice(-4), quota: undefined, quotaCheckedAt: null }, create: { provider, ciphertext, keyHint: key.slice(-4) } })
  .then(() => console.log(`✓ ${provider} key ••••${key.slice(-4)} stored encrypted. You can now delete ${file}.`))
  .finally(() => prisma.$disconnect());
