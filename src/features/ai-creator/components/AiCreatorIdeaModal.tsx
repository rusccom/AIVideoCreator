"use client";

import type { FormEvent } from "react";
import type { AiCreatorIdeaFormState, AiCreatorImageModel, AiCreatorVideoModel } from "../types";

type AiCreatorIdeaModalProps = {
  aspectRatios: string[];
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
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    props.onSubmit();
  }

  function update(key: keyof AiCreatorIdeaFormState, value: string | number) {
    props.onChange({ ...props.form, [key]: value });
  }

  return (
    <div className="ai-creator-nested-backdrop">
      <form className="ai-creator-idea-modal" onSubmit={submit}>
        <div className="project-modal-header">
          <div>
            <h2>Describe the idea</h2>
            <p>Set the video direction, format, and models before generation starts.</p>
          </div>
        </div>
        {!props.projectReady ? <div className="form-error">Open a project to use AI Creator generation.</div> : null}
        <label>
          Video idea
          <textarea
            onChange={(event) => update("idea", event.target.value)}
            placeholder="Describe the YouTube video you want to create."
            value={props.form.idea}
          />
        </label>
        <div className="ai-creator-idea-grid">
          <label>
            Duration, sec
            <input
              min={10}
              onChange={(event) => update("durationSeconds", Number(event.target.value))}
              type="number"
              value={props.form.durationSeconds}
            />
          </label>
          <label>
            Aspect ratio
            <select onChange={(event) => update("aspectRatio", event.target.value)} value={props.form.aspectRatio}>
              {props.aspectRatios.map((ratio) => <option key={ratio} value={ratio}>{ratio}</option>)}
            </select>
          </label>
        </div>
        <label>
          Photo model
          <select onChange={(event) => update("imageModelId", event.target.value)} value={props.form.imageModelId}>
            {props.imageModels.map((model) => <option key={model.id} value={model.id}>{model.displayName}</option>)}
          </select>
        </label>
        <label>
          Video model
          <select onChange={(event) => update("videoModelId", event.target.value)} value={props.form.videoModelId}>
            {props.videoModels.map((model) => <option key={model.id} value={model.id}>{model.displayName}</option>)}
          </select>
        </label>
        <div className="button-row">
          <button className="button button-secondary" onClick={props.onCancel} type="button">Cancel</button>
          <button className="button button-primary" disabled={generateDisabled(props)} type="submit">
            {props.loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </form>
    </div>
  );
}

function generateDisabled(props: AiCreatorIdeaModalProps) {
  return props.loading || !props.projectReady || props.form.idea.trim().length === 0;
}
