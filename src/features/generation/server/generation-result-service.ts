import { Prisma } from "@prisma/client";
import { cleanupFailedAiCreatorSequence } from "@/features/ai-creator/server/ai-creator-sequence-cleanup";
import { createAssetFromRemoteUrl } from "@/features/assets/server/asset-storage-service";
import { completeProjectImageGeneration } from "@/features/image-generation/server/project-image-service";
import { touchProjectInTransaction } from "@/features/projects/server/project-touch-service";
import { incrementProjectReadyScenes, incrementProjectTimelineItems } from "@/shared/server/counters";
import { recordOutboxEvent } from "@/shared/server/outbox";
import { prisma } from "@/shared/server/prisma";
import { commitCredits, refundCredits } from "./credit-service";
import { providerErrorPayload } from "./provider-error";

export async function completeGenerationJob(jobId: string, data: unknown) {
  const claim = await claimGenerationCompletion(jobId);
  const job = claim.job;
  if (!claim.ready) return job;
  if (job.type === "IMAGE_GENERATION") return completeProjectImageGeneration(job, data);
  return completeVideoGenerationJob(job, data);
}

export async function failGenerationJob(jobId: string, payload: unknown, reason: string) {
  const job = await prisma.generationJob.findUniqueOrThrow({ where: { id: jobId } });
  await refundCredits(jobId, reason);
  await markSceneFailed(job.sceneId);
  await cleanupFailedAiCreatorSequence(job.sceneId);
  return markJobFailed(jobId, payload);
}

async function createVideoAsset(job: JobRecord, data: unknown) {
  const video = videoPayload(data);
  if (!video || !job.projectId || !job.sceneId) return null;
  const asset = await createAssetFromRemoteUrl(videoAssetData(job, video));
  await saveReadyScene({ assetId: asset.id, jobId: job.id, projectId: job.projectId, sceneId: job.sceneId, video });
  return asset;
}

async function saveReadyScene(input: ReadySceneInput) {
  const durationSeconds = videoDuration(input.video);
  await prisma.$transaction(async (tx) => {
    const previous = await sceneBeforeReady(tx, input.sceneId);
    const oldDuration = await timelineDuration(tx, input.sceneId, previous.durationSeconds);
    await tx.scene.update({
      where: { id: input.sceneId },
      data: sceneData(input.jobId, input.assetId, durationSeconds)
    });
    const timelines = await tx.timelineItem.updateMany({ where: { sceneId: input.sceneId }, data: { durationSeconds } });
    await updateProjectSceneCounters(tx, previous, input.projectId, timelines.count, durationSeconds, oldDuration);
    await recordProjectEvent(tx, input.projectId, "scene.ready", { sceneId: input.sceneId });
    await touchProjectInTransaction(tx, input.projectId);
  });
}

async function completeVideoGenerationJob(job: JobRecord, data: unknown) {
  try {
    const asset = await createVideoAsset(job, data);
    if (asset) await queueLastFrameJob(job, asset.id);
    await commitCredits(job.id);
    return markJobReady(job.id, data, asset ? [generatedAsset(asset.id)] : []);
  } catch (error) {
    return failGenerationJob(job.id, providerErrorPayload(error), "generation completion failed");
  }
}

async function claimGenerationCompletion(jobId: string) {
  const claim = await prisma.generationJob.updateMany({
    where: { id: jobId, status: "GENERATING" },
    data: { status: "PROCESSING" }
  });
  const job = await prisma.generationJob.findUniqueOrThrow({ where: { id: jobId } });
  return { job, ready: claim.count === 1 };
}

function markJobReady(jobId: string, data: unknown, assets: GeneratedAsset[]) {
  return prisma.$transaction(async (tx) => {
    await recordJobResult(tx, jobId, data, assets);
    await recordJobEvent(tx, jobId, "job.completed");
    return tx.generationJob.update({
      where: { id: jobId },
      data: { status: "READY", outputJson: asJson(data), completedAt: new Date() }
    });
  });
}

async function queueLastFrameJob(job: JobRecord, videoAssetId: string) {
  await prisma.generationJob.create({
    data: {
      userId: job.userId,
      projectId: job.projectId,
      sceneId: job.sceneId,
      provider: "worker",
      modelId: "ffmpeg-last-frame",
      type: "FRAME_EXTRACT",
      inputJson: asJson({ mode: "last", videoAssetId })
    }
  });
}

