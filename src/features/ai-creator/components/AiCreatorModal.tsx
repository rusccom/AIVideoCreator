"use client";

import { RotateCcw, X } from "lucide-react";
import { useState } from "react";
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

export function AiCreatorModal(props: AiCreatorModalProps) {
  const imageModels = props.imageModels ?? [];
  const videoModels = props.videoModels ?? [];
  const [form, setForm] = useState(() => initialIdeaForm(imageModels, videoModels, props.projectAspectRatio));
  const [showIdea, setShowIdea] = useState(true);
  const [loading, setLoading] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [videoSubmitting, setVideoSubmitting] = useState(false);
  const [scenes, setScenes] = useState<AiCreatorSceneDraft[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string>();
  const [mediaSlots, setMediaSlots] = useState<AiCreatorMediaSlot[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>();
  const projectReady = Boolean(props.projectId && imageModels.length > 0 && videoModels.length > 0);
  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId);

  async function submitIdea() {
    setLoading(true);
    const nextScenes = await loadSceneDrafts(form);
    setScenes(nextScenes);
    setShowIdea(false);
    setSelectedSceneId(nextScenes[0]?.id);
    setLoading(false);
    await loadFirstFrameImages(nextScenes[0], form);
  }

  async function submitVideo() {
    const input = videoRequest();
    if (!input) return setVideoError("Select a first frame before generating video.");
    setVideoSubmitting(true);
    setVideoError("");
    try {
      props.onVideoStarted(await generateCreatorVideo(input));
    } catch (error) {
      setVideoError(errorMessage(error));
    } finally {
      setVideoSubmitting(false);
    }
  }

  async function loadSceneDrafts(nextForm: AiCreatorIdeaFormState) {
    if (!props.projectId) return buildSceneDrafts(nextForm);
    try {
      return await generateCreatorScenes(props.projectId, nextForm);
    } catch {
      return buildSceneDrafts(nextForm);
    }
  }

  async function loadFirstFrameImages(scene: AiCreatorSceneDraft | undefined, nextForm = form) {
    const imageModel = selectedImageModel(imageModels, nextForm.imageModelId);
    if (!scene || !props.projectId || !imageModel) return;
    setLoading(true);
    setMediaSlots(createLoadingSlots(imageCount(imageModel)));
    setSelectedAssetId(undefined);
    await generateSceneImages(scene, imageModel, nextForm);
    setLoading(false);
  }

  async function generateSceneImages(
    scene: AiCreatorSceneDraft,
    imageModel: AiCreatorImageModel,
    nextForm: AiCreatorIdeaFormState
  ) {
    try {
      await generateCreatorImages(imageRequest(props.projectId!, scene, imageModel, nextForm, updateBatch));
    } catch {
      setMediaSlots((current) => failLoadingSlots(current));
    }
  }

  function selectScene(sceneId: string) {
    setSelectedSceneId(sceneId);
  }

  function updateSceneText(sceneId: string, text: string) {
    setScenes((current) => current.map((scene) => scene.id === sceneId ? { ...scene, text } : scene));
  }

  function selectMedia(slot: AiCreatorMediaSlot) {
    if (!slot.assetId) return;
    setSelectedAssetId(slot.assetId);
  }

  function updateBatch(start: number, count: number, assets: GeneratedCreatorAsset[]) {
    setSelectedAssetId((current) => current ?? assets[0]?.id);
    setMediaSlots((current) => mergeAssets(current, start, count, assets));
  }

  function videoRequest() {
    const assetId = selectedAssetId ?? firstReadyAssetId(mediaSlots);
    const videoModel = selectedVideoModel(videoModels, form.videoModelId);
    if (!props.projectId || !scenes.length || !assetId || !videoModel) return null;
    return { assetId, form, projectId: props.projectId, scenes, videoModel };
  }

  const currentVideoRequest = videoRequest();
  const currentVideoCost = currentVideoRequest ? estimateCreatorVideoCredits(currentVideoRequest) : null;

  return (
    <div aria-labelledby="ai-creator-title" aria-modal="true" className="project-modal-backdrop" role="dialog">
      <div className="project-modal ai-creator-modal">
        <div className="project-modal-header">
          <div>
            <h2 id="ai-creator-title">AI Creator</h2>
            <p>{selectedScene ? `${selectedScene.name} ${selectedScene.range}` : "Build a video plan from one idea."}</p>
          </div>
          <div className="ai-creator-header-actions">
            <button className="button button-secondary" onClick={() => setShowIdea(true)} type="button">
              <RotateCcw size={16} /> Reload
            </button>
            <button aria-label="Close" className="project-modal-close" onClick={props.onClose} type="button">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="ai-creator-modal-body">
          <AiCreatorMediaPanel
            addDisabled
            generating={loading}
            onAdd={() => setShowIdea(true)}
            onSelect={selectMedia}
            selectedAssetId={selectedAssetId}
            slots={mediaSlots}
          />
          <AiCreatorScenePanel
            onSelect={selectScene}
            onTextChange={updateSceneText}
            scenes={scenes}
            selectedSceneId={selectedSceneId}
          />
        </div>
        {videoError ? <div className="form-error">{videoError}</div> : null}
        <div className="ai-creator-modal-footer">
          <button className="button button-primary" disabled={videoDisabled(currentVideoRequest, loading, videoSubmitting)} onClick={submitVideo} type="button">
            {videoButtonText(videoSubmitting, currentVideoCost, scenes.length)}
          </button>
        </div>
        {showIdea ? (
          <AiCreatorIdeaModal
            form={form}
            imageModels={imageModels}
            loading={loading}
            onCancel={scenes.length > 0 ? () => setShowIdea(false) : props.onClose}
            onChange={setForm}
            onSubmit={submitIdea}
            projectReady={projectReady}
            videoModels={videoModels}
          />
        ) : null}
      </div>
    </div>
  );
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
