"use client";

import type { FormEvent } from "react";
import type {
  AiCreatorIdeaFormState,
  AiCreatorImageModel,
  AiCreatorVideoModel
} from "../types";

type AiCreatorIdeaModalProps = {
  form: AiCreatorIdeaFormState;
  imageModels: AiCreatorImageModel[];
  loading: boolean;
  onCancel: () => void;
  onChange: (form: AiCreatorIdeaFormState) => void;
  onSubmit: () => void;
  projectReady: boolean;
  videoModels: AiCreatorVideoModel[];
};

export function AiCreatorIdeaModal(props: AiCreatorIdeaModalProps) {
  const update = (key: keyof AiCreatorIdeaFormState, value: string | number) => props.onChange({ ...props.form, [key]: value });
  return (
    <div className="ai-creator-nested-backdrop">
      <form className="ai-creator-idea-modal" onSubmit={submitIdea(props)}>
        {ideaHeader()}
        {!props.projectReady ? <div className="form-error">Open a project to use AI Creator generation.</div> : null}
        {ideaField(props, update)}
        {durationField(props, update)}
        {modelField("Photo model", "imageModelId", props.form.imageModelId, props.imageModels, update)}
        {modelField("Video model", "videoModelId", props.form.videoModelId, props.videoModels, update)}
        {ideaActions(props)}
      </form>
    </div>
  );
}

function submitIdea(props: AiCreatorIdeaModalProps) {
  return (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); props.onSubmit(); };
}

function ideaHeader() {
  return <div className="project-modal-header"><div><h2>Describe the idea</h2><p>Set the video direction, format, and models before generation starts.</p></div></div>;
}

function ideaField(props: AiCreatorIdeaModalProps, update: UpdateIdea) {
  return <label>Video idea<textarea onChange={(event) => update("idea", event.target.value)} placeholder="Describe the YouTube video you want to create." value={props.form.idea} /></label>;
}

function durationField(props: AiCreatorIdeaModalProps, update: UpdateIdea) {
  return <div className="ai-creator-idea-grid"><label>Duration, sec<input min={10} onChange={(event) => update("durationSeconds", Number(event.target.value))} type="number" value={props.form.durationSeconds} /></label></div>;
}

function modelField(label: string, key: "imageModelId" | "videoModelId", value: string, models: ModelOption[], update: UpdateIdea) {
  return <label>{label}<select onChange={(event) => update(key, event.target.value)} value={value}>{models.map((model) => <option key={model.id} value={model.id}>{model.displayName}</option>)}</select></label>;
}

function ideaActions(props: AiCreatorIdeaModalProps) {
  return <div className="button-row"><button className="button button-secondary" onClick={props.onCancel} type="button">Cancel</button><button className="button button-primary" disabled={generateDisabled(props)} type="submit">{props.loading ? "Generating..." : "Generate"}</button></div>;
}

function generateDisabled(props: AiCreatorIdeaModalProps) {
  return props.loading || !props.projectReady || props.form.idea.trim().length === 0;
}

type UpdateIdea = (key: keyof AiCreatorIdeaFormState, value: string | number) => void;
type ModelOption = AiCreatorImageModel | AiCreatorVideoModel;
