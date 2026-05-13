import type { MouseEvent } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { ClipBox } from "../playback/timeline-layout";
import type { EditorTimelineItem } from "../types";
import { TimelineClipSlot } from "./TimelineClipSlot";

type TimelineTrackProps = {
  activeItemId: string | null;
  clipBoxes: readonly ClipBox[];
  insertionIndex: number | null;
  onContextMenu: (item: EditorTimelineItem, event: MouseEvent) => void;
  onSelect: (itemId: string) => void;
  selectedItemId?: string;
  width: number;
};

export const TIMELINE_INSERT_GAP_PX = 30;

export function TimelineTrack(props: TimelineTrackProps) {
  const drop = useDroppable({ id: "timeline-board", data: { type: "timeline-board" } });
  const insertLeft = insertionLeft(props.clipBoxes, props.insertionIndex);
  return (
    <div className="timeline-track" ref={drop.setNodeRef} style={{ width: props.width }}>
      {props.clipBoxes.length === 0 ? <p className="timeline-empty">No clips in this timeline yet.</p> : null}
      {insertLeft === null ? null : <div aria-hidden="true" className="timeline-insert-gap" style={{ left: insertLeft }} />}
      {props.clipBoxes.map((box, index) => (
        <TimelineClipSlot
          box={box}
          insertOffset={insertOffset(box, index, props)}
          key={box.item.id}
          onContextMenu={props.onContextMenu}
          onSelect={props.onSelect}
          selected={box.item.id === props.selectedItemId}
        />
      ))}
    </div>
  );
}

function insertOffset(box: ClipBox, index: number, props: TimelineTrackProps) {
  if (box.item.id === props.activeItemId) return 0;
  if (props.insertionIndex === null || index < props.insertionIndex) return 0;
  return TIMELINE_INSERT_GAP_PX;
}

function insertionLeft(clipBoxes: readonly ClipBox[], insertionIndex: number | null) {
  if (insertionIndex === null) return null;
  const box = clipBoxes[insertionIndex];
  if (box) return box.left;
  const last = clipBoxes[clipBoxes.length - 1];
  return last ? last.left + last.width : 0;
}
