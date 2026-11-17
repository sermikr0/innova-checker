import "server-only";
import { cookies, headers } from "next/headers";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "../db";
import { hmac, newScanId, randomToken, sha256 } from "../crypto";
import { ApiError, clientIp, userAgent } from "../http";
import { hitRateLimit } from "../rate-limit";
import { dbLookupCache, getScannerSettings, getSystemSettings } from "../settings";
import { env } from "../env";
import { resolveProviderKeys } from "../integrations";
import { ANON_COOKIE, cookieOptions } from "../auth/cookies";
import { getSession, type CurrentSession } from "../auth/session";
import { activeDeviceCount } from "../auth/devices";
import { requireFingerprint } from "../auth/fingerprint";
import { assertIpNotBlocked } from "../auth/ip-block";
import { getActiveSubscription } from "../subscriptions/service";
import { analyze } from "../scanner/engine";
import { dbDomainLookup, getWhitelistBrands, mergeBrands } from "../domain-intel/service";
import { InvalidUrlError, normalizeInputUrl } from "../scanner/normalize";
import type { StageKey } from "../scanner/types";
import { hasUnlimitedAccess } from "@/lib/roles";

// ─── Concurrency ──────────────────────────────────────────────────────────────
const MAX_CONCURRENT_SCANS = Number(process.env.MAX_CONCURRENT_SCANS ?? 4);
let running = 0;
const waiting: (() => void)[] = [];

async function acquire(): Promise<() => void> {
  if (running >= MAX_CONCURRENT_SCANS) await new Promise<void>((r) => waiting.push(r));
  running++;
  return () => {
    running--;
    waiting.shift()?.();
  };
}

// ─── Anonymous visitors ───────────────────────────────────────────────────────
// A visitor is recognised by cookie first and by device fingerprint second, so a
// private window or cleared cookies on the same machine reuses the same free
// scan instead of getting a new one.
async function getOrCreateAnonymousSession(ipHash: string, ua: string, fingerprintHash: string) {
  const jar = await cookies();
  const token = jar.get(ANON_COOKIE)?.value;
  if (token && token.length <= 100) {
    const found = await prisma.anonymousSession.findUnique({ where: { tokenHash: sha256(token) } });
    if (found) {
      await prisma.anonymousSession.update({ where: { id: found.id }, data: { lastSeenAt: new Date(), fingerprintHash: found.fingerprintHash ?? fingerprintHash } }).catch(() => {});
      return found;
    }
  }
  const fresh = randomToken(32);
  const sameMachine = await prisma.anonymousSession.findFirst({ where: { fingerprintHash }, orderBy: { scansUsed: "desc" } });
  if (sameMachine) {
    // Re-key the existing visitor record to this browser's new cookie.
    const reused = await prisma.anonymousSession.update({ where: { id: sameMachine.id }, data: { tokenHash: sha256(fresh), lastSeenAt: new Date() } });
    jar.set(ANON_COOKIE, fresh, cookieOptions(365 * 24 * 3600));
    return reused;
  }
  const created = await prisma.anonymousSession.create({ data: { tokenHash: sha256(fresh), ipHash, fingerprintHash, userAgentHash: ua ? sha256(ua) : null } });
  jar.set(ANON_COOKIE, fresh, cookieOptions(365 * 24 * 3600));
  return created;
}

