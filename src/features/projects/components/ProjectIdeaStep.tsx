import type { ProjectWizardState } from "./ProjectWizard";

type ProjectIdeaStepProps = {
  state: ProjectWizardState;
  update: (patch: Partial<ProjectWizardState>) => void;
};

export function ProjectIdeaStep({ state, update }: ProjectIdeaStepProps) {
  return (
    <section className="wizard-card">
      <h2>Scene idea</h2>
      <div className="field">
        <label htmlFor="idea">Describe the first scene</label>
        <textarea id="idea" value={state.idea} onChange={(event) => update({ idea: event.target.value })} />
      </div>
    </section>
  );
}
