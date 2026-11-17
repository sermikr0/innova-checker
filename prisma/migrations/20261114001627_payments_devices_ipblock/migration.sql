-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('CLICK', 'CARD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PREPARED', 'PAID', 'EXPIRED', 'CANCELLED', 'FAILED');

-- AlterEnum
ALTER TYPE "SubscriptionAction" ADD VALUE 'PURCHASED';

-- AlterTable
ALTER TABLE "AnonymousSession" ADD COLUMN     "fingerprintHash" TEXT;

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "fingerprintHash" TEXT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "paymentIntentId" TEXT;

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "priceUsdCents" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SystemSetting" ADD COLUMN     "ipBlockMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "paymentWindowSeconds" INTEGER NOT NULL DEFAULT 180;

-- CreateTable
CREATE TABLE "IpBlock" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "blockedUntil" TIMESTAMP(3) NOT NULL,
    "unblockedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IpBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentIntent" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT,
    "planId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "mock" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "providerTransId" TEXT,
    "preparedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "subscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "intentId" TEXT,
    "provider" "PaymentProvider" NOT NULL,
    "kind" TEXT NOT NULL,
    "request" JSONB NOT NULL,
    "response" JSONB NOT NULL,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IpBlock_ip_key" ON "IpBlock"("ip");

-- CreateIndex
CREATE INDEX "IpBlock_blockedUntil_idx" ON "IpBlock"("blockedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_number_key" ON "PaymentIntent"("number");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_tokenHash_key" ON "PaymentIntent"("tokenHash");

-- CreateIndex
CREATE INDEX "PaymentIntent_userId_createdAt_idx" ON "PaymentIntent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentIntent_status_expiresAt_idx" ON "PaymentIntent"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "PaymentEvent_intentId_idx" ON "PaymentEvent"("intentId");

-- CreateIndex
CREATE INDEX "PaymentEvent_createdAt_idx" ON "PaymentEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AnonymousSession_fingerprintHash_idx" ON "AnonymousSession"("fingerprintHash");

-- CreateIndex
CREATE INDEX "Device_userId_fingerprintHash_idx" ON "Device"("userId", "fingerprintHash");

-- AddForeignKey
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "PaymentIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
