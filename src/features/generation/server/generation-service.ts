import { Prisma } from "@prisma/client";
import { r2Storage } from "@/features/assets/server/r2-storage";
import { buildFalInput } from "@/features/generation/models/build-fal-input";
import { prisma } from "@/shared/server/prisma";
import { reserveCredits } from "./credit-service";
import { submitFalJob } from "./fal-client";
import { failGenerationJob } from "./generation-result-service";
import type { GenerateVideoInput, ResolvedGenerateVideoInput, SelectStartImageInput } from "./generation-schema";
import { getModel } from "./model-registry";
import { estimateVideoCredits, resolveVideoInput } from "./pricing-service";

export async function selectStartImage(
  userId: string,
  projectId: string,
  input: SelectStartImageInput
) {
  await assertProjectOwner(userId, projectId);
  await assertAssetOwner(userId, input.assetId);
  return prisma.project.update({
    where: { id: projectId },
    data: { initialFrameAssetId: input.assetId, coverAssetId: input.assetId }
  });
}

export async function generateVideo(userId: string, sceneId: string, input: GenerateVideoInput) {
  const scene = await ownedScene(userId, sceneId);
  const model = await getModel(input.modelId);
  const videoInput = resolveVideoInput(model, input);
  const credits = estimateVideoCredits(model, videoInput);
  const asset = await startFrameAsset(scene.startFrameAssetId);
  const startUrl = await assetReadUrl(asset.storageKey);
  const endUrl = await endFrameUrl(scene.endFrameAssetId, model.supportsEndFrame);
  const job = await createJob({ userId, projectId: scene.projectId, sceneId: scene.id, modelId: model.id, input: videoInput });
  await reserveCredits(userId, credits, job.id, "video generation");
  const submitted = await submitVideoJob(model, videoInput, startUrl, endUrl, job.id);
  await prisma.scene.update({ where: { id: sceneId }, data: { generationJobId: job.id, status: "GENERATING" } });
  return setProviderRequest(job.id, submitted.request_id);
}

type CreateJobInput = {
  userId: string;
  projectId: string;
  sceneId: string | null;
  modelId: string;
  input: unknown;
};

async function createJob(input: CreateJobInput) {
  return prisma.generationJob.create({
    data: {
      userId: input.userId,
      projectId: input.projectId,
      sceneId: input.sceneId,
      provider: "fal",
      modelId: input.modelId,
      type: "VIDEO_GENERATION",
      inputJson: asJson(input.input)
    }
  });
}

async function setProviderRequest(jobId: string, requestId: string) {
  return prisma.generationJob.update({
    where: { id: jobId },
    data: { providerRequestId: requestId, status: "GENERATING", startedAt: new Date() }
  });
}

async function submitVideoJob(
  model: { id: string; providerModelId: string },
  videoInput: ResolvedGenerateVideoInput,
  startUrl: string,
  endUrl: string | undefined,
  jobId: string
) {
  try {
    return await submitFalJob(submitInput(model, videoInput, startUrl, endUrl));
  } catch (error) {
    await markSubmitFailed(jobId, error);
    throw error;
  }
}

function submitInput(
  model: { id: string; providerModelId: string },
  videoInput: ResolvedGenerateVideoInput,
  startUrl: string,
  endUrl: string | undefined
) {
  return {
    providerModelId: model.providerModelId,
    input: buildFalInput(model.id, { video: videoInput, imageUrl: startUrl, endImageUrl: endUrl }),
    webhookUrl: webhookUrl()
  };
}

async function markSubmitFailed(jobId: string, error: unknown) {
  await failGenerationJob(jobId, errorPayload(error), "fal submit failed");
}

function webhookUrl() {
  const appUrl = process.env.APP_URL;
  return appUrl ? `${appUrl}/api/fal/webhook` : undefined;
}

async function assertProjectOwner(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!project) throw new Error("Project not found");
}

async function assertAssetOwner(userId: string, assetId: string) {
  const asset = await prisma.asset.findFirst({ where: { id: assetId, userId } });
  if (!asset) throw new Error("Asset not found");
}

async function ownedScene(userId: string, sceneId: string) {
  return prisma.scene.findFirstOrThrow({
    where: { id: sceneId, project: { userId } }
  });
}

async function startFrameAsset(assetId?: string | null) {
  if (!assetId) throw new Error("Start frame is required");
  return prisma.asset.findUniqueOrThrow({ where: { id: assetId } });
}

async function endFrameUrl(assetId: string | null | undefined, supported: boolean) {
  if (!assetId || !supported) return undefined;
  const asset = await prisma.asset.findUniqueOrThrow({ where: { id: assetId } });
  return assetReadUrl(asset.storageKey);
}

function assetReadUrl(storageKey: string) {
  if (storageKey.startsWith("http")) return storageKey;
  return r2Storage.createGetUrl(storageKey);
}

function asJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function errorPayload(error: unknown) {
  if (error instanceof Error) return { name: error.name, message: error.message };
  return { error };
}
