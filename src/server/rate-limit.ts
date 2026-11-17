import { prisma } from "./db";

// Fixed-window counters stored in PostgreSQL so limits hold across app instances.

export interface RateLimitResult {
  ok: boolean;
  count: number;
  limit: number;
  retryAfterSec: number;
}

export async function hitRateLimit(key: string, limit: number, windowSec: number): Promise<RateLimitResult> {
  if (!Number.isFinite(windowSec) || windowSec <= 0 || !Number.isFinite(limit)) {
    throw new Error(`Invalid rate-limit configuration for ${key.split(":")[0]}`);
  }
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const expiresAt = new Date(windowStart.getTime() + windowMs);
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimitBucket" ("key", "windowStart", "count", "expiresAt")
    VALUES (${key}, ${windowStart}, 1, ${expiresAt})
    ON CONFLICT ("key", "windowStart") DO UPDATE SET "count" = "RateLimitBucket"."count" + 1
    RETURNING "count"`;
  const count = Number(rows[0]?.count ?? 1);
  if (Math.random() < 0.02) {
    prisma.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});
  }
  return { ok: count <= limit, count, limit, retryAfterSec: Math.ceil((expiresAt.getTime() - now) / 1000) };
}

export async function peekRateLimit(key: string, windowSec: number): Promise<number> {
  const windowMs = windowSec * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  const row = await prisma.rateLimitBucket.findUnique({ where: { key_windowStart: { key, windowStart } } });
  return row?.count ?? 0;
}

export async function clearRateLimit(key: string, windowSec: number): Promise<void> {
  const windowMs = windowSec * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  await prisma.rateLimitBucket.deleteMany({ where: { key, windowStart } });
}
