import { GetObjectCommand, PutObjectCommand, S3Client, type PutObjectCommandInput } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";

let client: S3Client | undefined;

export const r2Storage = {
  bucketName() {
    return r2Env().R2_BUCKET;
  },

  async createPutUrl(key: string, mimeType: string) {
    const command = new PutObjectCommand({
      Bucket: r2Env().R2_BUCKET,
      Key: key,
      ContentType: mimeType
    });
    return getSignedUrl(getR2Client(), command, { expiresIn: 900 });
  },

  async createGetUrl(key: string) {
    const command = new GetObjectCommand({
      Bucket: r2Env().R2_BUCKET,
      Key: key
    });
    return getSignedUrl(getR2Client(), command, { expiresIn: 900 });
  },

  async uploadLocalFile(input: R2LocalUploadInput) {
    await putObject(input.key, input.mimeType, createReadStream(input.path));
  },

  async uploadRemoteUrl(input: R2RemoteUploadInput) {
    const response = await fetch(input.url);
    if (!response.ok || !response.body) throw new Error(`R2 remote upload failed: ${response.status}`);
    const mimeType = input.mimeType || response.headers.get("content-type") || "application/octet-stream";
    const body = Readable.fromWeb(response.body as unknown as NodeReadableStream);
    await putObject(input.key, mimeType, body);
    return { mimeType, sizeBytes: responseSize(response) };
  }
};

async function putObject(key: string, mimeType: string, body: PutObjectBody) {
  const command = new PutObjectCommand({
    Bucket: r2Env().R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: mimeType
  });
  await getR2Client().send(command);
}

function getR2Client() {
  if (!client) client = new S3Client(clientConfig());
  return client;
}

function clientConfig() {
  const env = r2Env();
  return {
    region: "auto",
    endpoint: env.R2_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY
    }
  };
}

function r2Env() {
  const { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET } = process.env;
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT || !R2_BUCKET) {
    throw new Error("R2 environment variables are required");
  }
  return { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET };
}

function responseSize(response: Response) {
  const value = Number(response.headers.get("content-length"));
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

type PutObjectBody = PutObjectCommandInput["Body"];

type R2LocalUploadInput = {
  key: string;
  mimeType: string;
  path: string;
};

type R2RemoteUploadInput = {
  key: string;
  mimeType?: string;
  url: string;
};
