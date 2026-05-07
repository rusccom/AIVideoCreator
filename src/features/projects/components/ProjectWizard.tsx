"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProjectFrameStep } from "./ProjectFrameStep";
import { ProjectIdeaStep } from "./ProjectIdeaStep";
import { ProjectSettingsStep } from "./ProjectSettingsStep";
import { WizardProgress } from "./WizardProgress";

export type ProjectWizardState = {
  title: string;
  aspectRatio: string;
  stylePreset: string;
  quality: string;
  idea: string;
  frameSource: string;
};

const initialState: ProjectWizardState = {
  title: "Untitled storyboard",
  aspectRatio: "16:9 YouTube",
  stylePreset: "cinematic",
  quality: "balanced",
  idea: "A woman walks through rainy neon Tokyo at night, cinematic camera.",
  frameSource: "Upload image"
};

export function ProjectWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState(initialState);
  const [error, setError] = useState("");

  function update(patch: Partial<ProjectWizardState>) {
    setState((current) => ({ ...current, ...patch }));
  }

  async function createProject() {
    setError("");
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state)
    });
    await finish(response);
  }

  async function finish(response: Response) {
    if (!response.ok) {
      setError("Project could not be created.");
      return;
    }
    const data = await response.json();
    router.push(`/app/projects/${data.id}`);
  }

  return (
    <div className="wizard">
      <WizardProgress step={step} />
      <div>
        {error ? <div className="form-error">{error}</div> : null}
        {step === 0 ? <ProjectSettingsStep state={state} update={update} /> : null}
        {step === 1 ? <ProjectIdeaStep state={state} update={update} /> : null}
        {step === 2 ? <ProjectFrameStep state={state} update={update} /> : null}
        <div className="button-row hero-actions">
          <button className="button button-secondary" disabled={step === 0} onClick={() => setStep(step - 1)} type="button">
            Back
          </button>
          {step < 2 ? (
            <button className="button button-primary" onClick={() => setStep(step + 1)} type="button">
              Continue
            </button>
          ) : (
            <button className="button button-primary" onClick={createProject} type="button">
              Create project
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
