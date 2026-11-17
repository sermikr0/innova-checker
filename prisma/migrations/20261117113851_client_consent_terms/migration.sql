-- AlterTable
ALTER TABLE "Scan" ADD COLUMN     "consentId" TEXT;

-- AlterTable
ALTER TABLE "SystemSetting" ADD COLUMN     "consentEmailVerification" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "consentRequired" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "ClientConsent" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "termsVersion" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locale" VARCHAR(5) NOT NULL,
    "ipAddress" TEXT,
    "country" VARCHAR(2),
    "userAgent" TEXT,
    "fingerprintHash" TEXT,
    "userId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "codeHash" TEXT,
    "codeExpiresAt" TIMESTAMP(3),
    "codeAttempts" INTEGER NOT NULL DEFAULT 0,
    "codeSentAt" TIMESTAMP(3),
    "codesSent" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientConsent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientConsent_tokenHash_key" ON "ClientConsent"("tokenHash");

-- CreateIndex
CREATE INDEX "ClientConsent_email_idx" ON "ClientConsent"("email");

-- CreateIndex
CREATE INDEX "ClientConsent_fingerprintHash_idx" ON "ClientConsent"("fingerprintHash");

-- CreateIndex
CREATE INDEX "ClientConsent_userId_idx" ON "ClientConsent"("userId");

-- CreateIndex
CREATE INDEX "ClientConsent_createdAt_idx" ON "ClientConsent"("createdAt");

-- CreateIndex
CREATE INDEX "Scan_consentId_idx" ON "Scan"("consentId");

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_consentId_fkey" FOREIGN KEY ("consentId") REFERENCES "ClientConsent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientConsent" ADD CONSTRAINT "ClientConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
