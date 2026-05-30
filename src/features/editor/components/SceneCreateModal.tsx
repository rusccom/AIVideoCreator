"use client";

import { useState } from "react";
import type { EditorIntegrations, StartedCreatorVideo } from "../editor-integrations";
import type { EditorAsset, EditorImageModel, EditorVideoModel } from "../types";
import { SceneClipForm } from "./SceneClipForm";
import { StoryboardCreatePanel } from "./StoryboardCreatePanel";

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

type SceneMode = "clip" | "storyboard";

const MODE_COPY: Record<SceneMode, { subtitle: string; title: string }> = {
  clip: { subtitle: "Choose a start frame and video model, then generate the clip.", title: "Create clip" },
  storyboard: { subtitle: "Plan a numbered grid, then animate it as one continuous clip.", title: "Storyboard" }
};

export function SceneCreateModal(props: SceneCreateModalProps) {
  const [mode, setMode] = useState<SceneMode>("clip");
  return (
    <div className="project-modal-backdrop" role="presentation">
      <div className="project-modal scene-modal">
        {modalHeader(props, mode, setMode)}
        {mode === "clip" ? <SceneClipForm {...props} /> : storyboardPanel(props)}
      </div>
    </div>
  );
}

function modalHeader(props: SceneCreateModalProps, mode: SceneMode, setMode: (mode: SceneMode) => void) {
  return (
    <div className="project-modal-header">
      <div>
        <h2>{MODE_COPY[mode].title}</h2>
        <p>{MODE_COPY[mode].subtitle}</p>
      </div>
      <div className="scene-mode-header">
        {modeSwitch(mode, setMode)}
        <button className="project-modal-close" onClick={props.onClose} type="button">x</button>
      </div>
    </div>
  );
}

function modeSwitch(mode: SceneMode, setMode: (mode: SceneMode) => void) {
  return (
    <div aria-label="Creation mode" className="scene-mode-switch" role="group">
      {modeButton("clip", "Clip", mode, setMode)}
      {modeButton("storyboard", "Storyboard", mode, setMode)}
    </div>
  );
}

function modeButton(value: SceneMode, label: string, mode: SceneMode, setMode: (mode: SceneMode) => void) {
  return (
    <button aria-pressed={mode === value} className={modeClass(mode === value)} onClick={() => setMode(value)} type="button">
      {label}
    </button>
  );
}

function storyboardPanel(props: SceneCreateModalProps) {
  return (
    <StoryboardCreatePanel
      defaultIdea={props.defaultPrompt}
      imageModels={props.imageModels}
      integrations={props.integrations}
      onClose={props.onClose}
      onStarted={props.onStarted}
      projectAspectRatio={props.projectAspectRatio}
      projectId={props.projectId}
      videoModels={props.models}
    />
  );
}

function modeClass(active: boolean) {
  return active ? "scene-mode-button is-active" : "scene-mode-button";
}
