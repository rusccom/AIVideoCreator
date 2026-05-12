"use client";

import { useCallback, useEffect, useState } from "react";
import type { EditorProject, EditorScene, EditorTimelineItem } from "../types";

export function useTimelineItems(project: EditorProject) {
  const [items, setItems] = useState(project.timelineItems);
  useEffect(() => setItems(project.timelineItems), [project.timelineItems]);
  const addScene = useCallback(
    (sceneId: string, index: number) => addTimelineScene(project, items, setItems, sceneId, index),
    [project, items]
  );
  const moveItem = useCallback(
    (itemId: string, index: number) => moveTimelineItem(project.id, items, setItems, itemId, index),
    [project.id, items]
  );
  return { addScene, items, moveItem };
}

async function addTimelineScene(
  project: EditorProject,
  current: EditorTimelineItem[],
  setItems: SetTimelineItems,
  sceneId: string,
  index: number
) {
  const scene = project.scenes.find((item) => item.id === sceneId);
  if (!scene) return;
  const temp = tempItem(scene);
  const next = insertAt(current, temp, index);
  setItems(next);
  const created = await createTimelineItem(project.id, sceneId, index);
  created ? setItems(replaceItem(next, temp.id, created.item.id)) : setItems(current);
}

async function moveTimelineItem(
  projectId: string,
  current: EditorTimelineItem[],
  setItems: SetTimelineItems,
  itemId: string,
  index: number
) {
  const next = moveAt(current, itemId, index);
  if (next === current) return;
  setItems(next);
  const saved = await reorderTimeline(projectId, next.map((item) => item.id));
  if (!saved) setItems(current);
}

function insertAt(items: EditorTimelineItem[], item: EditorTimelineItem, index: number) {
  const next = [...items];
  next.splice(clamp(index, 0, next.length), 0, item);
  return renumber(next);
}

function moveAt(items: EditorTimelineItem[], itemId: string, index: number) {
  const from = items.findIndex((item) => item.id === itemId);
  if (from < 0) return items;
  if (from === index) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(clamp(index, 0, next.length), 0, item);
  return renumber(next);
}

function replaceItem(items: EditorTimelineItem[], tempId: string, itemId: string) {
  return items.map((item) => (item.id === tempId ? { ...item, id: itemId } : item));
}

function renumber(items: EditorTimelineItem[]) {
  return items.map((item, orderIndex) => ({ ...item, orderIndex }));
}

function tempItem(scene: EditorScene) {
  return {
    id: `temp-${crypto.randomUUID()}`,
    sceneId: scene.id,
    orderIndex: 0,
    durationSeconds: scene.durationSeconds,
    scene
  } satisfies EditorTimelineItem;
}

async function createTimelineItem(projectId: string, sceneId: string, index: number) {
  const response = await fetch(`/api/projects/${projectId}/timeline-items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index, sceneId })
  });
  if (!response.ok) return null;
  return response.json() as Promise<{ item: { id: string } }>;
}

async function reorderTimeline(projectId: string, itemIds: string[]) {
  const response = await fetch(`/api/projects/${projectId}/timeline-items/reorder`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemIds })
  });
  return response.ok;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

type SetTimelineItems = (items: EditorTimelineItem[]) => void;
