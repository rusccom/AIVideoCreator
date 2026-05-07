import { aspectRatios, qualityModes, stylePresets } from "../data/project-options";
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
      <div className="option-grid">
        {aspectRatios.map((item) => (
          <button className={state.aspectRatio === item ? "option-card active" : "option-card"} key={item} onClick={() => update({ aspectRatio: item })} type="button">
            {item}
          </button>
        ))}
      </div>
      <div className="field">
        <label htmlFor="style">Style preset</label>
        <select id="style" value={state.stylePreset} onChange={(event) => update({ stylePreset: event.target.value })}>
          {stylePresets.map((style) => <option key={style}>{style}</option>)}
        </select>
      </div>
      <div className="option-grid">
        {qualityModes.map((quality) => (
          <button className={state.quality === quality ? "option-card active" : "option-card"} key={quality} onClick={() => update({ quality })} type="button">
            {quality}
          </button>
        ))}
      </div>
    </section>
  );
}
