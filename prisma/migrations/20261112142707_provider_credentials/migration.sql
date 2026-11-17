-- CreateTable
CREATE TABLE "ProviderCredential" (
    "provider" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "keyHint" TEXT NOT NULL,
    "quota" JSONB,
    "quotaCheckedAt" TIMESTAMP(3),
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderCredential_pkey" PRIMARY KEY ("provider")
);
