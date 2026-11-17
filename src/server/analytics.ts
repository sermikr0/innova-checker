import "server-only";
import { Prisma, type Verdict } from "@/generated/prisma/client";
import { prisma } from "./db";

// Link analytics for the admin panel: which links people check and what the
// scanner concluded. Everything is computed from the Scan table.

export const RANGES = { "24h": { label: "Last 24 hours", days: 1 }, "7d": { label: "Last 7 days", days: 7 }, "30d": { label: "Last 30 days", days: 30 }, "90d": { label: "Last 90 days", days: 90 }, all: { label: "All time", days: 0 } } as const;
export type RangeKey = keyof typeof RANGES;

export function parseRange(v: unknown): RangeKey {
  return typeof v === "string" && v in RANGES ? (v as RangeKey) : "30d";
}

export function rangeStart(range: RangeKey, now = Date.now()): Date {
  const days = RANGES[range].days;
  return days ? new Date(now - days * 86_400_000) : new Date(0);
}

const RISKY: Verdict[] = ["SUSPICIOUS", "HIGH_RISK", "MALICIOUS"];
const VERDICT_FILTERS: Record<string, Verdict[]> = { scam: ["MALICIOUS"], risky: ["SUSPICIOUS", "HIGH_RISK"], safe: ["SAFE", "TRUSTED", "LOW_RISK"], inconclusive: ["INCONCLUSIVE"] };

export type DomainRow = { domain: string; checks: number; people: number; scam: number; risky: number; maxScore: number | null; lastVerdict: string | null; lastAt: Date };

async function domainTable(since: Date, onlyRisky: boolean, limit: number): Promise<DomainRow[]> {
  const risky = onlyRisky ? Prisma.sql`AND verdict IN ('SUSPICIOUS', 'HIGH_RISK', 'MALICIOUS')` : Prisma.empty;
  const rows = await prisma.$queryRaw<DomainRow[]>`
    SELECT domain,
           COUNT(*)::int AS checks,
           COUNT(DISTINCT COALESCE("userId", "anonymousSessionId", "ipHash"))::int AS people,
           COUNT(*) FILTER (WHERE verdict = 'MALICIOUS')::int AS scam,
           COUNT(*) FILTER (WHERE verdict IN ('SUSPICIOUS', 'HIGH_RISK'))::int AS risky,
           MAX("riskScore")::int AS "maxScore",
           (ARRAY_AGG(verdict::text ORDER BY "createdAt" DESC) FILTER (WHERE verdict IS NOT NULL))[1] AS "lastVerdict",
           MAX("createdAt") AS "lastAt"
    FROM "Scan"
    WHERE "createdAt" >= ${since} ${risky}
    GROUP BY domain
    ORDER BY checks DESC, "lastAt" DESC
    LIMIT ${limit}`;
  return rows;
}

