import type { AiCreatorIdeaFormState, AiCreatorSceneDraft, AiCreatorVideoModel } from "./types";

type GenerateCreatorVideoInput = {
  assetId: string;
  form: AiCreatorIdeaFormState;
  projectId: string;
  scene: AiCreatorSceneDraft;
  videoModel: AiCreatorVideoModel;
};

export async function generateCreatorVideo(input: GenerateCreatorVideoInput) {
  await preflightVideoGeneration(input);
  await selectStartImage(input.projectId, input.assetId);
  const sceneId = await createCreatorScene(input);
  await startVideoGeneration(sceneId, input);
  return { sceneId };
}

export function estimateCreatorVideoCredits(input: Pick<GenerateCreatorVideoInput, "scene" | "videoModel">) {
  const resolution = input.videoModel.defaultResolution;
  const price = input.videoModel.pricePerSecondByResolution[resolution] ?? 0;
  return Math.ceil(sceneDuration(input.scene) * price);
}

async function preflightVideoGeneration(input: GenerateCreatorVideoInput) {
  const response = await fetch(`/api/projects/${input.projectId}/video-generation/preflight`, postJson(videoBody(input)));
  if (!response.ok) throw new Error(await responseError(response, "Video generation could not start."));
}

async function selectStartImage(projectId: string, assetId: string) {
  const response = await fetch(`/api/projects/${projectId}/start-images/select`, postJson({ assetId }));
  if (!response.ok) throw new Error(await responseError(response, "Start image selection failed."));
}

async function createCreatorScene(input: GenerateCreatorVideoInput) {
  const response = await fetch(`/api/projects/${input.projectId}/scenes`, postJson(sceneBody(input)));
  if (!response.ok) throw new Error(await responseError(response, "Scene could not be created."));
  const data = await response.json() as { scene?: { id?: string } };
  if (!data.scene?.id) throw new Error("Scene was not created.");
  return data.scene.id;
}

async function startVideoGeneration(sceneId: string, input: GenerateCreatorVideoInput) {
  const response = await fetch(`/api/scenes/${sceneId}/generate-video`, postJson(videoBody(input)));
  if (!response.ok) throw new Error(await responseError(response, "Video generation could not start."));
}

function sceneBody(input: GenerateCreatorVideoInput) {
  return {
    durationSeconds: sceneDuration(input.scene),
    modelId: input.form.videoModelId,
    prompt: videoPrompt(input.scene),
    startFrameAssetId: input.assetId
  };
}

function videoBody(input: GenerateCreatorVideoInput) {
  return {
    aspectRatio: input.form.aspectRatio,
    duration: sceneDuration(input.scene),
    modelId: input.form.videoModelId,
    prompt: videoPrompt(input.scene),
    resolution: input.videoModel.defaultResolution
  };
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
