-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED', 'PENDING');

-- CreateEnum
CREATE TYPE "SubscriptionAction" AS ENUM ('ASSIGNED', 'PLAN_CHANGED', 'EXTENDED', 'EXPIRY_SET', 'ACTIVATED', 'DEACTIVATED', 'SUSPENDED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DurationUnit" AS ENUM ('DAY', 'MONTH', 'YEAR');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('PENDING', 'SCANNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('SAFE', 'LOW_RISK', 'SUSPICIOUS', 'HIGH_RISK', 'MALICIOUS', 'INCONCLUSIVE');

-- CreateEnum
CREATE TYPE "CheckStatus" AS ENUM ('PASS', 'INFO', 'WARN', 'FAIL', 'ERROR', 'UNAVAILABLE', 'NOT_CONFIGURED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IntelStatus" AS ENUM ('CLEAN', 'MALICIOUS', 'SUSPICIOUS', 'UNKNOWN', 'NOT_CONFIGURED', 'DISABLED', 'UNAVAILABLE', 'ERROR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "userAgent" TEXT,
    "firstIp" TEXT,
    "lastIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "revokedReason" TEXT,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "requestIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonymousSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "userAgentHash" TEXT,
    "scansUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnonymousSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "durationValue" INTEGER NOT NULL,
    "durationUnit" "DurationUnit" NOT NULL,
    "priceUzs" INTEGER NOT NULL,
    "deviceLimit" INTEGER NOT NULL,
    "features" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "deviceLimit" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'ADMIN',
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionHistory" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "SubscriptionAction" NOT NULL,
    "fromStatus" "SubscriptionStatus",
    "toStatus" "SubscriptionStatus",
    "fromPlanName" TEXT,
    "toPlanName" TEXT,
    "fromExpiresAt" TIMESTAMP(3),
    "toExpiresAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "anonymousSessionId" TEXT,
    "deviceId" TEXT,
    "inputUrl" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "finalUrl" TEXT,
    "domain" TEXT NOT NULL,
    "registrableDomain" TEXT,
    "status" "ScanStatus" NOT NULL DEFAULT 'PENDING',
    "stage" TEXT,
    "verdict" "Verdict",
    "riskScore" INTEGER,
    "confidence" INTEGER,
    "ipHash" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanResult" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "urlAnalysis" JSONB,
    "domainInfo" JSONB,
    "dnsRecords" JSONB,
    "tlsInfo" JSONB,
    "redirects" JSONB,
    "content" JSONB,
    "download" JSONB,
    "recommendations" JSONB NOT NULL DEFAULT '[]',
    "modules" JSONB NOT NULL,
    "scoring" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanFinding" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "CheckStatus" NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'NONE',
    "weight" INTEGER NOT NULL DEFAULT 0,
    "result" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "evidence" JSONB,
    "source" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreatIntelligenceResult" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "IntelStatus" NOT NULL,
    "summary" TEXT NOT NULL,
    "details" JSONB,
    "latencyMs" INTEGER,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreatIntelligenceResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntelCache" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntelCache_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "ScannerConfiguration" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "modules" JSONB NOT NULL,
    "providers" JSONB NOT NULL,
    "weights" JSONB NOT NULL,
    "suspiciousKeywords" TEXT[],
    "suspiciousTlds" TEXT[],
    "urlShorteners" TEXT[],
    "suspiciousDomainPatterns" TEXT[],
    "trustedDomains" TEXT[],
    "brandDomains" JSONB NOT NULL,
    "requestTimeoutMs" INTEGER NOT NULL DEFAULT 8000,
    "scanTimeoutMs" INTEGER NOT NULL DEFAULT 45000,
    "maxRedirects" INTEGER NOT NULL DEFAULT 5,
    "maxResponseBytes" INTEGER NOT NULL DEFAULT 2000000,
    "maxDownloadBytes" INTEGER NOT NULL DEFAULT 10000000,
    "userAgent" TEXT NOT NULL,
    "virusTotalSubmitUnknown" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "ScannerConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingConfiguration" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "paymentNotice" TEXT NOT NULL DEFAULT 'Payments are currently unavailable. Subscription purchases will be enabled soon.',
    "ctaLabel" TEXT NOT NULL DEFAULT 'Coming Soon',
    "highlightLabel" TEXT NOT NULL DEFAULT 'Recommended',
    "showComparison" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "PricingConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "siteName" TEXT NOT NULL DEFAULT 'Innova Checker',
    "supportEmail" TEXT NOT NULL DEFAULT 'support@innovanetworks.uz',
    "logoUrl" TEXT NOT NULL DEFAULT '/brand/innova-logo-white.png',
    "freeScanLimit" INTEGER NOT NULL DEFAULT 1,
    "anonymousIpDailyLimit" INTEGER NOT NULL DEFAULT 5,
    "registrationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sessionTtlHours" INTEGER NOT NULL DEFAULT 168,
    "loginMaxAttempts" INTEGER NOT NULL DEFAULT 5,
    "deviceRemovalsPer30Days" INTEGER NOT NULL DEFAULT 3,
    "noSubscriptionDeviceLimit" INTEGER NOT NULL DEFAULT 1,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT NOT NULL DEFAULT 'Innova Checker is undergoing scheduled maintenance. Scanning will resume shortly.',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "targetLabel" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key","windowStart")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "ipHash" TEXT,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_deviceId_idx" ON "Session"("deviceId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Device_userId_revokedAt_idx" ON "Device"("userId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Device_userId_tokenHash_key" ON "Device"("userId", "tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousSession_tokenHash_key" ON "AnonymousSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AnonymousSession_ipHash_createdAt_idx" ON "AnonymousSession"("ipHash", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_slug_key" ON "SubscriptionPlan"("slug");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_isActive_sortOrder_idx" ON "SubscriptionPlan"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

-- CreateIndex
CREATE INDEX "Subscription_status_expiresAt_idx" ON "Subscription"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "SubscriptionHistory_userId_createdAt_idx" ON "SubscriptionHistory"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SubscriptionHistory_subscriptionId_idx" ON "SubscriptionHistory"("subscriptionId");

-- CreateIndex
CREATE INDEX "Scan_userId_createdAt_idx" ON "Scan"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Scan_anonymousSessionId_idx" ON "Scan"("anonymousSessionId");

-- CreateIndex
CREATE INDEX "Scan_ipHash_createdAt_idx" ON "Scan"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "Scan_verdict_idx" ON "Scan"("verdict");

-- CreateIndex
CREATE INDEX "Scan_domain_idx" ON "Scan"("domain");

-- CreateIndex
CREATE INDEX "Scan_status_createdAt_idx" ON "Scan"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ScanResult_scanId_key" ON "ScanResult"("scanId");

-- CreateIndex
CREATE INDEX "ScanFinding_scanId_module_idx" ON "ScanFinding"("scanId", "module");

-- CreateIndex
CREATE INDEX "ThreatIntelligenceResult_scanId_idx" ON "ThreatIntelligenceResult"("scanId");

-- CreateIndex
CREATE INDEX "ThreatIntelligenceResult_provider_status_idx" ON "ThreatIntelligenceResult"("provider", "status");

-- CreateIndex
CREATE INDEX "IntelCache_expiresAt_idx" ON "IntelCache"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");

-- CreateIndex
CREATE INDEX "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_anonymousSessionId_fkey" FOREIGN KEY ("anonymousSessionId") REFERENCES "AnonymousSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanResult" ADD CONSTRAINT "ScanResult_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanFinding" ADD CONSTRAINT "ScanFinding_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreatIntelligenceResult" ADD CONSTRAINT "ThreatIntelligenceResult_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- At most one current (ACTIVE, SUSPENDED or PENDING) subscription per user.
-- Prisma cannot express partial unique indexes, so it lives here.
CREATE UNIQUE INDEX "Subscription_one_current_per_user"
  ON "Subscription"("userId")
  WHERE "status" IN ('ACTIVE', 'SUSPENDED', 'PENDING');

-- Plans must be sane even if written outside the app.
ALTER TABLE "SubscriptionPlan"
  ADD CONSTRAINT "SubscriptionPlan_positive_values"
  CHECK ("durationValue" > 0 AND "priceUzs" >= 0 AND "deviceLimit" > 0);
