import { subscribeProjectEvents } from "@/shared/client/project-events";

export type GeneratedProjectImageAsset = {
  id: string;
  url: string;
};

export type ProjectImageGenerationRequest = {
  aspectRatio?: string;
  modelId: string;
  numImages: number;
  prompt: string;
  referenceAssetId?: string;
  resolution?: string;
};

export async function generateProjectImageAssets(
  projectId: string,
  request: ProjectImageGenerationRequest
) {
  const job = await startImageGeneration(projectId, request);
  return waitForImageGeneration(projectId, job.id);
}

async function startImageGeneration(projectId: string, request: ProjectImageGenerationRequest) {
  const response = await fetch(`/api/projects/${projectId}/images/generate`, requestOptions(request));
  if (!response.ok) throw new Error("Image generation failed.");
  const data = await response.json() as { job?: { id?: string } };
  if (!data.job?.id) throw new Error("Image generation job was not created.");
  return { id: data.job.id };
}

function waitForImageGeneration(projectId: string, jobId: string) {
  return new Promise<GeneratedProjectImageAsset[]>((resolve, reject) => {
    let cleanup: () => void = () => undefined;
    const check = () => void refreshImageJob(jobId, cleanup, resolve, reject);
    cleanup = subscribeProjectEvents(projectId, ["images.ready", "images.failed"], check);
    check();
  });
}

async function refreshJob(jobId: string) {
  const response = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Image generation status failed.");
  const job = await response.json() as ImageGenerationJob;
  return { ...job, assets: Array.isArray(job.assets) ? job.assets : [] };
}

function requestOptions(request: ProjectImageGenerationRequest) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  };
}

async function refreshImageJob(
  jobId: string,
  cleanup: () => void,
  resolve: (assets: GeneratedProjectImageAsset[]) => void,
  reject: (error: Error) => void
) {
  try {
    const job = await refreshJob(jobId);
    if (job.status === "READY") return finish(cleanup, () => resolve(job.assets));
    if (job.status === "FAILED" || job.status === "CANCELED") {
      return finish(cleanup, () => reject(new Error("Image generation failed.")));
    }
  } catch (error) {
    finish(cleanup, () => reject(error instanceof Error ? error : new Error("Image generation failed.")));
  }
}

function finish(cleanup: () => void, callback: () => void) {
  cleanup();
  callback();
}

type ImageGenerationJob = {
  assets?: GeneratedProjectImageAsset[];
  status: string;
};
