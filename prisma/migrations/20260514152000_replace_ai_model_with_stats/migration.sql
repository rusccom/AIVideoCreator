-- Keep model catalog in code. Persist only operational stats and owner overrides.

CREATE TABLE "AiModelStats" (
  "key" TEXT NOT NULL,
  "usageRequestCount" INTEGER NOT NULL DEFAULT 0,
  "usageGeneratedImages" INTEGER NOT NULL DEFAULT 0,
  "aiCreatorImageCount" INTEGER NOT NULL DEFAULT 4,
  "lastUsedAt" TIMESTAMP(3),
  "pricePerSecondOverride" JSONB,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "selected" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AiModelStats_pkey" PRIMARY KEY ("key")
);

INSERT INTO "AiModelStats" (
  "key",
  "usageRequestCount",
  "usageGeneratedImages",
  "aiCreatorImageCount",
  "lastUsedAt",
  "pricePerSecondOverride",
  "active",
  "createdAt",
  "updatedAt"
)
SELECT
  "key",
  "usageRequestCount",
  "usageGeneratedImages",
  "aiCreatorImageCount",
  "lastUsedAt",
  "pricePerSecondByResolution",
  "active",
  "createdAt",
  "updatedAt"
FROM "AiModel";

CREATE INDEX "AiModelStats_active_idx" ON "AiModelStats"("active");
CREATE INDEX "AiModelStats_selected_active_idx" ON "AiModelStats"("selected", "active");

DROP TABLE "AiModel";
