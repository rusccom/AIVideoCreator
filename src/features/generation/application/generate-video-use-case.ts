import { getAssetReadUrl } from "@/features/assets/server/asset-service";
import { prisma } from "@/shared/server/prisma";
import { buildFalInput } from "../models/build-fal-input";
import type { GenerationJobRepository } from "../domain/generation-job";
import { prismaGenerationJobRepository } from "../infrastructure/prisma-generation-job-repository";
import { getCreditBalance, reserveCredits } from "../server/credit-service";
import { submitFalJob } from "../server/fal-client";
import { failGenerationJob } from "../server/generation-result-service";
import type { GenerateVideoInput, ResolvedGenerateVideoInput } from "../server/generation-schema";
import { getModel } from "../server/model-registry";
import { estimateVideoCredits, resolveVideoInput } from "../server/pricing-service";
import { providerErrorPayload } from "../server/provider-error";

const jobRepository = prismaGenerationJobRepository;

export async function generateVideoUseCase(userId: string, sceneId: string, input: GenerateVideoInput) {
  return executeGenerateVideo(userId, sceneId, input, jobRepository);
}

async function executeGenerateVideo(
  userId: string,
  sceneId: string,
  input: GenerateVideoInput,
  jobs: GenerationJobRepository
) {
  const scene = await ownedScene(userId, sceneId);
  const model = await getModel(input.modelId);
  const videoInput = resolveVideoInput(model, input);
  const credits = estimateVideoCredits(model, videoInput);
  await assertCredits(userId, credits);
  const startUrl = await startFrameUrl(userId, scene.startFrameAssetId);
  const endUrl = await endFrameUrl(userId, scene.endFrameAssetId, model.supportsEndFrame);
  const job = await jobs.createVideoJob(jobInput(userId, scene, model.id, videoInput, credits));
  await reserveJobCredits(userId, credits, job.id);
  const submitted = await submitVideoJob(model, videoInput, startUrl, endUrl, job.id);
  await jobs.markSceneGenerating(sceneId, job.id);
  return jobs.setProviderRequest(job.id, submitted.request_id);
}

function jobInput(
  userId: string,
  scene: OwnedScene,
  modelId: string,
  input: ResolvedGenerateVideoInput,
  estimatedCredits: number
) {
  return { userId, projectId: scene.projectId, sceneId: scene.id, modelId, input, estimatedCredits };
}

async function startFrameUrl(userId: string, assetId?: string | null) {
  if (!assetId) throw new Error("Start frame is required");
  return getAssetReadUrl(userId, assetId);
}

async function endFrameUrl(userId: string, assetId: string | null | undefined, supported: boolean) {
  if (!assetId || !supported) return undefined;
  return getAssetReadUrl(userId, assetId);
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
    await failGenerationJob(jobId, providerErrorPayload(error), "fal submit failed");
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

async function assertCredits(userId: string, credits: number) {
  const balance = await getCreditBalance(userId);
  if (balance < credits) throw new Error("Insufficient credits");
}

async function reserveJobCredits(userId: string, credits: number, jobId: string) {
  try {
    await reserveCredits(userId, credits, jobId, "video generation");
  } catch (error) {
    await failGenerationJob(jobId, providerErrorPayload(error), "credit reserve failed");
    throw error;
  }
}

function webhookUrl() {
  const appUrl = process.env.APP_URL;
  return appUrl ? `${appUrl}/api/fal/webhook` : undefined;
}

async function ownedScene(userId: string, sceneId: string) {
  return prisma.scene.findFirstOrThrow({ where: { id: sceneId, project: { userId } } });
}

type OwnedScene = Awaited<ReturnType<typeof ownedScene>>;
