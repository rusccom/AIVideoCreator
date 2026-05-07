ALTER TABLE "AiModel"
DROP COLUMN IF EXISTS "usagePromptTokensUsed",
DROP COLUMN IF EXISTS "usageCompletionTokensUsed",
DROP COLUMN IF EXISTS "usageReasoningTokensUsed",
DROP COLUMN IF EXISTS "usageTotalTokensUsed";
