import type { FreeScanMode } from "@/generated/prisma/client";
import { prisma } from "../db";

// Free scans for visitors and users without a subscription, counted per device
// (HMAC of the browser fingerprint) so that private windows, cleared cookies and
// signing in or out on the same machine all share one allowance.

export type FreeQuota = { freeScanMode: FreeScanMode; freeScanLimit: number };

const TASHKENT_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent", year: "numeric", month: "2-digit", day: "2-digit" });

/** Counter period: today's Tashkent date, "total", or null when there is no quota. */
export function quotaPeriod(mode: FreeScanMode, now = new Date()): string | null {
  if (mode === "UNLIMITED") return null;
  return mode === "DAILY" ? TASHKENT_DAY.format(now) : "total";
}

/**
 * Atomically takes one free scan for `key`. Returns a function that gives the
 * scan back (when a later check refuses the request), or null when none is left.
 */
export async function claimFreeScan(q: FreeQuota, key: string): Promise<(() => Promise<void>) | null> {
  const period = quotaPeriod(q.freeScanMode);
  if (!period) return async () => {};
  if (q.freeScanLimit <= 0) return null;
  await prisma.freeScanUsage.createMany({ data: [{ key, period }], skipDuplicates: true });
  const taken = await prisma.freeScanUsage.updateMany({ where: { key, period, used: { lt: q.freeScanLimit } }, data: { used: { increment: 1 } } });
  if (taken.count === 0) return null;
  return async () => {
    await prisma.freeScanUsage.updateMany({ where: { key, period, used: { gt: 0 } }, data: { used: { decrement: 1 } } });
  };
}

/** Free scans left for `key`, or null when the free mode is unlimited. */
export async function freeScansLeft(q: FreeQuota, key: string | null): Promise<number | null> {
  const period = quotaPeriod(q.freeScanMode);
  if (!period) return null;
  if (!key) return Math.max(0, q.freeScanLimit);
  const row = await prisma.freeScanUsage.findUnique({ where: { key_period: { key, period } }, select: { used: true } });
  return Math.max(0, q.freeScanLimit - (row?.used ?? 0));
}

/** Removes daily counters older than a week (one-time counters are kept). */
export async function pruneFreeScanUsage(): Promise<number> {
  const cutoff = TASHKENT_DAY.format(new Date(Date.now() - 7 * 86_400_000));
  return (await prisma.freeScanUsage.deleteMany({ where: { period: { not: "total", lt: cutoff } } })).count;
}
