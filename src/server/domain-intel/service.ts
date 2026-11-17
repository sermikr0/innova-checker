import { promises as dnsp } from "node:dns";
import type { DomainListType, DomainMatchScope, DomainRecordStatus, DomainTrustStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "../db";
import { lookupKeys, matchRecords, normalizeRecordDomain, type DomainDbLookup, type DomainRecordRef } from "../scanner/domain-db";
import type { BrandProfile } from "../scanner/types";
import { collectThreatIntel } from "../threat-intel/collector";

type Actor = { id: string; email: string } | null;
type DbRecord = Prisma.DomainRecordGetPayload<object>;

export function toRef(r: DbRecord): DomainRecordRef {
  return {
    id: r.id,
    domain: r.domain,
    listType: r.listType,
    scope: r.scope,
    trustStatus: r.trustStatus,
    platformName: r.platformName,
    companyName: r.companyName,
    category: r.category,
    officialUrl: r.officialUrl,
    verificationSource: r.verificationSource,
    verifiedAt: r.verifiedAt?.toISOString() ?? null,
    notes: r.notes,
  };
}

// ─── Lookup used by the scanner ───────────────────────────────────────────────

export const dbDomainLookup: DomainDbLookup = {
  async lookup(url: string) {
    let host: string;
    let noHash: string;
    try {
      const u = new URL(url);
      host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
      u.hash = "";
      noHash = u.toString();
    } catch {
      return [];
    }
    const now = new Date();
    const rows = await prisma.domainRecord.findMany({
      where: {
        status: "ACTIVE",
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        AND: [{ OR: [{ domain: { in: lookupKeys(host) }, scope: { in: ["DOMAIN", "HOST"] } }, { scope: "URL", domain: noHash }] }],
      },
      take: 50,
    });
    return matchRecords(url, rows.map(toRef));
  },
};

let brandCache: { at: number; brands: BrandProfile[] } | null = null;

/** Verified whitelist records grouped into brand profiles for impersonation checks. */
export async function getWhitelistBrands(): Promise<BrandProfile[]> {
  if (brandCache && Date.now() - brandCache.at < 60_000) return brandCache.brands;
  const rows = await prisma.domainRecord.findMany({
    where: { listType: "WHITELIST", status: "ACTIVE", scope: "DOMAIN" },
    select: { domain: true, platformName: true, brandKeywords: true },
  });
  const by = new Map<string, BrandProfile>();
  for (const r of rows) {
    const name = (r.platformName ?? r.domain).replace(/\s*\(.*\)\s*$/, "").trim();
    const key = name.toLowerCase();
    const cur = by.get(key) ?? { brand: name, keywords: [], domains: [], verified: true };
    cur.domains = [...new Set([...cur.domains, r.domain])];
    cur.keywords = [...new Set([...cur.keywords, ...r.brandKeywords.map((k) => k.toLowerCase())])];
    by.set(key, cur);
  }
  brandCache = { at: Date.now(), brands: [...by.values()] };
  return brandCache.brands;
}

export function invalidateBrandCache() {
  brandCache = null;
}

/** Merges configured brand profiles with verified whitelist platforms (by brand name). */
export function mergeBrands(config: BrandProfile[], db: BrandProfile[]): BrandProfile[] {
  const out = new Map(config.map((b) => [b.brand.toLowerCase(), { ...b }]));
  for (const b of db) {
    const cur = out.get(b.brand.toLowerCase());
    if (cur) {
      cur.domains = [...new Set([...cur.domains, ...b.domains])];
      cur.keywords = [...new Set([...cur.keywords, ...b.keywords])];
      cur.verified = true;
    } else {
      out.set(b.brand.toLowerCase(), { ...b });
    }
  }
  return [...out.values()];
}

// ─── CRUD with history ────────────────────────────────────────────────────────

export interface DomainRecordInput {
  domain: string;
  listType: DomainListType;
  scope: DomainMatchScope;
  status: DomainRecordStatus;
  trustStatus: DomainTrustStatus;
  platformName?: string | null;
  companyName?: string | null;
  officialUrl?: string | null;
  category?: string | null;
  brandKeywords?: string[];
  verificationSource?: string | null;
  verifiedAt?: Date | null;
  notes?: string | null;
  origin?: string;
  expiresAt?: Date | null;
}

export class DomainIntelError extends Error {}

/** Evidence rule: active whitelist/blacklist records must cite a source and a verification time. */
export function enforceEvidence(input: DomainRecordInput): DomainRecordInput {
  if (input.status === "ACTIVE" && input.listType !== "SUSPICIOUS" && (!input.verificationSource?.trim() || !input.verifiedAt)) {
    throw new DomainIntelError(`${input.listType === "WHITELIST" ? "Trusted" : "Malicious"} records need a verification source and a verification date before they can be active.`);
  }
  return input;
}

async function history(tx: Prisma.TransactionClient, rec: { id: string | null; domain: string; listType: DomainListType }, action: string, actor: Actor, changes?: unknown) {
  await tx.domainRecordHistory.create({
    data: { recordId: rec.id, domain: rec.domain, listType: rec.listType, action, changes: (changes ?? undefined) as Prisma.InputJsonValue | undefined, actorId: actor?.id ?? null, actorEmail: actor?.email ?? null },
  });
}

function diff(before: Record<string, unknown>, after: Record<string, unknown>) {
  const out: Record<string, { from: unknown; to: unknown }> = {};
  for (const k of Object.keys(after)) {
    const a = before[k] instanceof Date ? (before[k] as Date).toISOString() : before[k];
    const b = after[k] instanceof Date ? (after[k] as Date).toISOString() : after[k];
    if (JSON.stringify(a) !== JSON.stringify(b)) out[k] = { from: a ?? null, to: b ?? null };
  }
  return out;
}

export async function createDomainRecord(raw: DomainRecordInput, actor: Actor, action = "CREATED") {
  const input = enforceEvidence({ ...raw, domain: normalizeRecordDomain(raw.domain, raw.scope) });
  const exists = await prisma.domainRecord.findUnique({ where: { domain_listType: { domain: input.domain, listType: input.listType } } });
  if (exists) throw new DomainIntelError(`${input.domain} is already in the ${input.listType.toLowerCase()}.`);
  const rec = await prisma.$transaction(async (tx) => {
    const r = await tx.domainRecord.create({ data: { ...input, brandKeywords: input.brandKeywords ?? [], origin: input.origin ?? "ADMIN", reviewedById: input.status === "ACTIVE" ? actor?.id : null, reviewedAt: input.status === "ACTIVE" ? new Date() : null } });
    await history(tx, r, action, actor, { record: input });
    return r;
  });
  invalidateBrandCache();
  return rec;
}

export async function updateDomainRecord(id: string, raw: DomainRecordInput, actor: Actor) {
  const before = await prisma.domainRecord.findUnique({ where: { id } });
  if (!before) throw new DomainIntelError("Record not found.");
  const input = enforceEvidence({ ...raw, domain: normalizeRecordDomain(raw.domain, raw.scope) });
  if (input.domain !== before.domain || input.listType !== before.listType) {
    const clash = await prisma.domainRecord.findUnique({ where: { domain_listType: { domain: input.domain, listType: input.listType } } });
    if (clash && clash.id !== id) throw new DomainIntelError(`${input.domain} is already in the ${input.listType.toLowerCase()}.`);
  }
  const changes = diff(before as unknown as Record<string, unknown>, input as unknown as Record<string, unknown>);
  const rec = await prisma.$transaction(async (tx) => {
    const r = await tx.domainRecord.update({ where: { id }, data: { ...input, brandKeywords: input.brandKeywords ?? [] } });
    await history(tx, r, "UPDATED", actor, changes);
    return r;
  });
  invalidateBrandCache();
  return rec;
}

export async function deleteDomainRecord(id: string, actor: Actor) {
  const before = await prisma.domainRecord.findUnique({ where: { id } });
  if (!before) throw new DomainIntelError("Record not found.");
  await prisma.$transaction(async (tx) => {
    await history(tx, before, "DELETED", actor, { record: before });
    await tx.domainRecord.delete({ where: { id } });
  });
  invalidateBrandCache();
  return before;
}

export async function reviewDomainRecord(id: string, decision: "APPROVE" | "REJECT", actor: Actor, note?: string) {
  const rec = await prisma.domainRecord.findUnique({ where: { id } });
  if (!rec) throw new DomainIntelError("Record not found.");
  if (decision === "APPROVE") {
    enforceEvidence({ ...rec, status: "ACTIVE" } as DomainRecordInput);
  }
  const updated = await prisma.$transaction(async (tx) => {
    const r = await tx.domainRecord.update({
      where: { id },
      data: { status: decision === "APPROVE" ? "ACTIVE" : "REJECTED", reviewedById: actor?.id ?? null, reviewedAt: new Date(), notes: note ? [rec.notes, `Review: ${note}`].filter(Boolean).join("\n") : rec.notes },
    });
    await history(tx, r, decision === "APPROVE" ? "APPROVED" : "REJECTED", actor, note ? { note } : undefined);
    return r;
  });
  invalidateBrandCache();
  return updated;
}

/** A signed-in user proposes a domain for review; it never becomes active on its own. */
export async function submitDomain(input: { domain: string; listType: DomainListType; reason: string; evidenceUrl?: string; userId: string; userEmail: string }) {
  const domain = normalizeRecordDomain(input.domain, "DOMAIN");
  const existing = await prisma.domainRecord.findUnique({ where: { domain_listType: { domain, listType: input.listType } } });
  if (existing) return { record: existing, duplicate: true };
  const record = await prisma.$transaction(async (tx) => {
    const r = await tx.domainRecord.create({
      data: {
        domain,
        listType: input.listType,
        scope: "DOMAIN",
        status: "PENDING",
        trustStatus: input.listType === "WHITELIST" ? "UNVERIFIED" : "SUSPECTED",
        notes: `User report: ${input.reason}`,
        verificationSource: input.evidenceUrl ? `Submitted by user (${input.userEmail}); evidence: ${input.evidenceUrl}` : `Submitted by user (${input.userEmail})`,
        origin: "USER_SUBMISSION",
        submittedById: input.userId,
      },
    });
    await history(tx, r, "SUBMITTED", { id: input.userId, email: input.userEmail }, { reason: input.reason, evidenceUrl: input.evidenceUrl });
    return r;
  });
  return { record, duplicate: false };
}

// ─── CSV import / export ──────────────────────────────────────────────────────

export const CSV_COLUMNS = ["domain", "listType", "scope", "status", "trustStatus", "platformName", "companyName", "officialUrl", "category", "brandKeywords", "verificationSource", "verifiedAt", "notes"] as const;

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : Array.isArray(v) ? v.join(";") : String(v);
  // Neutralise spreadsheet formula injection.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export async function exportCsv(where: Prisma.DomainRecordWhereInput = {}): Promise<string> {
  const rows = await prisma.domainRecord.findMany({ where, orderBy: [{ listType: "asc" }, { domain: "asc" }] });
  const lines = [CSV_COLUMNS.join(",")];
  for (const r of rows) lines.push(CSV_COLUMNS.map((c) => csvEscape((r as unknown as Record<string, unknown>)[c])).join(","));
  return `${lines.join("\n")}\n`;
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else q = false;
      } else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

