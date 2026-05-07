import { Plus } from "lucide-react";
import type { EditorScene } from "../types";
import { StatusBadge } from "./StatusBadge";

type SceneRailProps = {
  onCreate: () => void;
  onSelect: (sceneId: string) => void;
  selectedSceneId?: string;
  scenes: EditorScene[];
};

export function SceneRail(props: SceneRailProps) {
  return (
    <section className="editor-panel">
      <div className="editor-panel-header">
        <h2>Scenes</h2>
        <button className="button button-quiet" onClick={props.onCreate} type="button">
          <Plus size={15} />
        </button>
      </div>
      <div className="scene-list">
        {props.scenes.length === 0 ? <p className="form-note">No scenes yet.</p> : null}
        {props.scenes.map((scene) => (
          <button className={sceneClass(scene.id, props.selectedSceneId)} key={scene.id} onClick={() => props.onSelect(scene.id)} type="button">
            <span className="scene-thumb" />
            <div>
              <strong>{scene.name}</strong>
              <span>{scene.duration} - {scene.model}</span>
              <StatusBadge status={scene.status} />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function sceneClass(sceneId: string, selectedSceneId?: string) {
  return sceneId === selectedSceneId ? "scene-item active" : "scene-item";
}
