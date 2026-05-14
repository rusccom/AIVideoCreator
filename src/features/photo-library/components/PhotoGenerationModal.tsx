"use client";

import { useState, type FormEvent } from "react";
import { Sparkles, X } from "lucide-react";
import { generateProjectImageAssets } from "@/shared/client/project-image-client";
import type { PhotoLibraryAsset, PhotoLibraryImageModel } from "../types";
import { PhotoReferenceField } from "./PhotoReferenceField";

type PhotoGenerationModalProps = {
  assets: PhotoLibraryAsset[];
  initialReferenceAssetId?: string;
  models: PhotoLibraryImageModel[];
  onClose: () => void;
  onGenerated: (assetId?: string) => Promise<void>;
  projectAspectRatio: string;
  projectId: string;
};

export function PhotoGenerationModal(props: PhotoGenerationModalProps) {
  const [modelId, setModelId] = useState(props.models[0]?.id ?? "");
  const [prompt, setPrompt] = useState("A polished advertising product photo in a realistic studio setting.");
  const [referenceAssetId, setReferenceAssetId] = useState(initialReferenceId(props));
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const model = selectedModel(props.models, modelId);
  const references = referenceAssets(props.assets);

  return (
    <div className="project-modal-backdrop photo-generation-backdrop" role="presentation">
      <form className="project-modal photo-generation-modal" onSubmit={photoSubmit({ model, prompt, props, referenceAssetId, setError, setGenerating })}>
        {photoHeader(props)}
        {photoPrompt(prompt, setPrompt)}
        <PhotoReferenceField assets={references} disabled={!model?.supportsReferenceImage} onChange={setReferenceAssetId} value={referenceAssetId} />
        {photoModelSelect(props, modelId, setModelId)}
        {error ? <div className="form-error">{error}</div> : null}
        {photoActions(props, model, generating)}
      </form>
    </div>
  );
}

function photoSubmit(input: PhotoSubmitInput) {
  return async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    input.setGenerating(true);
    input.setError("");
    const result = await generateImage(input.props, input.model, input.prompt, input.referenceAssetId);
    input.setGenerating(false);
    if (!result.ok) return input.setError(result.error);
    await input.props.onGenerated(result.assetId);
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
  prompt: string,
  referenceAssetId: string
) {
  if (!model) return { ok: false, error: "No image model is active." };
  try {
    const assets = await generateProjectImageAssets(props.projectId, requestBody(props, model, prompt, referenceAssetId));
    return { assetId: assets[0]?.id, ok: true, error: "" };
  } catch {
    return { ok: false, error: "Photo generation failed." };
  }
}

function requestBody(props: PhotoGenerationModalProps, model: PhotoLibraryImageModel, prompt: string, referenceAssetId: string) {
  return {
    aspectRatio: imageAspectRatio(model, props.projectAspectRatio),
    modelId: model.id,
    numImages: 1,
    prompt,
    ...(referenceId(model, referenceAssetId) ? { referenceAssetId } : {}),
    resolution: model.defaultResolution
  };
}

function referenceId(model: PhotoLibraryImageModel, assetId: string) {
  return model.supportsReferenceImage ? assetId : "";
}

function imageAspectRatio(model: PhotoLibraryImageModel, aspectRatio: string) {
  if (model.supportedAspectRatios.includes(aspectRatio)) return aspectRatio;
  return model.supportedAspectRatios.includes("auto") ? "auto" : model.defaultAspectRatio;
}

function selectedModel(models: PhotoLibraryImageModel[], modelId: string) {
  return models.find((model) => model.id === modelId) ?? models[0];
}

function initialReferenceId(props: PhotoGenerationModalProps) {
  return referenceAssets(props.assets).some((asset) => asset.id === props.initialReferenceAssetId)
    ? props.initialReferenceAssetId ?? ""
    : "";
}

function referenceAssets(assets: PhotoLibraryAsset[]) {
  return assets.filter((asset) => Boolean(asset.url));
}

type PhotoSubmitInput = {
  model: PhotoLibraryImageModel | undefined;
  prompt: string;
  props: PhotoGenerationModalProps;
  referenceAssetId: string;
  setError: SetText;
  setGenerating: SetBoolean;
};

type SetBoolean = (value: boolean) => void;
type SetText = (value: string) => void;
