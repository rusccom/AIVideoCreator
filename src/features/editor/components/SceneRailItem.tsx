"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { EditorScene } from "../types";
import { StatusBadge } from "./StatusBadge";

type SceneRailItemProps = {
  onSelect: (sceneId: string) => void;
  scene: EditorScene;
  selected: boolean;
};

export function SceneRailItem(props: SceneRailItemProps) {
  const drag = useDraggable({ id: `clip:${props.scene.id}`, data: dragData(props.scene.id) });
  return (
    <button
      className={sceneClass(props.selected)}
      onClick={() => props.onSelect(props.scene.id)}
      ref={drag.setNodeRef}
      style={dragStyle(drag.transform)}
      type="button"
      {...drag.attributes}
      {...drag.listeners}
    >
      <span className="scene-thumb" />
      <div>
        <strong>{props.scene.name}</strong>
        <span>{props.scene.duration} - {props.scene.model}</span>
        <StatusBadge status={props.scene.status} />
      </div>
    </button>
  );
}

function dragData(sceneId: string) {
  return { sceneId, type: "clip" };
}

function dragStyle(transform: ReturnType<typeof useDraggable>["transform"]) {
  return {
    opacity: transform ? 0.62 : 1,
    transform: CSS.Transform.toString(transform)
  };
}

function sceneClass(selected: boolean) {
  return selected ? "scene-item active" : "scene-item";
}
