"use client";

import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import {
  startClipGeneration,
  type StartedCreatorVideo,
  type StartClipGenerationInput
} from "@/features/ai-creator/ai-creator-video-generation";
import type { EditorAsset, EditorVideoModel } from "../types";

type SceneCreateModalProps = {
  assets: EditorAsset[];
  defaultPrompt: string;
  initialAssetId?: string;
  models: EditorVideoModel[];
  onClose: () => void;
  onStarted: (video: StartedCreatorVideo) => void;
  parentSceneId?: string;
  projectAspectRatio: string;
  projectId: string;
};

type SceneFormState = {
  durationSeconds: number;
  modelId: string;
  prompt: string;
  resolution: string;
  selectedAssetId: string;
};

export function SceneCreateModal(props: SceneCreateModalProps) {
  const initial = initialState(props.models, props.assets, props.defaultPrompt, props.initialAssetId);
  const [form, setForm] = useState(initial);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const model = selectedModel(props.models, form.modelId);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const started = await startClip(props, form, file, model);
      props.onStarted(started);
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setSaving(false);
    }
  }

  function changeModel(modelId: string) {
    const nextModel = selectedModel(props.models, modelId);
    setForm((current) => modelState(current, nextModel));
  }

  return (
    <div className="project-modal-backdrop" role="presentation">
      <form className="project-modal scene-modal" onSubmit={submit}>
        <div className="project-modal-header">
          <div>
            <h2>Create clip</h2>
            <p>Upload a start frame, choose a video model, then generate the clip.</p>
          </div>
          <button className="project-modal-close" onClick={props.onClose} type="button">x</button>
        </div>
        {error ? <div className="form-error">{error}</div> : null}
        <label>
          Prompt
          <textarea value={form.prompt} onChange={(event) => update(setForm, "prompt", event.target.value)} />
        </label>
        <label>
          Video model
          <select value={form.modelId} onChange={(event) => changeModel(event.target.value)}>
            {props.models.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}
          </select>
        </label>
        <div className="scene-modal-grid">
          <label>
            Duration, sec
            <input max={model?.maxDurationSeconds} min={model?.minDurationSeconds} type="number" value={form.durationSeconds} onChange={(event) => updateNumber(setForm, "durationSeconds", event.target.value)} />
          </label>
          <label>
            Resolution
            <select value={form.resolution} onChange={(event) => update(setForm, "resolution", event.target.value)}>
              {model?.supportedResolutions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <label>
          Start frame upload
          <input accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} type="file" />
        </label>
        <label>
          Or use existing asset
          <select disabled={Boolean(file)} value={form.selectedAssetId} onChange={(event) => update(setForm, "selectedAssetId", event.target.value)}>
            <option value="">Select asset</option>
            {props.assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.label}</option>)}
          </select>
        </label>
        <div className="button-row">
          <button className="button button-secondary" onClick={props.onClose} type="button">Cancel</button>
          <button className="button button-primary" disabled={saving || props.models.length === 0} type="submit">
            {saving ? "Starting..." : "Generate clip"}
          </button>
        </div>
      </form>
    </div>
  );
}

async function startClip(
  props: SceneCreateModalProps,
  form: SceneFormState,
  file: File | null,
  model: EditorVideoModel | undefined
) {
  if (!model) throw new Error("Video model is not available.");
  const assetId = await resolveStartFrame(props.projectId, form, file);
  return startClipGeneration(clipInput(props, form, model, assetId));
}

function clipInput(
  props: SceneCreateModalProps,
  form: SceneFormState,
  model: EditorVideoModel,
  assetId: string
): StartClipGenerationInput {
  return {
    assetId,
    aspectRatio: videoAspectRatio(model, props.projectAspectRatio),
    duration: form.durationSeconds,
    modelId: form.modelId,
    parentSceneId: props.parentSceneId,
    projectId: props.projectId,
    prompt: form.prompt,
    resolution: form.resolution
  };
}

function videoAspectRatio(model: EditorVideoModel, aspectRatio: string) {
  if (model.supportedAspectRatios.includes(aspectRatio)) return aspectRatio;
  return model.supportedAspectRatios.includes("auto") ? "auto" : model.defaultAspectRatio;
}

async function resolveStartFrame(projectId: string, form: SceneFormState, file: File | null) {
  if (file) return uploadAsset(projectId, file);
  if (form.selectedAssetId) return form.selectedAssetId;
  throw new Error("Start frame is required.");
}

async function uploadAsset(projectId: string, file: File) {
  const data = await requestUpload(projectId, file);
  const uploaded = await fetch(data.uploadUrl, { method: "PUT", body: file });
  if (!uploaded.ok) throw new Error("Start frame upload failed.");
  return data.assetId;
}

async function requestUpload(projectId: string, file: File) {
  const response = await fetch("/api/assets/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(uploadBody(projectId, file))
  });
  if (!response.ok) throw new Error("Upload URL could not be created.");
  return response.json() as Promise<{ assetId: string; uploadUrl: string }>;
}

function initialState(
  models: EditorVideoModel[],
  assets: EditorAsset[],
  prompt: string,
  initialAssetId?: string
) {
  const model = models[0];
  return {
    durationSeconds: model?.defaultDurationSeconds ?? 6,
    modelId: model?.id ?? "",
    prompt: prompt || "Describe the clip motion.",
    resolution: model?.defaultResolution ?? "720p",
    selectedAssetId: startAssetId(assets, initialAssetId)
  };
}

function startAssetId(assets: EditorAsset[], initialAssetId?: string) {
  if (initialAssetId && assets.some((asset) => asset.id === initialAssetId)) return initialAssetId;
  return assets[0]?.id ?? "";
}

function modelState(current: SceneFormState, model?: EditorVideoModel) {
  return {
    ...current,
    durationSeconds: model?.defaultDurationSeconds ?? current.durationSeconds,
    modelId: model?.id ?? current.modelId,
    resolution: model?.defaultResolution ?? current.resolution
  };
}

function selectedModel(models: EditorVideoModel[], modelId: string) {
  return models.find((model) => model.id === modelId) ?? models[0];
}

function update(setForm: SetForm, key: keyof SceneFormState, value: string) {
  setForm((current) => ({ ...current, [key]: value }));
}

function updateNumber(setForm: SetForm, key: keyof SceneFormState, value: string) {
  setForm((current) => ({ ...current, [key]: Number(value) }));
}

function uploadBody(projectId: string, file: File) {
  return { projectId, fileName: file.name, mimeType: file.type || "image/png", type: "IMAGE" };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Clip could not be created.";
}

type SetForm = Dispatch<SetStateAction<SceneFormState>>;
