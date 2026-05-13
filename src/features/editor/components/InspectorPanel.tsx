import type { EditorScene } from "../types";
import { InspectorField } from "./InspectorField";

type InspectorPanelProps = {
  generating: boolean;
  onGenerate: () => void;
  scene?: EditorScene;
};

export function InspectorPanel(props: InspectorPanelProps) {
  const scene = props.scene;
  return (
    <section className="editor-panel">
      <div className="editor-panel-header">
        <h2>Inspector</h2>
        <span className="badge">{scene?.name ?? "No scene"}</span>
      </div>
      <div className="inspector-body">
        {!scene ? <p className="form-note">Create a scene to edit generation settings.</p> : null}
        {scene ? <InspectorField label="User prompt" value={scene.prompt} /> : null}
        <InspectorField label="Camera movement" value="Push in - handheld" />
        <InspectorField label="Motion intensity" value="Medium" />
        <InspectorField label="Style lock" value="Enabled" />
        <InspectorField label="Character consistency" value="High" />
        <div className="button-row">
          <button className="button button-secondary" disabled={!scene || props.generating} onClick={props.onGenerate} type="button">
            {scene?.statusValue === "DRAFT" ? "Generate" : "Regenerate"}
          </button>
          <button className="button button-secondary" type="button">Duplicate</button>
          <button className="button button-quiet" type="button">Mark final</button>
        </div>
      </div>
    </section>
  );
}
