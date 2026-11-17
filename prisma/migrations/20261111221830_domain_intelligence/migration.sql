-- CreateEnum
CREATE TYPE "DomainListType" AS ENUM ('WHITELIST', 'BLACKLIST', 'SUSPICIOUS');

-- CreateEnum
CREATE TYPE "DomainMatchScope" AS ENUM ('DOMAIN', 'HOST', 'URL');

-- CreateEnum
CREATE TYPE "DomainRecordStatus" AS ENUM ('ACTIVE', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "DomainTrustStatus" AS ENUM ('VERIFIED_OFFICIAL', 'CONFIRMED_MALICIOUS', 'SUSPECTED', 'UNVERIFIED');

-- AlterEnum
ALTER TYPE "Verdict" ADD VALUE 'TRUSTED';

-- AlterTable
ALTER TABLE "ScanResult" ADD COLUMN     "domainDbMatch" JSONB;

-- AlterTable
ALTER TABLE "SystemSetting" ADD COLUMN     "allowUserDeviceRemoval" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "loginLockoutMinutes" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "passwordMinLength" INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "preferences" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "DomainRecord" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "listType" "DomainListType" NOT NULL,
    "scope" "DomainMatchScope" NOT NULL DEFAULT 'DOMAIN',
    "status" "DomainRecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "trustStatus" "DomainTrustStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "platformName" TEXT,
    "companyName" TEXT,
    "officialUrl" TEXT,
    "category" TEXT,
    "brandKeywords" TEXT[],
    "verificationSource" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'ADMIN',
    "submittedById" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "lastRevalidatedAt" TIMESTAMP(3),
    "revalidationStatus" TEXT,
    "revalidationNote" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DomainRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainRecordHistory" (
    "id" TEXT NOT NULL,
    "recordId" TEXT,
    "domain" TEXT NOT NULL,
    "listType" "DomainListType" NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DomainRecordHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRun" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "summary" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DomainRecord_listType_status_idx" ON "DomainRecord"("listType", "status");

-- CreateIndex
CREATE INDEX "DomainRecord_status_createdAt_idx" ON "DomainRecord"("status", "createdAt");

-- CreateIndex
CREATE INDEX "DomainRecord_origin_idx" ON "DomainRecord"("origin");

-- CreateIndex
CREATE UNIQUE INDEX "DomainRecord_domain_listType_key" ON "DomainRecord"("domain", "listType");

-- CreateIndex
CREATE INDEX "DomainRecordHistory_recordId_createdAt_idx" ON "DomainRecordHistory"("recordId", "createdAt");

-- CreateIndex
CREATE INDEX "DomainRecordHistory_domain_idx" ON "DomainRecordHistory"("domain");

-- CreateIndex
CREATE INDEX "DomainRecordHistory_createdAt_idx" ON "DomainRecordHistory"("createdAt");

-- CreateIndex
CREATE INDEX "JobRun_name_startedAt_idx" ON "JobRun"("name", "startedAt");

-- AddForeignKey
ALTER TABLE "DomainRecord" ADD CONSTRAINT "DomainRecord_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DomainRecordHistory" ADD CONSTRAINT "DomainRecordHistory_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "DomainRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
