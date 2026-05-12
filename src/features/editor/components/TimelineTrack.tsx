import { useDroppable } from "@dnd-kit/core";
import type { ClipBox } from "../playback/timeline-layout";
import { TimelineClipSlot } from "./TimelineClipSlot";

type TimelineTrackProps = {
  clipBoxes: readonly ClipBox[];
  onSelect: (itemId: string) => void;
  selectedItemId?: string;
  width: number;
};

export function TimelineTrack(props: TimelineTrackProps) {
  const drop = useDroppable({ id: "timeline-board", data: { type: "timeline-board" } });
  return (
    <div className="timeline-track" ref={drop.setNodeRef} style={{ width: props.width }}>
      {props.clipBoxes.length === 0 ? <p className="timeline-empty">No clips in this timeline yet.</p> : null}
      {props.clipBoxes.map((box) => (
        <TimelineClipSlot
          box={box}
          key={box.item.id}
          onSelect={props.onSelect}
          selected={box.item.id === props.selectedItemId}
        />
      ))}
    </div>
  );
}
