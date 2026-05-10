export type EditorScene = {
  id: string;
  name: string;
  status: string;
  statusValue: string;
  duration: string;
  durationSeconds: number;
  model: string;
  modelId: string;
  prompt: string;
  aiPrompt: string;
  startFrameAssetId?: string | null;
  generationJobId?: string | null;
  startFrameUrl?: string | null;
  videoUrl?: string | null;
  endFrameUrl?: string | null;
  linkState: "Linked" | "Needs relink";
};

export type EditorAsset = {
  id: string;
  label: string;
  type: string;
  url?: string | null;
};

export type EditorImageModel = {
  id: string;
  displayName: string;
  defaultAspectRatio: string;
  defaultResolution: string;
  maxImagesPerRequest: number;
  supportedAspectRatios: string[];
  supportedResolutions: string[];
};

export type EditorVideoModel = {
  id: string;
  displayName: string;
  defaultAspectRatio: string;
  defaultDurationSeconds: number;
  defaultResolution: string;
  maxDurationSeconds: number;
  minDurationSeconds: number;
  pricePerSecondByResolution: Record<string, number>;
  supportedAspectRatios: string[];
  supportedResolutions: string[];
};

export type EditorProject = {
  id: string;
  title: string;
  aspectRatio: string;
  totalDuration: string;
  scenes: EditorScene[];
  assets: EditorAsset[];
  imageModels: EditorImageModel[];
  videoModels: EditorVideoModel[];
};
