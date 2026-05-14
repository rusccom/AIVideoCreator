import { Prisma, type Asset } from "@prisma/client";
import { createAssetFromRemoteUrl } from "@/shared/server/asset-storage-service";
import { recordOutboxEvent } from "@/shared/server/outbox";
import { prisma } from "@/shared/server/prisma";
import { touchProject } from "@/shared/server/project-touch";
import { recordModelUsage } from "@/shared/server/model-stats";
import { providerErrorPayload } from "@/shared/server/provider-error";

export async function completeImageGenerationJob(job: ImageGenerationJob, data: unknown) {
  try {
    const images = imagePayloads(data);
    if (images.length === 0) throw new Error("Image generation returned no images");
    const assets = await createImageAssets(job.userId, job.projectId!, images);
    await recordModelUsage(job.modelId, images.length);
    const ready = await markJobReady(job.id, job.projectId!, assets);
    await touchProject(job.projectId!).catch(() => undefined);
    return ready;
  } catch (error) {
    return markImageJobFailed(job.id, error, job.projectId ?? undefined);
  }
}

async function markJobReady(jobId: string, projectId: string, assets: Asset[]) {
  const output = { assets: assets.map(toGeneratedAsset) };
  return prisma.$transaction(async (tx) => {
    await recordJobResult(tx, jobId, output);
    await recordJobEvent(tx, jobId, "job.completed");
    await recordProjectEvent(tx, projectId, "images.ready", output);
    return tx.generationJob.update({
      where: { id: jobId },
      data: { status: "READY", completedAt: new Date() }
    });
  });
}

async function markImageJobFailed(jobId: string, error: unknown, projectId?: string) {
  const payload = providerErrorPayload(error);
  return prisma.$transaction(async (tx) => {
    await recordJobError(tx, jobId, payload);
    await recordJobEvent(tx, jobId, "job.failed");
    if (projectId) await recordProjectEvent(tx, projectId, "images.failed", { jobId });
    return tx.generationJob.update({
      where: { id: jobId },
      data: { status: "FAILED", completedAt: new Date() }
    });
  });
}

function imagePayloads(data: unknown) {
  const images = imagePayloadArray(data);
  const directImage = toImagePayload(record(data).image);
  return [...images, directImage].filter(isImagePayload);
}

function imagePayloadArray(data: unknown) {
  const images = Array.isArray(data) ? data : record(data).images;
  if (!Array.isArray(images)) return [];
  return images.map(toImagePayload).filter(isImagePayload);
}

async function createImageAssets(userId: string, projectId: string, images: ImagePayload[]) {
  return Promise.all(images.map((image) => createAssetFromRemoteUrl(assetData(userId, projectId, image))));
}

function assetData(userId: string, projectId: string, image: ImagePayload) {
  return {
    height: image.height,
    metadataJson: asJson(image),
    mimeType: image.content_type ?? "image/png",
    projectId,
    remoteUrl: image.url,
    sizeBytes: image.file_size,
    source: "FAL_GENERATION" as const,
    type: "IMAGE" as const,
    userId,
    width: image.width
  };
}

function toImagePayload(value: unknown) {
  const image = record(value) as Partial<ImagePayload>;
  return typeof image.url === "string" ? { ...image, url: image.url } : null;
}

function toGeneratedAsset(asset: Asset) {
  return {
    id: asset.id,
    url: `/api/assets/${asset.id}/signed-url`
  };
}

async function recordJobResult(
  tx: Prisma.TransactionClient,
  jobId: string,
  output: { assets: GeneratedAsset[] }
) {
  await tx.jobResult.upsert({
    where: { jobId },
    create: { jobId, assets: asJson(output.assets), rawResponse: asJson(output) },
    update: { assets: asJson(output.assets), rawResponse: asJson(output) }
  });
}

async function recordJobError(
  tx: Prisma.TransactionClient,
  jobId: string,
  payload: ReturnType<typeof providerErrorPayload>
) {
  await tx.jobError.upsert({
    where: { jobId },
    create: errorRecord(jobId, payload),
    update: errorUpdate(payload)
  });
}

function errorRecord(jobId: string, payload: ReturnType<typeof providerErrorPayload>) {
  return { jobId, ...errorUpdate(payload) };
}

function errorUpdate(payload: ReturnType<typeof providerErrorPayload>) {
  const source = record(payload);
  return {
    code: typeof source.code === "string" ? source.code : null,
    message: typeof source.message === "string" ? source.message : "Image generation failed",
    rawError: asJson(payload)
  };
}

async function recordProjectEvent(
  tx: Prisma.TransactionClient,
  projectId: string,
  type: string,
  payload: Prisma.InputJsonObject
) {
  await recordOutboxEvent(tx, { aggregateId: projectId, aggregateType: "project", type, payload });
}

async function recordJobEvent(tx: Prisma.TransactionClient, jobId: string, type: string) {
  await recordOutboxEvent(tx, {
    aggregateId: jobId,
    aggregateType: "generationJob",
    type,
    payload: { jobId }
  });
}

function isImagePayload(value: ImagePayload | null): value is ImagePayload {
  return Boolean(value);
}

function record(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

type ImagePayload = {
  content_type?: string;
  file_size?: number;
  height?: number;
  url: string;
  width?: number;
};

type ImageGenerationJob = Awaited<ReturnType<typeof prisma.generationJob.findUniqueOrThrow>>;
type GeneratedAsset = ReturnType<typeof toGeneratedAsset>;
