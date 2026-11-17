import "./net-defaults";
import crypto from "node:crypto";
import { prisma } from "./db";
import { dbLookupCache } from "./settings";
import { env } from "./env";
import { decryptSecret, encryptSecret, keyHint } from "./secrets";
import type { Prisma } from "@/generated/prisma/client";
import type { ProviderId, ProviderKeys } from "./scanner/types";

// Threat-intelligence API keys: a key saved in the admin panel (encrypted in the DB)
// overrides the environment variable. Keys are never sent to the browser.

export const PROVIDER_ENV: Record<ProviderId, keyof ReturnType<typeof env>> = {
  googleSafeBrowsing: "GOOGLE_SAFE_BROWSING_API_KEY",
  virusTotal: "VIRUSTOTAL_API_KEY",
  urlhaus: "URLHAUS_AUTH_KEY",
  phishTank: "PHISHTANK_APP_KEY",
  abuseIpdb: "ABUSEIPDB_API_KEY",
};

let cache: { at: number; keys: ProviderKeys } | null = null;

export function invalidateProviderKeys() {
  cache = null;
}

export async function resolveProviderKeys(): Promise<ProviderKeys> {
  if (cache && Date.now() - cache.at < 30_000) return cache.keys;
  const e = env();
  const keys: ProviderKeys = {};
  for (const [id, envName] of Object.entries(PROVIDER_ENV) as [ProviderId, keyof ReturnType<typeof env>][]) {
    const v = e[envName];
    if (typeof v === "string" && v) keys[id] = v;
  }
  const rows = await prisma.providerCredential.findMany();
  for (const r of rows) {
    try {
      keys[r.provider as ProviderId] = decryptSecret(r.ciphertext);
    } catch (err) {
      console.error(`[integrations] cannot decrypt key for ${r.provider}; check SECRETS_ENCRYPTION_KEY`, err);
    }
  }
  cache = { at: Date.now(), keys };
  return keys;
}

export async function listIntegrations() {
  const e = env();
  const rows = await prisma.providerCredential.findMany();
  return (Object.keys(PROVIDER_ENV) as ProviderId[]).map((id) => {
    const row = rows.find((r) => r.provider === id);
    const envVal = e[PROVIDER_ENV[id]];
    return {
      id,
      source: row ? ("database" as const) : typeof envVal === "string" && envVal ? ("environment" as const) : ("none" as const),
      hint: row ? row.keyHint : typeof envVal === "string" && envVal ? keyHint(envVal) : null,
      updatedAt: row?.updatedAt ?? null,
      quota: (row?.quota ?? null) as VtQuota | null,
      quotaCheckedAt: row?.quotaCheckedAt ?? null,
    };
  });
}

export async function saveProviderKey(provider: ProviderId, apiKey: string, actorId: string) {
  const data = { ciphertext: encryptSecret(apiKey), keyHint: keyHint(apiKey), updatedById: actorId, quota: undefined, quotaCheckedAt: null };
  await prisma.providerCredential.upsert({ where: { provider }, update: data, create: { provider, ...data } });
  invalidateProviderKeys();
}

export async function removeProviderKey(provider: ProviderId) {
  await prisma.providerCredential.deleteMany({ where: { provider } });
  invalidateProviderKeys();
}

// ─── VirusTotal quota ─────────────────────────────────────────────────────────

export type QuotaLine = { used: number; allowed: number };
export type VtQuota = { hourly: QuotaLine | null; daily: QuotaLine | null; monthly: QuotaLine | null; perMinute: number; user: string | null };

export class ProviderKeyError extends Error {}

/** Asks VirusTotal for the key's quota usage. Quota endpoints do not consume API quota. */
export async function fetchVirusTotalQuota(apiKey: string): Promise<VtQuota> {
  const res = await fetch(`https://www.virustotal.com/api/v3/users/${encodeURIComponent(apiKey)}/overall_quotas`, { headers: { "x-apikey": apiKey, accept: "application/json" }, signal: AbortSignal.timeout(15000) });
  if (res.status === 401 || res.status === 403) throw new ProviderKeyError("VirusTotal rejected this API key.");
  if (res.status === 404) throw new ProviderKeyError("VirusTotal does not recognise this API key.");
  if (!res.ok) throw new ProviderKeyError(`VirusTotal returned HTTP ${res.status}.`);
  const j = (await res.json()) as { data?: Record<string, { user?: QuotaLine }> };
  const pick = (k: string) => j.data?.[k]?.user ?? null;
  const userRes = await fetch(`https://www.virustotal.com/api/v3/users/${encodeURIComponent(apiKey)}`, { headers: { "x-apikey": apiKey }, signal: AbortSignal.timeout(15000) }).catch(() => null);
  const user = userRes?.ok ? (((await userRes.json()) as { data?: { id?: string } }).data?.id ?? null) : null;
  return { hourly: pick("api_requests_hourly"), daily: pick("api_requests_daily"), monthly: pick("api_requests_monthly"), perMinute: env().VIRUSTOTAL_REQUESTS_PER_MINUTE, user };
}

/** Refreshes and stores the quota snapshot for the active VirusTotal key (if any). */
export async function refreshVirusTotalQuota(maxAgeMs = 60_000): Promise<VtQuota | null> {
  const keys = await resolveProviderKeys();
  if (!keys.virusTotal) return null;
  const cacheKey = `vt:quota:${crypto.createHash("sha256").update(keys.virusTotal).digest("hex").slice(0, 16)}`;
  const cached = await dbLookupCache.get<{ at: number; quota: VtQuota }>(cacheKey);
  if (cached && Date.now() - cached.at < maxAgeMs) return cached.quota;
  const quota = await fetchVirusTotalQuota(keys.virusTotal);
  await dbLookupCache.set(cacheKey, { at: Date.now(), quota }, 3600);
  await prisma.providerCredential.updateMany({ where: { provider: "virusTotal" }, data: { quota: quota as unknown as Prisma.InputJsonValue, quotaCheckedAt: new Date() } });
  return quota;
}

export function quotaPressure(q: VtQuota | null): { level: "ok" | "warn" | "critical"; worst: number } {
  if (!q) return { level: "ok", worst: 0 };
  const ratios = [q.daily, q.monthly, q.hourly].filter((x): x is QuotaLine => !!x && x.allowed > 0).map((x) => x.used / x.allowed);
  const worst = Math.max(0, ...ratios);
  return { level: worst >= 0.95 ? "critical" : worst >= 0.8 ? "warn" : "ok", worst };
}
