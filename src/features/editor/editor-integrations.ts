import type { ComponentType } from "react";
import type { EditorAsset, EditorImageModel, EditorVideoModel } from "./types";

export type StartedCreatorVideo = {
  job: { id: string; status: string };
  scene: { id: string };
  sequence?: { id: string; sceneIds: string[]; total: number };
};

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

export type SceneProgressTarget = {
  jobId: string;
  projectId: string;
  sequenceId?: string;
  total: number;
};

type AiCreatorButtonProps = {
  imageModels: EditorImageModel[];
  projectAspectRatio: string;
  projectId: string;
  videoModels: EditorVideoModel[];
};

type AiCreatorProgressProps = SceneProgressTarget & {
  onDone: () => void;
};

type PhotoLibraryModalProps = {
  assets?: EditorAsset[];
  imageModels: EditorImageModel[];
  initialSelectedAssetId?: string;
  mode: "manage" | "select";
  onChanged?: () => void;
  onClose: () => void;
  onSelect?: (asset: EditorAsset) => void;
  projectAspectRatio: string;
  projectId: string;
};

export type EditorIntegrations = {
  AiCreatorButton: ComponentType<AiCreatorButtonProps>;
  AiCreatorProgressModal: ComponentType<AiCreatorProgressProps>;
  PhotoLibraryModal: ComponentType<PhotoLibraryModalProps>;
  startClipGeneration: (input: StartClipGenerationInput) => Promise<StartedCreatorVideo>;
};
