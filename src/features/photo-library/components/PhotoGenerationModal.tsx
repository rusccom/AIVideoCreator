"use client";

import { useState, type FormEvent } from "react";
import { Sparkles, X } from "lucide-react";
import { generateProjectImageAssets } from "@/shared/client/project-image-client";
import type { PhotoLibraryImageModel } from "../types";

type PhotoGenerationModalProps = {
  models: PhotoLibraryImageModel[];
  onClose: () => void;
  onGenerated: (assetId?: string) => Promise<void>;
  projectAspectRatio: string;
  projectId: string;
};

export function PhotoGenerationModal(props: PhotoGenerationModalProps) {
  const [modelId, setModelId] = useState(props.models[0]?.id ?? "");
  const [prompt, setPrompt] = useState("A cinematic start frame for the next video scene.");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const model = selectedModel(props.models, modelId);

  return (
    <div className="project-modal-backdrop photo-generation-backdrop" role="presentation">
      <form className="project-modal photo-generation-modal" onSubmit={photoSubmit(props, model, prompt, setGenerating, setError)}>
        {photoHeader(props)}
        {photoPrompt(prompt, setPrompt)}
        {photoModelSelect(props, modelId, setModelId)}
        {error ? <div className="form-error">{error}</div> : null}
        {photoActions(props, model, generating)}
      </form>
    </div>
  );
}

function photoSubmit(props: PhotoGenerationModalProps, model: PhotoLibraryImageModel | undefined, prompt: string, setGenerating: SetBoolean, setError: SetText) {
  return async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGenerating(true);
    setError("");
    const result = await generateImage(props, model, prompt);
    setGenerating(false);
    if (!result.ok) return setError(result.error);
    await props.onGenerated(result.assetId);
  };
}

function photoHeader(props: PhotoGenerationModalProps) {
  return <div className="project-modal-header"><div><h2>Generate photo</h2><p>Create a new project image with an active image model.</p></div><button className="project-modal-close" onClick={props.onClose} type="button"><X size={18} /></button></div>;
}

function photoPrompt(prompt: string, setPrompt: SetText) {
  return <label className="photo-library-field">Prompt<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} /></label>;
}

function photoModelSelect(props: PhotoGenerationModalProps, modelId: string, setModelId: SetText) {
  return <label className="photo-library-field">Model<select value={modelId} onChange={(event) => setModelId(event.target.value)}>{props.models.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}</select></label>;
}

function photoActions(props: PhotoGenerationModalProps, model: PhotoLibraryImageModel | undefined, generating: boolean) {
  return <div className="button-row"><button className="button button-secondary" onClick={props.onClose} type="button">Cancel</button><button className="button button-primary" disabled={generating || !model} type="submit"><Sparkles size={16} /> {generating ? "Generating..." : "Generate"}</button></div>;
}

async function generateImage(
  props: PhotoGenerationModalProps,
  model: PhotoLibraryImageModel | undefined,
  prompt: string
) {
  if (!model) return { ok: false, error: "No image model is active." };
  try {
    const assets = await generateProjectImageAssets(props.projectId, requestBody(props, model, prompt));
    return { assetId: assets[0]?.id, ok: true, error: "" };
  } catch {
    return { ok: false, error: "Photo generation failed." };
  }
}

function requestBody(props: PhotoGenerationModalProps, model: PhotoLibraryImageModel, prompt: string) {
  return {
    aspectRatio: imageAspectRatio(model, props.projectAspectRatio),
    modelId: model.id,
    numImages: 1,
    prompt,
    resolution: model.defaultResolution
  };
}

function imageAspectRatio(model: PhotoLibraryImageModel, aspectRatio: string) {
  if (model.supportedAspectRatios.includes(aspectRatio)) return aspectRatio;
  return model.supportedAspectRatios.includes("auto") ? "auto" : model.defaultAspectRatio;
}

function selectedModel(models: PhotoLibraryImageModel[], modelId: string) {
  return models.find((model) => model.id === modelId) ?? models[0];
}

type SetBoolean = (value: boolean) => void;
type SetText = (value: string) => void;
