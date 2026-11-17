import type { DurationUnit, Prisma, Subscription, SubscriptionPlan, SubscriptionStatus } from "@/generated/prisma/client";
import { prisma } from "../db";
import { getSystemSettings } from "../settings";

// Subscription business rules. All checks run on the server; the UI only reflects them.

export type SubscriptionWithPlan = Subscription & { plan: SubscriptionPlan };
type Actor = { id: string; email: string } | null;
type Tx = Prisma.TransactionClient;

const CURRENT: SubscriptionStatus[] = ["ACTIVE", "SUSPENDED", "PENDING"];
const DAY = 86_400_000;

export function addDuration(start: Date, value: number, unit: DurationUnit): Date {
  const d = new Date(start);
  if (unit === "DAY") return new Date(d.getTime() + value * DAY);
  if (unit === "MONTH") {
    d.setUTCMonth(d.getUTCMonth() + value);
    return d;
  }
  d.setUTCFullYear(d.getUTCFullYear() + value);
  return d;
}

export function durationLabel(value: number, unit: DurationUnit): string {
  const u = unit === "DAY" ? "day" : unit === "MONTH" ? "month" : "year";
  return `${value} ${u}${value === 1 ? "" : "s"}`;
}

export function remainingDays(sub: Pick<Subscription, "expiresAt" | "status"> | null): number {
  if (!sub || sub.status !== "ACTIVE") return 0;
  return Math.max(0, Math.ceil((sub.expiresAt.getTime() - Date.now()) / DAY));
}

/** Marks lapsed ACTIVE subscriptions as EXPIRED (lazy, idempotent). */
export async function expireLapsed(userId?: string): Promise<number> {
  const lapsed = await prisma.subscription.findMany({
    where: { status: "ACTIVE", expiresAt: { lte: new Date() }, ...(userId ? { userId } : {}) },
    include: { plan: true },
    take: 500,
  });
  for (const s of lapsed) {
    await prisma.$transaction(async (tx) => {
      const r = await tx.subscription.updateMany({ where: { id: s.id, status: "ACTIVE" }, data: { status: "EXPIRED" } });
      if (r.count) {
        await tx.subscriptionHistory.create({
          data: { subscriptionId: s.id, userId: s.userId, action: "EXPIRED", fromStatus: "ACTIVE", toStatus: "EXPIRED", fromPlanName: s.plan.name, toPlanName: s.plan.name, fromExpiresAt: s.expiresAt, toExpiresAt: s.expiresAt, note: "Expired automatically" },
        });
      }
    });
  }
  return lapsed.length;
}

export async function getCurrentSubscription(userId: string): Promise<SubscriptionWithPlan | null> {
  await expireLapsed(userId);
  return prisma.subscription.findFirst({
    where: { userId, status: { in: CURRENT } },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
}

/** Most recent subscription of any status, for display ("expired on ..."). */
export async function getLatestSubscription(userId: string): Promise<SubscriptionWithPlan | null> {
  await expireLapsed(userId);
  return prisma.subscription.findFirst({ where: { userId }, include: { plan: true }, orderBy: { createdAt: "desc" } });
}

export async function getActiveSubscription(userId: string): Promise<SubscriptionWithPlan | null> {
  const s = await getCurrentSubscription(userId);
  const now = Date.now();
  if (s && s.status === "ACTIVE" && s.startsAt.getTime() <= now && s.expiresAt.getTime() > now) return s;
  return null;
}

/** Device allowance: null means unlimited (administrators). */
export async function deviceLimitFor(user: { id: string; role: string }): Promise<number | null> {
  if (user.role === "SUPER_ADMIN" || user.role === "UNLIMITED") return null;
  const sub = await getActiveSubscription(user.id);
  if (sub) return sub.deviceLimit;
  return (await getSystemSettings()).noSubscriptionDeviceLimit;
}

async function record(tx: Tx, sub: SubscriptionWithPlan, action: Prisma.SubscriptionHistoryUncheckedCreateInput["action"], actor: Actor, after: Partial<{ status: SubscriptionStatus; planName: string; expiresAt: Date }>, note?: string) {
  await tx.subscriptionHistory.create({
    data: {
      subscriptionId: sub.id,
      userId: sub.userId,
      actorId: actor?.id ?? null,
      action,
      fromStatus: sub.status,
      toStatus: after.status ?? sub.status,
      fromPlanName: sub.plan.name,
      toPlanName: after.planName ?? sub.plan.name,
      fromExpiresAt: sub.expiresAt,
      toExpiresAt: after.expiresAt ?? sub.expiresAt,
      note: note ?? null,
    },
  });
}

export class SubscriptionError extends Error {}

export async function assignSubscription(input: {
  userId: string;
  planId: string;
  startsAt?: Date;
  expiresAt?: Date;
  deviceLimit?: number;
  note?: string;
  actor: Actor;
}): Promise<SubscriptionWithPlan> {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: input.planId } });
  if (!plan) throw new SubscriptionError("Plan not found.");
  const startsAt = input.startsAt ?? new Date();
  const expiresAt = input.expiresAt ?? addDuration(startsAt, plan.durationValue, plan.durationUnit);
  if (expiresAt <= startsAt) throw new SubscriptionError("Expiration must be after the start date.");

  return prisma.$transaction(async (tx) => {
    const current = await tx.subscription.findMany({ where: { userId: input.userId, status: { in: CURRENT } }, include: { plan: true } });
    for (const c of current) {
      await tx.subscription.update({ where: { id: c.id }, data: { status: "CANCELLED" } });
      await record(tx, c, "CANCELLED", input.actor, { status: "CANCELLED" }, `Superseded by ${plan.name}`);
    }
    const created = await tx.subscription.create({
      data: { userId: input.userId, planId: plan.id, status: "ACTIVE", startsAt, expiresAt, deviceLimit: input.deviceLimit ?? plan.deviceLimit, note: input.note, createdById: input.actor?.id, source: "ADMIN" },
      include: { plan: true },
    });
    await tx.subscriptionHistory.create({
      data: { subscriptionId: created.id, userId: created.userId, actorId: input.actor?.id ?? null, action: "ASSIGNED", toStatus: "ACTIVE", toPlanName: plan.name, toExpiresAt: expiresAt, note: input.note ?? null },
    });
    return created;
  });
}

