import type { AiCreatorIdeaFormState, AiCreatorSceneDraft, AiCreatorVideoModel } from "./types";

type GenerateCreatorVideoInput = {
  assetId: string;
  form: AiCreatorIdeaFormState;
  projectId: string;
  scenes: AiCreatorSceneDraft[];
  videoModel: AiCreatorVideoModel;
};

export type StartedCreatorVideo = {
  job: {
    id: string;
    status: string;
  };
  scene: {
    id: string;
  };
  sequence?: {
    id: string;
    sceneIds: string[];
    total: number;
  };
};

export async function generateCreatorVideo(input: GenerateCreatorVideoInput) {
  const response = await fetch(`/api/projects/${input.projectId}/ai-creator/video`, postJson(videoBody(input)));
  if (!response.ok) throw new Error(await responseError(response, "Video generation could not start."));
  return response.json() as Promise<StartedCreatorVideo>;
}

export type StartClipGenerationInput = {
  assetId: string;
  aspectRatio: string;
  duration: number;
  modelId: string;
  parentSceneId?: string;
  projectId: string;
  prompt: string;
  resolution: string;
};

export async function startClipGeneration(input: StartClipGenerationInput) {
  const response = await fetch(`/api/projects/${input.projectId}/ai-creator/video`, postJson(clipBody(input)));
  if (!response.ok) throw new Error(await responseError(response, "Video generation could not start."));
  return response.json() as Promise<StartedCreatorVideo>;
}

function clipBody(input: StartClipGenerationInput) {
  return {
    assetId: input.assetId,
    aspectRatio: input.aspectRatio,
    duration: input.duration,
    modelId: input.modelId,
    parentSceneId: input.parentSceneId,
    prompt: input.prompt,
    resolution: input.resolution
  };
}

export function estimateCreatorVideoCredits(input: Pick<GenerateCreatorVideoInput, "scenes" | "videoModel">) {
  return input.scenes.reduce((total, scene) => total + sceneCredits(input.videoModel, scene), 0);
}

function videoBody(input: GenerateCreatorVideoInput) {
  const scenes = videoScenes(input);
  const first = scenes[0];
  return {
    assetId: input.assetId,
    aspectRatio: videoAspectRatio(input.videoModel, input.form.aspectRatio),
    duration: first.duration,
    modelId: input.form.videoModelId,
    prompt: first.prompt,
    resolution: input.videoModel.defaultResolution,
    scenes
  };
}

function videoScenes(input: GenerateCreatorVideoInput) {
  return input.scenes.map((scene) => ({
    duration: sceneDuration(scene),
    prompt: videoPrompt(scene)
  }));
}

function sceneCredits(model: AiCreatorVideoModel, scene: AiCreatorSceneDraft) {
  const resolution = model.defaultResolution;
  const price = model.pricePerSecondByResolution[resolution] ?? 0;
  return Math.ceil(sceneDuration(scene) * price);
}

function videoAspectRatio(model: AiCreatorVideoModel, aspectRatio: string) {
  if (model.supportedAspectRatios.includes(aspectRatio)) return aspectRatio;
  return model.supportedAspectRatios.includes("auto") ? "auto" : model.defaultAspectRatio;
}

function videoPrompt(scene: AiCreatorSceneDraft) {
  const prompt = `${scene.imagePrompt}\nNarration: ${scene.text}`.trim();
  return prompt.slice(0, 2000);
}

function sceneDuration(scene: AiCreatorSceneDraft) {
  const match = scene.range.match(/(\d+)-(\d+)s/);
  if (!match) return 10;
  return Math.max(1, Number(match[2]) - Number(match[1]));
}

function postJson(body: unknown) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

async function responseError(response: Response, fallback: string) {
  try {
    const data = await response.json() as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}
