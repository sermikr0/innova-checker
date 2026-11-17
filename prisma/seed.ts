// Seeds plans, configuration singletons and the Super Admin account.
// Idempotent: safe to run repeatedly. Credentials come only from the environment.
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { DEFAULT_SCANNER_SETTINGS } from "../src/server/scanner/data/defaults";
import { matchRecords, type DomainRecordRef } from "../src/server/scanner/domain-db";
import { domainParts } from "../src/server/scanner/util";
import { guardListing } from "../src/server/threat-intel/guard";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const FULL_FEATURES = [
  "Full URL, domain and DNS analysis",
  "SSL/TLS certificate inspection",
  "Redirect-chain and hidden-destination tracing",
  "Website content and login-form analysis",
  "File download inspection with SHA-256",
  "Threat-intelligence lookups (when configured)",
  "PDF reports and scan history",
];

const PLANS: Prisma.SubscriptionPlanCreateInput[] = [
  { slug: "daily", name: "Daily Full Scan", description: "Full access for a single working day. Ideal for checking a batch of suspicious links.", durationValue: 1, durationUnit: "DAY", priceUzs: 19_000, deviceLimit: 1, sortOrder: 1, features: FULL_FEATURES },
  { slug: "ten-days", name: "10-Day Full Scan", description: "Ten days of complete protection for one employee or workstation.", durationValue: 10, durationUnit: "DAY", priceUzs: 169_000, deviceLimit: 1, sortOrder: 2, features: FULL_FEATURES },
  { slug: "monthly", name: "Monthly Full Scan", description: "A month of full analysis for a small dispatch or sales team.", durationValue: 1, durationUnit: "MONTH", priceUzs: 499_000, deviceLimit: 5, sortOrder: 3, features: FULL_FEATURES },
  { slug: "quarterly", name: "Quarterly Full Scan", description: "Three months of coverage for growing freight and forwarding offices.", durationValue: 3, durationUnit: "MONTH", priceUzs: 1_399_000, deviceLimit: 20, sortOrder: 4, features: FULL_FEATURES },
  { slug: "semi-annual", name: "Semi-Annual Full Scan", description: "Six months of protection for multi-department logistics companies.", durationValue: 6, durationUnit: "MONTH", priceUzs: 2_699_000, deviceLimit: 30, sortOrder: 5, features: FULL_FEATURES },
  { slug: "annual", name: "Annual Full Scan", description: "A full year of protection for the whole company at the best rate.", durationValue: 1, durationUnit: "YEAR", priceUzs: 5_299_000, deviceLimit: 50, sortOrder: 6, isRecommended: true, features: FULL_FEATURES },
];

function validPassword(p: string) {
  return p.length >= 1 && p.length <= 128;
}

