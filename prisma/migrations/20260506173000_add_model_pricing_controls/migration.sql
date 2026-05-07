ALTER TABLE "AiModel"
ADD COLUMN IF NOT EXISTS "supportedResolutions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "pricePerSecondByResolution" JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "minDurationSeconds" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "maxDurationSeconds" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN IF NOT EXISTS "defaultDurationSeconds" INTEGER NOT NULL DEFAULT 6;

UPDATE "AiModel"
SET
    "supportedResolutions" = ARRAY['480p', '720p'],
    "pricePerSecondByResolution" = '{"480p":5,"720p":7}'::jsonb,
    "minDurationSeconds" = 2,
    "maxDurationSeconds" = 15,
    "defaultDurationSeconds" = 6,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'grok-imagine-video';

ALTER TABLE "AiModel"
DROP COLUMN IF EXISTS "supportedDurations",
DROP COLUMN IF EXISTS "creditMultiplier";
