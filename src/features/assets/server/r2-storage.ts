import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client, type PutObjectCommandInput } from "@aws-sdk/client-s3";
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

  async createGetUrl(key: string, options?: R2GetUrlOptions) {
    const command = new GetObjectCommand({
      Bucket: r2Env().R2_BUCKET,
      Key: key,
      ResponseContentDisposition: contentDisposition(options?.downloadFileName)
    });
    return getSignedUrl(getR2Client(), command, { expiresIn: 900 });
  },

  async deleteObject(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: r2Env().R2_BUCKET,
      Key: key
    });
    await getR2Client().send(command);
  },

  async uploadLocalFile(input: R2LocalUploadInput) {
    await putObject({
      body: createReadStream(input.path),
      key: input.key,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes
    });
  },

  async uploadBuffer(input: R2BufferUploadInput) {
    await putObject({
      body: input.buffer,
      key: input.key,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.byteLength
    });
  },

  async uploadRemoteUrl(input: R2RemoteUploadInput) {
    const response = await fetch(input.url);
    if (!response.ok || !response.body) throw new Error(`R2 remote upload failed: ${response.status}`);
    const mimeType = input.mimeType || response.headers.get("content-type") || "application/octet-stream";
    return uploadRemoteResponse(input.key, mimeType, response);
  }
};

async function uploadRemoteResponse(key: string, mimeType: string, response: Response) {
  const sizeBytes = responseSize(response);
  if (!sizeBytes) return uploadBufferedResponse(key, mimeType, response);
  const body = Readable.fromWeb(response.body as unknown as NodeReadableStream);
  await putObject({ body, key, mimeType, sizeBytes });
  return { mimeType, sizeBytes };
}

async function uploadBufferedResponse(key: string, mimeType: string, response: Response) {
  const body = Buffer.from(await response.arrayBuffer());
  await putObject({ body, key, mimeType, sizeBytes: body.byteLength });
  return { mimeType, sizeBytes: body.byteLength };
}

async function putObject(input: R2PutObjectInput) {
  const command = new PutObjectCommand({
    Bucket: r2Env().R2_BUCKET,
    Key: input.key,
    Body: input.body,
    ContentLength: input.sizeBytes,
    ContentType: input.mimeType
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

function contentDisposition(fileName?: string) {
  if (!fileName) return undefined;
  const safe = fileName.replace(/[\\/"\r\n]+/g, "_");
  return `attachment; filename="${safe}"`;
}

type PutObjectBody = PutObjectCommandInput["Body"];

type R2GetUrlOptions = {
  downloadFileName?: string;
};

type R2LocalUploadInput = {
  key: string;
  mimeType: string;
  path: string;
  sizeBytes: number;
};

type R2BufferUploadInput = {
  buffer: Buffer;
  key: string;
  mimeType: string;
};

type R2RemoteUploadInput = {
  key: string;
  mimeType?: string;
  url: string;
};

type R2PutObjectInput = {
  body: PutObjectBody;
  key: string;
  mimeType: string;
  sizeBytes: number;
};
