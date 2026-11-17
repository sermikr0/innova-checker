-- CreateEnum
CREATE TYPE "FreeScanMode" AS ENUM ('UNLIMITED', 'DAILY', 'TOTAL');

-- AlterTable
ALTER TABLE "Scan" ADD COLUMN     "country" VARCHAR(2);

-- AlterTable
ALTER TABLE "SystemSetting" ADD COLUMN     "freeScanMode" "FreeScanMode" NOT NULL DEFAULT 'TOTAL',
ADD COLUMN     "loginEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pricingVisible" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "FreeScanUsage" (
    "key" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreeScanUsage_pkey" PRIMARY KEY ("key","period")
);

-- CreateIndex
CREATE INDEX "FreeScanUsage_updatedAt_idx" ON "FreeScanUsage"("updatedAt");

-- CreateIndex
CREATE INDEX "Scan_createdAt_idx" ON "Scan"("createdAt");

-- Carry over free scans already used by anonymous visitors, so switching to the
-- per-device counter does not hand out a new free scan.
INSERT INTO "FreeScanUsage" ("key", "period", "used", "updatedAt")
SELECT "fingerprintHash", 'total', MAX("scansUsed"), CURRENT_TIMESTAMP
FROM "AnonymousSession"
WHERE "fingerprintHash" IS NOT NULL AND "scansUsed" > 0
GROUP BY "fingerprintHash"
ON CONFLICT DO NOTHING;
