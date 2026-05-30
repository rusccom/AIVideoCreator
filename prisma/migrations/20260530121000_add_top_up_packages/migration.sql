CREATE TABLE "TopUpPackage" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "bonusCredits" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopUpPackage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TopUpPackage_key_key" ON "TopUpPackage"("key");
CREATE INDEX "TopUpPackage_active_sortOrder_idx" ON "TopUpPackage"("active", "sortOrder");

INSERT INTO "TopUpPackage" ("id", "key", "label", "amountCents", "bonusCredits", "currency", "popular", "active", "sortOrder", "createdAt", "updatedAt")
VALUES
  ('topup_usd_10', 'usd_10', '$10', 1000, 0, 'usd', false, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('topup_usd_20', 'usd_20', '$20', 2000, 0, 'usd', true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('topup_usd_50', 'usd_50', '$50', 5000, 0, 'usd', false, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
