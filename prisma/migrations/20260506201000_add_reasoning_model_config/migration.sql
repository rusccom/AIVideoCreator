ALTER TABLE "ReasoningModel"
ADD COLUMN "reasoningEffort" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN "excludeReasoning" BOOLEAN NOT NULL DEFAULT true;

UPDATE "ReasoningModel"
SET "reasoningEffort" = 'medium',
    "excludeReasoning" = true
WHERE "key" = 'openai-gpt-5-5';
