-- Phase 1 schema migration: denormalized counters, OutboxEvent, SceneBranch,
-- Asset origin split. Old columns preserved; data backfilled inline so existing
-- code keeps working while application gradually migrates to the new shape.

-- New enums
CREATE TYPE "AssetOrigin" AS ENUM ('R2', 'EXTERNAL_URL', 'PENDING');
CREATE TYPE "SceneBranchKind" AS ENUM ('AI_CREATOR', 'MANUAL_CONTINUE');
CREATE TYPE "SceneBranchStatus" AS ENUM ('GENERATING', 'READY', 'FAILED');

-- User: denormalized counters
ALTER TABLE "User"
  ADD COLUMN "creditBalance"    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "storageBytesUsed" BIGINT  NOT NULL DEFAULT 0,
  ADD COLUMN "projectCount"     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastActiveAt"     TIMESTAMP(3);

-- Backfill User counters from existing rows
UPDATE "User" u SET
  "creditBalance"    = COALESCE((SELECT SUM(amount)::int FROM "CreditLedger" l WHERE l."userId" = u.id), 0),
  "storageBytesUsed" = COALESCE((SELECT SUM("sizeBytes")::bigint FROM "Asset" a WHERE a."userId" = u.id), 0),
  "projectCount"     = COALESCE((SELECT COUNT(*)::int FROM "Project" p WHERE p."userId" = u.id AND p."archivedAt" IS NULL), 0);

-- Project: denormalized counters
ALTER TABLE "Project"
  ADD COLUMN "sceneCount"        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "readySceneCount"   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "timelineItemCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "Project" p SET
  "sceneCount"        = COALESCE((SELECT COUNT(*)::int FROM "Scene" s WHERE s."projectId" = p.id), 0),
  "readySceneCount"   = COALESCE((SELECT COUNT(*)::int FROM "Scene" s WHERE s."projectId" = p.id AND s.status = 'READY'), 0),
  "timelineItemCount" = COALESCE((SELECT COUNT(*)::int FROM "TimelineItem" t WHERE t."projectId" = p.id), 0),
  "totalDurationSeconds" = COALESCE((SELECT SUM(COALESCE(t."durationSeconds", s."durationSeconds"))::int FROM "TimelineItem" t JOIN "Scene" s ON s.id = t."sceneId" WHERE t."projectId" = p.id), 0);

-- SceneBranch table (first-class entity for AI Creator sequences and manual continues)
CREATE TABLE "SceneBranch" (
  "id"          TEXT PRIMARY KEY,
  "projectId"   TEXT NOT NULL,
  "legacyKey"   TEXT,
  "kind"        "SceneBranchKind" NOT NULL,
  "status"      "SceneBranchStatus" NOT NULL DEFAULT 'GENERATING',
  "totalScenes" INTEGER NOT NULL DEFAULT 0,
  "readyScenes" INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SceneBranch_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SceneBranch_projectId_legacyKey_key" ON "SceneBranch"("projectId", "legacyKey");
CREATE INDEX "SceneBranch_projectId_status_idx" ON "SceneBranch"("projectId", "status");

-- Scene: add branch FK + status index
ALTER TABLE "Scene" ADD COLUMN "branchEntityId" TEXT;
ALTER TABLE "Scene"
  ADD CONSTRAINT "Scene_branchEntityId_fkey" FOREIGN KEY ("branchEntityId") REFERENCES "SceneBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill SceneBranch from existing branchId strings (one row per distinct branchId per project)
INSERT INTO "SceneBranch" ("id", "projectId", "legacyKey", "kind", "status", "totalScenes", "readyScenes", "createdAt", "updatedAt")
SELECT
  'scene_branch_' || md5(s."projectId" || ':' || s."branchId"),
  s."projectId",
  s."branchId",
  CASE WHEN s."branchId" LIKE 'ai_creator_sequence_%' THEN 'AI_CREATOR'::"SceneBranchKind" ELSE 'MANUAL_CONTINUE'::"SceneBranchKind" END,
  CASE
    WHEN bool_or(s.status = 'FAILED') THEN 'FAILED'::"SceneBranchStatus"
    WHEN bool_and(s.status = 'READY') THEN 'READY'::"SceneBranchStatus"
    ELSE 'GENERATING'::"SceneBranchStatus"
  END,
  COUNT(*)::int,
  COUNT(*) FILTER (WHERE s.status = 'READY')::int,
  MIN(s."createdAt"),
  MAX(s."updatedAt")
FROM "Scene" s
WHERE s."branchId" IS NOT NULL
GROUP BY s."projectId", s."branchId";

-- Wire scenes to their branch
UPDATE "Scene" s
SET "branchEntityId" = b.id
FROM "SceneBranch" b
WHERE b."legacyKey" = s."branchId" AND b."projectId" = s."projectId";

CREATE INDEX "Scene_projectId_status_idx" ON "Scene"("projectId", "status");
CREATE INDEX "Scene_branchEntityId_orderIndex_idx" ON "Scene"("branchEntityId", "orderIndex");

-- Explicit FK relations for nullable asset pointers and scene ancestry.
UPDATE "Project" p
SET "initialFrameAssetId" = NULL
WHERE "initialFrameAssetId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Asset" a WHERE a.id = p."initialFrameAssetId");

