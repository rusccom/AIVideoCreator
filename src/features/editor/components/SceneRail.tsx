import { Plus } from "lucide-react";
import type { MouseEvent } from "react";
import type { EditorScene } from "../types";
import { SceneRailItem } from "./SceneRailItem";

type SceneRailProps = {
  onContextMenu: (scene: EditorScene, event: MouseEvent) => void;
  onCreate: () => void;
  onSelect: (sceneId: string) => void;
  selectedSceneId?: string;
  scenes: EditorScene[];
};

export function SceneRail(props: SceneRailProps) {
  return (
    <section className="editor-panel">
      <div className="editor-panel-header">
        <h2>Clips</h2>
        <button className="button button-quiet" onClick={props.onCreate} type="button">
          <Plus size={15} />
        </button>
      </div>
      <div className="scene-list">
        {props.scenes.length === 0 ? <p className="form-note">No clips yet.</p> : null}
        {props.scenes.map((scene) => (
          <SceneRailItem
            key={scene.id}
            onContextMenu={props.onContextMenu}
            onSelect={props.onSelect}
            scene={scene}
            selected={scene.id === props.selectedSceneId}
          />
        ))}
      </div>
    </section>
  );
}