async function main() {
  for (const p of PLANS) {
    // Only create: prices edited later in /admin/plans must not be overwritten.
    await prisma.subscriptionPlan.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }
  console.log(`✓ ${PLANS.length} subscription plans present`);

  const d = DEFAULT_SCANNER_SETTINGS;
  await prisma.scannerConfiguration.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      modules: d.modules,
      providers: d.providers,
      weights: d.weights,
      suspiciousKeywords: d.suspiciousKeywords,
      suspiciousTlds: d.suspiciousTlds,
      urlShorteners: d.urlShorteners,
      suspiciousDomainPatterns: d.suspiciousDomainPatterns,
      trustedDomains: d.trustedDomains,
      brandDomains: d.brandDomains as unknown as Prisma.InputJsonValue,
      requestTimeoutMs: d.requestTimeoutMs,
      scanTimeoutMs: d.scanTimeoutMs,
      maxRedirects: d.maxRedirects,
      maxResponseBytes: d.maxResponseBytes,
      maxDownloadBytes: d.maxDownloadBytes,
      userAgent: d.userAgent,
      virusTotalSubmitUnknown: d.virusTotalSubmitUnknown,
    },
  });
  await prisma.pricingConfiguration.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  await prisma.systemSetting.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  console.log("✓ scanner, pricing and system settings present");

  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "";
  const name = process.env.SUPER_ADMIN_NAME?.trim() || "Super Admin";
  const existing = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (existing) {
    // The password only creates the account; it is never re-applied, so it can
    // be removed from the environment after the first run.
    if (existing.role !== "SUPER_ADMIN") await prisma.user.update({ where: { id: existing.id }, data: { role: "SUPER_ADMIN", isActive: true } });
    console.log(`✓ Super Admin ${email} already exists (password unchanged)`);
  } else if (!email || !password) {
    console.warn("! SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set — no Super Admin created.");
  } else if (!validPassword(password)) {
    throw new Error("SUPER_ADMIN_PASSWORD must be 1-128 characters.");
  } else {
    await prisma.user.create({
      data: { email, fullName: name, companyName: "Innova Networks", role: "SUPER_ADMIN", passwordHash: await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 }) },
    });
    console.log(`✓ Super Admin ${email} created`);
  }

  await seedDomainIntelligence();

  if (process.env.SEED_DEMO_DATA === "true") {
    const demoEmail = "demo.dispatcher@example.com";
    const demoPassword = process.env.SEED_DEMO_PASSWORD || `Demo-${crypto.randomBytes(6).toString("base64url")}9`;
    let demo = await prisma.user.findUnique({ where: { email: demoEmail } });
    if (!demo) {
      demo = await prisma.user.create({
        data: { email: demoEmail, fullName: "Demo Dispatcher", companyName: "Silk Road Freight LLC", passwordHash: await hash(demoPassword, { memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 }) },
      });
      const plan = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { slug: "monthly" } });
      const startsAt = new Date();
      const expiresAt = new Date(startsAt);
      expiresAt.setUTCMonth(expiresAt.getUTCMonth() + 1);
      const sub = await prisma.subscription.create({ data: { userId: demo.id, planId: plan.id, status: "ACTIVE", startsAt, expiresAt, deviceLimit: plan.deviceLimit, note: "Seeded demo subscription" } });
      await prisma.subscriptionHistory.create({ data: { subscriptionId: sub.id, userId: demo.id, action: "ASSIGNED", toStatus: "ACTIVE", toPlanName: plan.name, toExpiresAt: expiresAt, note: "Seeded demo subscription" } });
      console.log(`✓ Demo user ${demoEmail} / ${demoPassword} (Monthly plan)`);
    } else {
      console.log(`✓ Demo user ${demoEmail} already exists`);
    }
  }
}

type ResearchRecord = {
  domain: string;
  listType?: "WHITELIST" | "BLACKLIST" | "SUSPICIOUS";
  scope?: "DOMAIN" | "HOST" | "URL";
  status?: "ACTIVE" | "PENDING";
  trustStatus: string;
  platformName?: string | null;
  companyName?: string | null;
  officialUrl?: string | null;
  category?: string | null;
  brandKeywords?: string[];
  verificationSource: string;
  verifiedAt: string;
  notes?: string | null;
};

