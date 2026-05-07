"use client";

import { Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { EditorImageModel } from "../types";

type PhotoGenerateFormProps = {
  models: EditorImageModel[];
  onGenerated: () => void;
  projectId: string;
};

export function PhotoGenerateForm(props: PhotoGenerateFormProps) {
  const [modelId, setModelId] = useState(props.models[0]?.id ?? "");
  const [prompt, setPrompt] = useState("A cinematic start frame for the next video scene.");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const model = selectedModel(props.models, modelId);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGenerating(true);
    setError("");
    const result = await generateImage(props.projectId, model, prompt);
    setGenerating(false);
    if (!result.ok) return setError(result.error ?? "Photo generation failed.");
    props.onGenerated();
  }

  return (
    <form className="photo-tool-form" onSubmit={submit}>
      <label>Generate photo<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} /></label>
      <label>Model<select value={modelId} onChange={(event) => setModelId(event.target.value)}>
        {props.models.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}
      </select></label>
      {error ? <div className="form-error">{error}</div> : null}
      <button className="button button-primary" disabled={generating || !model} type="submit">
        <Sparkles size={16} /> {generating ? "Generating..." : "Generate photo"}
      </button>
    </form>
  );
}

async function generateImage(projectId: string, model: EditorImageModel | undefined, prompt: string) {
  if (!model) return { ok: false, error: "No image model is active." };
  const response = await fetch(`/api/projects/${projectId}/images/generate`, requestOptions(model, prompt));
  return response.ok ? { ok: true } : { ok: false, error: "Photo generation failed." };
}

function requestOptions(model: EditorImageModel, prompt: string) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody(model, prompt))
  };
}

function requestBody(model: EditorImageModel, prompt: string) {
  return {
    aspectRatio: model.defaultAspectRatio,
    modelId: model.id,
    numImages: 1,
    prompt,
    resolution: model.defaultResolution
  };
}

function selectedModel(models: EditorImageModel[], modelId: string) {
  return models.find((model) => model.id === modelId) ?? models[0];
}
