import { Prisma } from "@prisma/client";
import { buildFalInput } from "@/features/generation/models/build-fal-input";
import { getSupportedModel } from "@/features/generation/models/catalog";
import { subscribeFalJob } from "@/features/generation/server/fal-client";
import { prisma } from "@/shared/server/prisma";
import { recordImageModelUsage } from "./image-model-service";
import type { GenerateProjectImageInput } from "./image-generation-schema";

export async function generateProjectImage(
  userId: string,
  projectId: string,
  input: GenerateProjectImageInput
) {
  await assertProjectOwner(userId, projectId);
  const model = await imageModel(input.modelId);
  const result = await subscribeFalJob(falInput(model, input));
  const images = imagePayloads(result.data);
  const assets = await createImageAssets(userId, projectId, images);
  await recordImageModelUsage(model.id, images.length);
  return { assets };
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

function imageInput(input: GenerateProjectImageInput) {
  return {
    aspectRatio: input.aspectRatio,
    numImages: input.numImages,
    prompt: input.prompt,
    resolution: input.resolution
  };
}

async function createImageAssets(userId: string, projectId: string, images: ImagePayload[]) {
  const assets = [];
  for (const image of images) {
    assets.push(await prisma.asset.create({ data: assetData(userId, projectId, image) }));
  }
  return assets;
}

function assetData(userId: string, projectId: string, image: ImagePayload) {
  return {
    userId,
    projectId,
    type: "IMAGE" as const,
    source: "FAL_GENERATION" as const,
    storageProvider: "fal",
    storageBucket: "fal",
    storageKey: image.url,
    mimeType: image.content_type ?? "image/png",
    sizeBytes: image.file_size,
    width: image.width,
    height: image.height,
    metadataJson: asJson(image)
  };
}

async function assertProjectOwner(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!project) throw new Error("Project not found");
}

function imagePayloads(data: unknown) {
  const images = record(data).images;
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