// Imports researched domain intelligence (prisma/data/*.json). Records first created by
// the seed are refreshed on re-run; records edited by administrators are left alone.
async function seedDomainIntelligence() {
  const dir = path.join(__dirname, "data");
  const whitelist = JSON.parse(fs.readFileSync(path.join(dir, "logistics-whitelist.json"), "utf8")) as ResearchRecord[];
  const threats = JSON.parse(fs.readFileSync(path.join(dir, "threat-domains.json"), "utf8")) as ResearchRecord[];
  const all: ResearchRecord[] = [
    ...whitelist.map((r) => ({
      ...r,
      listType: "WHITELIST" as const,
      scope: "DOMAIN" as const,
      status: r.trustStatus === "VERIFIED_OFFICIAL" ? ("ACTIVE" as const) : ("PENDING" as const),
      trustStatus: r.trustStatus === "VERIFIED_OFFICIAL" ? "VERIFIED_OFFICIAL" : "UNVERIFIED",
    })),
    ...threats,
  ];
  let created = 0;
  let refreshed = 0;
  for (const r of all) {
    const data = {
      scope: r.scope ?? "DOMAIN",
      status: r.status ?? "ACTIVE",
      trustStatus: r.trustStatus as "VERIFIED_OFFICIAL" | "CONFIRMED_MALICIOUS" | "SUSPECTED" | "UNVERIFIED",
      platformName: r.platformName ?? null,
      companyName: r.companyName ?? null,
      officialUrl: r.officialUrl ?? null,
      category: r.category ?? null,
      brandKeywords: r.brandKeywords ?? [],
      verificationSource: r.verificationSource,
      verifiedAt: new Date(r.verifiedAt),
      notes: r.notes ?? null,
    };
    const key = { domain_listType: { domain: r.domain, listType: r.listType as "WHITELIST" | "BLACKLIST" | "SUSPICIOUS" } };
    const existing = await prisma.domainRecord.findUnique({ where: key });
    // A domain moved between lists by research (e.g. suspicious -> blacklist) replaces the seeded entry.
    const moved = await prisma.domainRecord.findMany({ where: { domain: r.domain, origin: "SEED_RESEARCH", NOT: { listType: r.listType } } });
    for (const m of moved) {
      await prisma.domainRecordHistory.create({ data: { recordId: null, domain: m.domain, listType: m.listType, action: "DELETED", changes: { reason: `Reclassified to ${r.listType} by research seed` } } });
      await prisma.domainRecord.delete({ where: { id: m.id } });
    }
    if (!existing) {
      const rec = await prisma.domainRecord.create({ data: { domain: r.domain, listType: r.listType as "WHITELIST", origin: "SEED_RESEARCH", reviewedAt: data.status === "ACTIVE" ? new Date() : null, ...data } });
      await prisma.domainRecordHistory.create({ data: { recordId: rec.id, domain: rec.domain, listType: rec.listType, action: "SEEDED", changes: { source: data.verificationSource } } });
      created++;
    } else if (existing.origin === "SEED_RESEARCH" && existing.status === data.status) {
      // Records later approved or rejected (e.g. by the Innova verified list) keep that decision.
      await prisma.domainRecord.update({ where: { id: existing.id }, data });
      refreshed++;
    }
  }
  console.log(`✓ domain intelligence: ${created} created, ${refreshed} refreshed (${all.length} researched records)`);
  await seedInnovaVerifiedList();
}

// Overlays the Innova Networks verified logistics list, which the CISO declared
// authoritative: its whitelist and blacklist entries are active immediately.
async function seedInnovaVerifiedList() {
  const file = path.join(__dirname, "data", "innova-verified-list.json");
  if (!fs.existsSync(file)) return;
  const data = JSON.parse(fs.readFileSync(file, "utf8")) as { neverTrust: string[]; records: (ResearchRecord & { listType: "WHITELIST" | "BLACKLIST" | "SUSPICIOUS"; scope: "DOMAIN" | "HOST" | "URL"; status: "ACTIVE" })[] };
  let created = 0;
  let activated = 0;
  for (const r of data.records) {
    const key = { domain_listType: { domain: r.domain, listType: r.listType } };
    const existing = await prisma.domainRecord.findUnique({ where: key });
    if (!existing) {
      const rec = await prisma.domainRecord.create({
        data: { domain: r.domain, listType: r.listType, scope: r.scope, status: "ACTIVE", trustStatus: r.trustStatus as "VERIFIED_OFFICIAL", platformName: r.platformName ?? null, officialUrl: r.officialUrl ?? null, category: r.category ?? null, brandKeywords: r.brandKeywords ?? [], verificationSource: r.verificationSource, verifiedAt: new Date(r.verifiedAt), notes: r.notes ?? null, origin: "INNOVA_LIST", reviewedAt: new Date() },
      });
      await prisma.domainRecordHistory.create({ data: { recordId: rec.id, domain: rec.domain, listType: rec.listType, action: "SEEDED", changes: { source: r.verificationSource } } });
      created++;
    } else if (existing.origin === "SEED_RESEARCH" && existing.listType === "WHITELIST" && existing.status !== "ACTIVE") {
      // Researched but unverified (pending) entries become active on the CISO's list.
      await prisma.domainRecord.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", trustStatus: "VERIFIED_OFFICIAL", verificationSource: `${r.verificationSource}. Earlier automated research: ${existing.verificationSource ?? "no independent source found"}`, verifiedAt: new Date(r.verifiedAt), brandKeywords: [...new Set([...existing.brandKeywords, ...(r.brandKeywords ?? [])])], reviewedAt: new Date() },
      });
      await prisma.domainRecordHistory.create({ data: { recordId: existing.id, domain: existing.domain, listType: existing.listType, action: "APPROVED", changes: { by: "Innova Networks verified list" } } });
      activated++;
    } else if (existing.origin === "SEED_RESEARCH" && existing.listType === "WHITELIST" && !(existing.notes ?? "").includes("Innova Networks verified list")) {
      await prisma.domainRecord.update({ where: { id: existing.id }, data: { notes: [existing.notes, "Also on the Innova Networks verified logistics list."].filter(Boolean).join(" · "), brandKeywords: [...new Set([...existing.brandKeywords, ...(r.brandKeywords ?? [])])] } });
    }
  }
  // "Still do not add" / "What not to whitelist": never active in the whitelist.
  const rejected = await prisma.domainRecord.findMany({ where: { listType: "WHITELIST", domain: { in: data.neverTrust }, status: "ACTIVE", origin: { in: ["SEED_RESEARCH", "INNOVA_LIST"] } } });
  for (const r of rejected) {
    await prisma.domainRecord.update({ where: { id: r.id }, data: { status: "REJECTED", notes: [r.notes, "Rejected by the Innova Networks list ('Still do not add' / 'What not to whitelist'), e.g. defunct company whose name can be resold, or a domain that hosts user content."].filter(Boolean).join(" · ") } });
    await prisma.domainRecordHistory.create({ data: { recordId: r.id, domain: r.domain, listType: r.listType, action: "REJECTED", changes: { by: "Innova Networks verified list" } } });
  }
  console.log(`✓ Innova verified list: ${created} created, ${activated} pending research entries activated, ${rejected.length} rejected (${data.records.length} records)`);
  await seedDnsAllowlist();
  await seedAuditWhitelist();
  await seedLogisticsThreats();
}

