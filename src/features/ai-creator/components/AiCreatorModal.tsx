"use client";

import { RotateCcw, X } from "lucide-react";
import { useMemo, useState } from "react";
import { generateCreatorImages, type GeneratedCreatorAsset } from "../ai-creator-generation";
import { generateCreatorScenes } from "../ai-creator-scenes";
import {
  aspectRatioOptions,
  buildSceneDrafts,
  createLoadingSlots,
  initialIdeaForm,
  selectedImageModel
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
  projectId?: string;
  videoModels?: AiCreatorVideoModel[];
};

export function AiCreatorModal(props: AiCreatorModalProps) {
  const imageModels = props.imageModels ?? [];
  const videoModels = props.videoModels ?? [];
  const [form, setForm] = useState(() => initialIdeaForm(imageModels, videoModels));
  const [showIdea, setShowIdea] = useState(true);
  const [loading, setLoading] = useState(false);
  const [scenes, setScenes] = useState<AiCreatorSceneDraft[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string>();
  const [mediaByScene, setMediaByScene] = useState<Record<string, AiCreatorMediaSlot[]>>({});
  const [selectedAssetByScene, setSelectedAssetByScene] = useState<Record<string, string>>({});
  const projectReady = Boolean(props.projectId && imageModels.length > 0 && videoModels.length > 0);
  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId);
  const selectedSlots = selectedSceneId ? mediaByScene[selectedSceneId] ?? [] : [];
  const aspectRatios = useMemo(() => aspectRatioOptions(), []);

  async function submitIdea() {
    setLoading(true);
    const nextScenes = await loadSceneDrafts(form);
    setScenes(nextScenes);
    setShowIdea(false);
    setSelectedSceneId(nextScenes[0]?.id);
    setLoading(false);
    await loadImagesForScene(nextScenes[0], form);
  }

  async function loadSceneDrafts(nextForm: AiCreatorIdeaFormState) {
    if (!props.projectId) return buildSceneDrafts(nextForm);
    try {
      return await generateCreatorScenes(props.projectId, nextForm);
    } catch {
      return buildSceneDrafts(nextForm);
    }
  }

  async function loadImagesForScene(scene: AiCreatorSceneDraft | undefined, nextForm = form) {
    const imageModel = selectedImageModel(imageModels, nextForm.imageModelId);
    if (!scene || !props.projectId || !imageModel) return;
    setLoading(true);
    setSceneSlots(scene.id, createLoadingSlots());
    await generateSceneImages(scene, imageModel, nextForm);
    setLoading(false);
  }

  async function generateSceneImages(
    scene: AiCreatorSceneDraft,
    imageModel: AiCreatorImageModel,
    nextForm: AiCreatorIdeaFormState
  ) {
    try {
      await generateCreatorImages(imageRequest(props.projectId!, scene, imageModel, nextForm, updateSceneBatch));
    } catch {
      setMediaByScene((current) => ({ ...current, [scene.id]: failLoadingSlots(current[scene.id]) }));
    }
  }

  function selectScene(sceneId: string) {
    setSelectedSceneId(sceneId);
    if (!mediaByScene[sceneId]) void loadImagesForScene(scenes.find((scene) => scene.id === sceneId));
  }

  function updateSceneText(sceneId: string, text: string) {
    setScenes((current) => current.map((scene) => scene.id === sceneId ? { ...scene, text } : scene));
  }

  function selectMedia(slot: AiCreatorMediaSlot) {
    if (!selectedSceneId || !slot.assetId) return;
    setSelectedAssetByScene((current) => ({ ...current, [selectedSceneId]: slot.assetId! }));
  }

  function setSceneSlots(sceneId: string, slots: AiCreatorMediaSlot[]) {
    setMediaByScene((current) => ({ ...current, [sceneId]: slots }));
  }

  function updateSceneBatch(sceneId: string, start: number, count: number, assets: GeneratedCreatorAsset[]) {
    setMediaByScene((current) => ({ ...current, [sceneId]: mergeAssets(current[sceneId], start, count, assets) }));
  }

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
            selectedAssetId={selectedSceneId ? selectedAssetByScene[selectedSceneId] : undefined}
            slots={selectedSlots}
          />
          <AiCreatorScenePanel
            onSelect={selectScene}
            onTextChange={updateSceneText}
            scenes={scenes}
            selectedSceneId={selectedSceneId}
          />
        </div>
        <div className="ai-creator-modal-footer">
          <button className="button button-primary" disabled type="button">
            Generate video
          </button>
        </div>
        {showIdea ? (
          <AiCreatorIdeaModal
            aspectRatios={aspectRatios}
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
  onBatch: (sceneId: string, start: number, count: number, assets: GeneratedCreatorAsset[]) => void
) {
  return {
    aspectRatio: form.aspectRatio,
    imageModel,
    onBatch: (start: number, count: number, assets: GeneratedCreatorAsset[]) => onBatch(scene.id, start, count, assets),
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
