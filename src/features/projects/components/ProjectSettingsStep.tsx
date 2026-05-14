import { COMMON_ASPECT_RATIO_PRESETS as aspectRatios } from "@/shared/generation/models";
import type { ProjectWizardState } from "./ProjectWizard";

type ProjectSettingsStepProps = {
  state: ProjectWizardState;
  update: (patch: Partial<ProjectWizardState>) => void;
};

export function ProjectSettingsStep({ state, update }: ProjectSettingsStepProps) {
  return (
    <section className="wizard-card">
      <h2>Project setup</h2>
      {projectTitleField(state, update)}
      <div className="field"><label>Aspect ratio</label></div>
      <div className="option-grid">{aspectRatios.map((item) => aspectButton(item, state, update))}</div>
    </section>
  );
}

function projectTitleField(state: ProjectWizardState, update: (patch: Partial<ProjectWizardState>) => void) {
  return <div className="field"><label htmlFor="title">Project title</label><input id="title" value={state.title} onChange={(event) => update({ title: event.target.value })} /></div>;
}

function aspectButton(item: (typeof aspectRatios)[number], state: ProjectWizardState, update: (patch: Partial<ProjectWizardState>) => void) {
  return <button className={state.aspectRatio === item.value ? "option-card active" : "option-card"} key={item.value} onClick={() => update({ aspectRatio: item.value })} type="button"><span>{item.label}</span><small>{item.value}</small></button>;
}
