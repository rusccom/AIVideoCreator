"use client";

import { useDraggable } from "@dnd-kit/core";
import { memo, type MouseEvent } from "react";
import type { EditorScene } from "../types";
import { StatusBadge } from "./StatusBadge";

type SceneRailItemProps = {
  onContextMenu: (scene: EditorScene, event: MouseEvent) => void;
  onSelect: (sceneId: string) => void;
  scene: EditorScene;
  selected: boolean;
};

export const SceneRailItem = memo(function SceneRailItem(props: SceneRailItemProps) {
  const drag = useDraggable({ id: `clip:${props.scene.id}`, data: dragData(props.scene.id) });
  return (
    <button className={sceneClass(props.selected, drag.isDragging)} onClick={() => props.onSelect(props.scene.id)} onContextMenu={(event) => props.onContextMenu(props.scene, event)} ref={drag.setNodeRef} type="button" {...drag.attributes} {...drag.listeners}>
      <span className="scene-thumb" />
      <div><strong>{props.scene.name}</strong><span>{props.scene.duration} - {props.scene.model}</span><StatusBadge status={props.scene.status} /></div>
    </button>
  );
});

function dragData(sceneId: string) {
  return { sceneId, type: "clip" };
}

function sceneClass(selected: boolean, dragging: boolean) {
  const classes = ["scene-item"];
  if (selected) classes.push("active");
  if (dragging) classes.push("dragging");
  return classes.join(" ");
}
