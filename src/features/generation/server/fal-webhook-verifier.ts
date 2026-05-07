import { createHash, createPublicKey, verify } from "node:crypto";

type JwksKey = {
  x?: string;
};

let jwksCache: JwksKey[] | undefined;
let jwksCacheTime = 0;

const JWKS_URL = "https://rest.fal.ai/.well-known/jwks.json";
const CACHE_MS = 24 * 60 * 60 * 1000;

export async function verifyFalWebhook(headers: Headers, body: string) {
  const values = readHeaders(headers);
  if (!values || !validTimestamp(values.timestamp)) {
    return false;
  }
  const message = buildMessage(values, body);
  const keys = await fetchJwks();
  return keys.some((key) => verifyKey(key, values.signature, message));
}

function readHeaders(headers: Headers) {
  const requestId = headers.get("x-fal-webhook-request-id");
  const userId = headers.get("x-fal-webhook-user-id");
  const timestamp = headers.get("x-fal-webhook-timestamp");
  const signature = headers.get("x-fal-webhook-signature");
  if (!requestId || !userId || !timestamp || !signature) {
    return null;
  }
  return { requestId, userId, timestamp, signature };
}

function validTimestamp(timestamp: string) {
  const value = Number.parseInt(timestamp, 10);
  if (Number.isNaN(value)) {
    return false;
  }
  return Math.abs(Math.floor(Date.now() / 1000) - value) <= 300;
}

function buildMessage(values: NonNullable<ReturnType<typeof readHeaders>>, body: string) {
  const hash = createHash("sha256").update(body).digest("hex");
  return Buffer.from([values.requestId, values.userId, values.timestamp, hash].join("\n"));
}

async function fetchJwks() {
  if (jwksCache && Date.now() - jwksCacheTime < CACHE_MS) {
    return jwksCache;
  }
  const response = await fetch(JWKS_URL);
  const data = (await response.json()) as { keys?: JwksKey[] };
  jwksCache = data.keys ?? [];
  jwksCacheTime = Date.now();
  return jwksCache;
}

function verifyKey(key: JwksKey, signatureHex: string, message: Buffer) {
  if (!key.x) {
    return false;
  }
  const signature = Buffer.from(signatureHex, "hex");
  const publicKey = createEd25519Key(Buffer.from(key.x, "base64url"));
  return verify(null, message, publicKey, signature);
}

function createEd25519Key(rawKey: Buffer) {
  const prefix = Buffer.from("302a300506032b6570032100", "hex");
  return createPublicKey({
    key: Buffer.concat([prefix, rawKey]),
    format: "der",
    type: "spki"
  });
}
