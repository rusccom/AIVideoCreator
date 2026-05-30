const PII_KEYS = new Set([
  "email",
  "receipt_email",
  "customer_email",
  "name",
  "phone",
  "address",
  "billing_details",
  "customer_details",
  "shipping",
  "billing_address",
  "shipping_address",
  "tax_ids"
]);

export function redactStripeEvent(event: object): object {
  return redact(event) as object;
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (isPlainObject(value)) return redactObject(value);
  return value;
}

function redactObject(value: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    out[key] = PII_KEYS.has(key) ? "[redacted]" : redact(val);
  }
  return out;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