// DNS boxes allowlist (2026-11-12): clean names trusted, tenants pinned to exact hosts,
// problems flagged. Hosts already covered by an active whitelist record are skipped.
// Carrier-owned domains verified during false-positive audits
// (prisma/data/audit-whitelist-*.json). They also keep the threat feeds from
// ever re-listing these domains.
async function seedAuditWhitelist() {
  const dir = path.join(process.cwd(), "prisma", "data");
  let created = 0;
  for (const file of fs.readdirSync(dir).filter((f) => /^audit-whitelist-.*\.json$/.test(f))) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")) as { records: { domain: string; platformName: string; companyName: string; officialUrl: string; evidence: string }[] };
    for (const v of data.records) {
      if (await prisma.domainRecord.findUnique({ where: { domain_listType: { domain: v.domain, listType: "WHITELIST" } } })) continue;
      await prisma.domainRecord.deleteMany({ where: { domain: v.domain, listType: { in: ["BLACKLIST", "SUSPICIOUS"] } } });
      const rec = await prisma.domainRecord.create({ data: { domain: v.domain, listType: "WHITELIST", scope: "DOMAIN", status: "ACTIVE", trustStatus: "VERIFIED_OFFICIAL", platformName: v.platformName, companyName: v.companyName, officialUrl: v.officialUrl, category: "Postal / parcel carrier", verificationSource: v.evidence, verifiedAt: new Date(), origin: "AUDIT", reviewedAt: new Date() } });
      await prisma.domainRecordHistory.create({ data: { recordId: rec.id, domain: rec.domain, listType: "WHITELIST", action: "SEEDED", changes: { source: v.evidence, file } } });
      created++;
    }
  }
  console.log(`✓ Audit whitelist: ${created} created`);
}

