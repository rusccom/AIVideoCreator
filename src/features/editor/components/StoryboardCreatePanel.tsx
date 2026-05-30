"use client";

import type { EditorIntegrations, StartedCreatorVideo } from "../editor-integrations";
import type { EditorImageModel, EditorVideoModel } from "../types";
import {
  STORYBOARD_DURATION_BOUNDS,
  STORYBOARD_PANEL_OPTIONS,
  useStoryboardCreator
} from "../hooks/use-storyboard-creator";
import { ResolvedAssetImage } from "./ResolvedAssetImage";

type StoryboardCreatePanelProps = {
  defaultIdea: string;
  imageModels: EditorImageModel[];
  integrations: EditorIntegrations;
  onClose: () => void;
  onStarted: (video: StartedCreatorVideo) => void;
  projectAspectRatio: string;
  projectId: string;
  videoModels: EditorVideoModel[];
};

type StoryboardState = ReturnType<typeof useStoryboardCreator>;

export function StoryboardCreatePanel(props: StoryboardCreatePanelProps) {
  const state = useStoryboardCreator(props);
  return (
    <div className="storyboard-panel">
      {state.error ? <div className="form-error">{state.error}</div> : null}
      {ideaField(state)}
      {characterField(state)}
      {optionsRow(props, state)}
      {gridHint(state)}
      {planButton(state)}
      {gridPreview(state)}
      {actions(props, state)}
    </div>
  );
}

function ideaField(state: StoryboardState) {
  return (
    <label>Story idea
      <textarea onChange={(event) => state.setField("idea", event.target.value)} placeholder="What happens in the video?" value={state.form.idea} />
    </label>
  );
}

function characterField(state: StoryboardState) {
  return (
    <label>Main character
      <textarea className="storyboard-character" onChange={(event) => state.setField("character", event.target.value)} placeholder="Appearance, clothing, mood - kept consistent across every panel." value={state.form.character} />
    </label>
  );
}

function optionsRow(props: StoryboardCreatePanelProps, state: StoryboardState) {
  return (
    <div className="scene-modal-options">
      {panelSelect(state)}
      {videoModelSelect(props, state)}
      {durationInput(state)}
      {resolutionSelect(state)}
    </div>
  );
}

function panelSelect(state: StoryboardState) {
  return (
    <label>Panels
      <select onChange={(event) => state.setField("panelCount", Number(event.target.value))} value={state.form.panelCount}>
        {STORYBOARD_PANEL_OPTIONS.map((count) => <option key={count} value={count}>{count} panels</option>)}
      </select>
    </label>
  );
}

function videoModelSelect(props: StoryboardCreatePanelProps, state: StoryboardState) {
  return (
    <label>Video model
      <select onChange={(event) => state.changeVideoModel(event.target.value)} value={state.form.videoModelId}>
        {props.videoModels.map((model) => <option key={model.id} value={model.id}>{model.displayName}</option>)}
      </select>
    </label>
  );
}

function durationInput(state: StoryboardState) {
  return (
    <label>Duration, sec
      <input max={STORYBOARD_DURATION_BOUNDS.max} min={STORYBOARD_DURATION_BOUNDS.min} onChange={(event) => state.setField("durationSeconds", Number(event.target.value))} type="number" value={state.form.durationSeconds} />
    </label>
  );
}

function resolutionSelect(state: StoryboardState) {
  return (
    <label>Resolution
      <select onChange={(event) => state.setField("resolution", event.target.value)} value={state.form.resolution}>
        {(state.videoModel?.supportedResolutions ?? []).map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
  );
}

function gridHint(state: StoryboardState) {
  const name = state.imageModel?.displayName ?? "image model";
  return <p className="storyboard-hint">Grid rendered with {name}, then animated as one continuous clip.</p>;
}

function planButton(state: StoryboardState) {
  return (
    <button className="button button-secondary storyboard-plan" disabled={planDisabled(state)} onClick={state.plan} type="button">
      {planLabel(state)}
    </button>
  );
}

function gridPreview(state: StoryboardState) {
  if (!state.grid) return null;
  return (
    <div className="storyboard-grid-preview">
      <ResolvedAssetImage alt="Storyboard grid" className="storyboard-grid-image" fallback="Storyboard grid" source={state.grid.url} />
    </div>
  );
}

function actions(props: StoryboardCreatePanelProps, state: StoryboardState) {
  return (
    <div className="button-row">
      <button className="button button-secondary" onClick={props.onClose} type="button">Cancel</button>
      <button className="button button-primary" disabled={submitDisabled(state)} onClick={state.submit} type="button">{submitLabel(state)}</button>
    </div>
  );
}

function planDisabled(state: StoryboardState) {
  return busy(state) || state.form.idea.trim().length === 0 || state.form.character.trim().length === 0;
}

function submitDisabled(state: StoryboardState) {
  return busy(state) || !state.grid || !state.videoModel;
}

function busy(state: StoryboardState) {
  return state.phase === "planning" || state.phase === "rendering" || state.phase === "submitting";
}

function planLabel(state: StoryboardState) {
  if (state.phase === "planning") return "Planning storyboard...";
  if (state.phase === "rendering") return "Rendering grid...";
  return state.grid ? "Regenerate storyboard" : "Generate storyboard";
}

function submitLabel(state: StoryboardState) {
  if (state.phase === "submitting") return "Starting...";
  return state.cost === null ? "Generate video" : `Generate video (${state.cost} credits)`;
}
