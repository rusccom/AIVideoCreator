import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";
import { commitCredits, refundCredits } from "./credit-service";

export async function completeGenerationJob(jobId: string, data: unknown) {
  const job = await prisma.generationJob.findUniqueOrThrow({ where: { id: jobId } });
  if (job.status === "READY") return job;
  const asset = await createVideoAsset(job, data);
  if (asset) await queueLastFrameJob(job, asset.id);
  await commitCredits(jobId);
  return prisma.generationJob.update({
    where: { id: jobId },
    data: { status: "READY", outputJson: asJson(data), completedAt: new Date() }
  });
}

export async function failGenerationJob(jobId: string, payload: unknown, reason: string) {
  const job = await prisma.generationJob.findUniqueOrThrow({ where: { id: jobId } });
  await refundCredits(jobId, reason);
  await markSceneFailed(job.sceneId);
  return prisma.generationJob.update({
    where: { id: jobId },
    data: { status: "FAILED", errorJson: asJson(payload), completedAt: new Date() }
  });
}

async function createVideoAsset(job: JobRecord, data: unknown) {
  const video = videoPayload(data);
  if (!video || !job.projectId || !job.sceneId) return null;
  const asset = await prisma.asset.create({ data: videoAssetData(job, video) });
  await prisma.scene.update({ where: { id: job.sceneId }, data: sceneData(job.id, asset.id, video) });
  return asset;
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
    storageProvider: "fal",
    storageBucket: "fal",
    storageKey: video.url,
    mimeType: video.content_type ?? "video/mp4",
    sizeBytes: video.file_size,
    width: video.width,
    height: video.height,
    durationSeconds: videoDuration(video),
    metadataJson: asJson(video)
  };
}

function sceneData(jobId: string, assetId: string, video: VideoPayload) {
  return {
    generationJobId: jobId,
    videoAssetId: assetId,
    status: "READY" as const,
    durationSeconds: videoDuration(video)
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
