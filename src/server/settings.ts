import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./db";
import { siteAccessFrom, type SiteAccess } from "@/lib/site-access";
import { DEFAULT_SCANNER_SETTINGS } from "./scanner/data/defaults";
import type { BrandProfile, LookupCache, ModuleKey, ProviderId, ScannerSettings } from "./scanner/types";

// Singleton configuration rows. Each loader creates the row with defaults if missing,
// so a fresh database works even before the seed script runs.

// Short in-process cache: settings are read on nearly every request but change rarely.
// Admin saves call invalidateSettingsCache(); other instances pick changes up within TTL.
const TTL_MS = 10_000;
const memo = new Map<string, { at: number; value: unknown }>();

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as T;
  const value = await load();
  memo.set(key, { at: Date.now(), value });
  return value;
}

export function invalidateSettingsCache() {
  memo.clear();
}

export async function getSystemSettings() {
  return cached("system", async () => (await prisma.systemSetting.findUnique({ where: { id: "default" } })) ?? prisma.systemSetting.create({ data: { id: "default" } }));
}

/** Website switches (client sign-in, registration, pricing) and the free-scan policy. */
export async function getSiteAccess(): Promise<SiteAccess> {
  return siteAccessFrom(await getSystemSettings());
}

export async function getPricingConfig() {
  return cached("pricing", async () => (await prisma.pricingConfiguration.findUnique({ where: { id: "default" } })) ?? prisma.pricingConfiguration.create({ data: { id: "default" } }));
}

export function scannerCreateData(): Prisma.ScannerConfigurationCreateInput {
  const d = DEFAULT_SCANNER_SETTINGS;
  return {
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
  };
}

export async function getScannerRow() {
  return cached("scanner", async () => (await prisma.scannerConfiguration.findUnique({ where: { id: "default" } })) ?? prisma.scannerConfiguration.create({ data: scannerCreateData() }));
}

function mergeBools<K extends string>(defaults: Record<K, boolean>, raw: unknown): Record<K, boolean> {
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return Object.fromEntries(Object.entries(defaults).map(([k, v]) => [k, typeof src[k] === "boolean" ? src[k] : v])) as Record<K, boolean>;
}

function mergeNumbers<K extends string>(defaults: Record<K, number>, raw: unknown): Record<K, number> {
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(defaults).map(([k, v]) => {
      const n = Number(src[k]);
      return [k, Number.isFinite(n) && n >= 0 && n <= 5 ? n : v];
    }),
  ) as Record<K, number>;
}

export async function getScannerSettings(): Promise<ScannerSettings> {
  const row = await getScannerRow();
  const d = DEFAULT_SCANNER_SETTINGS;
  const brands = Array.isArray(row.brandDomains) ? (row.brandDomains as unknown as BrandProfile[]) : d.brandDomains;
  return {
    modules: mergeBools<ModuleKey>(d.modules, row.modules),
    providers: mergeBools<ProviderId>(d.providers, row.providers),
    weights: mergeNumbers<ModuleKey>(d.weights, row.weights),
    suspiciousKeywords: row.suspiciousKeywords,
    suspiciousTlds: row.suspiciousTlds.map((t) => t.replace(/^\./, "").toLowerCase()),
    urlShorteners: row.urlShorteners,
    suspiciousDomainPatterns: row.suspiciousDomainPatterns,
    trustedDomains: row.trustedDomains,
    brandDomains: brands.filter((b) => b && typeof b.brand === "string" && Array.isArray(b.domains) && Array.isArray(b.keywords)),
    requestTimeoutMs: row.requestTimeoutMs,
    scanTimeoutMs: row.scanTimeoutMs,
    maxRedirects: row.maxRedirects,
    maxResponseBytes: row.maxResponseBytes,
    maxDownloadBytes: row.maxDownloadBytes,
    userAgent: row.userAgent,
    virusTotalSubmitUnknown: row.virusTotalSubmitUnknown,
  };
}

/** LookupCache backed by the IntelCache table. */
export const dbLookupCache: LookupCache = {
  async get<T>(key: string): Promise<T | null> {
    const row = await prisma.intelCache.findUnique({ where: { key } });
    if (!row || row.expiresAt < new Date()) return null;
    return row.value as T;
  },
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const v = value as Prisma.InputJsonValue;
    await prisma.intelCache.upsert({ where: { key }, update: { value: v, expiresAt }, create: { key, value: v, expiresAt } });
  },
};
