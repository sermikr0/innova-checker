import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "../db";
import { normalizeRecordDomain } from "../scanner/domain-db";
import { DEFAULT_BRANDS } from "../scanner/data/defaults";
import { domainParts } from "../scanner/util";
import { genericLureLooksMalicious, isBrandRule, listingFor, matchLogistics, type Listing } from "./logistics";
import { guardListing, officialLooking, ownedByBrand } from "./guard";
import { SOURCES, type Source } from "./sources";

// Daily threat-intelligence collection (scheduler / cron / admin button).
//
//   curated sources    → BLACKLIST, CONFIRMED_MALICIOUS, every entry
//   aggregator sources → SUSPICIOUS, SUSPECTED, logistics-themed entries only
//                        (BLACKLIST when a curated source lists them too)
//   newly registered   → SUSPICIOUS, SUSPECTED, look-alikes of a named logistics brand
//
// Records carry origin FEED:<source>, are refreshed on every run while a
// source still lists them, and are deleted once they expire. Whitelisted
// domains and records created by admins or seeds are never modified.

const DAY = 86_400_000;
const EXPIRY_DAYS: Record<Source["kind"], number> = { curated: 14, aggregator: 30, nrd: 60 };
const PRIORITY = SOURCES.map((s) => s.id);

type Draft = {
  listing: Listing;
  listType: "BLACKLIST" | "SUSPICIOUS";
  sources: Set<string>;
  kind: Source["kind"];
  brand?: string;
  category: string;
  firstSeen?: string;
  sample?: string;
};

export type CollectProgress = (p: Record<string, unknown>) => void | Promise<void>;

