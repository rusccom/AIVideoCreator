import { prisma } from "@/shared/server/prisma";
import { getSupportedModel } from "../models/catalog";
import { getFalResult, getFalStatus } from "./fal-client";
import { completeGenerationJob, failGenerationJob } from "./generation-result-service";

export async function refreshGenerationJobForUser(userId: string, jobId: string) {
  const job = await ownedJob(userId, jobId);
  if (!shouldRefresh(job)) return jobSummary(jobId);
  const status = await getFalStatus(providerModelId(job.modelId), job.providerRequestId!);
  await applyStatus(job.id, job.modelId, job.providerRequestId!, status.status);
  return jobSummary(jobId);
}

async function applyStatus(jobId: string, modelId: string, requestId: string, status: string) {
  if (status === "COMPLETED") return completeFromFal(jobId, modelId, requestId);
  if (isFailedStatus(status)) return failGenerationJob(jobId, { status }, "fal generation failed");
}

async function completeFromFal(jobId: string, modelId: string, requestId: string) {
  const result = await getFalResult(providerModelId(modelId), requestId);
  return completeGenerationJob(jobId, result.data);
}

async function ownedJob(userId: string, jobId: string) {
  return prisma.generationJob.findFirstOrThrow({
    where: { id: jobId, userId, type: "VIDEO_GENERATION" }
  });
}

async function jobSummary(jobId: string) {
  return prisma.generationJob.findUniqueOrThrow({
    where: { id: jobId },
    select: { id: true, status: true, sceneId: true }
  });
}

function shouldRefresh(job: Awaited<ReturnType<typeof ownedJob>>) {
  return job.status === "GENERATING" && Boolean(job.providerRequestId);
}

function providerModelId(modelId: string) {
  const model = getSupportedModel(modelId);
  if (!model) throw new Error("Generation model is not supported");
  return model.providerModelId;
}

function isFailedStatus(status: string) {
  return status === "FAILED" || status === "CANCELED";
}
