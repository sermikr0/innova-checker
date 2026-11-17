import type { PaymentIntent, PaymentProvider, Prisma } from "@/generated/prisma/client";
import QRCode from "qrcode";
import { prisma } from "../db";
import { randomToken, sha256 } from "../crypto";
import { env } from "../env";
import { ApiError } from "../http";
import { audit } from "../audit";
import { getSystemSettings } from "../settings";
import { addDuration } from "../subscriptions/service";
import { clickConfig, providerStatus } from "./config";

// Payment lifecycle: a signed-in user picks a plan on a registered device, gets
// a QR code valid for `paymentWindowSeconds`, pays in Click (or by card), and
// the provider's verified callback activates the subscription for that device.
// Payments started after the window closes are refused by the callback itself,
// so an old QR code can never be paid.

/** Grace for a Complete callback whose Prepare arrived inside the window. */
export const COMPLETE_GRACE_MS = 2 * 60_000;

export function payLink(token: string): string {
  return `${env().APP_URL}/pay/${token}`;
}

export function clickCheckoutUrl(intent: Pick<PaymentIntent, "id" | "number" | "amount">): string {
  const c = clickConfig();
  if (!c) throw new ApiError(503, "PAYMENTS_UNAVAILABLE", "Click payments are not configured yet.");
  const q = new URLSearchParams({
    service_id: c.serviceId,
    merchant_id: c.merchantId,
    amount: String(intent.amount),
    transaction_param: String(intent.number),
    return_url: `${env().APP_URL}/dashboard/billing?intent=${intent.id}`,
  });
  if (c.merchantUserId) q.set("merchant_user_id", c.merchantUserId);
  return `https://my.click.uz/services/pay?${q.toString()}`;
}

export async function createPaymentIntent(input: { userId: string; userEmail: string; deviceId: string; planSlug: string; provider: PaymentProvider; ip: string; userAgent: string }) {
  const status = providerStatus().find((p) => p.id === input.provider);
  if (!status?.available) throw new ApiError(503, "PAYMENTS_UNAVAILABLE", `${status?.label ?? "This payment method"} is not available yet.`);
  const plan = await prisma.subscriptionPlan.findFirst({ where: { slug: input.planSlug, isActive: true } });
  if (!plan) throw new ApiError(404, "PLAN_NOT_FOUND", "This plan is not available.");
  const amount = input.provider === "CLICK" ? plan.priceUzs : plan.priceUsdCents;
  if (amount <= 0) throw new ApiError(400, "PLAN_NOT_PURCHASABLE", `${plan.name} cannot be bought with ${status.label}.`);

  const settings = await getSystemSettings();
  const token = randomToken(24);
  const mock = !status.live;
  const now = new Date();
  const intent = await prisma.$transaction(async (tx) => {
    // One live QR per user: older unpaid codes are withdrawn.
    await tx.paymentIntent.updateMany({ where: { userId: input.userId, status: "PENDING" }, data: { status: "CANCELLED", cancelledAt: now, failureReason: "Superseded by a new payment" } });
    return tx.paymentIntent.create({
      data: {
        tokenHash: sha256(token),
        userId: input.userId,
        deviceId: input.deviceId,
        planId: plan.id,
        provider: input.provider,
        amount,
        currency: status.currency,
        mock,
        expiresAt: new Date(now.getTime() + settings.paymentWindowSeconds * 1000),
      },
    });
  });
  await audit({ actor: { id: input.userId, email: input.userEmail }, action: "PAYMENT_STARTED", targetType: "PaymentIntent", targetId: intent.id, targetLabel: `${plan.name} · ${amount} ${status.currency}`, metadata: { provider: input.provider, mock, number: intent.number }, ip: input.ip, userAgent: input.userAgent });

  const link = payLink(token);
  const qrSvg = await QRCode.toString(link, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: "#0b0b0d", light: "#ffffff" } });
  return { intent, plan, link, qrSvg };
}

/** Marks PENDING intents whose window has closed; called lazily on reads and callbacks. */
export async function expireIntent(intent: PaymentIntent): Promise<PaymentIntent> {
  if (intent.status !== "PENDING" || intent.expiresAt > new Date()) return intent;
  await prisma.paymentIntent.updateMany({ where: { id: intent.id, status: "PENDING" }, data: { status: "EXPIRED", failureReason: "QR code expired" } });
  return { ...intent, status: "EXPIRED" };
}

export async function intentByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const intent = await prisma.paymentIntent.findUnique({ where: { tokenHash: sha256(token) }, include: { plan: true } });
  return intent ? { ...(await expireIntent(intent)), plan: intent.plan } : null;
}

export async function logPaymentEvent(entry: { intentId?: string | null; provider: PaymentProvider; kind: string; request: Record<string, unknown>; response: Record<string, unknown>; ip?: string }) {
  // The Click signature is not secret but is useless in logs; never store the merchant secret.
  const request = Object.fromEntries(Object.entries(entry.request).filter(([k]) => k !== "sign_string"));
  await prisma.paymentEvent.create({ data: { intentId: entry.intentId ?? null, provider: entry.provider, kind: entry.kind, request: request as Prisma.InputJsonValue, response: entry.response as Prisma.InputJsonValue, ip: entry.ip ?? null } }).catch(() => {});
}