export async function currentAnonymousSessionId(): Promise<string | null> {
  const token = (await cookies()).get(ANON_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const found = await prisma.anonymousSession.findUnique({ where: { tokenHash: sha256(token) }, select: { id: true } });
  return found?.id ?? null;
}

/** Attaches scans made before signing in to the user's history. */
export async function claimAnonymousScans(userId: string): Promise<void> {
  const anonId = await currentAnonymousSessionId();
  if (anonId) await prisma.scan.updateMany({ where: { anonymousSessionId: anonId, userId: null }, data: { userId } });
}

// ─── Authorisation to scan ────────────────────────────────────────────────────
export async function assertCanScan(session: CurrentSession): Promise<void> {
  if (hasUnlimitedAccess(session.user.role)) return;
  const sub = await getActiveSubscription(session.user.id);
  if (!sub) {
    throw new ApiError(402, "SUBSCRIPTION_REQUIRED", "An active subscription is required to scan URLs. Choose a plan or contact your administrator.");
  }
  if (!session.deviceId) throw new ApiError(403, "DEVICE_REQUIRED", "This session is not bound to a registered device. Please sign in again.");
  const active = await activeDeviceCount(session.user.id);
  if (active > sub.deviceLimit) {
    throw new ApiError(403, "DEVICE_LIMIT_EXCEEDED", `Your ${sub.plan.name} plan allows ${sub.deviceLimit} device${sub.deviceLimit === 1 ? "" : "s"}, but ${active} are registered. Remove devices in Dashboard → Devices to continue scanning.`, { limit: sub.deviceLimit, active });
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────
export async function startScan(rawUrl: string): Promise<{ id: string }> {
  const h = await headers();
  const ip = clientIp(h);
  const ua = userAgent(h);
  const ipHash = hmac(ip);
  await assertIpNotBlocked(ip);
  const [system, session] = await Promise.all([getSystemSettings(), getSession()]);

  if (system.maintenanceMode && session?.user.role !== "SUPER_ADMIN") {
    throw new ApiError(503, "MAINTENANCE", system.maintenanceMessage);
  }

  let normalized;
  try {
    normalized = normalizeInputUrl(rawUrl);
  } catch (e) {
    if (e instanceof InvalidUrlError) throw new ApiError(400, "INVALID_URL", e.message);
    throw e;
  }

  const base = {
    id: newScanId(),
    inputUrl: rawUrl.slice(0, 2048),
    normalizedUrl: normalized.normalized,
    domain: normalized.url.hostname.replace(/^\[|\]$/g, "").toLowerCase(),
    ipHash,
  };

  if (session) {
    await assertCanScan(session);
    // Unlimited roles have no quota; only a high ceiling against runaway scripts remains.
    const unlimited = hasUnlimitedAccess(session.user.role);
    const perMin = await hitRateLimit(`scan:user:${session.user.id}:m`, unlimited ? 120 : 20, 60);
    if (!perMin.ok) throw new ApiError(429, "RATE_LIMITED", "Too many scans. Please wait a minute.", { retryAfter: perMin.retryAfterSec });
    const perDay = await hitRateLimit(`scan:user:${session.user.id}:d`, unlimited ? 50_000 : 1000, 86400);
    if (!perDay.ok) throw new ApiError(429, "RATE_LIMITED", "Daily scan limit reached.", { retryAfter: perDay.retryAfterSec });
    await prisma.scan.create({ data: { ...base, userId: session.user.id, deviceId: session.deviceId } });
    return { id: base.id };
  }

  const burst = await hitRateLimit(`scan:anon-ip:${ipHash}:m`, 10, 60);
  if (!burst.ok) throw new ApiError(429, "RATE_LIMITED", "Too many requests. Please wait a minute.", { retryAfter: burst.retryAfterSec });

  const fp = requireFingerprint(h);
  const anon = await getOrCreateAnonymousSession(ipHash, ua, fp.hash);
  const claimed = await prisma.anonymousSession.updateMany({ where: { id: anon.id, scansUsed: { lt: system.freeScanLimit } }, data: { scansUsed: { increment: 1 } } });
  if (claimed.count === 0) throw freeScanUsed();
  const daily = await hitRateLimit(`scan:anon-ip:${ipHash}:d`, system.anonymousIpDailyLimit, 86400);
  if (!daily.ok) {
    await prisma.anonymousSession.update({ where: { id: anon.id }, data: { scansUsed: { decrement: 1 } } });
    throw freeScanUsed();
  }
  await prisma.scan.create({ data: { ...base, anonymousSessionId: anon.id } });
  return { id: base.id };
}

function freeScanUsed() {
  return new ApiError(403, "FREE_SCAN_USED", "Your free security scan has been used. Create an account and choose a subscription plan to continue analyzing suspicious URLs.");
}

// ─── Execute ──────────────────────────────────────────────────────────────────
export async function executeScan(id: string): Promise<void> {
  const release = await acquire();
  try {
    const scan = await prisma.scan.findUnique({ where: { id } });
    if (!scan || scan.status !== "PENDING") return;
    await prisma.scan.update({ where: { id }, data: { status: "SCANNING", startedAt: new Date(), stage: "" } });
    const settings = await getScannerSettings();
    settings.brandDomains = mergeBrands(settings.brandDomains, await getWhitelistBrands());
    const done = new Set<StageKey>();
    const report = await analyze(scan.normalizedUrl, settings, {
      cache: dbLookupCache,
      keys: await resolveProviderKeys(),
      virusTotalPerMinute: env().VIRUSTOTAL_REQUESTS_PER_MINUTE,
      domainDb: dbDomainLookup,
      onStage: async (s) => {
        done.add(s);
        await prisma.scan.update({ where: { id }, data: { stage: [...done].join(",") } });
      },
    });

    const json = (v: unknown) => (v === null || v === undefined ? undefined : (JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue));
    await prisma.$transaction([
      prisma.scan.update({
        where: { id },
        data: {
          status: "COMPLETED",
          stage: "validate,domain,reputation,redirects,ssl,content,intel",
          verdict: report.verdict,
          riskScore: report.riskScore,
          confidence: report.confidence,
          finalUrl: report.finalUrl,
          registrableDomain: report.registrableDomain,
          completedAt: new Date(report.completedAt),
          durationMs: report.durationMs,
        },
      }),
      prisma.scanResult.create({
        data: {
          scanId: id,
          summary: report.summary,
          urlAnalysis: json(report.data.urlAnalysis),
          domainInfo: json(report.data.domainInfo),
          dnsRecords: json(report.data.dnsRecords),
          tlsInfo: json(report.data.tlsInfo),
          redirects: json(report.data.redirects),
          content: json(report.data.content),
          download: json(report.data.download),
          recommendations: report.recommendations,
          domainDbMatch: json(report.domainDb),
          modules: json(report.modules) as Prisma.InputJsonValue,
          scoring: json({ ...report.scoring, riskLevel: report.riskLevel }) as Prisma.InputJsonValue,
        },
      }),
      prisma.scanFinding.createMany({
        data: report.findings.map((f) => ({
          scanId: id,
          module: f.module,
          code: f.code,
          title: f.title,
          status: f.status,
          severity: f.severity,
          weight: f.weight,
          result: f.result.slice(0, 2000),
          explanation: f.explanation,
          evidence: json(f.evidence),
          source: f.source,
          checkedAt: new Date(f.checkedAt),
        })),
      }),
      prisma.threatIntelligenceResult.createMany({
        data: report.intel.map((r) => ({ scanId: id, provider: r.provider, status: r.status, summary: r.summary, details: json(r.details), latencyMs: r.latencyMs ?? null, checkedAt: new Date(r.checkedAt) })),
      }),
    ]);
  } catch (e) {
    console.error(`[scan ${id}] failed`, e);
    await prisma.scan.update({ where: { id }, data: { status: "FAILED", errorMessage: (e as Error).message.slice(0, 500), completedAt: new Date() } }).catch(() => {});
  } finally {
    release();
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────
const STALE_AFTER_MS = 3 * 60 * 1000;

export async function failStaleScan(scan: { id: string; status: string; createdAt: Date }) {
  if ((scan.status === "PENDING" || scan.status === "SCANNING") && Date.now() - scan.createdAt.getTime() > STALE_AFTER_MS) {
    await prisma.scan.updateMany({ where: { id: scan.id, status: { in: ["PENDING", "SCANNING"] } }, data: { status: "FAILED", errorMessage: "The scan was interrupted. Please run it again." } });
    return true;
  }
  return false;
}

/** Returns the scan only if the current viewer may see it (owner, same anonymous session, or admin). */
export async function getViewableScan(id: string) {
  if (!id || id.length > 64) return null;
  const scan = await prisma.scan.findUnique({ where: { id } });
  if (!scan) return null;
  const session = await getSession();
  let allowed = false;
  if (session?.user.role === "SUPER_ADMIN") allowed = true;
  else if (session && scan.userId === session.user.id) allowed = true;
  else if (!scan.userId || !session) {
    const anonId = await currentAnonymousSessionId();
    allowed = !!anonId && scan.anonymousSessionId === anonId && !scan.userId;
  }
  if (!allowed) return null;
  if (await failStaleScan(scan)) return prisma.scan.findUnique({ where: { id } });
  return scan;
}

export async function getFullReport(id: string) {
  const scan = await getViewableScan(id);
  if (!scan) return null;
  const [result, findings, intel] = await Promise.all([
    prisma.scanResult.findUnique({ where: { scanId: id } }),
    prisma.scanFinding.findMany({ where: { scanId: id }, orderBy: [{ weight: "desc" }, { checkedAt: "asc" }] }),
    prisma.threatIntelligenceResult.findMany({ where: { scanId: id }, orderBy: { provider: "asc" } }),
  ]);
  return { scan, result, findings, intel };
}

export type FullReport = NonNullable<Awaited<ReturnType<typeof getFullReport>>>;
