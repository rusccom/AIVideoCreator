"use client";

import { useMemo, useState } from "react";
import {
  PointerSensor,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import type { EditorProject, EditorTimelineItem } from "../types";

type UseTimelineDragInput = {
  addScene: (sceneId: string, index: number) => void;
  items: EditorTimelineItem[];
  moveItem: (itemId: string, index: number) => void;
  project: EditorProject;
};

export function useTimelineDrag(input: UseTimelineDragInput) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [activeLabel, setActiveLabel] = useState("");
  const [insertionIndex, setInsertionIndex] = useState<number | null>(null);
  const sceneNames = useMemo(() => sceneNameMap(input.project), [input.project]);
  return {
    activeLabel,
    insertionIndex,
    onDragCancel: () => resetDrag(setActiveLabel, setInsertionIndex),
    onDragEnd: (event: DragEndEvent) => handleDragEnd(input, event, setActiveLabel, setInsertionIndex),
    onDragMove: (event: DragMoveEvent) => handleDragMove(input, event, setInsertionIndex),
    onDragStart: (event: DragStartEvent) => handleDragStart(event, sceneNames, input.items, setActiveLabel, setInsertionIndex),
    sensors
  };
}

function handleDragEnd(
  input: UseTimelineDragInput,
  event: DragEndEvent,
  setActiveLabel: (value: string) => void,
  setInsertionIndex: (value: number | null) => void
) {
  resetDrag(setActiveLabel, setInsertionIndex);
  const active = dragData(event.active.data.current);
  if (!active || !isTimelineDrop(event.over?.data.current)) return;
  const movingId = active.type === "timeline-item" ? active.itemId : undefined;
  const index = dropIndex(event, input.items, movingId);
  if (index === null) return;
  if (active.type === "clip") input.addScene(active.sceneId, index);
  if (active.type === "timeline-item") input.moveItem(active.itemId, index);
}

function handleDragMove(
  input: UseTimelineDragInput,
  event: DragMoveEvent,
  setInsertionIndex: (value: number | null) => void
) {
  const active = dragData(event.active.data.current);
  if (!active || !isTimelineDrop(event.over?.data.current)) return setInsertionIndex(null);
  const movingId = active.type === "timeline-item" ? active.itemId : undefined;
  setInsertionIndex(dropIndex(event, input.items, movingId));
}

function handleDragStart(
  event: DragStartEvent,
  sceneNames: Map<string, string>,
  items: EditorTimelineItem[],
  setActiveLabel: (value: string) => void,
  setInsertionIndex: (value: number | null) => void
) {
  setInsertionIndex(null);
  setActiveLabel(labelForDrag(event, sceneNames, items));
}

function dropIndex(event: TimelineDragEvent, items: EditorTimelineItem[], movingId?: string) {
  const pointerIndex = timelinePointerIndex(event, items, movingId);
  if (pointerIndex !== null) return pointerIndex;
  const drop = dropData(event.over?.data.current);
  if (!drop) return null;
  if (drop.type === "timeline-board") return items.length;
  return itemIndex(items, drop.itemId);
}

function timelinePointerIndex(event: TimelineDragEvent, items: EditorTimelineItem[], movingId?: string) {
  const pointerX = pointerClientX(event);
  if (pointerX === null) return null;
  const centers = timelineCenters(items, movingId);
  const index = centers.findIndex((center) => pointerX < center);
  return index < 0 ? items.length : index;
}

function timelineCenters(items: EditorTimelineItem[], movingId?: string) {
  return items.filter((item) => item.id !== movingId).flatMap((item) => {
    const node = document.querySelector(`[data-timeline-item-id="${item.id}"]`);
    if (!(node instanceof HTMLElement)) return [];
    const rect = node.getBoundingClientRect();
    return [rect.left + rect.width / 2];
  });
}

function pointerClientX(event: TimelineDragEvent) {
  if ("clientX" in event.activatorEvent && typeof event.activatorEvent.clientX === "number") {
    return event.activatorEvent.clientX + event.delta.x;
  }
  const rect = event.active.rect.current.translated;
  return rect ? rect.left + rect.width / 2 : null;
}

function itemIndex(items: EditorTimelineItem[], itemId: string) {
  const index = items.findIndex((item) => item.id === itemId);
  return index < 0 ? null : index;
}

function isTimelineDrop(data: unknown) {
  return Boolean(dropData(data));
}

function labelForDrag(
  event: DragStartEvent,
  sceneNames: Map<string, string>,
  items: EditorTimelineItem[]
) {
  const active = dragData(event.active.data.current);
  if (!active) return "";
  if (active.type === "clip") return sceneNames.get(active.sceneId) ?? "Clip";
  return items.find((item) => item.id === active.itemId)?.scene.name ?? "Timeline clip";
}

function sceneNameMap(project: EditorProject) {
  return new Map(project.scenes.map((scene) => [scene.id, scene.name]));
}

function resetDrag(
  setActiveLabel: (value: string) => void,
  setInsertionIndex: (value: number | null) => void
) {
  setActiveLabel("");
  setInsertionIndex(null);
}

function dragData(value: unknown): TimelineDragData | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (data.type === "clip" && typeof data.sceneId === "string") return { sceneId: data.sceneId, type: "clip" };
  if (data.type === "timeline-item" && typeof data.itemId === "string") return { itemId: data.itemId, type: "timeline-item" };
  return null;
}

function dropData(value: unknown): TimelineDropData | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (data.type === "timeline-board") return { type: "timeline-board" };
  if (data.type === "timeline-slot" && typeof data.itemId === "string") return { itemId: data.itemId, type: "timeline-slot" };
  return null;
}

type TimelineDragData =
  | { sceneId: string; type: "clip" }
  | { itemId: string; type: "timeline-item" };

type TimelineDropData =
  | { type: "timeline-board" }
  | { itemId: string; type: "timeline-slot" };

type TimelineDragEvent = DragEndEvent | DragMoveEvent;
