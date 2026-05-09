import {
  AI_CREATOR_ASPECT_RATIOS,
  DEFAULT_IMAGE_BATCH_SIZE,
  DEFAULT_IMAGES_PER_SCENE,
  DEFAULT_SCENE_DURATION_SECONDS,
  IMAGE_API_MAX_IMAGES_PER_REQUEST
} from "./config";
import type {
  AiCreatorIdeaFormState,
  AiCreatorImageModel,
  AiCreatorMediaSlot,
  AiCreatorSceneDraft,
  AiCreatorVideoModel
} from "./types";

export function initialIdeaForm(
  imageModels: AiCreatorImageModel[],
  videoModels: AiCreatorVideoModel[]
): AiCreatorIdeaFormState {
  const imageModel = imageModels[0];
  const videoModel = videoModels[0];
  return {
    aspectRatio: videoModel?.defaultAspectRatio ?? imageModel?.defaultAspectRatio ?? AI_CREATOR_ASPECT_RATIOS[0],
    durationSeconds: DEFAULT_SCENE_DURATION_SECONDS * 6,
    idea: "",
    imageModelId: imageModel?.id ?? "",
    videoModelId: videoModel?.id ?? ""
  };
}

export function aspectRatioOptions(
  form: AiCreatorIdeaFormState,
  imageModels: AiCreatorImageModel[],
  videoModels: AiCreatorVideoModel[]
) {
  const imageModel = selectedImageModel(imageModels, form.imageModelId);
  const videoModel = selectedVideoModel(videoModels, form.videoModelId);
  return uniqueOptions(videoModel?.supportedAspectRatios, imageModel?.supportedAspectRatios);
}

export function buildSceneDrafts(form: AiCreatorIdeaFormState) {
  return Array.from({ length: sceneCount(form.durationSeconds) }, (_, index) => sceneDraft(form, index));
}

export function createLoadingSlots(count = DEFAULT_IMAGES_PER_SCENE): AiCreatorMediaSlot[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `slot-${index + 1}`,
    label: `Image ${index + 1}`,
    status: "loading"
  }));
}

export function imageBatchSize(model?: AiCreatorImageModel) {
  const value = model?.maxImagesPerRequest ?? DEFAULT_IMAGE_BATCH_SIZE;
  return Math.max(1, Math.min(value, IMAGE_API_MAX_IMAGES_PER_REQUEST, DEFAULT_IMAGES_PER_SCENE));
}

export function selectedImageModel(models: AiCreatorImageModel[], modelId: string) {
  return models.find((model) => model.id === modelId) ?? models[0];
}

export function selectedVideoModel(models: AiCreatorVideoModel[], modelId: string) {
  return models.find((model) => model.id === modelId) ?? models[0];
}

function sceneDraft(form: AiCreatorIdeaFormState, index: number): AiCreatorSceneDraft {
  const start = index * DEFAULT_SCENE_DURATION_SECONDS;
  const end = Math.min(start + DEFAULT_SCENE_DURATION_SECONDS, form.durationSeconds);
  return {
    id: `scene-${index + 1}`,
    imagePrompt: imagePrompt(form.idea, index),
    name: `Scene ${index + 1}`,
    range: `${start}-${end}s`,
    text: narrationText(form.idea, index)
  };
}

function sceneCount(durationSeconds: number) {
  return Math.max(1, Math.ceil(durationSeconds / DEFAULT_SCENE_DURATION_SECONDS));
}

function imagePrompt(idea: string, index: number) {
  return `Cinematic first frame for scene ${index + 1}. Video idea: ${idea}`;
}

function narrationText(idea: string, index: number) {
  return `Narration draft for scene ${index + 1}. Adapt this part of the video idea: ${idea}`;
}

function uniqueOptions(first: string[] = [], second: string[] = []) {
  const options = [...first, ...second, ...AI_CREATOR_ASPECT_RATIOS].filter(Boolean);
  return Array.from(new Set(options));
}
