import "server-only";
import type { Prisma, Verdict } from "@/generated/prisma/client";
import { prisma } from "./db";
import { activeDeviceWhere } from "./auth/devices";

export const RISKY: Verdict[] = ["SUSPICIOUS", "HIGH_RISK", "MALICIOUS"];

export async function scanStats(where: Prisma.ScanWhereInput) {
  const grouped = await prisma.scan.groupBy({ by: ["verdict"], where: { ...where, status: "COMPLETED" }, _count: true });
  const c = (v: Verdict[]) => grouped.filter((g) => g.verdict && v.includes(g.verdict)).reduce((a, g) => a + g._count, 0);
  return {
    total: grouped.reduce((a, g) => a + g._count, 0),
    safe: c(["SAFE", "TRUSTED", "LOW_RISK"]),
    suspicious: c(["SUSPICIOUS", "HIGH_RISK"]),
    malicious: c(["MALICIOUS"]),
    inconclusive: c(["INCONCLUSIVE"]),
    byVerdict: Object.fromEntries(grouped.map((g) => [g.verdict ?? "NONE", g._count])) as Record<string, number>,
  };
}

/** Completed scans per day for the last `days` days, split into safe / suspicious / malicious. */
export async function scansPerDay(where: Prisma.ScanWhereInput, days = 14) {
  const since = new Date(Date.now() - (days - 1) * 86_400_000);
  since.setUTCHours(0, 0, 0, 0);
  const rows = await prisma.scan.findMany({ where: { ...where, status: "COMPLETED", createdAt: { gte: since } }, select: { createdAt: true, verdict: true } });
  const out: { day: string; safe: number; suspicious: number; malicious: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 86_400_000);
    out.push({ day: d.toISOString().slice(0, 10), safe: 0, suspicious: 0, malicious: 0 });
  }
  for (const r of rows) {
    const bucket = out.find((o) => o.day === r.createdAt.toISOString().slice(0, 10));
    if (!bucket) continue;
    if (r.verdict === "MALICIOUS") bucket.malicious++;
    else if (r.verdict === "SUSPICIOUS" || r.verdict === "HIGH_RISK") bucket.suspicious++;
    else bucket.safe++;
  }
  return out;
}

export async function userDevices(userId: string, currentDeviceId: string | null) {
  const [devices, activeIds] = await Promise.all([
    prisma.device.findMany({
      where: { userId },
      orderBy: [{ revokedAt: { sort: "asc", nulls: "first" } }, { lastSeenAt: "desc" }],
      include: { sessions: { where: { revokedAt: null, expiresAt: { gt: new Date() } }, orderBy: { lastSeenAt: "desc" } } },
      take: 100,
    }),
    prisma.device.findMany({ where: activeDeviceWhere(userId), select: { id: true } }),
  ]);
  const active = new Set(activeIds.map((d) => d.id));
  return devices.map((d) => ({ ...d, current: d.id === currentDeviceId, signedIn: active.has(d.id) }));
}

/** Point in time `ms` milliseconds ago (kept out of components for render purity). */
export function msAgo(ms: number): Date {
  return new Date(Date.now() - ms);
}