UPDATE "Project" p
SET "coverAssetId" = NULL
WHERE "coverAssetId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Asset" a WHERE a.id = p."coverAssetId");

UPDATE "Scene" s
SET "startFrameAssetId" = NULL
WHERE "startFrameAssetId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Asset" a WHERE a.id = s."startFrameAssetId");

UPDATE "Scene" s
SET "videoAssetId" = NULL
WHERE "videoAssetId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Asset" a WHERE a.id = s."videoAssetId");

UPDATE "Scene" s
SET "endFrameAssetId" = NULL
WHERE "endFrameAssetId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Asset" a WHERE a.id = s."endFrameAssetId");

UPDATE "Scene" s
SET "parentSceneId" = NULL
WHERE "parentSceneId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Scene" parent WHERE parent.id = s."parentSceneId");

CREATE INDEX "Project_initialFrameAssetId_idx" ON "Project"("initialFrameAssetId");
CREATE INDEX "Project_coverAssetId_idx" ON "Project"("coverAssetId");
CREATE INDEX "Scene_startFrameAssetId_idx" ON "Scene"("startFrameAssetId");
CREATE INDEX "Scene_videoAssetId_idx" ON "Scene"("videoAssetId");
CREATE INDEX "Scene_endFrameAssetId_idx" ON "Scene"("endFrameAssetId");
CREATE INDEX "Scene_parentSceneId_idx" ON "Scene"("parentSceneId");

