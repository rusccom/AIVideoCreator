"use client";

import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import type { EditorIntegrations, StartedCreatorVideo, StartClipGenerationInput } from "../editor-integrations";
import type { EditorAsset, EditorImageModel, EditorVideoModel } from "../types";
import { ScenePhotoSelector } from "./ScenePhotoSelector";

type SceneCreateModalProps = {
  assets: EditorAsset[];
  defaultPrompt: string;
  imageModels: EditorImageModel[];
  initialAssetId?: string;
  integrations: EditorIntegrations;
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
  const [form, setForm] = useState(initial), [error, setError] = useState(""), [saving, setSaving] = useState(false);
  const model = selectedModel(props.models, form.modelId);
  const changeModel = (modelId: string) => setForm((current) => modelState(current, selectedModel(props.models, modelId)));
  return (
    <div className="project-modal-backdrop" role="presentation"><form className="project-modal scene-modal" onSubmit={submitScene(props, form, model, setError, setSaving)}>{sceneModalHeader(props)}{error ? <div className="form-error">{error}</div> : null}{promptField(form, setForm)}{videoOptions(props, form, model, setForm, changeModel)}{startFrameField(props, form, setForm)}{sceneActions(props, saving)}</form></div>
  );
}

function submitScene(props: SceneCreateModalProps, form: SceneFormState, model: EditorVideoModel | undefined, setError: SetText, setSaving: SetBoolean) {
  return async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      props.onStarted(await startClip(props, form, model));
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setSaving(false);
    }
  };
}

function sceneModalHeader(props: SceneCreateModalProps) {
  return (
    <div className="project-modal-header">
      <div>
        <h2>Create clip</h2>
        <p>Choose a start frame and video model, then generate the clip.</p>
      </div>
      <button className="project-modal-close" onClick={props.onClose} type="button">x</button>
    </div>
  );
}

function promptField(form: SceneFormState, setForm: SetForm) {
  return <label>Prompt<textarea value={form.prompt} onChange={(event) => update(setForm, "prompt", event.target.value)} /></label>;
}

function videoOptions(
  props: SceneCreateModalProps,
  form: SceneFormState,
  model: EditorVideoModel | undefined,
  setForm: SetForm,
  changeModel: (modelId: string) => void
) {
  return <div className="scene-modal-options">{modelSelect(props, form, changeModel)}{durationInput(form, model, setForm)}{resolutionSelect(form, model, setForm)}</div>;
}

function modelSelect(props: SceneCreateModalProps, form: SceneFormState, changeModel: (modelId: string) => void) {
  return <label>Video model<select value={form.modelId} onChange={(event) => changeModel(event.target.value)}>{props.models.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}</select></label>;
}

function durationInput(form: SceneFormState, model: EditorVideoModel | undefined, setForm: SetForm) {
  return <label>Duration, sec<input max={model?.maxDurationSeconds} min={model?.minDurationSeconds} type="number" value={form.durationSeconds} onChange={(event) => updateNumber(setForm, "durationSeconds", event.target.value)} /></label>;
}

function resolutionSelect(form: SceneFormState, model: EditorVideoModel | undefined, setForm: SetForm) {
  return <label>Resolution<select value={form.resolution} onChange={(event) => update(setForm, "resolution", event.target.value)}>{model?.supportedResolutions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>;
}

function startFrameField(props: SceneCreateModalProps, form: SceneFormState, setForm: SetForm) {
  return <div className="scene-modal-section"><span className="scene-modal-label">Start frame</span><ScenePhotoSelector assets={props.assets} imageModels={props.imageModels} integrations={props.integrations} onChange={(assetId) => update(setForm, "selectedAssetId", assetId)} projectAspectRatio={props.projectAspectRatio} projectId={props.projectId} selectedAssetId={form.selectedAssetId} /></div>;
}

function sceneActions(props: SceneCreateModalProps, saving: boolean) {
  return <div className="button-row"><button className="button button-secondary" onClick={props.onClose} type="button">Cancel</button><button className="button button-primary" disabled={saving || props.models.length === 0} type="submit">{saving ? "Starting..." : "Generate clip"}</button></div>;
}

async function startClip(
  props: SceneCreateModalProps,
  form: SceneFormState,
  model: EditorVideoModel | undefined
) {
  if (!model) throw new Error("Video model is not available.");
  const assetId = resolveStartFrame(form);
  return props.integrations.startClipGeneration(clipInput(props, form, model, assetId));
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

function resolveStartFrame(form: SceneFormState) {
  if (form.selectedAssetId) return form.selectedAssetId;
  throw new Error("Start frame is required.");
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

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Clip could not be created.";
}

type SetForm = Dispatch<SetStateAction<SceneFormState>>;
type SetBoolean = (value: boolean) => void;
type SetText = (value: string) => void;
