import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";
import { getSupportedModel } from "@/shared/generation/models";
import { getFalResult } from "@/shared/server/fal-client";
import { logProviderError, logProviderEvent } from "@/shared/server/provider-log";
import { providerErrorPayload } from "@/shared/server/provider-error";
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
    logProviderEvent("error", "fal.webhook.missing_request_id", { payload });
    throw new Error("Missing fal request id");
  }
  logProviderEvent("info", "fal.webhook.received", webhookLog(eventId, payload));
  const event = await upsertWebhookEvent(eventId, payload);
  if (event.processedAt) {
    logProviderEvent("warn", "fal.webhook.duplicate", { eventId });
    return { duplicate: true };
  }
  return processWebhookEvent(eventId, payload);
}

export async function processDeferredFalWebhook(eventId: string) {
  const event = await prisma.webhookEvent.findUnique({
    where: { provider_eventId: { provider: "fal", eventId } }
  });
  if (!event || event.processedAt) return null;
  return processWebhookEvent(eventId, event.payloadJson as FalWebhookPayload);
}

async function processWebhookEvent(eventId: string, payload: FalWebhookPayload) {
  const job = await findJob(eventId);
  if (!job) {
    logProviderEvent("warn", "fal.webhook.ignored", { eventId, status: payload.status });
    return { deferred: true };
  }
  logProviderEvent("info", "fal.webhook.matched_job", jobLog(job, payload));
  const result = isFailure(payload) ? await failJob(job.id, payload) : await processJob(job, payload);
  await markWebhookProcessed(eventId);
  return result;
}

async function upsertWebhookEvent(eventId: string, payload: FalWebhookPayload) {
  const existing = await prisma.webhookEvent.findUnique({
    where: { provider_eventId: { provider: "fal", eventId } }
  });
  if (existing) return existing;
  return prisma.webhookEvent.create({
    data: { expiresAt: webhookExpiresAt(), provider: "fal", eventId, payloadJson: asJson(payload) }
  });
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
  logProviderEvent("error", "fal.webhook.failed_job", { jobId, payload });
  return failGenerationJob(jobId, payload.error ?? payload, "fal generation failed");
}

async function processJob(job: Awaited<ReturnType<typeof findJob>>, payload: FalWebhookPayload) {
  if (!job?.providerRequestId) throw new Error("Missing fal request id");
  if (job.status !== "GENERATING") {
    logProviderEvent("warn", "fal.webhook.job_already_closed", { jobId: job.id, status: job.status });
    return job;
  }
  logProviderEvent("info", "fal.webhook.processing_job", { jobId: job.id, requestId: job.providerRequestId });
  try {
    return await completeWebhookJob(job, payload);
  } catch (error) {
    logProviderError("fal.webhook.result_failed", { jobId: job.id, requestId: job.providerRequestId }, error);
    return failGenerationJob(job.id, providerErrorPayload(error), "fal result failed");
  }
}

async function completeWebhookJob(job: NonNullable<Awaited<ReturnType<typeof findJob>>>, payload: FalWebhookPayload) {
  if (!job.providerRequestId) throw new Error("Missing fal request id");
  const result = payload.data ? { data: payload.data } : await getFalResult(providerModelId(job.modelId), job.providerRequestId);
  return completeGenerationJob(job.id, result.data);
}

function markWebhookProcessed(eventId: string) {
  return prisma.webhookEvent.update({
    where: { provider_eventId: { provider: "fal", eventId } },
    data: { processedAt: new Date() }
  });
}

function providerModelId(modelId: string) {
  const model = getSupportedModel(modelId);
  if (!model) throw new Error("Generation model is not supported");
  return model.providerModelId;
}

function asJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function webhookExpiresAt() {
  return new Date(Date.now() + 1000 * 60 * 60 * 24 * 90);
}

function webhookLog(eventId: string, payload: FalWebhookPayload) {
  return {
    eventId,
    hasData: Boolean(payload.data),
    hasError: Boolean(payload.error),
    status: payload.status,
    payload
  };
}

function jobLog(job: NonNullable<Awaited<ReturnType<typeof findJob>>>, payload: FalWebhookPayload) {
  return {
    jobId: job.id,
    modelId: job.modelId,
    requestId: job.providerRequestId,
    status: payload.status
  };
}
