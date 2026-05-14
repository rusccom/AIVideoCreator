"use client";

import { RotateCcw, X } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import { generateCreatorImages, type GeneratedCreatorAsset } from "../ai-creator-generation";
import { generateCreatorScenes } from "../ai-creator-scenes";
import { estimateCreatorVideoCredits, generateCreatorVideo, type StartedCreatorVideo } from "../ai-creator-video-generation";
import {
  buildSceneDrafts,
  createLoadingSlots,
  imageCount,
  initialIdeaForm,
  selectedImageModel,
  selectedVideoModel
} from "../ai-creator-state";
import type {
  AiCreatorIdeaFormState,
  AiCreatorImageModel,
  AiCreatorMediaSlot,
  AiCreatorSceneDraft,
  AiCreatorVideoModel
} from "../types";
import { AiCreatorIdeaModal } from "./AiCreatorIdeaModal";
import { AiCreatorMediaPanel } from "./AiCreatorMediaPanel";
import { AiCreatorScenePanel } from "./AiCreatorScenePanel";

type AiCreatorModalProps = {
  imageModels?: AiCreatorImageModel[];
  onClose: () => void;
  onVideoStarted: (video: StartedCreatorVideo) => void;
  projectAspectRatio: string;
  projectId?: string;
  videoModels?: AiCreatorVideoModel[];
};

type CreatorBase = {
  form: AiCreatorIdeaFormState;
  mediaSlots: AiCreatorMediaSlot[];
  scenes: AiCreatorSceneDraft[];
  selectedAssetId?: string;
};

type CreatorContext = CreatorBase & {
  imageModels: AiCreatorImageModel[];
  onBatch: (start: number, count: number, assets: GeneratedCreatorAsset[]) => void;
  projectId?: string;
  videoModels: AiCreatorVideoModel[];
};

type DraftSetters = {
  setLoading: Dispatch<SetStateAction<boolean>>;
  setMediaSlots: Dispatch<SetStateAction<AiCreatorMediaSlot[]>>;
  setScenes: Dispatch<SetStateAction<AiCreatorSceneDraft[]>>;
  setSelectedAssetId: Dispatch<SetStateAction<string | undefined>>;
  setSelectedSceneId: Dispatch<SetStateAction<string | undefined>>;
  setShowIdea: Dispatch<SetStateAction<boolean>>;
};

export function AiCreatorModal(props: AiCreatorModalProps) {
  const state = useCreatorController(props);
  return (
    <div aria-labelledby="ai-creator-title" aria-modal="true" className="project-modal-backdrop" role="dialog">
      <div className="project-modal ai-creator-modal">
        {modalHeader(props, state)}
        {modalBody(state)}
        {state.videoError ? <div className="form-error">{state.videoError}</div> : null}
        {modalFooter(state)}
        {ideaModal(props, state)}
      </div>
    </div>
  );
}

function useCreatorController(props: AiCreatorModalProps) {
  const imageModels = props.imageModels ?? [], videoModels = props.videoModels ?? [];
  const [form, setForm] = useState(() => initialIdeaForm(imageModels, videoModels, props.projectAspectRatio)),
    [showIdea, setShowIdea] = useState(true),
    [loading, setLoading] = useState(false),
    [videoError, setVideoError] = useState(""),
    [videoSubmitting, setVideoSubmitting] = useState(false),
    [scenes, setScenes] = useState<AiCreatorSceneDraft[]>([]),
    [selectedSceneId, setSelectedSceneId] = useState<string>(),
    [mediaSlots, setMediaSlots] = useState<AiCreatorMediaSlot[]>([]),
    [selectedAssetId, setSelectedAssetId] = useState<string>();
  const projectReady = Boolean(props.projectId && imageModels.length > 0 && videoModels.length > 0);
  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId);
  const onBatch = (start: number, count: number, assets: GeneratedCreatorAsset[]) => updateBatch(setMediaSlots, setSelectedAssetId, start, count, assets);
  const context = { form, imageModels, mediaSlots, onBatch, projectId: props.projectId, scenes, selectedAssetId, videoModels };
  const request = videoRequest(context);
  const setters = { setLoading, setMediaSlots, setScenes, setSelectedAssetId, setSelectedSceneId, setShowIdea };
  return { form, imageModels, loading, mediaSlots, projectReady, scenes, selectedAssetId, selectedScene, selectedSceneId, setForm, setShowIdea, showIdea, selectMedia: (slot: AiCreatorMediaSlot) => selectMedia(setSelectedAssetId, slot), selectScene: setSelectedSceneId, submitIdea: () => submitIdea(context, setters), submitVideo: () => submitVideo(context, props.onVideoStarted, setVideoSubmitting, setVideoError), updateSceneText: (sceneId: string, text: string) => updateSceneText(setScenes, sceneId, text), videoCost: request ? estimateCreatorVideoCredits(request) : null, videoError, videoModels, videoRequest: request, videoSubmitting };
}

