import { Link2, TriangleAlert } from "lucide-react";
import type { EditorScene } from "../types";
import { StatusBadge } from "./StatusBadge";

type TimelineClipCardProps = {
  onSelect: (sceneId: string) => void;
  scene: EditorScene;
  selected: boolean;
};

export function TimelineClipCard(props: TimelineClipCardProps) {
  const { scene } = props;
  const Icon = scene.linkState === "Linked" ? Link2 : TriangleAlert;

  return (
    <button className={clipClass(scene, props.selected)} onClick={() => props.onSelect(scene.id)} type="button">
      <div className="timeline-preview" />
      <div className="timeline-copy">
        <strong>{scene.name} - {scene.status}</strong>
        <span>{scene.duration} - {scene.model}</span>
        <StatusBadge status={scene.status} />
        <div className="link-row">
          <Icon size={14} />
          <span>Start to end: {scene.linkState}</span>
        </div>
      </div>
    </button>
  );
}

function clipClass(scene: EditorScene, selected: boolean) {
  const classes = ["timeline-clip"];
  if (scene.status === "Stale") classes.push("stale");
  if (selected) classes.push("active");
  return classes.join(" ");
}
