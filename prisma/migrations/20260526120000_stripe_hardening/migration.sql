ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

ALTER TABLE "Payment"
  ADD COLUMN "refundedCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "refundedCredits" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "CreditLedger_stripeEventId_key"
  ON "CreditLedger"("stripeEventId")
  WHERE "stripeEventId" IS NOT NULL;
