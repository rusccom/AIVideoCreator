import { Link2, TriangleAlert } from "lucide-react";
import type { MouseEvent } from "react";
import type { EditorTimelineItem } from "../types";
import { StatusBadge } from "./StatusBadge";

type TimelineClipCardProps = {
  item: EditorTimelineItem;
  onContextMenu: (item: EditorTimelineItem, event: MouseEvent) => void;
  onSelect: (itemId: string) => void;
  selected: boolean;
};

export function TimelineClipCard(props: TimelineClipCardProps) {
  const { scene } = props.item;
  const Icon = scene.linkState === "Linked" ? Link2 : TriangleAlert;

  return (
    <button
      className={clipClass(props.item, props.selected)}
      onClick={() => props.onSelect(props.item.id)}
      onContextMenu={(event) => props.onContextMenu(props.item, event)}
      type="button"
    >
      <div className="timeline-preview" />
      <div className="timeline-copy">{clipText(props.item)}{clipLink(scene.linkState, Icon)}</div>
    </button>
  );
}

function clipText(item: EditorTimelineItem) {
  return <><strong>{item.scene.name} - {item.scene.status}</strong><span>{item.scene.duration} - {item.scene.model}</span><StatusBadge status={item.scene.status} /></>;
}

function clipLink(linkState: string, Icon: typeof Link2) {
  return <div className="link-row"><Icon size={14} /><span>Start to end: {linkState}</span></div>;
}

function clipClass(item: EditorTimelineItem, selected: boolean) {
  const classes = ["timeline-clip"];
  if (item.scene.status === "Stale") classes.push("stale");
  if (selected) classes.push("active");
  return classes.join(" ");
}