export async function collectThreatIntel(onProgress?: CollectProgress) {
  const now = new Date();
  const summary: Record<string, unknown> = { startedAt: now.toISOString() };

  const whitelist = await prisma.domainRecord.findMany({ where: { listType: "WHITELIST", status: { in: ["ACTIVE", "PENDING"] } }, select: { domain: true } });
  const official = new Set([...whitelist.map((w) => w.domain), ...DEFAULT_BRANDS.flatMap((b) => b.domains)]);
  const isOfficial = (h: string) => {
    const labels = h.split(".");
    for (let i = 0; i < labels.length - 1; i++) if (official.has(labels.slice(i).join("."))) return true;
    return false;
  };

  // 1. Download every source independently; one failure never stops the run.
  const perSource: Record<string, unknown> = {};
  const drafts = new Map<string, Draft>();
  let done = 0;
  await Promise.all(
    SOURCES.map(async (src) => {
      let items;
      try {
        items = await src.fetch();
      } catch (e) {
        perSource[src.id] = { error: (e as Error).message };
        return;
      }
      let kept = 0;
      for (const it of items) {
        const logistics = matchLogistics(it.host);
        if (src.kind === "aggregator" && (!logistics || (!isBrandRule(logistics.rule) && !genericLureLooksMalicious(it.host)))) continue;
        if (src.kind === "nrd" && !(logistics && logistics.inRegistrable && isBrandRule(logistics.rule))) continue;
        let listing = listingFor(it.host, { url: it.url, brandInRegistrable: logistics?.inRegistrable, isOfficial });
        if (!listing) continue;
        try {
          listing = { ...listing, domain: normalizeRecordDomain(listing.domain, listing.scope) };
        } catch {
          continue;
        }
        if (listing.scope !== "URL" && isOfficial(listing.domain)) continue;
        const listType = src.kind === "curated" ? "BLACKLIST" : "SUSPICIOUS";
        const key = `${listing.scope}|${listing.domain}`;
        const d = drafts.get(key);
        if (d) {
          d.sources.add(src.id);
          if (listType === "BLACKLIST") d.listType = "BLACKLIST";
          if (src.kind === "curated" && d.kind !== "curated") {
            d.kind = "curated";
            d.category = logistics ? d.category : src.category;
          }
          if (it.seen && (!d.firstSeen || it.seen < d.firstSeen)) d.firstSeen = it.seen;
          d.brand ??= logistics?.rule.brand ?? it.target;
        } else {
          drafts.set(key, {
            listing,
            listType,
            sources: new Set([src.id]),
            kind: src.kind,
            brand: logistics?.rule.brand ?? it.target,
            category: logistics ? (logistics.rule.group === "freight" ? "Freight & trucking phishing" : "Postal / parcel delivery phishing") : src.category,
            firstSeen: it.seen,
            sample: it.url ?? it.host,
          });
        }
        kept++;
      }
      perSource[src.id] = { received: items.length, kept };
      done++;
      await onProgress?.({ phase: `downloaded ${done}/${SOURCES.length} sources`, done, total: SOURCES.length });
    }),
  );
  summary.sources = perSource;

  // Two independent aggregators agreeing are enough for the blacklist.
  for (const d of drafts.values()) if (d.listType === "SUSPICIOUS" && d.kind === "aggregator" && d.sources.size >= 2) d.listType = "BLACKLIST";

  // 2. False-positive guard: popular sites, government domains and carrier-owned
  //    domains are never listed, and any earlier feed record for them is removed.
  const regOf = (d: Draft) => (d.listing.scope === "URL" ? "" : (domainParts(d.listing.domain).registrable ?? d.listing.domain));
  const hostsPerReg = new Map<string, Set<string>>();
  for (const d of drafts.values()) if (d.listing.scope !== "URL") (hostsPerReg.get(regOf(d)) ?? hostsPerReg.set(regOf(d), new Set()).get(regOf(d))!).add(d.listing.domain);
  const purge = new Set<string>();
  const guardReasons: Record<string, number> = {};
  for (const [key, d] of drafts) {
    const v = guardListing(d.listing, hostsPerReg.get(regOf(d))?.size ?? 0);
    if (v.action === "drop") {
      const reason = v.reason.replace(/ \(rank \d+\)/, "");
      guardReasons[reason] = (guardReasons[reason] ?? 0) + 1;
      purge.add(d.listing.domain);
      drafts.delete(key);
    }
  }
  const candidatesToVerify = [...new Set([...drafts.values()].filter((d) => d.listing.scope !== "URL" && officialLooking(regOf(d))).map(regOf))];
  let brandOwned = 0;
  await pool(candidatesToVerify, 8, async (reg) => {
    const cacheKey = `brandcert:${reg}`;
    const cached = await prisma.intelCache.findUnique({ where: { key: cacheKey } });
    let owned = cached && cached.expiresAt > now ? (cached.value as { owned: boolean }).owned : null;
    if (owned === null) {
      const r = await ownedByBrand(reg).catch(() => ({ owned: false, organisation: null }));
      owned = r.owned;
      await prisma.intelCache.upsert({ where: { key: cacheKey }, create: { key: cacheKey, value: r, expiresAt: new Date(now.getTime() + 30 * DAY) }, update: { value: r, expiresAt: new Date(now.getTime() + 30 * DAY) } });
    }
    if (!owned) return;
    brandOwned++;
    for (const [key, d] of drafts) {
      if (regOf(d) === reg) {
        purge.add(d.listing.domain);
        drafts.delete(key);
      }
    }
  });
  const purged = purge.size ? (await prisma.domainRecord.deleteMany({ where: { domain: { in: [...purge] }, listType: { in: ["BLACKLIST", "SUSPICIOUS"] }, OR: [{ origin: { startsWith: "FEED:" } }, { origin: "THREAT_RESEARCH" }] } })).count : 0;
  summary.guard = { dropped: guardReasons, brandOwnedDomains: brandOwned, existingRecordsRemoved: purged };

  // 3. Compare with what is already stored.
  const all = [...drafts.values()];
  const domains = [...new Set(all.map((d) => d.listing.domain))];
  const existing = new Map<string, { id: string; listType: string; origin: string }[]>();
  for (let i = 0; i < domains.length; i += 10_000) {
    const rows = await prisma.domainRecord.findMany({ where: { domain: { in: domains.slice(i, i + 10_000) } }, select: { id: true, domain: true, listType: true, origin: true } });
    for (const r of rows) existing.set(r.domain, [...(existing.get(r.domain) ?? []), r]);
    await onProgress?.({ phase: "comparing with the database", done: Math.min(i + 10_000, domains.length), total: domains.length });
  }

  const create: Prisma.DomainRecordCreateManyInput[] = [];
  const refresh = new Map<number, string[]>();
  const demote: string[] = [];
  let skippedWhitelisted = 0;
  let keptManual = 0;
  for (const d of all) {
    const rows = existing.get(d.listing.domain) ?? [];
    if (rows.some((r) => r.listType === "WHITELIST")) {
      skippedWhitelisted++;
      continue;
    }
    const expiryDays = d.listType === "BLACKLIST" ? EXPIRY_DAYS.curated : EXPIRY_DAYS[d.kind];
    const same = rows.find((r) => r.listType === d.listType);
    if (same) {
      if (same.origin.startsWith("FEED:")) refresh.set(expiryDays, [...(refresh.get(expiryDays) ?? []), same.id]);
      else keptManual++;
      continue;
    }
    if (d.listType === "SUSPICIOUS" && rows.some((r) => r.listType === "BLACKLIST")) continue;
    if (d.listType === "BLACKLIST") for (const r of rows) if (r.listType === "SUSPICIOUS" && r.origin.startsWith("FEED:")) demote.push(r.id);
    const sources = [...d.sources].sort((a, b) => PRIORITY.indexOf(a) - PRIORITY.indexOf(b));
    const names = sources.map((id) => SOURCES.find((s) => s.id === id)!.name);
    create.push({
      domain: d.listing.domain,
      listType: d.listType,
      scope: d.listing.scope,
      status: "ACTIVE",
      trustStatus: d.listType === "BLACKLIST" ? "CONFIRMED_MALICIOUS" : "SUSPECTED",
      platformName: d.brand?.slice(0, 120) ?? null,
      category: d.category,
      verificationSource: names.join("; "),
      verifiedAt: now,
      notes: `${d.brand ? `Impersonates ${d.brand}. ` : ""}Listed by: ${names.join(", ")}${d.firstSeen ? `; first listed ${d.firstSeen.slice(0, 10)}` : ""}. Seen as: ${d.sample}`.slice(0, 1000),
      origin: `FEED:${sources[0]}`,
      reviewedAt: now,
      expiresAt: new Date(now.getTime() + expiryDays * DAY),
    });
  }

  // 4. Write in bulk.
  let created = 0;
  for (let i = 0; i < create.length; i += 2000) {
    created += (await prisma.domainRecord.createMany({ data: create.slice(i, i + 2000), skipDuplicates: true })).count;
    await onProgress?.({ phase: "saving new records", done: Math.min(i + 2000, create.length), total: create.length });
  }
  let refreshed = 0;
  for (const [days, ids] of refresh) {
    for (let i = 0; i < ids.length; i += 10_000) {
      refreshed += (await prisma.domainRecord.updateMany({ where: { id: { in: ids.slice(i, i + 10_000) } }, data: { expiresAt: new Date(now.getTime() + days * DAY), verifiedAt: now } })).count;
    }
  }
  const promoted = demote.length ? (await prisma.domainRecord.deleteMany({ where: { id: { in: demote } } })).count : 0;
  const expired = (await prisma.domainRecord.deleteMany({ where: { origin: { startsWith: "FEED:" }, expiresAt: { lt: now } } })).count;

  Object.assign(summary, {
    candidates: all.length,
    created,
    createdBlacklist: create.filter((c) => c.listType === "BLACKLIST").length,
    createdSuspicious: create.filter((c) => c.listType === "SUSPICIOUS").length,
    refreshed,
    promotedFromSuspicious: promoted,
    expiredRemoved: expired,
    skippedWhitelisted,
    keptManualRecords: keptManual,
    finishedAt: new Date().toISOString(),
  });
  return summary;
}

async function pool<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}
