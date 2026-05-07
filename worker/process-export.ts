import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Prisma } from "@prisma/client";
import { createAssetFromLocalFile } from "../src/features/assets/server/local-asset-service";
import { prisma } from "../src/shared/server/prisma";
import { runFfmpeg } from "./ffmpeg";
import { createJobWorkspace, removeJobWorkspace } from "./job-workspace";
import { downloadAsset } from "./media-download";

export async function processNextExportJob() {
  const job = await nextExportJob();
  if (!job) return null;
  await markProcessing(job.id);
  try {
    return await processExportJob(job);
  } catch (error) {
    return failExportJob(job.id, error);
  }
}

async function nextExportJob() {
  return prisma.exportJob.findFirst({
    where: { status: "QUEUED" },
    orderBy: { createdAt: "asc" }
  });
}

async function processExportJob(job: ExportJob) {
  const context = await exportContext(job);
  const workspace = await createJobWorkspace(job.id);
  try {
    const output = await renderExport(context, workspace);
    const asset = await createExportAsset(job, output.path, output.duration);
    await markReady(job.id, asset.storageKey, output.duration);
    return { jobId: job.id, scenes: context.scenes.length };
  } finally {
    await removeJobWorkspace(workspace);
  }
}

async function renderExport(context: ExportContext, workspace: string) {
  const normalized = await normalizeClips(context, workspace);
  const listPath = join(workspace, "concat.txt");
  const outputPath = join(workspace, "export.mp4");
  await writeFile(listPath, concatList(normalized), "utf8");
  await runFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outputPath]);
  return { duration: totalDuration(context.scenes), path: outputPath };
}

async function normalizeClips(context: ExportContext, workspace: string) {
  const paths: string[] = [];
  for (const [index, scene] of context.scenes.entries()) {
    paths.push(await normalizeClip(context, scene, index, workspace));
  }
  return paths;
}

async function normalizeClip(context: ExportContext, scene: ReadyScene, index: number, workspace: string) {
  const input = join(workspace, `clip-${index}.mp4`);
  const output = join(workspace, `clip-${index}-normalized.mp4`);
  await downloadAsset(context.assets.get(scene.videoAssetId ?? "")!, input);
  await runFfmpeg(normalizeCommand(input, output, context.dimensions));
  return output;
}

function normalizeCommand(input: string, output: string, dimensions: Dimensions) {
  return [
    "-y", "-i", input, "-vf", videoFilter(dimensions),
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
    "-pix_fmt", "yuv420p", "-an", output
  ];
}

async function exportContext(job: ExportJob) {
  const [project, scenes] = await Promise.all([projectForJob(job), readyScenes(job.projectId)]);
  if (scenes.length === 0) throw new Error("No ready scenes to export");
  return { assets: await videoAssets(scenes), dimensions: dimensions(job.resolution, project.aspectRatio), scenes };
}

async function createExportAsset(job: ExportJob, localPath: string, duration: number) {
  return createAssetFromLocalFile({
    localPath,
    metadata: asJson({ exportJobId: job.id, resolution: job.resolution, duration }),
    mimeType: "video/mp4",
    projectId: job.projectId,
    source: "EXPORT",
    type: "EXPORT",
    userId: job.userId
  });
}

async function markReady(jobId: string, storageKey: string, duration: number) {
  return prisma.exportJob.update({
    where: { id: jobId },
    data: { status: "READY", storageKey, durationSeconds: duration, completedAt: new Date() }
  });
}

async function markProcessing(jobId: string) {
  await prisma.exportJob.update({ where: { id: jobId }, data: { status: "PROCESSING" } });
}

async function failExportJob(jobId: string, error: unknown) {
  await prisma.exportJob.update({
    where: { id: jobId },
    data: { status: "FAILED", errorJson: asJson(errorPayload(error)), completedAt: new Date() }
  });
  return { error: errorMessage(error), jobId };
}

function videoFilter(dimensions: Dimensions) {
  const scale = `scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=decrease`;
  const pad = `pad=${dimensions.width}:${dimensions.height}:(ow-iw)/2:(oh-ih)/2`;
  return `${scale},${pad},fps=30,format=yuv420p`;
}

function concatList(paths: string[]) {
  return paths.map((path) => `file '${escapePath(path)}'`).join("\n");
}

function escapePath(path: string) {
  return path.replace(/\\/g, "/").replace(/'/g, "'\\''");
}

function totalDuration(scenes: ReadyScene[]) {
  return scenes.reduce((total, scene) => total + scene.durationSeconds, 0);
}

function dimensions(resolution: string, aspectRatio: string) {
  const base = resolution === "4k" ? 2160 : resolution === "1080p" ? 1080 : 720;
  if (aspectRatio === "9:16") return { height: Math.round((base * 16) / 9), width: base };
  if (aspectRatio === "1:1") return { height: base, width: base };
  return { height: base, width: Math.round((base * 16) / 9) };
}

async function videoAssets(scenes: ReadyScene[]) {
  const ids = scenes.map((scene) => scene.videoAssetId).filter(isString);
  const assets = await prisma.asset.findMany({ where: { id: { in: ids } } });
  return new Map(assets.map((asset) => [asset.id, asset]));
}

function readyScenes(projectId: string) {
  return prisma.scene.findMany({
    where: { projectId, status: "READY", videoAssetId: { not: null } },
    orderBy: { orderIndex: "asc" }
  });
}

function projectForJob(job: ExportJob) {
  return prisma.project.findUniqueOrThrow({ where: { id: job.projectId } });
}

function asJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function errorPayload(error: unknown) {
  return error instanceof Error ? { name: error.name, message: error.message } : { error };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Export failed";
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

type ExportJob = Awaited<ReturnType<typeof nextExportJob>> & {};
type ReadyScene = Awaited<ReturnType<typeof readyScenes>>[number];
type ExportContext = Awaited<ReturnType<typeof exportContext>>;
type Dimensions = ReturnType<typeof dimensions>;
