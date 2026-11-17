import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "../db";

// Admin listing of Terms-of-Use acceptances (Admin → Terms & clients).

export type ConsentFilter = { q?: string; status?: string };

export function consentWhere(f: ConsentFilter): Prisma.ClientConsentWhereInput {
  const q = f.q?.trim().slice(0, 200);
  return {
    ...(q ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { email: { contains: q.toLowerCase() } }, { ipAddress: { startsWith: q } }] } : {}),
    ...(f.status === "verified" ? { emailVerifiedAt: { not: null } } : f.status === "pending" ? { emailVerifiedAt: null } : {}),
  };
}

export async function consentStats() {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const [total, verified, pending, recent, withAccount] = await Promise.all([
    prisma.clientConsent.count(),
    prisma.clientConsent.count({ where: { emailVerifiedAt: { not: null } } }),
    prisma.clientConsent.count({ where: { emailVerifiedAt: null, codeHash: { not: null } } }),
    prisma.clientConsent.count({ where: { acceptedAt: { gte: weekAgo } } }),
    prisma.clientConsent.count({ where: { userId: { not: null } } }),
  ]);
  return { total, verified, pending, recent, withAccount };
}

export async function listConsents(f: ConsentFilter, take = 200) {
  const where = consentWhere(f);
  const [rows, count] = await Promise.all([
    prisma.clientConsent.findMany({
      where,
      orderBy: { acceptedAt: "desc" },
      take,
      select: { id: true, fullName: true, email: true, emailVerifiedAt: true, codeSentAt: true, termsVersion: true, acceptedAt: true, locale: true, ipAddress: true, country: true, userAgent: true, lastSeenAt: true, user: { select: { id: true, email: true, companyName: true } }, _count: { select: { scans: true } } },
    }),
    prisma.clientConsent.count({ where }),
  ]);
  return { rows, count };
}
