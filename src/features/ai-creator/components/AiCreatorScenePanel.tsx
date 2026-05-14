import type { AiCreatorSceneDraft } from "../types";
import { AiCreatorSceneCard } from "./AiCreatorSceneCard";

type AiCreatorScenePanelProps = {
  onSelect: (sceneId: string) => void;
  onTextChange: (sceneId: string, text: string) => void;
  scenes: AiCreatorSceneDraft[];
  selectedSceneId?: string;
};

export function AiCreatorScenePanel(props: AiCreatorScenePanelProps) {
  return (
    <section className="ai-creator-panel ai-creator-scenes-panel">
      <div className="ai-creator-panel-header"><div><h3>Scenes</h3><span>{props.scenes.length} planned</span></div></div>
      <div className="ai-creator-scenes-list">{props.scenes.map((scene) => sceneCard(props, scene))}</div>
    </section>
  );
}

function sceneCard(props: AiCreatorScenePanelProps, scene: AiCreatorSceneDraft) {
  return <AiCreatorSceneCard key={scene.id} onSelect={props.onSelect} onTextChange={props.onTextChange} scene={scene} selected={scene.id === props.selectedSceneId} />;
}
