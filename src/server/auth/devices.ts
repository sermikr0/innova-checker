import type { Device } from "@/generated/prisma/client";
import { prisma } from "../db";
import { randomToken, sha256 } from "../crypto";
import { ApiError } from "../http";
import { getSystemSettings } from "../settings";
import { deviceLimitFor } from "../subscriptions/service";
import { audit } from "../audit";
import { describeUserAgent } from "./user-agent";

// A device is a registered machine: identified first by a random per-browser
// token in an httpOnly cookie, then by the browser fingerprint, so a private
// window or cleared cookies on the same machine is still the same device.
// Each registered device holds a licence slot until the user or an admin
// removes it; signing out does not free the slot.
export function activeDeviceWhere(userId: string) {
  return { userId, revokedAt: null };
}

export async function activeDeviceCount(userId: string): Promise<number> {
  return prisma.device.count({ where: activeDeviceWhere(userId) });
}

export async function resolveDeviceForLogin(input: {
  user: { id: string; role: string; email?: string };
  browserToken: string | null;
  fingerprintHash: string;
  ip: string;
  userAgent: string;
}): Promise<{ device: Device; browserToken: string | null }> {
  const { user, fingerprintHash } = input;
  const seen = { lastSeenAt: new Date(), lastIp: input.ip, userAgent: input.userAgent };

  if (input.browserToken) {
    const existing = await prisma.device.findUnique({ where: { userId_tokenHash: { userId: user.id, tokenHash: sha256(input.browserToken) } } });
    if (existing && !existing.revokedAt) {
      const device = await prisma.device.update({ where: { id: existing.id }, data: { ...seen, fingerprintHash } });
      return { device, browserToken: input.browserToken };
    }
  }

  // Same machine without the cookie (private window, cleared storage, second browser profile).
  const known = await prisma.device.findFirst({ where: { userId: user.id, revokedAt: null, fingerprintHash }, orderBy: { lastSeenAt: "desc" } });
  if (known) {
    const device = await prisma.device.update({ where: { id: known.id }, data: seen });
    return { device, browserToken: null };
  }

  const limit = await deviceLimitFor(user);
  if (limit !== null) {
    const registered = await activeDeviceCount(user.id);
    if (registered >= limit) {
      throw new ApiError(403, "DEVICE_LIMIT", `This account is already registered on ${registered} of ${limit} allowed device${limit === 1 ? "" : "s"}. Remove a device in Dashboard → Devices on a registered device, or ask your administrator.`, { limit, active: registered });
    }
  }
  const token = randomToken(32);
  const device = await prisma.device.create({
    data: { userId: user.id, tokenHash: sha256(token), fingerprintHash, label: describeUserAgent(input.userAgent), userAgent: input.userAgent, firstIp: input.ip, lastIp: input.ip },
  });
  await audit({ actor: user.email ? { id: user.id, email: user.email } : null, action: "DEVICE_REGISTERED", targetType: "Device", targetId: device.id, targetLabel: device.label, ip: input.ip, userAgent: input.userAgent });
  return { device, browserToken: token };
}

export async function revokeDevice(input: { deviceId: string; userId: string; actor: { id: string; email: string }; reason: "USER" | "ADMIN"; ip?: string; userAgent?: string }) {
  const device = await prisma.device.findFirst({ where: { id: input.deviceId, userId: input.userId } });
  if (!device) throw new ApiError(404, "NOT_FOUND", "Device not found.");
  if (device.revokedAt) return device;

  if (input.reason === "USER") {
    const settings = await getSystemSettings();
    const since = new Date(Date.now() - 30 * 86_400_000);
    const recent = await prisma.device.count({ where: { userId: input.userId, revokedById: input.userId, revokedReason: "USER", revokedAt: { gte: since } } });
    if (recent >= settings.deviceRemovalsPer30Days) {
      throw new ApiError(429, "DEVICE_REMOVAL_LIMIT", `You can remove up to ${settings.deviceRemovalsPer30Days} devices per 30 days. Contact your administrator to remove more.`);
    }
  }

  const now = new Date();
  const [updated] = await prisma.$transaction([
    prisma.device.update({ where: { id: device.id }, data: { revokedAt: now, revokedById: input.actor.id, revokedReason: input.reason } }),
    prisma.session.updateMany({ where: { deviceId: device.id, revokedAt: null }, data: { revokedAt: now } }),
  ]);
  await audit({ actor: input.actor, action: "DEVICE_REVOKED", targetType: "Device", targetId: device.id, targetLabel: device.label, metadata: { userId: input.userId, reason: input.reason }, ip: input.ip, userAgent: input.userAgent });
  return updated;
}
