import { Prisma } from "@prisma/client";
import { getAssetReadUrl } from "../src/application/assets/worker";
import { buildFalInput } from "../src/application/generation/worker";
import { submitFalJob } from "../src/application/generation/worker";
import { processDeferredFalWebhook } from "../src/application/generation/worker";
import { failGenerationJob } from "../src/application/generation/worker";
import type { ResolvedGenerateVideoInput } from "../src/application/generation/worker";
import { getModel } from "../src/application/generation/worker";
import { providerErrorPayload } from "../src/application/generation/worker";
import { recordOutboxEvent } from "../src/shared/server/outbox";
import { publishPendingOutboxEvents } from "../src/shared/server/outbox-publisher";
import { prisma } from "../src/shared/server/prisma";

export async function processNextVideoGenerationJob() {
  const job = await nextVideoJob();
  if (!job) return null;
  if (!await claimVideoJob(job.id)) return null;
  return submitVideoJob(job);
}

async function submitVideoJob(job: VideoJob) {
  try {
    const submitted = await submitQueuedJob(job);
    await markSubmitted(job, submitted.request_id);
    await processDeferredFalWebhook(submitted.request_id);
    return { jobId: job.id, status: "GENERATING" };
  } catch (error) {
    await failGenerationJob(job.id, providerErrorPayload(error), "fal submit failed");
    return { error: errorMessage(error), jobId: job.id };
  }
}

async function submitQueuedJob(job: VideoJob) {
  const model = await getModel(job.modelId);
  const startUrl = await startFrameUrl(job.userId, job.scene?.startFrameAssetId);
  const endUrl = await endFrameUrl(job.userId, job.scene?.endFrameAssetId, model.supportsEndFrame);
  return submitFalJob(submitInput(model, videoInput(job.input), startUrl, endUrl));
}

function submitInput(model: Awaited<ReturnType<typeof getModel>>, video: ResolvedGenerateVideoInput, imageUrl: string, endImageUrl?: string) {
  return {
    providerModelId: model.providerModelId,
    input: buildFalInput(model.id, { video, imageUrl, endImageUrl }),
    webhookUrl: webhookUrl()
  };
}

async function markSubmitted(job: VideoJob, requestId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.generationJob.update({ where: { id: job.id }, data: submittedJobData(requestId) });
    if (job.sceneId && job.projectId) await markSceneGenerating(tx, job.sceneId, job.projectId);
  });
  await publishPendingOutboxEvents();
}

function submittedJobData(requestId: string) {
  return { providerRequestId: requestId, status: "GENERATING" as const, startedAt: new Date() };
}

async function markSceneGenerating(tx: Prisma.TransactionClient, sceneId: string, projectId: string) {
  await tx.scene.update({ where: { id: sceneId }, data: { status: "GENERATING" } });
  await recordOutboxEvent(tx, { aggregateId: projectId, aggregateType: "project", type: "scene.updated", payload: { sceneId } });
}

async function nextVideoJob() {
  return prisma.generationJob.findFirst({
    where: { status: "QUEUED", type: "VIDEO_GENERATION" },
    orderBy: { createdAt: "asc" },
    include: { scene: { select: { endFrameAssetId: true, startFrameAssetId: true } } }
  });
}

async function claimVideoJob(jobId: string) {
  const result = await prisma.generationJob.updateMany({
    where: { id: jobId, status: "QUEUED" },
    data: { status: "PROCESSING", startedAt: new Date() }
  });
  return result.count === 1;
}

async function startFrameUrl(userId: string, assetId?: string | null) {
  if (!assetId) throw new Error("Start frame is required");
  return getAssetReadUrl(userId, assetId);
}

async function endFrameUrl(userId: string, assetId: string | null | undefined, supported: boolean) {
  if (!assetId || !supported) return undefined;
  return getAssetReadUrl(userId, assetId);
}

function videoInput(value: Prisma.JsonValue) {
  return value as unknown as ResolvedGenerateVideoInput;
}

function webhookUrl() {
  const appUrl = process.env.APP_URL;
  return appUrl ? `${appUrl}/api/fal/webhook` : undefined;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Video generation submit failed";
}

type VideoJob = NonNullable<Awaited<ReturnType<typeof nextVideoJob>>>;