function videoAssetData(job: JobRecord, video: ReadyVideoPayload) {
  return {
    userId: job.userId,
    projectId: job.projectId,
    type: "VIDEO" as const,
    source: "FAL_GENERATION" as const,
    remoteUrl: video.url,
    mimeType: video.content_type ?? "video/mp4",
    sizeBytes: video.file_size,
    width: video.width,
    height: video.height,
    durationSeconds: videoDuration(video),
    metadataJson: asJson(video)
  };
}

function sceneData(jobId: string, assetId: string, durationSeconds: number) {
  return {
    generationJobId: jobId,
    videoAssetId: assetId,
    status: "READY" as const,
    durationSeconds
  };
}

async function markSceneFailed(sceneId?: string | null) {
  if (!sceneId) return;
  await prisma.$transaction(async (tx) => {
    const scene = await sceneBeforeFailure(tx, sceneId);
    if (!scene) return;
    await tx.scene.update({ where: { id: sceneId }, data: { status: "FAILED" } });
    if (scene.status === "READY") await incrementProjectReadyScenes(tx, scene.projectId, -1);
    await recordProjectEvent(tx, scene.projectId, "scene.failed", { sceneId });
  });
}

function videoPayload(data: unknown): ReadyVideoPayload | null {
  const source = record(data);
  const video = record(source.video) as VideoPayload;
  return typeof video.url === "string" ? { ...video, url: video.url } : null;
}

function videoDuration(video: VideoPayload) {
  return Math.max(1, Math.round(Number(video.duration ?? 6)));
}

function record(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function sceneBeforeReady(tx: Prisma.TransactionClient, sceneId: string) {
  return tx.scene.findUniqueOrThrow({
    where: { id: sceneId },
    select: { durationSeconds: true, status: true }
  });
}

async function timelineDuration(
  tx: Prisma.TransactionClient,
  sceneId: string,
  sceneDuration: number
) {
  const items = await tx.timelineItem.findMany({
    where: { sceneId },
    select: { durationSeconds: true }
  });
  return items.reduce((sum, item) => sum + (item.durationSeconds ?? sceneDuration), 0);
}

async function updateProjectSceneCounters(
  tx: Prisma.TransactionClient,
  previous: { status: string },
  projectId: string,
  timelineCount: number,
  durationSeconds: number,
  oldDuration: number
) {
  if (previous.status !== "READY") await incrementProjectReadyScenes(tx, projectId, 1);
  await incrementProjectTimelineItems(tx, projectId, 0, timelineCount * durationSeconds - oldDuration);
}

function markJobFailed(jobId: string, payload: unknown) {
  return prisma.$transaction(async (tx) => {
    await recordJobError(tx, jobId, payload);
    await recordJobEvent(tx, jobId, "job.failed");
    return tx.generationJob.update({
      where: { id: jobId },
      data: { status: "FAILED", errorJson: asJson(payload), completedAt: new Date() }
    });
  });
}

async function recordJobResult(
  tx: Prisma.TransactionClient,
  jobId: string,
  data: unknown,
  assets: GeneratedAsset[]
) {
  await tx.jobResult.upsert({
    where: { jobId },
    create: { jobId, assets: asJson(assets), rawResponse: asJson(data) },
    update: { assets: asJson(assets), rawResponse: asJson(data) }
  });
}

async function recordJobError(tx: Prisma.TransactionClient, jobId: string, payload: unknown) {
  await tx.jobError.upsert({
    where: { jobId },
    create: errorRecord(jobId, payload),
    update: errorUpdate(payload)
  });
}

function errorRecord(jobId: string, payload: unknown) {
  return { jobId, ...errorUpdate(payload) };
}

function errorUpdate(payload: unknown) {
  const error = record(payload);
  return {
    code: typeof error.code === "string" ? error.code : null,
    message: typeof error.message === "string" ? error.message : "Generation failed",
    rawError: asJson(payload)
  };
}

function sceneBeforeFailure(tx: Prisma.TransactionClient, sceneId: string) {
  return tx.scene.findUnique({
    where: { id: sceneId },
    select: { projectId: true, status: true }
  });
}

function generatedAsset(assetId: string) {
  return { id: assetId, url: `/api/assets/${assetId}/signed-url` };
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

type JobRecord = Awaited<ReturnType<typeof prisma.generationJob.findUniqueOrThrow>>;

type VideoPayload = {
  content_type?: string;
  duration?: number;
  file_size?: number;
  height?: number;
  url?: string;
  width?: number;
};

type ReadyVideoPayload = VideoPayload & {
  url: string;
};

type GeneratedAsset = ReturnType<typeof generatedAsset>;

type ReadySceneInput = {
  assetId: string;
  jobId: string;
  projectId: string;
  sceneId: string;
  video: VideoPayload;
};
