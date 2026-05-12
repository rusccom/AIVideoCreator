"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { ClipBox } from "../playback/timeline-layout";
import { TimelineClipCard } from "./TimelineClipCard";

type TimelineClipSlotProps = {
  box: ClipBox;
  insertOffset: number;
  onSelect: (itemId: string) => void;
  selected: boolean;
};

export function TimelineClipSlot(props: TimelineClipSlotProps) {
  const item = props.box.item;
  const drop = useDroppable({ id: dropId(item.id), data: dropData(item.id) });
  const drag = useDraggable({ id: dragId(item.id), data: dragData(item.id) });
  return (
    <div
      className="timeline-clip-slot"
      data-timeline-item-id={item.id}
      ref={mergeRefs(drop.setNodeRef, drag.setNodeRef)}
      style={slotStyle(props.box, props.insertOffset, drag.transform)}
      {...drag.attributes}
      {...drag.listeners}
    >
      <TimelineClipCard item={item} onSelect={props.onSelect} selected={props.selected} />
    </div>
  );
}

function slotStyle(box: ClipBox, insertOffset: number, transform: ReturnType<typeof useDraggable>["transform"]) {
  return {
    left: box.left + insertOffset,
    opacity: transform ? 0.62 : 1,
    transform: CSS.Transform.toString(transform),
    width: box.width
  };
}

function mergeRefs<T>(first: (node: T | null) => void, second: (node: T | null) => void) {
  return (node: T | null) => {
    first(node);
    second(node);
  };
}

function dropId(itemId: string) {
  return `timeline-slot:${itemId}`;
}

function dragId(itemId: string) {
  return `timeline-item:${itemId}`;
}

function dropData(itemId: string) {
  return { itemId, type: "timeline-slot" };
}

function dragData(itemId: string) {
  return { itemId, type: "timeline-item" };
}
