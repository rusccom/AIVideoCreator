"use client";

import { useMemo, useState } from "react";
import { PointerSensor, type DragEndEvent, type DragStartEvent, useSensor, useSensors } from "@dnd-kit/core";
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
  const sceneNames = useMemo(() => sceneNameMap(input.project), [input.project]);
  return {
    activeLabel,
    onDragEnd: (event: DragEndEvent) => handleDragEnd(input, event, setActiveLabel),
    onDragStart: (event: DragStartEvent) => setActiveLabel(labelForDrag(event, sceneNames, input.items)),
    sensors
  };
}

function handleDragEnd(
  input: UseTimelineDragInput,
  event: DragEndEvent,
  setActiveLabel: (value: string) => void
) {
  setActiveLabel("");
  const active = dragData(event.active.data.current);
  const index = dropIndex(event.over?.data.current, input.items);
  if (!active || index === null) return;
  if (active.type === "clip") input.addScene(active.sceneId, index);
  if (active.type === "timeline-item") input.moveItem(active.itemId, moveIndex(input.items, active.itemId, index));
}

function moveIndex(items: EditorTimelineItem[], itemId: string, targetIndex: number) {
  const currentIndex = items.findIndex((item) => item.id === itemId);
  return currentIndex >= 0 && currentIndex < targetIndex ? targetIndex - 1 : targetIndex;
}

function dropIndex(data: unknown, items: EditorTimelineItem[]) {
  const drop = dropData(data);
  if (!drop) return null;
  if (drop.type === "timeline-board") return items.length;
  const index = items.findIndex((item) => item.id === drop.itemId);
  return index < 0 ? null : index;
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
