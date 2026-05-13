export type GeneratedProjectImageAsset = {
  id: string;
  url: string;
};

export type ProjectImageGenerationRequest = {
  aspectRatio?: string;
  modelId: string;
  numImages: number;
  prompt: string;
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
    const source = new EventSource(`/api/projects/${projectId}/events`);
    const check = () => void refreshImageJob(jobId, source, resolve, reject);
    source.addEventListener("images.ready", check);
    source.addEventListener("images.failed", check);
    source.onerror = () => undefined;
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
  source: EventSource,
  resolve: (assets: GeneratedProjectImageAsset[]) => void,
  reject: (error: Error) => void
) {
  try {
    const job = await refreshJob(jobId);
    if (job.status === "READY") return finish(source, () => resolve(job.assets));
    if (job.status === "FAILED" || job.status === "CANCELED") {
      return finish(source, () => reject(new Error("Image generation failed.")));
    }
  } catch (error) {
    finish(source, () => reject(error instanceof Error ? error : new Error("Image generation failed.")));
  }
}

function finish(source: EventSource, callback: () => void) {
  source.close();
  callback();
}

type ImageGenerationJob = {
  assets?: GeneratedProjectImageAsset[];
  status: string;
};
