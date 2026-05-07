-- CreateTable
CREATE TABLE "AiModel" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerModelId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "qualityTier" TEXT NOT NULL,
    "supportedAspectRatios" TEXT[],
    "supportedResolutions" TEXT[],
    "supportsStartFrame" BOOLEAN NOT NULL DEFAULT false,
    "supportsEndFrame" BOOLEAN NOT NULL DEFAULT false,
    "supportsSeed" BOOLEAN NOT NULL DEFAULT false,
    "pricePerSecondByResolution" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "minDurationSeconds" INTEGER NOT NULL DEFAULT 1,
    "maxDurationSeconds" INTEGER NOT NULL DEFAULT 6,
    "defaultDurationSeconds" INTEGER NOT NULL DEFAULT 6,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiModel_key_key" ON "AiModel"("key");

-- CreateIndex
CREATE INDEX "AiModel_provider_type_active_idx" ON "AiModel"("provider", "type", "active");

-- Seed initial active model
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
);
