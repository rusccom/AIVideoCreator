import { Prisma } from "@prisma/client";
import { cleanupFailedAiCreatorSequence } from "@/features/ai-creator/server/ai-creator-sequence-cleanup";
import { createAssetFromRemoteUrl } from "@/features/assets/server/asset-storage-service";
import { completeProjectImageGeneration } from "@/features/image-generation/server/project-image-service";
import { touchProjectInTransaction } from "@/features/projects/server/project-touch-service";
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
  return prisma.generationJob.update({
    where: { id: jobId },
    data: { status: "FAILED", errorJson: asJson(payload), completedAt: new Date() }
  });
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
    await tx.scene.update({
      where: { id: input.sceneId },
      data: sceneData(input.jobId, input.assetId, durationSeconds)
    });
    await tx.timelineItem.updateMany({ where: { sceneId: input.sceneId }, data: { durationSeconds } });
    await touchProjectInTransaction(tx, input.projectId);
  });
}

async function completeVideoGenerationJob(job: JobRecord, data: unknown) {
  try {
    const asset = await createVideoAsset(job, data);
    if (asset) await queueLastFrameJob(job, asset.id);
    await commitCredits(job.id);
    return markJobReady(job.id, data);
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

function markJobReady(jobId: string, data: unknown) {
  return prisma.generationJob.update({
    where: { id: jobId },
    data: { status: "READY", outputJson: asJson(data), completedAt: new Date() }
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
  await prisma.scene.update({ where: { id: sceneId }, data: { status: "FAILED" } });
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

type ReadySceneInput = {
  assetId: string;
  jobId: string;
  projectId: string;
  sceneId: string;
  video: VideoPayload;
};
