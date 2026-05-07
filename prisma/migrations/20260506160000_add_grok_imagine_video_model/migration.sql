ALTER TABLE "AiModel"
ADD COLUMN IF NOT EXISTS "supportedResolutions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "pricePerSecondByResolution" JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "minDurationSeconds" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "maxDurationSeconds" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN IF NOT EXISTS "defaultDurationSeconds" INTEGER NOT NULL DEFAULT 6;

DELETE FROM "AiModel"
WHERE "key" <> 'grok-imagine-video';

INSERT INTO "AiModel" (
    "id",
    "key",
    "provider",
    "providerModelId",
    "type",
    "displayName",
    "qualityTier",
    "supportedAspectRatios",
    "supportedResolutions",
    "supportsStartFrame",
    "supportsEndFrame",
    "supportsSeed",
    "pricePerSecondByResolution",
    "minDurationSeconds",
    "maxDurationSeconds",
    "defaultDurationSeconds",
    "active",
    "updatedAt"
) VALUES (
    'aimodel_grok_imagine_video',
    'grok-imagine-video',
    'fal',
    'xai/grok-imagine-video/image-to-video',
    'image-to-video',
    'Grok Imagine Video',
    'premium',
    ARRAY['auto', '16:9', '4:3', '3:2', '1:1', '2:3', '3:4', '9:16'],
    ARRAY['480p', '720p'],
    true,
    false,
    false,
    '{"480p":5,"720p":7}'::jsonb,
    2,
    15,
    6,
    true,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO UPDATE SET
    "provider" = EXCLUDED."provider",
    "providerModelId" = EXCLUDED."providerModelId",
    "type" = EXCLUDED."type",
    "displayName" = EXCLUDED."displayName",
    "qualityTier" = EXCLUDED."qualityTier",
    "supportedAspectRatios" = EXCLUDED."supportedAspectRatios",
    "supportedResolutions" = EXCLUDED."supportedResolutions",
    "supportsStartFrame" = EXCLUDED."supportsStartFrame",
    "supportsEndFrame" = EXCLUDED."supportsEndFrame",
    "supportsSeed" = EXCLUDED."supportsSeed",
    "active" = EXCLUDED."active",
    "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "CreditLedger"
SET "generationJobId" = NULL
WHERE "generationJobId" IN (
    SELECT "id" FROM "GenerationJob"
    WHERE "type"::text NOT IN ('VIDEO_GENERATION', 'FRAME_EXTRACT', 'EXPORT')
);

DELETE FROM "GenerationJob"
WHERE "type"::text NOT IN ('VIDEO_GENERATION', 'FRAME_EXTRACT', 'EXPORT');

ALTER TYPE "JobType" RENAME TO "JobType_old";
CREATE TYPE "JobType" AS ENUM ('VIDEO_GENERATION', 'FRAME_EXTRACT', 'EXPORT');
ALTER TABLE "GenerationJob"
ALTER COLUMN "type" TYPE "JobType"
USING "type"::text::"JobType";
DROP TYPE "JobType_old";

ALTER TABLE "Scene"
ALTER COLUMN "durationSeconds" SET DEFAULT 6;

UPDATE "Scene"
SET "durationSeconds" = 6
WHERE "durationSeconds" <> 6;

ALTER TABLE "Scene"
DROP COLUMN IF EXISTS "negativePrompt";

ALTER TABLE "Scene"
DROP COLUMN IF EXISTS "motionSettingsJson";
