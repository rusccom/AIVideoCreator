"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { MouseEvent } from "react";
import type { ClipBox } from "../playback/timeline-layout";
import type { EditorTimelineItem } from "../types";
import { TimelineClipCard } from "./TimelineClipCard";

type TimelineClipSlotProps = {
  box: ClipBox;
  insertOffset: number;
  onContextMenu: (item: EditorTimelineItem, event: MouseEvent) => void;
  onSelect: (itemId: string) => void;
  selected: boolean;
};

export function TimelineClipSlot(props: TimelineClipSlotProps) {
  const item = props.box.item;
  const drop = useDroppable({ id: dropId(item.id), data: dropData(item.id) });
  const drag = useDraggable({ id: dragId(item.id), data: dragData(item.id) });
  return (
    <div
      className={slotClass(drag.isDragging)}
      data-timeline-item-id={item.id}
      ref={mergeRefs(drop.setNodeRef, drag.setNodeRef)}
      style={slotStyle(props.box, props.insertOffset)}
      {...drag.attributes}
      {...drag.listeners}
    >
      <TimelineClipCard
        item={item}
        onContextMenu={props.onContextMenu}
        onSelect={props.onSelect}
        selected={props.selected}
      />
    </div>
  );
}

function slotStyle(box: ClipBox, insertOffset: number) {
  return {
    left: box.left + insertOffset,
    width: box.width
  };
}

function slotClass(dragging: boolean) {
  return dragging ? "timeline-clip-slot dragging" : "timeline-clip-slot";
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
