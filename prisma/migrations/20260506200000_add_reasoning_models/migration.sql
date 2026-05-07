CREATE TABLE "ReasoningModel" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerModelId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "contextWindowTokens" INTEGER NOT NULL,
    "inputTokenPriceUsdPerMillion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outputTokenPriceUsdPerMillion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "promptTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "completionTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "reasoningTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "totalTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReasoningModel_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReasoningModel_key_key" ON "ReasoningModel"("key");
CREATE INDEX "ReasoningModel_provider_active_idx" ON "ReasoningModel"("provider", "active");
CREATE INDEX "ReasoningModel_selected_active_idx" ON "ReasoningModel"("selected", "active");
CREATE UNIQUE INDEX "ReasoningModel_single_selected_idx" ON "ReasoningModel"("selected") WHERE "selected" = true;

INSERT INTO "ReasoningModel" (
    "id",
    "key",
    "provider",
    "providerModelId",
    "displayName",
    "contextWindowTokens",
    "inputTokenPriceUsdPerMillion",
    "outputTokenPriceUsdPerMillion",
    "selected",
    "active",
    "updatedAt"
) VALUES (
    'reasoning_openai_gpt_5_5',
    'openai-gpt-5-5',
    'openrouter',
    'openai/gpt-5.5',
    'OpenAI GPT-5.5',
    1050000,
    5,
    30,
    true,
    true,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO UPDATE SET
    "provider" = EXCLUDED."provider",
    "providerModelId" = EXCLUDED."providerModelId",
    "displayName" = EXCLUDED."displayName",
    "contextWindowTokens" = EXCLUDED."contextWindowTokens",
    "inputTokenPriceUsdPerMillion" = EXCLUDED."inputTokenPriceUsdPerMillion",
    "outputTokenPriceUsdPerMillion" = EXCLUDED."outputTokenPriceUsdPerMillion",
    "updatedAt" = CURRENT_TIMESTAMP;
