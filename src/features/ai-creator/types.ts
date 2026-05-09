import type { AspectRatioPreset } from "@/features/generation/models/aspect-ratio-presets";

export type AiCreatorAspectRatioOption = AspectRatioPreset;

export type AiCreatorImageModel = {
  id: string;
  displayName: string;
  defaultAspectRatio: string;
  defaultResolution: string;
  maxImagesPerRequest?: number;
  supportedAspectRatios: string[];
  supportedResolutions: string[];
};

export type AiCreatorVideoModel = {
  id: string;
  displayName: string;
  defaultAspectRatio: string;
  defaultDurationSeconds: number;
  defaultResolution: string;
  maxDurationSeconds: number;
  minDurationSeconds: number;
  supportedAspectRatios: string[];
  supportedResolutions: string[];
};

export type AiCreatorIdeaFormState = {
  aspectRatio: string;
  durationSeconds: number;
  idea: string;
  imageModelId: string;
  videoModelId: string;
};

export type AiCreatorSceneDraft = {
  id: string;
  imagePrompt: string;
  name: string;
  range: string;
  text: string;
};

export type AiCreatorMediaSlot = {
  id: string;
  label: string;
  status: "loading" | "ready" | "failed";
  assetId?: string;
  url?: string;
};
