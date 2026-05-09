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
  return waitForImageGeneration(job.id);
}

async function startImageGeneration(projectId: string, request: ProjectImageGenerationRequest) {
  const response = await fetch(`/api/projects/${projectId}/images/generate`, requestOptions(request));
  if (!response.ok) throw new Error("Image generation failed.");
  const data = await response.json() as { job?: { id?: string } };
  if (!data.job?.id) throw new Error("Image generation job was not created.");
  return { id: data.job.id };
}

async function waitForImageGeneration(jobId: string): Promise<GeneratedProjectImageAsset[]> {
  while (true) {
    const job = await refreshJob(jobId);
    if (job.status === "READY") return job.assets;
    if (job.status === "FAILED" || job.status === "CANCELED") throw new Error("Image generation failed.");
    await sleep(1200);
  }
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ImageGenerationJob = {
  assets?: GeneratedProjectImageAsset[];
  status: string;
};
