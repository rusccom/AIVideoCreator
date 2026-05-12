import { fal } from "@fal-ai/client";
import { logProviderError, logProviderEvent } from "./provider-log";

type SubmitFalInput = {
  providerModelId: string;
  input: Record<string, unknown>;
  webhookUrl?: string;
};

let configured = false;

export async function submitFalJob(input: SubmitFalInput) {
  configureFal();
  logProviderEvent("info", "fal.submit.started", submitLog(input));
  try {
    const result = await fal.queue.submit(input.providerModelId, submitOptions(input));
    logProviderEvent("info", "fal.submit.accepted", { ...submitMeta(input), result });
    return result;
  } catch (error) {
    logProviderError("fal.submit.failed", submitLog(input), error);
    throw error;
  }
}

export async function subscribeFalJob(input: SubmitFalInput) {
  configureFal();
  logProviderEvent("info", "fal.subscribe.started", submitLog(input));
  try {
    return await fal.subscribe(input.providerModelId, { input: input.input, logs: true });
  } catch (error) {
    logProviderError("fal.subscribe.failed", submitLog(input), error);
    throw error;
  }
}

export async function getFalResult(providerModelId: string, requestId: string) {
  configureFal();
  logProviderEvent("info", "fal.result.started", { providerModelId, requestId });
  try {
    const result = await fal.queue.result(providerModelId, { requestId });
    logProviderEvent("info", "fal.result.received", { providerModelId, requestId, result });
    return result;
  } catch (error) {
    logProviderError("fal.result.failed", { providerModelId, requestId }, error);
    throw error;
  }
}

export async function getFalStatus(providerModelId: string, requestId: string) {
  configureFal();
  logProviderEvent("info", "fal.status.started", { providerModelId, requestId });
  try {
    const status = await fal.queue.status(providerModelId, { requestId, logs: true });
    logProviderEvent("info", "fal.status.received", { providerModelId, requestId, status });
    return status;
  } catch (error) {
    logProviderError("fal.status.failed", { providerModelId, requestId }, error);
    throw error;
  }
}

function configureFal() {
  if (configured) {
    return;
  }
  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY is required");
  }
  fal.config({ credentials: process.env.FAL_KEY });
  configured = true;
}

function submitOptions(input: SubmitFalInput) {
  return { input: input.input, webhookUrl: input.webhookUrl };
}

function submitLog(input: SubmitFalInput) {
  return { ...submitMeta(input), input: input.input };
}

function submitMeta(input: SubmitFalInput) {
  return {
    providerModelId: input.providerModelId,
    webhookEnabled: Boolean(input.webhookUrl)
  };
}
