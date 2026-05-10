import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";
import { getSupportedModel } from "../models/catalog";
import { getFalResult } from "./fal-client";
import { completeGenerationJob, failGenerationJob } from "./generation-result-service";

type FalWebhookPayload = {
  request_id?: string;
  requestId?: string;
  status?: string;
  data?: unknown;
  error?: unknown;
};

export async function handleFalWebhook(payload: FalWebhookPayload) {
  const eventId = payload.request_id ?? payload.requestId;
  if (!eventId) {
    throw new Error("Missing fal request id");
  }
  const created = await createWebhookEvent(eventId, payload);
  if (!created) {
    return { duplicate: true };
  }
  const job = await findJob(eventId);
  if (!job) {
    return { ignored: true };
  }
  return isFailure(payload) ? failJob(job.id, payload) : processJob(job);
}

async function createWebhookEvent(eventId: string, payload: FalWebhookPayload) {
  const existing = await prisma.webhookEvent.findUnique({
    where: { provider_eventId: { provider: "fal", eventId } }
  });
  if (existing) {
    return false;
  }
  await prisma.webhookEvent.create({
    data: { provider: "fal", eventId, payloadJson: asJson(payload) }
  });
  return true;
}

async function findJob(requestId: string) {
  return prisma.generationJob.findFirst({
    where: { providerRequestId: requestId }
  });
}

function isFailure(payload: FalWebhookPayload) {
  const status = payload.status?.toLowerCase() ?? "";
  return status.includes("fail") || Boolean(payload.error);
}

async function failJob(jobId: string, payload: FalWebhookPayload) {
  return failGenerationJob(jobId, payload.error ?? payload, "fal generation failed");
}

async function processJob(job: Awaited<ReturnType<typeof findJob>>) {
  if (!job?.providerRequestId) throw new Error("Missing fal request id");
  const result = await getFalResult(providerModelId(job.modelId), job.providerRequestId);
  return completeGenerationJob(job.id, result.data);
}

function providerModelId(modelId: string) {
  const model = getSupportedModel(modelId);
  if (!model) throw new Error("Generation model is not supported");
  return model.providerModelId;
}

function asJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