/**
 * Activates the paid subscription exactly once. The paying device keeps its slot;
 * if the plan allows fewer devices than are registered, the least recently used
 * other devices are signed out and removed.
 */
export async function fulfillIntent(intentId: string, providerTransId: string): Promise<{ alreadyPaid: boolean; subscriptionId: string | null }> {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.paymentIntent.updateMany({ where: { id: intentId, status: "PREPARED" }, data: { status: "PAID", paidAt: new Date(), providerTransId } });
    const intent = await tx.paymentIntent.findUniqueOrThrow({ where: { id: intentId }, include: { plan: true, user: true } });
    if (claimed.count === 0) return { alreadyPaid: intent.status === "PAID", subscriptionId: intent.subscriptionId };

    const now = new Date();
    const plan = intent.plan;
    const current = await tx.subscription.findFirst({ where: { userId: intent.userId, status: "ACTIVE" }, orderBy: { expiresAt: "desc" } });
    let subscriptionId: string;
    if (current && current.planId === plan.id && current.expiresAt > now) {
      // Renewal of the same plan stacks on top of the remaining time.
      const expiresAt = addDuration(current.expiresAt, plan.durationValue, plan.durationUnit);
      await tx.subscription.update({ where: { id: current.id }, data: { expiresAt, source: intent.provider, paymentIntentId: intent.id } });
      await tx.subscriptionHistory.create({ data: { subscriptionId: current.id, userId: intent.userId, action: "PURCHASED", fromStatus: "ACTIVE", toStatus: "ACTIVE", fromPlanName: plan.name, toPlanName: plan.name, fromExpiresAt: current.expiresAt, toExpiresAt: expiresAt, note: `Renewed via ${intent.provider} payment #${intent.number}` } });
      subscriptionId = current.id;
    } else {
      const open = await tx.subscription.findMany({ where: { userId: intent.userId, status: { in: ["ACTIVE", "SUSPENDED", "PENDING"] } } });
      for (const o of open) {
        await tx.subscription.update({ where: { id: o.id }, data: { status: "CANCELLED" } });
        await tx.subscriptionHistory.create({ data: { subscriptionId: o.id, userId: intent.userId, action: "CANCELLED", fromStatus: o.status, toStatus: "CANCELLED", note: `Replaced by paid ${plan.name}` } });
      }
      const expiresAt = addDuration(now, plan.durationValue, plan.durationUnit);
      const created = await tx.subscription.create({ data: { userId: intent.userId, planId: plan.id, status: "ACTIVE", startsAt: now, expiresAt, deviceLimit: plan.deviceLimit, source: intent.provider, paymentIntentId: intent.id, note: `Paid via ${intent.provider} #${intent.number}` } });
      await tx.subscriptionHistory.create({ data: { subscriptionId: created.id, userId: intent.userId, action: "PURCHASED", toStatus: "ACTIVE", toPlanName: plan.name, toExpiresAt: expiresAt, note: `Paid via ${intent.provider} payment #${intent.number}` } });
      subscriptionId = created.id;
    }

    const devices = await tx.device.findMany({ where: { userId: intent.userId, revokedAt: null }, orderBy: { lastSeenAt: "desc" } });
    const keep = new Set([intent.deviceId, ...devices.filter((d) => d.id !== intent.deviceId).map((d) => d.id)].filter(Boolean).slice(0, plan.deviceLimit));
    const drop = devices.filter((d) => !keep.has(d.id)).map((d) => d.id);
    if (drop.length) {
      await tx.device.updateMany({ where: { id: { in: drop } }, data: { revokedAt: now, revokedReason: "PLAN_LIMIT" } });
      await tx.session.updateMany({ where: { deviceId: { in: drop }, revokedAt: null }, data: { revokedAt: now } });
    }
    await tx.paymentIntent.update({ where: { id: intent.id }, data: { subscriptionId } });
    await tx.auditLog.create({ data: { actorId: intent.userId, actorEmail: intent.user.email, action: "SUBSCRIPTION_PURCHASED", targetType: "Subscription", targetId: subscriptionId, targetLabel: `${plan.name} · ${intent.amount} ${intent.currency}`, metadata: { provider: intent.provider, payment: intent.number, providerTransId, mock: intent.mock, removedDevices: drop.length } } });
    return { alreadyPaid: false, subscriptionId };
  });
}

/** Simulated card checkout for local testing (no card gateway is integrated yet). */
export async function simulateCardPayment(intentId: string, outcome: "pay" | "cancel"): Promise<void> {
  if (outcome === "cancel") {
    await prisma.paymentIntent.updateMany({ where: { id: intentId, status: "PENDING" }, data: { status: "CANCELLED", cancelledAt: new Date(), failureReason: "Cancelled in test checkout" } });
    return;
  }
  const prepared = await prisma.paymentIntent.updateMany({ where: { id: intentId, status: "PENDING", expiresAt: { gt: new Date() } }, data: { status: "PREPARED", preparedAt: new Date(), providerTransId: `mock-${Date.now()}` } });
  if (prepared.count) await fulfillIntent(intentId, `mock-${Date.now()}`);
}
