import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createReadStream } from "node:fs";

let client: S3Client | undefined;

function r2Env() {
  const { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET } = process.env;
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT || !R2_BUCKET) {
    throw new Error("R2 environment variables are required");
  }
  return { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET };
}

export function getR2Client() {
  if (!client) {
    const env = r2Env();
    client = new S3Client({
      region: "auto",
      endpoint: env.R2_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY
      }
    });
  }
  return client;
}

export async function createPutUrl(key: string, mimeType: string) {
  const command = new PutObjectCommand({
    Bucket: r2Env().R2_BUCKET,
    Key: key,
    ContentType: mimeType
  });
  return getSignedUrl(getR2Client(), command, { expiresIn: 900 });
}

export async function createGetUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: r2Env().R2_BUCKET,
    Key: key
  });
  return getSignedUrl(getR2Client(), command, { expiresIn: 900 });
}

export async function uploadFile(key: string, mimeType: string, path: string) {
  const command = new PutObjectCommand({
    Bucket: r2Env().R2_BUCKET,
    Key: key,
    Body: createReadStream(path),
    ContentType: mimeType
  });
  await getR2Client().send(command);
}

export function bucketName() {
  return r2Env().R2_BUCKET;
}