async function load(id: string): Promise<SubscriptionWithPlan> {
  const s = await prisma.subscription.findUnique({ where: { id }, include: { plan: true } });
  if (!s) throw new SubscriptionError("Subscription not found.");
  return s;
}

export async function changePlan(id: string, planId: string, opts: { recomputeExpiry: boolean; actor: Actor }) {
  const sub = await load(id);
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new SubscriptionError("Plan not found.");
  const expiresAt = opts.recomputeExpiry ? addDuration(new Date(), plan.durationValue, plan.durationUnit) : sub.expiresAt;
  return prisma.$transaction(async (tx) => {
    const updated = await tx.subscription.update({ where: { id }, data: { planId, deviceLimit: plan.deviceLimit, expiresAt }, include: { plan: true } });
    await record(tx, sub, "PLAN_CHANGED", opts.actor, { planName: plan.name, expiresAt });
    return updated;
  });
}

export async function extendSubscription(id: string, value: number, unit: DurationUnit, actor: Actor) {
  if (!Number.isInteger(value) || value < 1 || value > 3650) throw new SubscriptionError("Invalid extension.");
  const sub = await load(id);
  const base = sub.expiresAt.getTime() > Date.now() ? sub.expiresAt : new Date();
  const expiresAt = addDuration(base, value, unit);
  return prisma.$transaction(async (tx) => {
    const reactivate = sub.status === "EXPIRED";
    if (reactivate) {
      const other = await tx.subscription.count({ where: { userId: sub.userId, status: { in: CURRENT }, NOT: { id } } });
      if (other) throw new SubscriptionError("The user already has another current subscription.");
    }
    const updated = await tx.subscription.update({ where: { id }, data: { expiresAt, ...(reactivate ? { status: "ACTIVE" } : {}) }, include: { plan: true } });
    await record(tx, sub, "EXTENDED", actor, { expiresAt, status: updated.status }, `+${durationLabel(value, unit)}`);
    return updated;
  });
}

export async function setExpiry(id: string, expiresAt: Date, actor: Actor) {
  const sub = await load(id);
  if (expiresAt <= sub.startsAt) throw new SubscriptionError("Expiration must be after the start date.");
  return prisma.$transaction(async (tx) => {
    const reactivate = sub.status === "EXPIRED" && expiresAt.getTime() > Date.now();
    if (reactivate) {
      const other = await tx.subscription.count({ where: { userId: sub.userId, status: { in: CURRENT }, NOT: { id } } });
      if (other) throw new SubscriptionError("The user already has another current subscription.");
    }
    const updated = await tx.subscription.update({ where: { id }, data: { expiresAt, ...(reactivate ? { status: "ACTIVE" } : {}) }, include: { plan: true } });
    await record(tx, sub, "EXPIRY_SET", actor, { expiresAt, status: updated.status });
    return updated;
  });
}

export async function setSubscriptionStatus(id: string, status: "ACTIVE" | "SUSPENDED" | "CANCELLED", actor: Actor, note?: string) {
  const sub = await load(id);
  if (sub.status === status) return sub;
  if (status === "ACTIVE" && sub.expiresAt.getTime() <= Date.now()) throw new SubscriptionError("Extend the expiration date before activating an expired subscription.");
  return prisma.$transaction(async (tx) => {
    if (status === "ACTIVE" && !CURRENT.includes(sub.status)) {
      const other = await tx.subscription.count({ where: { userId: sub.userId, status: { in: CURRENT }, NOT: { id } } });
      if (other) throw new SubscriptionError("The user already has another current subscription. Cancel it first.");
    }
    const updated = await tx.subscription.update({ where: { id }, data: { status }, include: { plan: true } });
    const action = status === "ACTIVE" ? "ACTIVATED" : status === "SUSPENDED" ? "SUSPENDED" : "DEACTIVATED";
    await record(tx, sub, action, actor, { status }, note);
    return updated;
  });
}

export async function updateDeviceLimit(id: string, deviceLimit: number, actor: Actor) {
  if (!Number.isInteger(deviceLimit) || deviceLimit < 1 || deviceLimit > 1000) throw new SubscriptionError("Invalid device limit.");
  const sub = await load(id);
  return prisma.$transaction(async (tx) => {
    const updated = await tx.subscription.update({ where: { id }, data: { deviceLimit }, include: { plan: true } });
    await record(tx, sub, "PLAN_CHANGED", actor, {}, `Device limit ${sub.deviceLimit} → ${deviceLimit}`);
    return updated;
  });
}
