type ReasoningMessage = {
  content: string;
  role: "assistant" | "system" | "user";
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

export type ReasoningRequest = {
  maxTokens?: number;
  messages: ReasoningMessage[];
  responseFormat?: ReasoningResponseFormat;
  temperature?: number;
};

export type ReasoningRunner = (request: ReasoningRequest) => Promise<{ content: string }>;
