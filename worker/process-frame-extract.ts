import { join } from "node:path";
import { Prisma } from "@prisma/client";
import { createAssetFromLocalFile } from "../src/features/assets/server/asset-storage-service";
import { startNextAiCreatorScene } from "../src/features/ai-creator/server/ai-creator-sequence-service";
import { touchProjectInTransaction } from "../src/features/projects/server/project-touch-service";
import { prisma } from "../src/shared/server/prisma";
import { runFfmpeg } from "./ffmpeg";
import { createJobWorkspace, removeJobWorkspace } from "./job-workspace";
import { downloadAsset } from "./media-download";

export async function processNextFrameExtractJob() {
  const job = await nextFrameJob();
  if (!job) return null;
  await markProcessing(job.id);
  try {
    return await processFrameJob(job);
  } catch (error) {
    return failFrameJob(job.id, error);
  }
}

async function nextFrameJob() {
  return prisma.generationJob.findFirst({
    where: { status: "QUEUED", type: "FRAME_EXTRACT" },
    orderBy: { createdAt: "asc" }
  });
}

async function processFrameJob(job: FrameJob) {
  const scene = await sceneForJob(job);
  const video = await videoAsset(job, scene.videoAssetId);
  const workspace = await createJobWorkspace(job.id);
  try {
    const frame = await extractFrame(job, video, workspace, scene.projectId);
    await setFrameReady(job.id, scene.id, scene.projectId, frame.id);
    await startNextAiCreatorScene(job.userId, scene.id, frame.id);
    return { jobId: job.id, frameAssetId: frame.id };
  } finally {
    await removeJobWorkspace(workspace);
  }
}

async function extractFrame(job: FrameJob, video: VideoAsset, workspace: string, projectId: string) {
  const input = join(workspace, "input.mp4");
  const output = join(workspace, "frame.jpg");
  await downloadAsset(video, input);
  await runFfmpeg(frameCommand(job.inputJson, input, output));
  return createFrameAsset(job, projectId, output);
}

function createFrameAsset(job: FrameJob, projectId: string, output: string) {
  return createAssetFromLocalFile({
    localPath: output,
    metadata: frameMetadata(job),
    mimeType: "image/jpeg",
    projectId,
    source: "FRAME_EXTRACT",
    type: "FRAME",
    userId: job.userId
  });
}

async function setFrameReady(jobId: string, sceneId: string, projectId: string, assetId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.scene.update({ where: { id: sceneId }, data: { endFrameAssetId: assetId } });
    await touchProjectInTransaction(tx, projectId);
    return tx.generationJob.update({
      where: { id: jobId },
      data: { status: "READY", outputJson: asJson({ assetId }), completedAt: new Date() }
    });
  });
}

async function sceneForJob(job: FrameJob) {
  if (!job.sceneId) throw new Error("Frame job has no scene");
  return prisma.scene.findUniqueOrThrow({ where: { id: job.sceneId } });
}

async function videoAsset(job: FrameJob, sceneVideoAssetId?: string | null) {
  const assetId = videoAssetId(job.inputJson) ?? sceneVideoAssetId;
  if (!assetId) throw new Error("Frame job has no video asset");
  return prisma.asset.findUniqueOrThrow({ where: { id: assetId } });
}

function frameCommand(inputJson: Prisma.JsonValue, input: string, output: string) {
  const seconds = frameTimeSeconds(inputJson);
  if (seconds !== null) return pickedFrameCommand(seconds, input, output);
  return lastFrameCommand(input, output);
}

function pickedFrameCommand(seconds: number, input: string, output: string) {
  return ["-y", "-ss", String(seconds), "-i", input, "-frames:v", "1", "-q:v", "2", output];
}

function lastFrameCommand(input: string, output: string) {
  return ["-y", "-i", input, "-an", "-q:v", "2", "-update", "1", output];
}

function frameTimeSeconds(inputJson: Prisma.JsonValue) {
  const value = record(inputJson).frameTimeSeconds;
  return typeof value === "number" ? Math.max(0, value) : null;
}

function videoAssetId(inputJson: Prisma.JsonValue) {
  const value = record(inputJson).videoAssetId;
  return typeof value === "string" ? value : null;
}

function frameMetadata(job: FrameJob) {
  return asJson({ jobId: job.id, sceneId: job.sceneId, input: job.inputJson });
}

async function markProcessing(jobId: string) {
  await prisma.generationJob.update({
    where: { id: jobId },
    data: { status: "PROCESSING", startedAt: new Date() }
  });
}

async function failFrameJob(jobId: string, error: unknown) {
  await prisma.generationJob.update({
    where: { id: jobId },
    data: { status: "FAILED", errorJson: asJson(errorPayload(error)), completedAt: new Date() }
  });
  return { jobId, error: errorMessage(error) };
}

function record(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function errorPayload(error: unknown) {
  return error instanceof Error ? { name: error.name, message: error.message } : { error };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Frame extraction failed";
}

type FrameJob = Awaited<ReturnType<typeof nextFrameJob>> & {};
type VideoAsset = Awaited<ReturnType<typeof prisma.asset.findUniqueOrThrow>>;