type CreatorController = ReturnType<typeof useCreatorController>;

function modalHeader(props: AiCreatorModalProps, state: CreatorController) {
  return (
    <div className="project-modal-header">
      <div>
        <h2 id="ai-creator-title">AI Creator</h2>
        <p>{state.selectedScene ? `${state.selectedScene.name} ${state.selectedScene.range}` : "Build a video plan from one idea."}</p>
      </div>
      <div className="ai-creator-header-actions">
        <button className="button button-secondary" onClick={() => state.setShowIdea(true)} type="button">
          <RotateCcw size={16} /> Reload
        </button>
        <button aria-label="Close" className="project-modal-close" onClick={props.onClose} type="button"><X size={18} /></button>
      </div>
    </div>
  );
}

function modalBody(state: CreatorController) {
  return (
    <div className="ai-creator-modal-body">
      <AiCreatorMediaPanel addDisabled generating={state.loading} onAdd={() => state.setShowIdea(true)} onSelect={state.selectMedia} selectedAssetId={state.selectedAssetId} slots={state.mediaSlots} />
      <AiCreatorScenePanel onSelect={state.selectScene} onTextChange={state.updateSceneText} scenes={state.scenes} selectedSceneId={state.selectedSceneId} />
    </div>
  );
}

function modalFooter(state: CreatorController) {
  return (
    <div className="ai-creator-modal-footer">
      <button className="button button-primary" disabled={videoDisabled(state.videoRequest, state.loading, state.videoSubmitting)} onClick={state.submitVideo} type="button">
        {videoButtonText(state.videoSubmitting, state.videoCost, state.scenes.length)}
      </button>
    </div>
  );
}

function ideaModal(props: AiCreatorModalProps, state: CreatorController) {
  if (!state.showIdea) return null;
  return <AiCreatorIdeaModal form={state.form} imageModels={state.imageModels} loading={state.loading} onCancel={cancelIdea(props, state)} onChange={state.setForm} onSubmit={state.submitIdea} projectReady={state.projectReady} videoModels={state.videoModels} />;
}

async function submitIdea(context: CreatorContext, setters: DraftSetters) {
  setters.setLoading(true);
  const scenes = await loadSceneDrafts(context);
  setters.setScenes(scenes);
  setters.setShowIdea(false);
  setters.setSelectedSceneId(scenes[0]?.id);
  setters.setLoading(false);
  await loadFirstFrameImages(context, setters, scenes[0]);
}

async function submitVideo(
  context: CreatorContext,
  onVideoStarted: (video: StartedCreatorVideo) => void,
  setSubmitting: Dispatch<SetStateAction<boolean>>,
  setError: Dispatch<SetStateAction<string>>
) {
  const input = videoRequest(context);
  if (!input) return setError("Select a first frame before generating video.");
  setSubmitting(true);
  setError("");
  try {
    onVideoStarted(await generateCreatorVideo(input));
  } catch (error) {
    setError(errorMessage(error));
  } finally {
    setSubmitting(false);
  }
}

async function loadSceneDrafts(context: CreatorContext) {
  if (!context.projectId) return buildSceneDrafts(context.form);
  try {
    return await generateCreatorScenes(context.projectId, context.form);
  } catch {
    return buildSceneDrafts(context.form);
  }
}

async function loadFirstFrameImages(context: CreatorContext, setters: DraftSetters, scene?: AiCreatorSceneDraft) {
  const imageModel = selectedImageModel(context.imageModels, context.form.imageModelId);
  if (!scene || !context.projectId || !imageModel) return;
  setters.setLoading(true);
  setters.setMediaSlots(createLoadingSlots(imageCount(imageModel)));
  setters.setSelectedAssetId(undefined);
  await generateSceneImages(context, setters, scene, imageModel);
  setters.setLoading(false);
}