// Logistics-themed phishing collected from public threat feeds by
// scripts/research/collect-logistics-threats.ts. Existing records (including
// admin edits) and whitelisted domains are never overwritten.
async function seedLogisticsThreats() {
  const dir = path.join(process.cwd(), "prisma", "data");
  const files = fs.readdirSync(dir).filter((f) => /^logistics-threats-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  let created = 0;
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")) as { records: { domain: string; scope: "DOMAIN" | "HOST"; listType: "BLACKLIST" | "SUSPICIOUS"; trustStatus: "CONFIRMED_MALICIOUS" | "SUSPECTED"; brand: string; category: string; sources: string[]; sourceUrls: string[]; sampleHosts: string[]; firstSeen: string | null; fetchedAt: string }[] };
    const known = new Set((await prisma.domainRecord.findMany({ where: { domain: { in: data.records.map((r) => r.domain) } }, select: { domain: true } })).map((r) => r.domain));
    const reg = (d: string) => domainParts(d).registrable ?? d;
    const hostsPerReg = new Map<string, number>();
    for (const r of data.records) hostsPerReg.set(reg(r.domain), (hostsPerReg.get(reg(r.domain)) ?? 0) + 1);
    for (const r of data.records) {
      if (known.has(r.domain)) continue;
      // Same false-positive guard as the daily collector (popular, government sites).
      if (guardListing({ domain: r.domain, scope: r.scope }, hostsPerReg.get(reg(r.domain)) ?? 0).action === "drop") continue;
      const verifiedAt = new Date(r.fetchedAt);
      const rec = await prisma.domainRecord.create({
        data: {
          domain: r.domain,
          listType: r.listType,
          scope: r.scope,
          status: "ACTIVE",
          trustStatus: r.trustStatus,
          platformName: r.brand,
          category: r.category,
          verificationSource: `${r.sources.join("; ")} (${r.sourceUrls.join(" ")})`,
          verifiedAt,
          notes: `Impersonates ${r.brand}. Listed as phishing by: ${r.sources.join(", ")}${r.firstSeen ? `; first listed ${r.firstSeen.slice(0, 10)}` : ""}. Seen as: ${r.sampleHosts.join(", ")}`.slice(0, 1000),
          origin: "THREAT_RESEARCH",
          reviewedAt: verifiedAt,
          expiresAt: new Date(verifiedAt.getTime() + 365 * 86_400_000),
        },
      });
      await prisma.domainRecordHistory.create({ data: { recordId: rec.id, domain: rec.domain, listType: rec.listType, action: "SEEDED", changes: { source: r.sources, file } } });
      created++;
    }
  }
  console.log(`✓ Logistics threat research: ${created} new records`);
}

async function seedDnsAllowlist() {
  const file = path.join(__dirname, "data", "innova-dns-allowlist.json");
  if (!fs.existsSync(file)) return;
  const data = JSON.parse(fs.readFileSync(file, "utf8")) as { records: (ResearchRecord & { listType: "WHITELIST" | "SUSPICIOUS"; scope: "DOMAIN" | "HOST"; status: "ACTIVE" | "PENDING" })[] };
  const active = await prisma.domainRecord.findMany({ where: { status: "ACTIVE", listType: "WHITELIST" } });
  const refs: DomainRecordRef[] = active.map((r) => ({ id: r.id, domain: r.domain, listType: r.listType, scope: r.scope, trustStatus: r.trustStatus, platformName: r.platformName, companyName: r.companyName, category: r.category, officialUrl: r.officialUrl, verificationSource: r.verificationSource, verifiedAt: null, notes: r.notes }));
  let created = 0;
  let covered = 0;
  for (const r of data.records) {
    if (r.listType === "WHITELIST" && r.status === "ACTIVE" && matchRecords(`https://${r.domain}/`, refs).length) {
      covered++;
      continue;
    }
    const exists = await prisma.domainRecord.findUnique({ where: { domain_listType: { domain: r.domain, listType: r.listType } } });
    if (exists) continue;
    // A suspicious finding wins over a whitelist entry for the same name.
    if (r.listType === "SUSPICIOUS") await prisma.domainRecord.updateMany({ where: { domain: r.domain, listType: "WHITELIST", origin: "INNOVA_DNS" }, data: { status: "REJECTED" } });
    const rec = await prisma.domainRecord.create({
      data: { domain: r.domain, listType: r.listType, scope: r.scope, status: r.status, trustStatus: r.trustStatus as "VERIFIED_OFFICIAL", platformName: r.platformName ?? null, officialUrl: `https://${r.domain}/`, category: r.category ?? null, brandKeywords: [], verificationSource: r.verificationSource, verifiedAt: new Date(r.verifiedAt), notes: r.notes ?? null, origin: "INNOVA_DNS", reviewedAt: r.status === "ACTIVE" ? new Date() : null },
    });
    await prisma.domainRecordHistory.create({ data: { recordId: rec.id, domain: rec.domain, listType: rec.listType, action: "SEEDED", changes: { source: r.verificationSource } } });
    created++;
  }
  console.log(`✓ DNS boxes allowlist: ${created} created, ${covered} already covered by the whitelist (${data.records.length} records)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
