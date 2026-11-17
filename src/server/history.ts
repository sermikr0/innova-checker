import type { Prisma, Verdict } from "@/generated/prisma/client";

const FILTERS: Record<string, Verdict[]> = {
  safe: ["TRUSTED", "SAFE", "LOW_RISK"],
  suspicious: ["SUSPICIOUS", "HIGH_RISK"],
  malicious: ["MALICIOUS"],
  inconclusive: ["INCONCLUSIVE"],
};

export function historyWhere(userId: string, sp: Record<string, string | string[] | undefined>): Prisma.ScanWhereInput {
  const v = typeof sp.verdict === "string" ? sp.verdict : "";
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase().slice(0, 200) : "";
  const from = typeof sp.from === "string" && sp.from ? new Date(`${sp.from}T00:00:00Z`) : null;
  const to = typeof sp.to === "string" && sp.to ? new Date(`${sp.to}T23:59:59Z`) : null;
  return {
    userId,
    ...(FILTERS[v] ? { verdict: { in: FILTERS[v] } } : {}),
    ...(q ? { OR: [{ domain: { contains: q } }, { normalizedUrl: { contains: q } }] } : {}),
    ...(from && !Number.isNaN(from.getTime()) ? { createdAt: { gte: from, ...(to && !Number.isNaN(to.getTime()) ? { lte: to } : {}) } } : to && !Number.isNaN(to.getTime()) ? { createdAt: { lte: to } } : {}),
  };
}