const LISTS = ["WHITELIST", "BLACKLIST", "SUSPICIOUS"];
const SCOPES = ["DOMAIN", "HOST", "URL"];
const STATUSES = ["ACTIVE", "PENDING", "REJECTED"];
const TRUSTS = ["VERIFIED_OFFICIAL", "CONFIRMED_MALICIOUS", "SUSPECTED", "UNVERIFIED"];

export async function importCsv(text: string, actor: Actor, opts: { overwrite: boolean }) {
  const rows = parseCsv(text.replace(/^﻿/, ""));
  if (!rows.length) throw new DomainIntelError("The CSV file is empty.");
  const header = rows[0].map((h) => h.trim());
  if (!header.includes("domain") || !header.includes("listType")) throw new DomainIntelError("The CSV needs at least the columns: domain, listType.");
  const idx = (c: string) => header.indexOf(c);
  const get = (r: string[], c: string) => (idx(c) >= 0 ? (r[idx(c)] ?? "").trim().replace(/^'(?=[=+\-@])/, "") : "");
  const result = { created: 0, updated: 0, pendingForMissingEvidence: 0, skipped: 0, errors: [] as string[] };
  for (const [n, r] of rows.slice(1).entries()) {
    const line = n + 2;
    try {
      const listType = get(r, "listType").toUpperCase();
      const scope = (get(r, "scope") || "DOMAIN").toUpperCase();
      let status = (get(r, "status") || "ACTIVE").toUpperCase();
      if (!LISTS.includes(listType)) throw new Error(`listType must be one of ${LISTS.join("/")}`);
      if (!SCOPES.includes(scope)) throw new Error(`scope must be one of ${SCOPES.join("/")}`);
      if (!STATUSES.includes(status)) throw new Error(`status must be one of ${STATUSES.join("/")}`);
      const trust = (get(r, "trustStatus") || (listType === "WHITELIST" ? "VERIFIED_OFFICIAL" : listType === "BLACKLIST" ? "CONFIRMED_MALICIOUS" : "SUSPECTED")).toUpperCase();
      if (!TRUSTS.includes(trust)) throw new Error(`trustStatus must be one of ${TRUSTS.join("/")}`);
      const verifiedAtRaw = get(r, "verifiedAt");
      const verifiedAt = verifiedAtRaw ? new Date(verifiedAtRaw) : null;
      if (verifiedAt && Number.isNaN(verifiedAt.getTime())) throw new Error("verifiedAt is not a valid date");
      const source = get(r, "verificationSource") || null;
      if (status === "ACTIVE" && listType !== "SUSPICIOUS" && (!source || !verifiedAt)) {
        status = "PENDING";
        result.pendingForMissingEvidence++;
      }
      const input: DomainRecordInput = {
        domain: normalizeRecordDomain(get(r, "domain"), scope as DomainMatchScope),
        listType: listType as DomainListType,
        scope: scope as DomainMatchScope,
        status: status as DomainRecordStatus,
        trustStatus: trust as DomainTrustStatus,
        platformName: get(r, "platformName") || null,
        companyName: get(r, "companyName") || null,
        officialUrl: get(r, "officialUrl") || null,
        category: get(r, "category") || null,
        brandKeywords: get(r, "brandKeywords").split(/[;|]/).map((k) => k.trim().toLowerCase()).filter(Boolean),
        verificationSource: source,
        verifiedAt,
        notes: get(r, "notes") || null,
        origin: "IMPORT",
      };
      const existing = await prisma.domainRecord.findUnique({ where: { domain_listType: { domain: input.domain, listType: input.listType } } });
      if (existing && !opts.overwrite) {
        result.skipped++;
      } else if (existing) {
        await updateDomainRecord(existing.id, input, actor);
        result.updated++;
      } else {
        await createDomainRecord(input, actor, "IMPORTED");
        result.created++;
      }
    } catch (e) {
      if (result.errors.length < 50) result.errors.push(`Line ${line}: ${(e as Error).message}`);
    }
  }
  invalidateBrandCache();
  return result;
}

// ─── Scheduled jobs ───────────────────────────────────────────────────────────

export async function runJob<T extends Record<string, unknown>>(name: string, trigger: string, fn: () => Promise<T>) {
  const running = await prisma.jobRun.findFirst({ where: { name, status: "RUNNING", startedAt: { gt: new Date(Date.now() - 30 * 60_000) } } });
  if (running) return { skipped: true as const, reason: "Already running" };
  const run = await prisma.jobRun.create({ data: { name, trigger, status: "RUNNING" } });
  try {
    const summary = await fn();
    await prisma.jobRun.update({ where: { id: run.id }, data: { status: "SUCCESS", summary: summary as Prisma.InputJsonValue, finishedAt: new Date() } });
    return { skipped: false as const, summary };
  } catch (e) {
    await prisma.jobRun.update({ where: { id: run.id }, data: { status: "FAILED", error: (e as Error).message.slice(0, 1000), finishedAt: new Date() } });
    throw e;
  }
}

export type ProgressFn = (progress: Record<string, unknown>) => Promise<void>;

/**
 * Starts a job in the background and returns immediately. `schedule` is supplied by the
 * caller (Next.js `after()` in server actions) so the work outlives the request.
 * Progress is written to JobRun.summary for the admin UI to poll.
 */
export async function startJob(name: string, trigger: string, fn: (progress: ProgressFn) => Promise<Record<string, unknown>>, schedule: (task: () => Promise<void>) => void) {
  const running = await prisma.jobRun.findFirst({ where: { name, status: "RUNNING", startedAt: { gt: new Date(Date.now() - 30 * 60_000) } } });
  if (running) return { started: false as const, runId: running.id };
  const run = await prisma.jobRun.create({ data: { name, trigger, status: "RUNNING", summary: { phase: "starting" } } });
  let lastWrite = 0;
  const progress: ProgressFn = async (p) => {
    if (Date.now() - lastWrite < 1000) return;
    lastWrite = Date.now();
    await prisma.jobRun.update({ where: { id: run.id }, data: { summary: p as Prisma.InputJsonValue } }).catch(() => {});
  };
  schedule(async () => {
    try {
      const summary = await fn(progress);
      await prisma.jobRun.update({ where: { id: run.id }, data: { status: "SUCCESS", summary: summary as Prisma.InputJsonValue, finishedAt: new Date() } });
    } catch (e) {
      await prisma.jobRun.update({ where: { id: run.id }, data: { status: "FAILED", error: (e as Error).message.slice(0, 1000), finishedAt: new Date() } });
    }
  });
  return { started: true as const, runId: run.id };
}

async function pool<T>(items: T[], size: number, fn: (t: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(Array.from({ length: size }, async () => {
    while (queue.length) await fn(queue.shift() as T);
  }));
}

/** Re-checks DNS and HTTPS reachability of active whitelist / blacklist / suspicious domains. */
export async function revalidateDomains(opts: { limit?: number; onProgress?: ProgressFn } = {}) {
  const records = await prisma.domainRecord.findMany({
    where: { status: "ACTIVE", scope: { in: ["DOMAIN", "HOST"] }, NOT: [{ origin: { startsWith: "FEED:" } }, { origin: "THREAT_RESEARCH" }] },
    orderBy: [{ lastRevalidatedAt: { sort: "asc", nulls: "first" } }],
    take: opts.limit ?? 300,
  });
  const resolver = new dnsp.Resolver({ timeout: 4000, tries: 2 });
  const counts = { checked: 0, ok: 0, noDns: 0, unreachable: 0, changed: 0 };
  const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 InnovaChecker-Revalidation/1.0";
  const resolves = async (h: string) => (await resolver.resolve4(h).catch(() => [] as string[])).length > 0 || (await resolver.resolve6(h).catch(() => [] as string[])).length > 0;
  await pool(records, 8, async (r) => {
    let status = "OK";
    let note = "";
    try {
      // A registered domain may serve its site only on www.; it is "gone" only when
      // neither the apex nor www resolves and the zone has no nameservers.
      const apex = await resolves(r.domain);
      const www = apex || r.scope === "HOST" ? false : await resolves(`www.${r.domain}`);
      const ns = apex || www ? true : (await resolver.resolveNs(r.domain).catch(() => [] as string[])).length > 0;
      if (!apex && !www) {
        status = ns ? "NO_WEB_HOST" : "NO_DNS";
        note = ns ? "Domain is delegated but has no web host (apex or www)" : "Domain no longer resolves (no address and no nameservers)";
      } else if (r.listType === "WHITELIST") {
        let res: Response | null = null;
        let tried = "";
        for (const target of apex ? [`https://${r.domain}/`, `https://www.${r.domain}/`] : [`https://www.${r.domain}/`]) {
          tried = target;
          res = await fetch(target, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(20000), headers: { "user-agent": ua, accept: "text/html,*/*" } }).catch(() => null);
          if (res) break;
        }
        if (!res) {
          status = "UNREACHABLE";
          note = `No HTTPS response from ${tried}`;
        } else {
          const finalHost = new URL(res.url).hostname.replace(/^www\./, "");
          // Any HTTP answer (including 403/429 bot challenges) proves the site is up.
          note = `HTTP ${res.status}, final host ${finalHost}`;
          if (!(finalHost === r.domain || finalHost.endsWith(`.${r.domain}`)) && !(r.officialUrl && res.url.startsWith(r.officialUrl))) {
            status = "CHANGED";
            note += ` (redirects outside ${r.domain}; review)`;
          }
          await res.body?.cancel().catch(() => {});
        }
      }
    } catch (e) {
      status = "ERROR";
      note = (e as Error).message;
    }
    counts.checked++;
    void opts.onProgress?.({ phase: "checking", total: records.length, ...counts });
    if (status === "OK" || status === "NO_WEB_HOST") counts.ok++;
    else if (status === "NO_DNS") counts.noDns++;
    else if (status === "CHANGED") counts.changed++;
    else counts.unreachable++;
    const changed = r.revalidationStatus !== status;
    await prisma.domainRecord.update({ where: { id: r.id }, data: { lastRevalidatedAt: new Date(), revalidationStatus: status, revalidationNote: note.slice(0, 500) } });
    if (changed && r.revalidationStatus) {
      await prisma.domainRecordHistory.create({ data: { recordId: r.id, domain: r.domain, listType: r.listType, action: "REVALIDATED", changes: { from: r.revalidationStatus, to: status, note } } });
    }
  });
  return counts;
}


/** Imports current phishing URLs from public threat feeds as expiring URL-scope blacklist entries. */
export async function syncThreatFeeds(keys: { urlhaus?: string }, onProgress?: ProgressFn) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 86_400_000);
  const summary: Record<string, unknown> = {};

  const ingest = async (feed: string, urls: string[], source: string) => {
    let added = 0;
    let refreshed = 0;
    let i = 0;
    for (const raw of urls.slice(0, 5000)) {
      if (++i % 25 === 0) void onProgress?.({ phase: `importing ${feed}`, done: i, total: Math.min(urls.length, 5000) });
      let domain: string;
      try {
        domain = normalizeRecordDomain(raw, "URL");
      } catch {
        continue;
      }
      if (domain.length > 2000) continue;
      const existing = await prisma.domainRecord.findUnique({ where: { domain_listType: { domain, listType: "BLACKLIST" } } });
      if (existing) {
        if (existing.origin === `FEED:${feed}`) {
          await prisma.domainRecord.update({ where: { id: existing.id }, data: { expiresAt, verifiedAt: now } });
          refreshed++;
        }
        continue;
      }
      await prisma.domainRecord.create({
        data: { domain, listType: "BLACKLIST", scope: "URL", status: "ACTIVE", trustStatus: "CONFIRMED_MALICIOUS", category: "Phishing URL (threat feed)", verificationSource: source, verifiedAt: now, origin: `FEED:${feed}`, expiresAt, notes: "Exact URL from a public threat feed; expires automatically unless the feed still lists it." },
      });
      added++;
    }
    return { received: urls.length, added, refreshed };
  };

  // Full collection from every public source (src/server/threat-intel).
  try {
    summary.collection = await collectThreatIntel(onProgress ? (p) => onProgress(p as Parameters<ProgressFn>[0]) : undefined);
  } catch (e) {
    summary.collection = { error: (e as Error).message };
  }

  if (keys.urlhaus) {
    try {
      const res = await fetch("https://urlhaus-api.abuse.ch/v1/urls/recent/limit/1000/", { headers: { "Auth-Key": keys.urlhaus }, signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = (await res.json()) as { urls?: { url: string; url_status: string }[] };
      const urls = (j.urls ?? []).filter((u) => u.url_status === "online").map((u) => u.url);
      summary.urlhaus = await ingest("URLHAUS", urls, `URLhaus recent online URLs (abuse.ch API), fetched ${now.toISOString()}`);
    } catch (e) {
      summary.urlhaus = { error: (e as Error).message };
    }
  } else {
    summary.urlhaus = { skipped: "URLHAUS_AUTH_KEY not configured" };
  }

  const expired = await prisma.domainRecord.deleteMany({ where: { origin: { startsWith: "FEED:" }, expiresAt: { lt: now } } });
  summary.expiredRemoved = expired.count;
  return summary;
}

export async function domainIntelCounts() {
  const g = await prisma.domainRecord.groupBy({ by: ["listType", "status"], _count: true });
  const c = (l: string, s: string) => g.find((x) => x.listType === l && x.status === s)?._count ?? 0;
  return {
    whitelist: c("WHITELIST", "ACTIVE"),
    blacklist: c("BLACKLIST", "ACTIVE"),
    suspicious: c("SUSPICIOUS", "ACTIVE"),
    pending: g.filter((x) => x.status === "PENDING").reduce((a, x) => a + x._count, 0),
    rejected: g.filter((x) => x.status === "REJECTED").reduce((a, x) => a + x._count, 0),
  };
}