export async function linkAnalytics(range: RangeKey) {
  const since = rangeStart(range);
  const where: Prisma.ScanWhereInput = { createdAt: { gte: since } };
  const chartDays = range === "90d" || range === "all" ? 90 : range === "30d" ? 30 : 14;
  const chartSince = new Date(Date.now() - (chartDays - 1) * 86_400_000);
  chartSince.setUTCHours(0, 0, 0, 0);

  const [totals, verdicts, topDomains, topRisky, countries, hours, topUserRows, perDayRows] = await Promise.all([
    prisma.$queryRaw<{ total: number; domains: number; users: number; visitors: number; registered: number; failed: number; avgMs: number | null }[]>`
      SELECT COUNT(*)::int AS total,
             COUNT(DISTINCT domain)::int AS domains,
             COUNT(DISTINCT "userId")::int AS users,
             COUNT(DISTINCT "anonymousSessionId") FILTER (WHERE "userId" IS NULL)::int AS visitors,
             COUNT(*) FILTER (WHERE "userId" IS NOT NULL)::int AS registered,
             COUNT(*) FILTER (WHERE status = 'FAILED')::int AS failed,
             AVG("durationMs") FILTER (WHERE status = 'COMPLETED')::int AS "avgMs"
      FROM "Scan" WHERE "createdAt" >= ${since}`,
    prisma.scan.groupBy({ by: ["verdict"], where: { ...where, status: "COMPLETED" }, _count: true }),
    domainTable(since, false, 25),
    domainTable(since, true, 15),
    prisma.scan.groupBy({ by: ["country"], where: { ...where, country: { not: null } }, _count: true, orderBy: { _count: { country: "desc" } }, take: 15 }),
    prisma.$queryRaw<{ hour: number; checks: number }[]>`
      SELECT EXTRACT(HOUR FROM ("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Tashkent')::int AS hour, COUNT(*)::int AS checks
      FROM "Scan" WHERE "createdAt" >= ${since} GROUP BY 1`,
    prisma.scan.groupBy({ by: ["userId"], where: { ...where, userId: { not: null } }, _count: true, orderBy: { _count: { userId: "desc" } }, take: 10 }),
    prisma.$queryRaw<{ day: string; safe: number; suspicious: number; malicious: number }[]>`
      SELECT TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') AS day,
             COUNT(*) FILTER (WHERE verdict NOT IN ('SUSPICIOUS', 'HIGH_RISK', 'MALICIOUS'))::int AS safe,
             COUNT(*) FILTER (WHERE verdict IN ('SUSPICIOUS', 'HIGH_RISK'))::int AS suspicious,
             COUNT(*) FILTER (WHERE verdict = 'MALICIOUS')::int AS malicious
      FROM "Scan" WHERE status = 'COMPLETED' AND "createdAt" >= ${chartSince} GROUP BY 1`,
  ]);

  const users = await prisma.user.findMany({ where: { id: { in: topUserRows.map((r) => r.userId!) } }, select: { id: true, email: true, fullName: true, companyName: true } });
  const byId = new Map(users.map((u) => [u.id, u]));
  const perDayMap = new Map(perDayRows.map((r) => [r.day, r]));
  const perDay = Array.from({ length: chartDays }, (_, i) => {
    const day = new Date(chartSince.getTime() + i * 86_400_000).toISOString().slice(0, 10);
    const r = perDayMap.get(day);
    return { day, safe: r?.safe ?? 0, suspicious: r?.suspicious ?? 0, malicious: r?.malicious ?? 0 };
  });
  const v = (keys: Verdict[]) => verdicts.filter((g) => g.verdict && keys.includes(g.verdict)).reduce((a, g) => a + g._count, 0);
  const t = totals[0];
  return {
    since,
    chartDays,
    totals: { ...t, anonymous: t.total - t.registered },
    verdicts: { safe: v(["SAFE", "TRUSTED", "LOW_RISK"]), suspicious: v(["SUSPICIOUS", "HIGH_RISK"]), malicious: v(["MALICIOUS"]), inconclusive: v(["INCONCLUSIVE"]), risky: v(RISKY) },
    perDay,
    topDomains,
    topRisky,
    countries: countries.map((c) => ({ country: c.country!, checks: c._count })),
    hours: Array.from({ length: 24 }, (_, h) => hours.find((x) => x.hour === h)?.checks ?? 0),
    topUsers: topUserRows.map((r) => ({ user: byId.get(r.userId!) ?? null, checks: r._count })),
  };
}

export type RecentFilter = { range: RangeKey; q?: string; verdict?: string; who?: string };

export function recentWhere(f: RecentFilter): Prisma.ScanWhereInput {
  const q = f.q?.trim().toLowerCase().slice(0, 200);
  const verdicts = f.verdict ? VERDICT_FILTERS[f.verdict] : undefined;
  return {
    createdAt: { gte: rangeStart(f.range) },
    ...(q ? { OR: [{ domain: { contains: q } }, { normalizedUrl: { contains: q, mode: "insensitive" } }] } : {}),
    ...(verdicts ? { verdict: { in: verdicts } } : {}),
    ...(f.who === "registered" ? { userId: { not: null } } : f.who === "visitors" ? { userId: null } : {}),
  };
}

export async function recentChecks(f: RecentFilter, take = 100) {
  return prisma.scan.findMany({
    where: recentWhere(f),
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, inputUrl: true, normalizedUrl: true, domain: true, status: true, verdict: true, riskScore: true, country: true, createdAt: true, user: { select: { email: true, companyName: true } }, consent: { select: { fullName: true, email: true } }, anonymousSessionId: true },
  });
}
