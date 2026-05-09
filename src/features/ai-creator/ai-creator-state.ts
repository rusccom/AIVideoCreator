import {
  DEFAULT_IMAGE_BATCH_SIZE,
  DEFAULT_IMAGES_PER_SCENE,
  DEFAULT_SCENE_DURATION_SECONDS,
  IMAGE_API_MAX_IMAGES_PER_REQUEST
} from "./config";
import {
  COMMON_ASPECT_RATIO_PRESETS,
  defaultAspectRatioPreset
} from "@/features/generation/models/aspect-ratio-presets";
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
    aspectRatio: defaultAspectRatioPreset().value,
    durationSeconds: DEFAULT_SCENE_DURATION_SECONDS * 6,
    idea: "",
    imageModelId: imageModel?.id ?? "",
    videoModelId: videoModel?.id ?? ""
  };
}

export function aspectRatioOptions() {
  return COMMON_ASPECT_RATIO_PRESETS;
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
    imagePrompt: imagePrompt(form, index),
    name: `Scene ${index + 1}`,
    range: `${start}-${end}s`,
    text: narrationText(form, index)
  };
}

function sceneCount(durationSeconds: number) {
  return Math.max(1, Math.ceil(durationSeconds / DEFAULT_SCENE_DURATION_SECONDS));
}

function imagePrompt(form: AiCreatorIdeaFormState, index: number) {
  return `Cinematic first frame for scene ${index + 1}, ${form.aspectRatio} aspect ratio. Video idea: ${form.idea}`;
}

function narrationText(form: AiCreatorIdeaFormState, index: number) {
  return ideaChunk(form.idea, sceneCount(form.durationSeconds), index);
}

function ideaChunk(idea: string, count: number, index: number) {
  const words = idea.trim().split(/\s+/);
  const size = Math.max(1, Math.ceil(words.length / count));
  return words.slice(index * size, (index + 1) * size).join(" ") || idea;
}
