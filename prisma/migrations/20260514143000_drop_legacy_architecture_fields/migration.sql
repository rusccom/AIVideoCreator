-- Backfill remaining legacy columns, then remove them from the runtime schema.

-- SceneBranch: keep compatibility with old string branchId values.
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
  COUNT(*)::integer,
  COUNT(*) FILTER (WHERE s.status = 'READY')::integer,
  MIN(s."createdAt"),
  NOW()
FROM "Scene" s
WHERE s."branchId" IS NOT NULL
GROUP BY s."projectId", s."branchId"
ON CONFLICT ("projectId", "legacyKey") DO UPDATE SET
  "status" = EXCLUDED."status",
  "totalScenes" = EXCLUDED."totalScenes",
  "readyScenes" = EXCLUDED."readyScenes",
  "updatedAt" = NOW();

UPDATE "Scene" s
SET "branchEntityId" = b.id
FROM "SceneBranch" b
WHERE s."branchId" IS NOT NULL
  AND s."branchEntityId" IS NULL
  AND b."projectId" = s."projectId"
  AND b."legacyKey" = s."branchId";

-- Asset: preserve old storageKey data in explicit origin columns before dropping.
UPDATE "Asset"
SET
  "origin" = CASE
    WHEN "storageKey" LIKE 'http%' THEN 'EXTERNAL_URL'::"AssetOrigin"
    WHEN "storageKey" = 'pending' THEN 'PENDING'::"AssetOrigin"
    ELSE 'R2'::"AssetOrigin"
  END,
  "r2Key" = CASE WHEN "storageKey" LIKE 'http%' OR "storageKey" = 'pending' THEN NULL ELSE "storageKey" END,
  "externalUrl" = CASE WHEN "storageKey" LIKE 'http%' THEN "storageKey" ELSE NULL END
WHERE "r2Key" IS NULL AND "externalUrl" IS NULL;

-- GenerationJob: move inputJson to the new input column.
ALTER TABLE "GenerationJob" ADD COLUMN "input" JSONB;
UPDATE "GenerationJob" SET "input" = "inputJson";
ALTER TABLE "GenerationJob" ALTER COLUMN "input" SET NOT NULL;

INSERT INTO "JobResult" ("jobId", "assets", "rawResponse", "createdAt")
SELECT
  id,
  COALESCE("outputJson"->'assets', '[]'::jsonb),
  "outputJson",
  COALESCE("completedAt", NOW())
FROM "GenerationJob"
WHERE "outputJson" IS NOT NULL
ON CONFLICT ("jobId") DO NOTHING;

INSERT INTO "JobError" ("jobId", "code", "message", "rawError", "createdAt")
SELECT
  id,
  "errorJson"->>'code',
  COALESCE("errorJson"->>'message', 'Generation failed'),
  "errorJson",
  COALESCE("completedAt", NOW())
FROM "GenerationJob"
WHERE "errorJson" IS NOT NULL
ON CONFLICT ("jobId") DO NOTHING;

-- ExportJob: make R2 storage explicit and flatten the error message.
ALTER TABLE "ExportJob" ADD COLUMN "r2Key" TEXT;
ALTER TABLE "ExportJob" ADD COLUMN "errorMessage" TEXT;

UPDATE "ExportJob"
SET
  "r2Key" = CASE WHEN "storageKey" IS NULL OR "storageKey" LIKE 'http%' THEN NULL ELSE "storageKey" END,
  "errorMessage" = "errorJson"->>'message';

-- Drop old indexes and columns.
DROP INDEX IF EXISTS "Scene_projectId_orderIndex_branchId_key";
DROP INDEX IF EXISTS "SceneBranch_projectId_legacyKey_key";

ALTER TABLE "Scene" DROP COLUMN "branchId";
ALTER TABLE "Scene" DROP COLUMN "aiPrompt";
ALTER TABLE "SceneBranch" DROP COLUMN "legacyKey";

ALTER TABLE "Asset" DROP CONSTRAINT IF EXISTS "Asset_origin_storage_check";
ALTER TABLE "Asset" DROP COLUMN "storageProvider";
ALTER TABLE "Asset" DROP COLUMN "storageBucket";
ALTER TABLE "Asset" DROP COLUMN "storageKey";
ALTER TABLE "Asset" DROP COLUMN "thumbnailAssetId";
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_origin_storage_check" CHECK (
  ("origin" = 'R2' AND "r2Key" IS NOT NULL AND "externalUrl" IS NULL)
  OR ("origin" = 'EXTERNAL_URL' AND "externalUrl" IS NOT NULL AND "r2Key" IS NULL)
  OR ("origin" = 'PENDING' AND "r2Key" IS NULL AND "externalUrl" IS NULL)
);

ALTER TABLE "GenerationJob" DROP COLUMN "inputJson";
ALTER TABLE "GenerationJob" DROP COLUMN "outputJson";
ALTER TABLE "GenerationJob" DROP COLUMN "errorJson";

ALTER TABLE "ExportJob" DROP COLUMN "storageKey";
ALTER TABLE "ExportJob" DROP COLUMN "errorJson";

DROP TABLE IF EXISTS "BillingSettings";
