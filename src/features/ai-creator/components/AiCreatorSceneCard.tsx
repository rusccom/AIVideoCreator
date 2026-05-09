import type { AiCreatorSceneDraft } from "../types";

type AiCreatorSceneCardProps = {
  onSelect: (sceneId: string) => void;
  onTextChange: (sceneId: string, text: string) => void;
  scene: AiCreatorSceneDraft;
  selected: boolean;
};

export function AiCreatorSceneCard(props: AiCreatorSceneCardProps) {
  return (
    <article className={cardClass(props.selected)}>
      <button onClick={() => props.onSelect(props.scene.id)} type="button">
        <strong>{props.scene.name}</strong>
        <span>{props.scene.range}</span>
      </button>
      {props.selected ? (
        <textarea
          aria-label={`${props.scene.name} script`}
          onChange={(event) => props.onTextChange(props.scene.id, event.target.value)}
          value={props.scene.text}
        />
      ) : (
        <p>{props.scene.text}</p>
      )}
    </article>
  );
}

function cardClass(selected: boolean) {
  return selected ? "ai-creator-scene-card selected" : "ai-creator-scene-card";
}