async function generateSceneImages(
  context: CreatorContext,
  setters: DraftSetters,
  scene: AiCreatorSceneDraft,
  imageModel: AiCreatorImageModel
) {
  try {
    await generateCreatorImages(imageRequest(context.projectId!, scene, imageModel, context.form, context.onBatch));
  } catch {
    setters.setMediaSlots((current) => failLoadingSlots(current));
  }
}

function selectMedia(setSelectedAssetId: Dispatch<SetStateAction<string | undefined>>, slot: AiCreatorMediaSlot) {
  if (slot.assetId) setSelectedAssetId(slot.assetId);
}

function updateSceneText(setScenes: Dispatch<SetStateAction<AiCreatorSceneDraft[]>>, sceneId: string, text: string) {
  setScenes((current) => current.map((scene) => scene.id === sceneId ? { ...scene, text } : scene));
}

function updateBatch(
  setMediaSlots: Dispatch<SetStateAction<AiCreatorMediaSlot[]>>,
  setSelectedAssetId: Dispatch<SetStateAction<string | undefined>>,
  start: number,
  count: number,
  assets: GeneratedCreatorAsset[]
) {
  setSelectedAssetId((current) => current ?? assets[0]?.id);
  setMediaSlots((current) => mergeAssets(current, start, count, assets));
}

function videoRequest(context: CreatorContext) {
  const assetId = context.selectedAssetId ?? firstReadyAssetId(context.mediaSlots);
  const videoModel = selectedVideoModel(context.videoModels, context.form.videoModelId);
  if (!context.projectId || !context.scenes.length || !assetId || !videoModel) return null;
  return { assetId, form: context.form, projectId: context.projectId, scenes: context.scenes, videoModel };
}

function cancelIdea(props: AiCreatorModalProps, state: CreatorController) {
  return state.scenes.length > 0 ? () => state.setShowIdea(false) : props.onClose;
}

function imageRequest(
  projectId: string,
  scene: AiCreatorSceneDraft,
  imageModel: AiCreatorImageModel,
  form: AiCreatorIdeaFormState,
  onBatch: (start: number, count: number, assets: GeneratedCreatorAsset[]) => void
) {
  return {
    aspectRatio: form.aspectRatio,
    imageModel,
    onBatch,
    projectId,
    prompt: scene.imagePrompt
  };
}

function mergeAssets(slots = createLoadingSlots(), start: number, count: number, assets: GeneratedCreatorAsset[]) {
  const next = [...slots];
  for (let index = 0; index < count; index += 1) {
    next[start + index] = batchSlot(next[start + index], assets[index]);
  }
  return next;
}

function batchSlot(slot: AiCreatorMediaSlot | undefined, asset?: GeneratedCreatorAsset) {
  if (!asset) return { ...(slot ?? emptySlot()), status: "failed" as const };
  return readySlot(slot, asset);
}

function readySlot(slot: AiCreatorMediaSlot | undefined, asset: GeneratedCreatorAsset) {
  return {
    id: slot?.id ?? asset.id,
    label: slot?.label ?? "Generated image",
    status: "ready" as const,
    assetId: asset.id,
    url: asset.url
  };
}

function emptySlot() {
  return {
    id: "slot-missing",
    label: "Image"
  };
}

function failLoadingSlots(slots = createLoadingSlots()) {
  return slots.map((slot) => slot.status === "loading" ? { ...slot, status: "failed" as const } : slot);
}

function firstReadyAssetId(slots: AiCreatorMediaSlot[]) {
  return slots.find((slot) => slot.status === "ready" && slot.assetId)?.assetId;
}

function videoDisabled(input: unknown, loading: boolean, submitting: boolean) {
  return loading || submitting || !input;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Video generation could not start.";
}

function videoButtonText(submitting: boolean, credits: number | null, sceneCount: number) {
  if (submitting) return "Submitting...";
  const label = sceneCount > 1 ? `Generate ${sceneCount} videos` : "Generate video";
  return credits === null ? label : `${label} (${credits} credits)`;
}
