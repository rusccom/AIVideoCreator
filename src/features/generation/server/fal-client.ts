import { fal } from "@fal-ai/client";

type SubmitFalInput = {
  providerModelId: string;
  input: Record<string, unknown>;
  webhookUrl?: string;
};

let configured = false;

export async function submitFalJob(input: SubmitFalInput) {
  configureFal();
  return fal.queue.submit(input.providerModelId, {
    input: input.input,
    webhookUrl: input.webhookUrl
  });
}

export async function subscribeFalJob(input: SubmitFalInput) {
  configureFal();
  return fal.subscribe(input.providerModelId, {
    input: input.input,
    logs: true
  });
}

export async function getFalResult(providerModelId: string, requestId: string) {
  configureFal();
  return fal.queue.result(providerModelId, { requestId });
}

export async function getFalStatus(providerModelId: string, requestId: string) {
  configureFal();
  return fal.queue.status(providerModelId, { requestId, logs: true });
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
