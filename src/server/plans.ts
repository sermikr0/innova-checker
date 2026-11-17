import { prisma } from "./db";

export async function getPublicPlans() {
  return prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { priceUzs: "asc" }] });
}

export type PublicPlan = Awaited<ReturnType<typeof getPublicPlans>>[number];

export async function platformStats() {
  const [scans, threats] = await Promise.all([
    prisma.scan.count({ where: { status: "COMPLETED" } }),
    prisma.scan.count({ where: { status: "COMPLETED", verdict: { in: ["SUSPICIOUS", "HIGH_RISK", "MALICIOUS"] } } }),
  ]);
  return { scans, threats };
}
