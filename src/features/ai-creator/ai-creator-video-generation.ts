import type { AiCreatorIdeaFormState, AiCreatorSceneDraft, AiCreatorVideoModel } from "./types";

type GenerateCreatorVideoInput = {
  assetId: string;
  form: AiCreatorIdeaFormState;
  projectId: string;
  scene: AiCreatorSceneDraft;
  videoModel: AiCreatorVideoModel;
};

export async function generateCreatorVideo(input: GenerateCreatorVideoInput) {
  const response = await fetch(`/api/projects/${input.projectId}/ai-creator/video`, postJson(videoBody(input)));
  if (!response.ok) throw new Error(await responseError(response, "Video generation could not start."));
  return response.json() as Promise<{ scene: { id: string } }>;
}

export function estimateCreatorVideoCredits(input: Pick<GenerateCreatorVideoInput, "scene" | "videoModel">) {
  const resolution = input.videoModel.defaultResolution;
  const price = input.videoModel.pricePerSecondByResolution[resolution] ?? 0;
  return Math.ceil(sceneDuration(input.scene) * price);
}

function videoBody(input: GenerateCreatorVideoInput) {
  return {
    assetId: input.assetId,
    aspectRatio: videoAspectRatio(input.videoModel, input.form.aspectRatio),
    duration: sceneDuration(input.scene),
    modelId: input.form.videoModelId,
    prompt: videoPrompt(input.scene),
    resolution: input.videoModel.defaultResolution
  };
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
