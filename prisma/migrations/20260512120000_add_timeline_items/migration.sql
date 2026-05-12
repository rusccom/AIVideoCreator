CREATE TABLE "TimelineItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "trimStartSeconds" INTEGER NOT NULL DEFAULT 0,
    "trimEndSeconds" INTEGER,
    "durationSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimelineItem_pkey" PRIMARY KEY ("id")
);

INSERT INTO "TimelineItem" (
    "id",
    "projectId",
    "sceneId",
    "orderIndex",
    "durationSeconds",
    "createdAt",
    "updatedAt"
)
SELECT
    'timeline_' || "id",
    "projectId",
    "id",
    ROW_NUMBER() OVER (
        PARTITION BY "projectId"
        ORDER BY "orderIndex" ASC, "createdAt" ASC, "id" ASC
    ) - 1,
    "durationSeconds",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Scene";

CREATE UNIQUE INDEX "TimelineItem_projectId_orderIndex_key"
ON "TimelineItem"("projectId", "orderIndex");

CREATE INDEX "TimelineItem_projectId_sceneId_idx"
ON "TimelineItem"("projectId", "sceneId");

ALTER TABLE "TimelineItem"
ADD CONSTRAINT "TimelineItem_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TimelineItem"
ADD CONSTRAINT "TimelineItem_sceneId_fkey"
FOREIGN KEY ("sceneId") REFERENCES "Scene"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
