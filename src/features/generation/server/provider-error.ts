import { Prisma } from "@prisma/client";

export function providerErrorPayload(error: unknown) {
  if (!(error instanceof Error)) return { error: asJsonValue(error) };
  const source = record(error);
  return asJsonValue({
    code: stringValue(source.code),
    name: error.name,
    message: error.message,
    status: numberValue(source.status),
    requestId: stringValue(source.requestId),
    timeoutType: stringValue(source.timeoutType),
    body: asJsonValue(source.body),
    cause: errorCause(source.cause)
  });
}

export function providerErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  const status = numberValue(record(error).status);
  if (error.name === "ApiError" && status === 403) return "Video provider rejected the request: Forbidden";
  if (error.name === "ApiError") return `Video provider error: ${error.message}`;
  return fallback;
}

function asJsonValue(value: unknown) {
  if (value === undefined) return null;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function record(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function numberValue(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function errorCause(value: unknown) {
  if (!(value instanceof Error)) return asJsonValue(value);
  return asJsonValue({ name: value.name, message: value.message });
}
