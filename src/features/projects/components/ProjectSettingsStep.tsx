import { aspectRatios } from "../data/project-options";
import type { ProjectWizardState } from "./ProjectWizard";

type ProjectSettingsStepProps = {
  state: ProjectWizardState;
  update: (patch: Partial<ProjectWizardState>) => void;
};

export function ProjectSettingsStep({ state, update }: ProjectSettingsStepProps) {
  return (
    <section className="wizard-card">
      <h2>Project setup</h2>
      <div className="field">
        <label htmlFor="title">Project title</label>
        <input id="title" value={state.title} onChange={(event) => update({ title: event.target.value })} />
      </div>
      <div className="field">
        <label>Aspect ratio</label>
      </div>
      <div className="option-grid">
        {aspectRatios.map((item) => (
          <button
            className={state.aspectRatio === item.value ? "option-card active" : "option-card"}
            key={item.value}
            onClick={() => update({ aspectRatio: item.value })}
            type="button"
          >
            <span>{item.label}</span>
            <small>{item.value}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
