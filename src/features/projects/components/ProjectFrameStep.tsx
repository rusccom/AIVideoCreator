import { frameSources } from "../data/project-options";
import type { ProjectWizardState } from "./ProjectWizard";

type ProjectFrameStepProps = {
  state: ProjectWizardState;
  update: (patch: Partial<ProjectWizardState>) => void;
};

export function ProjectFrameStep({ state, update }: ProjectFrameStepProps) {
  return (
    <section className="wizard-card">
      <h2>Start image</h2>
      <div className="option-grid">
        {frameSources.map((source) => (
          <button className={state.frameSource === source ? "option-card active" : "option-card"} key={source} onClick={() => update({ frameSource: source })} type="button">
            {source}
          </button>
        ))}
      </div>
      <div className="grid use-case-grid">
        {[1, 2, 3, 4].map((item) => (
          <div className="use-case-card" key={item}>
            <div className="use-case-frame" />
            <button className="button button-secondary" type="button">
              Select
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
