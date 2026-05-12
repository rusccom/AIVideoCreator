import { providerErrorPayload } from "./provider-error";

type LogLevel = "error" | "info" | "warn";

export function logProviderEvent(level: LogLevel, event: string, data: Record<string, unknown>) {
  const payload = {
    at: new Date().toISOString(),
    event,
    ...sanitizeObject(data)
  };
  writeLog(level, payload);
}

export function logProviderError(event: string, data: Record<string, unknown>, error: unknown) {
  logProviderEvent("error", event, {
    ...data,
    error: providerErrorPayload(error),
    failureKind: failureKind(error),
    stack: errorStack(error)
  });
}

function writeLog(level: LogLevel, payload: Record<string, unknown>) {
  if (level === "error") return console.error(payload);
  if (level === "warn") return console.warn(payload);
  return console.info(payload);
}

function sanitizeObject(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, sanitizeValue(key, value, 0)]));
}

function sanitizeValue(key: string, value: unknown, depth: number): unknown {
  if (depth > 3) return valueType(value);
  if (typeof value === "string") return sanitizeString(key, value);
  if (Array.isArray(value)) return value.slice(0, 8).map((item) => sanitizeValue(key, item, depth + 1));
  if (isRecord(value)) return sanitizeNested(value, depth);
  return value;
}

function sanitizeNested(value: Record<string, unknown>, depth: number) {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeValue(key, item, depth + 1)]));
}

function sanitizeString(key: string, value: string) {
  if (key.toLowerCase().includes("url")) return redactUrl(value);
  return value.length > 500 ? `${value.slice(0, 500)}...` : value;
}

function redactUrl(value: string) {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}?<redacted>`;
  } catch {
    return value.length > 160 ? `${value.slice(0, 160)}...` : value;
  }
}

function failureKind(error: unknown) {
  if (!isRecord(error)) return "unknown";
  if (typeof error.status === "number") return "http";
  if (networkErrorName(error.name)) return "network";
  return "unknown";
}

function networkErrorName(name: unknown) {
  return name === "AbortError" || name === "FetchError" || name === "TypeError";
}

function errorStack(error: unknown) {
  return error instanceof Error ? error.stack?.slice(0, 2000) : undefined;
}

function valueType(value: unknown) {
  if (value === null) return null;
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
