import { getSelectedReasoningModel } from "./reasoning-model-service";
import { recordReasoningUsage, type ReasoningUsage } from "./reasoning-usage";

type ReasoningMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ReasoningRequest = {
  maxTokens?: number;
  messages: ReasoningMessage[];
  responseFormat?: ReasoningResponseFormat;
  temperature?: number;
};

export async function runReasoning(request: ReasoningRequest) {
  const model = await getSelectedReasoningModel();
  const response = await openRouterChat(model, request);
  const usage = parseUsage(response.usage);
  await recordReasoningUsage(model, usage);
  return { content: responseContent(response), modelKey: model.key, usage };
}

async function openRouterChat(model: ReasoningRuntimeModel, request: ReasoningRequest) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(requestBody(model, request))
  });
  if (!response.ok) throw new Error("OpenRouter reasoning request failed");
  return response.json() as Promise<OpenRouterResponse>;
}

function requestBody(model: ReasoningRuntimeModel, request: ReasoningRequest) {
  return {
    model: model.providerModelId,
    messages: request.messages,
    temperature: request.temperature,
    max_tokens: request.maxTokens,
    response_format: request.responseFormat,
    reasoning: reasoningConfig(model)
  };
}

function reasoningConfig(model: ReasoningRuntimeModel) {
  return {
    effort: model.reasoningEffort,
    exclude: model.excludeReasoning
  };
}

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${openRouterApiKey()}`
  };
}

function openRouterApiKey() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured");
  return key;
}

function responseContent(response: OpenRouterResponse) {
  return response.choices?.[0]?.message?.content ?? "";
}

function parseUsage(value: Record<string, unknown> | undefined): ReasoningUsage {
  const usage = value ?? {};
  const promptTokens = numberAt(usage, "prompt_tokens", "promptTokens");
  const completionTokens = numberAt(usage, "completion_tokens", "completionTokens");
  const reasoningTokens = reasoningTokenCount(usage);
  const totalTokens = numberAt(usage, "total_tokens", "totalTokens") || promptTokens + completionTokens + reasoningTokens;
  return { promptTokens, completionTokens, reasoningTokens, totalTokens };
}

function reasoningTokenCount(usage: Record<string, unknown>) {
  const details = recordAt(usage, "completion_tokens_details");
  return numberAt(usage, "reasoning_tokens", "reasoningTokens") || numberAt(details, "reasoning_tokens", "reasoningTokens");
}

function numberAt(source: Record<string, unknown>, ...keys: string[]) {
  const value = keys.map((key) => source[key]).find((item) => typeof item === "number");
  return typeof value === "number" ? value : 0;
}

function recordAt(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

type OpenRouterResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: Record<string, unknown>;
};

type ReasoningResponseFormat = {
  json_schema: {
    name: string;
    schema: Record<string, unknown>;
    strict?: boolean;
  };
  type: "json_schema";
} | {
  type: "json_object";
};

type ReasoningRuntimeModel = {
  providerModelId: string;
  reasoningEffort: string;
  excludeReasoning: boolean;
};