ALTER TABLE "Project" ADD CONSTRAINT "Project_initialFrameAssetId_fkey"
  FOREIGN KEY ("initialFrameAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Project" ADD CONSTRAINT "Project_coverAssetId_fkey"
  FOREIGN KEY ("coverAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Scene" ADD CONSTRAINT "Scene_startFrameAssetId_fkey"
  FOREIGN KEY ("startFrameAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Scene" ADD CONSTRAINT "Scene_videoAssetId_fkey"
  FOREIGN KEY ("videoAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Scene" ADD CONSTRAINT "Scene_endFrameAssetId_fkey"
  FOREIGN KEY ("endFrameAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Scene" ADD CONSTRAINT "Scene_parentSceneId_fkey"
  FOREIGN KEY ("parentSceneId") REFERENCES "Scene"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Project indexes: better composite for active listing
DROP INDEX IF EXISTS "Project_userId_updatedAt_idx";
CREATE INDEX "Project_userId_archivedAt_updatedAt_idx" ON "Project"("userId", "archivedAt", "updatedAt");

-- Asset: origin split, CDN url, additional indexes
ALTER TABLE "Asset"
  ADD COLUMN "origin"      "AssetOrigin" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "r2Key"       TEXT,
  ADD COLUMN "externalUrl" TEXT,
  ADD COLUMN "cdnUrl"      TEXT,
  ADD COLUMN "signedUrlCache" JSONB;

-- Backfill origin from existing storageKey shape
UPDATE "Asset" SET
  "origin"      = CASE
    WHEN "storageKey" LIKE 'http%' THEN 'EXTERNAL_URL'::"AssetOrigin"
    WHEN "storageKey" = 'pending'  THEN 'PENDING'::"AssetOrigin"
    ELSE 'R2'::"AssetOrigin"
  END,
  "r2Key"       = CASE WHEN "storageKey" LIKE 'http%' OR "storageKey" = 'pending' THEN NULL ELSE "storageKey" END,
  "externalUrl" = CASE WHEN "storageKey" LIKE 'http%' THEN "storageKey" ELSE NULL END;

CREATE INDEX "Asset_projectId_type_createdAt_idx" ON "Asset"("projectId", "type", "createdAt");
CREATE INDEX "Asset_origin_r2Key_idx" ON "Asset"("origin", "r2Key");

ALTER TABLE "Asset" ADD CONSTRAINT "Asset_origin_storage_check" CHECK (
  ("origin" = 'R2' AND "r2Key" IS NOT NULL AND "externalUrl" IS NULL)
  OR ("origin" = 'EXTERNAL_URL' AND "externalUrl" IS NOT NULL AND "r2Key" IS NULL)
  OR ("origin" = 'PENDING' AND "r2Key" IS NULL AND "externalUrl" IS NULL)
);

-- GenerationJob: analytics columns + worker index
ALTER TABLE "GenerationJob"
  ADD COLUMN "estimatedCredits" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "actualCredits"    INTEGER,
  ADD COLUMN "durationMs"       INTEGER;

CREATE INDEX "GenerationJob_userId_type_status_idx" ON "GenerationJob"("userId", "type", "status");
CREATE INDEX "GenerationJob_status_createdAt_idx" ON "GenerationJob"("status", "createdAt");

-- Structured result/error tables; legacy JSON columns stay for compatibility.
CREATE TABLE "JobResult" (
  "jobId"       TEXT PRIMARY KEY,
  "assets"      JSONB NOT NULL DEFAULT '[]',
  "rawResponse" JSONB NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JobResult_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "GenerationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "JobError" (
  "jobId"     TEXT PRIMARY KEY,
  "code"      TEXT,
  "message"   TEXT NOT NULL,
  "rawError"  JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JobError_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "GenerationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "JobResult" ("jobId", "assets", "rawResponse", "createdAt")
SELECT
  id,
  COALESCE("outputJson"->'assets', '[]'::jsonb),
  "outputJson",
  COALESCE("completedAt", "createdAt")
FROM "GenerationJob"
WHERE "outputJson" IS NOT NULL;

INSERT INTO "JobError" ("jobId", "code", "message", "rawError", "createdAt")
SELECT
  id,
  "errorJson"->>'code',
  COALESCE("errorJson"->>'message', 'Generation failed'),
  "errorJson",
  COALESCE("completedAt", "createdAt")
FROM "GenerationJob"
WHERE "errorJson" IS NOT NULL;

-- CreditLedger: reporting index
CREATE INDEX "CreditLedger_userId_type_createdAt_idx" ON "CreditLedger"("userId", "type", "createdAt");

-- WebhookEvent: TTL
ALTER TABLE "WebhookEvent" ADD COLUMN "expiresAt" TIMESTAMP(3);
UPDATE "WebhookEvent" SET "expiresAt" = "createdAt" + interval '30 days';
CREATE INDEX "WebhookEvent_expiresAt_idx" ON "WebhookEvent"("expiresAt");

-- OutboxEvent table for transactional event publishing
CREATE TABLE "OutboxEvent" (
  "id"            TEXT PRIMARY KEY,
  "aggregateId"   TEXT NOT NULL,
  "aggregateType" TEXT NOT NULL,
  "type"          TEXT NOT NULL,
  "payload"       JSONB NOT NULL,
  "publishedAt"   TIMESTAMP(3),
  "attempts"      INTEGER NOT NULL DEFAULT 0,
  "lastError"     TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "OutboxEvent_publishedAt_createdAt_idx" ON "OutboxEvent"("publishedAt", "createdAt");
CREATE INDEX "OutboxEvent_aggregateType_aggregateId_createdAt_idx" ON "OutboxEvent"("aggregateType", "aggregateId", "createdAt");
