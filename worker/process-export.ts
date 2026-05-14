import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Prisma } from "@prisma/client";
import { createAssetFromLocalFile } from "../src/application/assets/worker";
import { recordOutboxEvent } from "../src/shared/server/outbox";
import { publishPendingOutboxEvents } from "../src/shared/server/outbox-publisher";
import { prisma } from "../src/shared/server/prisma";
import { probeHasAudioStream, runFfmpeg } from "./ffmpeg";
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
    await markReady(job.id, requiredR2Key(asset.r2Key), output.duration);
    return { jobId: job.id, items: context.items.length };
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
  return { duration: totalDuration(context.items), path: outputPath };
}

async function normalizeClips(context: ExportContext, workspace: string) {
  const paths: string[] = [];
  for (const [index, item] of context.items.entries()) {
    paths.push(await normalizeClip(context, item, index, workspace));
  }
  return paths;
}

async function normalizeClip(context: ExportContext, item: ReadyTimelineItem, index: number, workspace: string) {
  const input = join(workspace, `clip-${index}.mp4`);
  const output = join(workspace, `clip-${index}-normalized.mp4`);
  await downloadAsset(context.assets.get(item.scene.videoAssetId ?? "")!, input);
  const hasAudio = await probeHasAudioStream(input);
  await runFfmpeg(normalizeCommand({ dimensions: context.dimensions, hasAudio, input, output }));
  return output;
}

function normalizeCommand(args: NormalizeArgs) {
  const inputs = audioInputs(args);
  const mapping = audioMapping(args.hasAudio);
  return [
    "-y", ...inputs, "-vf", videoFilter(args.dimensions), ...mapping,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-ar", "48000", "-ac", "2", "-b:a", "128k", "-shortest", args.output
  ];
}

function audioInputs(args: NormalizeArgs) {
  if (args.hasAudio) return ["-i", args.input];
  return ["-i", args.input, "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000"];
}

function audioMapping(hasAudio: boolean) {
  if (hasAudio) return ["-map", "0:v:0", "-map", "0:a:0"];
  return ["-map", "0:v:0", "-map", "1:a:0"];
}

async function exportContext(job: ExportJob) {
  const [project, items] = await Promise.all([projectForJob(job), readyTimelineItems(job.projectId)]);
  if (items.length === 0) throw new Error("No ready timeline clips to export");
  return { assets: await videoAssets(items), dimensions: dimensions(job.resolution, project.aspectRatio), items };
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

async function markReady(jobId: string, r2Key: string, duration: number) {
  const job = await prisma.$transaction(async (tx) => {
    const job = await tx.exportJob.update({
      where: { id: jobId },
      data: { status: "READY", r2Key, durationSeconds: duration, completedAt: new Date() }
    });
    await recordExportEvent(tx, job.projectId, "export.ready", job.id);
    return job;
  });
  await publishPendingOutboxEvents();
  return job;
}

async function markProcessing(jobId: string) {
  await prisma.exportJob.update({ where: { id: jobId }, data: { status: "PROCESSING" } });
}

async function failExportJob(jobId: string, error: unknown) {
  await prisma.$transaction(async (tx) => {
    const job = await tx.exportJob.update({
      where: { id: jobId },
      data: { status: "FAILED", errorMessage: errorMessage(error), completedAt: new Date() }
    });
    await recordExportEvent(tx, job.projectId, "export.failed", job.id);
  });
  await publishPendingOutboxEvents();
  return { error: errorMessage(error), jobId };
}

async function recordExportEvent(
  tx: Prisma.TransactionClient,
  projectId: string,
  type: string,
  jobId: string
) {
  await recordOutboxEvent(tx, {
    aggregateId: projectId,
    aggregateType: "project",
    type,
    payload: { jobId }
  });
}

function requiredR2Key(r2Key?: string | null) {
  if (!r2Key) throw new Error("Export asset has no R2 key");
  return r2Key;
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

function totalDuration(items: ReadyTimelineItem[]) {
  return items.reduce((total, item) => total + itemDuration(item), 0);
}

function dimensions(resolution: string, aspectRatio: string) {
  const base = resolution === "4k" ? 2160 : resolution === "1080p" ? 1080 : 720;
  if (aspectRatio === "9:16") return { height: Math.round((base * 16) / 9), width: base };
  if (aspectRatio === "1:1") return { height: base, width: base };
  return { height: base, width: Math.round((base * 16) / 9) };
}

async function videoAssets(items: ReadyTimelineItem[]) {
  const ids = items.map((item) => item.scene.videoAssetId).filter(isString);
  const assets = await prisma.asset.findMany({ where: { id: { in: ids } } });
  return new Map(assets.map((asset) => [asset.id, asset]));
}

function readyTimelineItems(projectId: string) {
  return prisma.timelineItem.findMany({
    where: { projectId, scene: { status: "READY", videoAssetId: { not: null } } },
    include: { scene: true },
    orderBy: { orderIndex: "asc" }
  });
}

function itemDuration(item: ReadyTimelineItem) {
  return item.durationSeconds ?? item.scene.durationSeconds;
}

function projectForJob(job: ExportJob) {
  return prisma.project.findUniqueOrThrow({ where: { id: job.projectId } });
}

function asJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Export failed";
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

type ExportJob = Awaited<ReturnType<typeof nextExportJob>> & {};
type ReadyTimelineItem = Awaited<ReturnType<typeof readyTimelineItems>>[number];
type ExportContext = Awaited<ReturnType<typeof exportContext>>;
type Dimensions = ReturnType<typeof dimensions>;

type NormalizeArgs = {
  dimensions: Dimensions;
  hasAudio: boolean;
  input: string;
  output: string;
};
