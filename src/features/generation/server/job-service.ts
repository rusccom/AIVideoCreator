import { prisma } from "@/shared/server/prisma";

export async function refreshGenerationJobForUser(userId: string, jobId: string) {
  await ownedJob(userId, jobId);
  return jobSummary(jobId);
}

async function ownedJob(userId: string, jobId: string) {
  return prisma.generationJob.findFirstOrThrow({
    where: { id: jobId, userId, type: { in: ["VIDEO_GENERATION", "IMAGE_GENERATION"] } }
  });
}

async function jobSummary(jobId: string) {
  const job = await prisma.generationJob.findUniqueOrThrow({
    where: { id: jobId },
    select: {
      id: true,
      outputJson: true,
      result: { select: { assets: true } },
      sceneId: true,
      status: true,
      type: true
    }
  });
  return {
    ...job,
    assets: generatedAssets(job.result?.assets ?? job.outputJson),
    outputJson: undefined,
    result: undefined
  };
}

function generatedAssets(value: unknown) {
  const assets = record(value).assets;
  return Array.isArray(assets) ? assets.filter(isGeneratedAsset) : [];
}

function isGeneratedAsset(value: unknown): value is { id: string; url: string } {
  const asset = record(value);
  return typeof asset.id === "string" && typeof asset.url === "string";
}

function record(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
