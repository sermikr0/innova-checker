import { prisma } from "../db";
import { hmac } from "../crypto";
import { ApiError } from "../http";
import { hitRateLimit } from "../rate-limit";
import { getSystemSettings } from "../settings";
import { audit } from "../audit";

// Brute-force protection: after `loginMaxAttempts` failed sign-ins from one IP
// within the lockout window, the IP is blocked from every authentication and
// scanning endpoint for `ipBlockMinutes`. A successful sign-in does not reset the
// counter, so an attacker cannot interleave a known-good account to keep guessing.

export async function activeIpBlock(ip: string) {
  return prisma.ipBlock.findFirst({ where: { ip, blockedUntil: { gt: new Date() } } });
}

export async function assertIpNotBlocked(ip: string): Promise<void> {
  const block = await activeIpBlock(ip);
  if (block) {
    const minutes = Math.max(1, Math.ceil((block.blockedUntil.getTime() - Date.now()) / 60_000));
    throw new ApiError(429, "IP_BLOCKED", `Too many failed sign-in attempts from your network. Access is blocked for about ${minutes} minute(s).`, { retryAfter: minutes * 60 });
  }
}

/** Counts a failed sign-in; blocks the IP once the limit is reached. Returns true when it was blocked. */
export async function recordAuthFailure(ip: string, context: { email?: string; userAgent?: string }): Promise<boolean> {
  const settings = await getSystemSettings();
  const window = settings.loginLockoutMinutes * 60;
  const hit = await hitRateLimit(`authfail:ip:${hmac(ip)}`, settings.loginMaxAttempts - 1, window);
  if (hit.ok) return false;
  const blockedUntil = new Date(Date.now() + settings.ipBlockMinutes * 60_000);
  await prisma.ipBlock.upsert({
    where: { ip },
    create: { ip, reason: "Repeated failed sign-in attempts", failures: hit.count, blockedUntil },
    update: { reason: "Repeated failed sign-in attempts", failures: hit.count, blockedUntil, unblockedById: null },
  });
  await audit({ action: "IP_BLOCKED", targetType: "IpBlock", targetLabel: ip, metadata: { failures: hit.count, minutes: settings.ipBlockMinutes, lastEmail: context.email }, ip, userAgent: context.userAgent });
  return true;
}

export async function unblockIp(id: string, actor: { id: string; email: string }, ip?: string): Promise<void> {
  const block = await prisma.ipBlock.update({ where: { id }, data: { blockedUntil: new Date(), unblockedById: actor.id } });
  await prisma.rateLimitBucket.deleteMany({ where: { key: `authfail:ip:${hmac(block.ip)}` } });
  await audit({ actor, action: "IP_UNBLOCKED", targetType: "IpBlock", targetId: block.id, targetLabel: block.ip, ip });
}
