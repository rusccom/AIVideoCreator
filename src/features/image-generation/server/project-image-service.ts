import { Prisma, type Asset } from "@prisma/client";
import { createAssetFromRemoteUrl } from "@/features/assets/server/asset-storage-service";
import { buildFalInput } from "@/features/generation/models/build-fal-input";
import { getSupportedModel } from "@/features/generation/models/catalog";
import { submitFalJob } from "@/features/generation/server/fal-client";
import { providerErrorPayload } from "@/features/generation/server/provider-error";
import { touchProject } from "@/features/projects/server/project-touch-service";
import { prisma } from "@/shared/server/prisma";
import { recordImageModelUsage } from "./image-model-service";
import type { GenerateProjectImageInput } from "./image-generation-schema";

export async function startProjectImageGeneration(
  userId: string,
  projectId: string,
  input: GenerateProjectImageInput
) {
  await assertProjectOwner(userId, projectId);
  const model = await imageModel(input.modelId);
  const job = await createImageJob(userId, projectId, model.id, input);
  try {
    const submitted = await submitFalJob({ ...falInput(model, input), webhookUrl: webhookUrl() });
    return setProviderRequest(job.id, submitted.request_id);
  } catch (error) {
    return markJobFailed(job.id, error);
  }
}

export async function completeProjectImageGeneration(job: ImageGenerationJob, data: unknown) {
  if (job.status === "READY") return job;
  try {
    const images = imagePayloads(data);
    if (images.length === 0) throw new Error("Image generation returned no images");
    const assets = await createImageAssets(job.userId, job.projectId!, images);
    await recordImageModelUsage(job.modelId, images.length);
    const ready = await markJobReady(job.id, assets);
    await touchProject(job.projectId!).catch(() => undefined);
    return ready;
  } catch (error) {
    return markJobFailed(job.id, error);
  }
}

async function imageModel(modelId: string) {
  const supported = getSupportedModel(modelId);
  const stored = await prisma.aiModel.findFirst({ where: { key: modelId, active: true } });
  if (!supported || !stored || supported.type !== "text-to-image") {
    throw new Error("Image model is not available");
  }
  return supported;
}

function falInput(model: NonNullable<ReturnType<typeof getSupportedModel>>, input: GenerateProjectImageInput) {
  return {
    providerModelId: model.providerModelId,
    input: buildFalInput(model.id, { image: imageInput(input) })
  };
}

async function createImageJob(
  userId: string,
  projectId: string,
  modelId: string,
  input: GenerateProjectImageInput
) {
  return prisma.generationJob.create({
    data: {
      userId,
      projectId,
      provider: "fal",
      modelId,
      type: "IMAGE_GENERATION",
      inputJson: asJson(input)
    }
  });
}

async function setProviderRequest(jobId: string, requestId: string) {
  return prisma.generationJob.update({
    where: { id: jobId },
    data: { providerRequestId: requestId, status: "GENERATING", startedAt: new Date() },
    select: { id: true, status: true }
  });
}

async function markJobReady(jobId: string, assets: Asset[]) {
  return prisma.generationJob.update({
    where: { id: jobId },
    data: { status: "READY", outputJson: asJson({ assets: assets.map(toGeneratedAsset) }), completedAt: new Date() }
  });
}

async function markJobFailed(jobId: string, error: unknown) {
  return prisma.generationJob.update({
    where: { id: jobId },
    data: { status: "FAILED", errorJson: asJson(providerErrorPayload(error)), completedAt: new Date() }
  });
}

function imageInput(input: GenerateProjectImageInput) {
  return {
    aspectRatio: input.aspectRatio,
    numImages: input.numImages,
    prompt: input.prompt,
    resolution: input.resolution
  };
}

async function createImageAssets(userId: string, projectId: string, images: ImagePayload[]) {
  const assets: Asset[] = [];
  for (const image of images) {
    assets.push(await createAssetFromRemoteUrl(assetData(userId, projectId, image)));
  }
  return assets;
}

function assetData(userId: string, projectId: string, image: ImagePayload) {
  return {
    userId,
    projectId,
    type: "IMAGE" as const,
    source: "FAL_GENERATION" as const,
    remoteUrl: image.url,
    mimeType: image.content_type ?? "image/png",
    sizeBytes: image.file_size,
    width: image.width,
    height: image.height,
    metadataJson: asJson(image)
  };
}

function toGeneratedAsset(asset: Asset) {
  return {
    id: asset.id,
    url: `/api/assets/${asset.id}/signed-url`
  };
}

function webhookUrl() {
  const appUrl = process.env.APP_URL;
  return appUrl ? `${appUrl}/api/fal/webhook` : undefined;
}

async function assertProjectOwner(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!project) throw new Error("Project not found");
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

function toImagePayload(value: unknown) {
  const image = record(value) as Partial<ImagePayload>;
  return typeof image.url === "string" ? { ...image, url: image.url } : null;
}

function record(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function isImagePayload(value: ImagePayload | null): value is ImagePayload {
  return Boolean(value);
}

type ImagePayload = {
  content_type?: string;
  file_size?: number;
  height?: number;
  url: string;
  width?: number;
};

type ImageGenerationJob = Awaited<ReturnType<typeof prisma.generationJob.findUniqueOrThrow>>;
