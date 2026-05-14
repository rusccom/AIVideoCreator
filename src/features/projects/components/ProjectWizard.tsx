"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { defaultAspectRatioPreset } from "@/shared/generation/models";
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
  const update = (patch: Partial<ProjectWizardState>) => setState((current) => ({ ...current, ...patch }));
  return (
    <form className="wizard" onSubmit={createProject(state, router, setError)}>
      <div>
        {error ? <div className="form-error">{error}</div> : null}
        <ProjectSettingsStep state={state} update={update} />
        <div className="button-row hero-actions"><button className="button button-primary" type="submit">Create project</button></div>
      </div>
    </form>
  );
}

function createProject(state: ProjectWizardState, router: ReturnType<typeof useRouter>, setError: (value: string) => void) {
  return async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    await finishProject(router, setError, await createProjectRequest(state));
  };
}

function createProjectRequest(state: ProjectWizardState) {
  return fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(state) });
}

async function finishProject(router: ReturnType<typeof useRouter>, setError: (value: string) => void, response: Response) {
  if (!response.ok) return setError("Project could not be created.");
  const data = await response.json();
  router.push(`/app/projects/${data.id}`);
}
