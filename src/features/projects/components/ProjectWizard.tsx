"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { defaultAspectRatioPreset } from "../data/project-options";
import { ProjectSettingsStep } from "./ProjectSettingsStep";

export type ProjectWizardState = {
  title: string;
  aspectRatio: string;
};

const initialState: ProjectWizardState = {
  title: "Untitled storyboard",
  aspectRatio: defaultAspectRatioPreset().value
};

export function ProjectWizard() {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [error, setError] = useState("");

  function update(patch: Partial<ProjectWizardState>) {
    setState((current) => ({ ...current, ...patch }));
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    <form className="wizard" onSubmit={createProject}>
      <div>
        {error ? <div className="form-error">{error}</div> : null}
        <ProjectSettingsStep state={state} update={update} />
        <div className="button-row hero-actions">
          <button className="button button-primary" type="submit">
            Create project
          </button>
        </div>
      </div>
    </form>
  );
}
