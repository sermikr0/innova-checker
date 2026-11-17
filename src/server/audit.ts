import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./db";

export type AuditAction =
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DELETED"
  | "USER_ACTIVATED"
  | "USER_DEACTIVATED"
  | "USER_REGISTERED"
  | "USER_PASSWORD_RESET"
  | "USER_PASSWORD_CHANGED"
  | "USER_LOGIN"
  | "USER_LOGIN_FAILED"
  | "ADMIN_LOGIN"
  | "SUBSCRIPTION_ASSIGNED"
  | "SUBSCRIPTION_CHANGED"
  | "SUBSCRIPTION_EXTENDED"
  | "SUBSCRIPTION_EXPIRY_SET"
  | "SUBSCRIPTION_ACTIVATED"
  | "SUBSCRIPTION_DEACTIVATED"
  | "SUBSCRIPTION_SUSPENDED"
  | "SUBSCRIPTION_CANCELLED"
  | "PLAN_CREATED"
  | "PLAN_UPDATED"
  | "PLAN_DELETED"
  | "PRICING_SETTINGS_UPDATED"
  | "SCANNER_CONFIG_UPDATED"
  | "SYSTEM_SETTINGS_UPDATED"
  | "SITE_CONTROLS_UPDATED"
  | "CLIENT_SESSIONS_REVOKED"
  | "DEVICE_REVOKED"
  | "SESSION_REVOKED"
  | "ACCOUNT_DELETED"
  | "INTEGRATION_KEY_UPDATED"
  | "INTEGRATION_KEY_REMOVED"
  | "USER_ROLE_CHANGED"
  | "IP_BLOCKED"
  | "IP_UNBLOCKED"
  | "DEVICE_REGISTERED"
  | "PAYMENT_STARTED"
  | "PAYMENT_PAID"
  | "PAYMENT_REJECTED"
  | "SUBSCRIPTION_PURCHASED";

export async function audit(entry: {
  actor?: { id: string; email: string } | null;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actor?.id ?? null,
        actorEmail: entry.actor?.email ?? null,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        targetLabel: entry.targetLabel,
        metadata: (entry.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        ipAddress: entry.ip ?? null,
        userAgent: entry.userAgent ?? null,
      },
    });
  } catch (e) {
    console.error("[audit] failed to write audit log", e);
  }
}
