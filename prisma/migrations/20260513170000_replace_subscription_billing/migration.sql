CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELED');

CREATE TABLE "BillingSettings" (
    "id" TEXT NOT NULL,
    "creditsPerUsd" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "BillingSettings" ("id", "creditsPerUsd", "createdAt", "updatedAt")
VALUES ('global', 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageKey" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "credits" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Payment_stripeCheckoutSessionId_key"
ON "Payment"("stripeCheckoutSessionId");

CREATE INDEX "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_stripePaymentIntentId_idx" ON "Payment"("stripePaymentIntentId");

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE IF EXISTS "Subscription";
