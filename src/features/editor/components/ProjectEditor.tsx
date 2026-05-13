"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { DndContext, DragOverlay, pointerWithin } from "@dnd-kit/core";
import { Trash2, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import type { EditorProject, EditorScene, EditorTimelineItem } from "../types";
import { usePlayback } from "../hooks/use-playback";
import { useSceneCreator } from "../hooks/use-scene-creator";
import { useTimelineDrag } from "../hooks/use-timeline-drag";
import { useTimelineItems } from "../hooks/use-timeline-items";
import { EditorHeader } from "./EditorHeader";
import { EditorContextMenu, type EditorContextMenuItem } from "./EditorContextMenu";
import { PhotoPanel } from "./PhotoPanel";
import { PreviewPlayer } from "./PreviewPlayer";
import { SceneRail } from "./SceneRail";
import { StoryboardTimeline } from "./StoryboardTimeline";

const AiCreatorProgressModal = dynamic(() =>
  import("@/features/ai-creator/components/AiCreatorProgressModal").then((mod) => mod.AiCreatorProgressModal)
);
const SceneCreateModal = dynamic(() => import("./SceneCreateModal").then((mod) => mod.SceneCreateModal));

type ProjectEditorProps = {
  credits: number;
  project: EditorProject;
};

type EditorMenuState =
  | { kind: "scene"; scene: EditorScene; x: number; y: number }
  | { item: EditorTimelineItem; kind: "timeline"; x: number; y: number };

type ContinueTarget = {
  sceneId?: string;
  timelineItemId?: string;
};

export function ProjectEditor({ credits, project }: ProjectEditorProps) {
  const router = useRouter();
  const timeline = useTimelineItems(project);
  const playback = usePlayback(timeline.items);
  const drag = useTimelineDrag({ ...timeline, project });
  const creator = useSceneCreator(project);
  const selectedScene = playback.currentPosition?.scene;
  const selectedTimelineItem = playback.currentPosition?.item;
  const [menu, setMenu] = useState<EditorMenuState | null>(null);
  const generationActive = sceneGenerationActive(selectedScene);
  const lastSceneId = project.scenes[project.scenes.length - 1]?.id;
  const lastTimelineItemId = timeline.items[timeline.items.length - 1]?.id;
  const continueTarget = { sceneId: lastSceneId, timelineItemId: lastTimelineItemId };
  const closeMenu = useCallback(() => setMenu(null), []);
  useProjectRealtime(project.id, router);
  useMenuListeners(menu, closeMenu);

  function openSceneMenu(scene: EditorScene, event: MouseEvent) {
    openMenu(event);
    playback.seekToScene(scene.id);
    setMenu({ kind: "scene", scene, ...menuPoint(event, scene.id === lastSceneId) });
  }

  function openTimelineMenu(item: EditorTimelineItem, event: MouseEvent) {
    openMenu(event);
    playback.seekToItem(item.id);
    setMenu({ item, kind: "timeline", ...menuPoint(event, item.id === lastTimelineItemId) });
  }

  async function deleteSceneFromMenu(scene: EditorScene) {
    setMenu(null);
    await deleteScene(scene.id);
    router.refresh();
  }

  async function deleteTimelineFromMenu(item: EditorTimelineItem) {
    setMenu(null);
    await timeline.deleteItem(item.id);
  }

  function continueFromScene(scene: EditorScene) {
    setMenu(null);
    creator.openContinue(scene);
  }

  return (
    <div className="editor-shell">
      <EditorHeader
        aspectRatio={project.aspectRatio}
        credits={credits}
        imageModels={project.imageModels}
        projectId={project.id}
        scenes={project.scenes}
        title={project.title}
        videoModels={project.videoModels}
      />
      <DndContext
        collisionDetection={pointerWithin}
        id={`editor-${project.id}`}
        onDragCancel={drag.onDragCancel}
        onDragEnd={drag.onDragEnd}
        onDragMove={drag.onDragMove}
        onDragStart={drag.onDragStart}
        sensors={drag.sensors}
      >
        <div className="editor-workspace">
          <SceneRail
            onContextMenu={openSceneMenu}
            onCreate={creator.openBlank}
            onSelect={playback.seekToScene}
            scenes={project.scenes}
            selectedSceneId={selectedScene?.id}
          />
          <PreviewPlayer
            generating={generationActive}
            playback={playback}
            projectAspectRatio={project.aspectRatio}
          />
          <PhotoPanel
            assets={project.assets}
            imageModels={project.imageModels}
            onCreateVideoFromPhoto={creator.openFromPhoto}
            projectAspectRatio={project.aspectRatio}
            projectId={project.id}
          />
        </div>
        <StoryboardTimeline
          activeItemId={drag.activeItemId}
          insertionIndex={drag.insertionIndex}
          onContextMenu={openTimelineMenu}
          onSelectItem={playback.seekToItem}
          playback={playback}
          selectedItemId={selectedTimelineItem?.id}
        />
        <DragOverlay>{drag.activeLabel ? <div className="timeline-drag-overlay">{drag.activeLabel}</div> : null}</DragOverlay>
      </DndContext>
      {menu ? (
        <EditorContextMenu
          items={menuItems(menu, continueTarget, deleteSceneFromMenu, deleteTimelineFromMenu, continueFromScene)}
          x={menu.x}
          y={menu.y}
        />
      ) : null}
      {creator.target ? (
        <SceneCreateModal
          assets={project.assets}
          defaultPrompt={creator.target.prompt}
          imageModels={project.imageModels}
          initialAssetId={creator.target.assetId}
          models={project.videoModels}
          onClose={creator.closeCreate}
          onStarted={creator.onStarted}
          parentSceneId={creator.target.parentSceneId}
          projectAspectRatio={project.aspectRatio}
          projectId={project.id}
        />
      ) : null}
      {creator.progressTarget ? (
        <AiCreatorProgressModal {...creator.progressTarget} onDone={creator.finishProgress} />
      ) : null}
    </div>
  );
}

function useProjectRealtime(projectId: string, router: ReturnType<typeof useRouter>) {
  useEffect(() => {
    const source = new EventSource(`/api/projects/${projectId}/events`);
    const refresh = () => router.refresh();
    projectEventTypes().forEach((type) => source.addEventListener(type, refresh));
    source.onerror = () => undefined;
    return () => source.close();
  }, [projectId, router]);
}

function sceneGenerationActive(scene: EditorScene | undefined) {
  return scene?.statusValue === "GENERATING";
}

function projectEventTypes() {
  return ["scene.created", "scene.updated", "scene.deleted", "scene.ready", "scene.failed", "images.ready", "images.failed"];
}

function useMenuListeners(menu: EditorMenuState | null, close: () => void) {
  useEffect(() => {
    if (!menu) return;
    const timer = window.setTimeout(() => addMenuListeners(close));
    return () => {
      window.clearTimeout(timer);
      removeMenuListeners(close);
    };
  }, [close, menu]);
}

function menuItems(
  menu: EditorMenuState,
  target: ContinueTarget,
  onDeleteScene: (scene: EditorScene) => void,
  onDeleteTimeline: (item: EditorTimelineItem) => void,
  onContinue: (scene: EditorScene) => void
) {
  const scene = menu.kind === "scene" ? menu.scene : menu.item.scene;
  const items = canContinue(menu, target) ? [continueItem(scene, onContinue)] : [];
  return [...items, deleteItem(menu, onDeleteScene, onDeleteTimeline)];
}

function canContinue(menu: EditorMenuState, target: ContinueTarget) {
  if (menu.kind === "scene") return menu.scene.id === target.sceneId;
  return menu.item.id === target.timelineItemId;
}

function continueItem(scene: EditorScene, onContinue: (scene: EditorScene) => void) {
  return {
    disabled: !scene.endFrameAssetId,
    icon: <Video size={16} />,
    id: "continue",
    label: "Continue based on this video",
    onSelect: () => onContinue(scene)
  } satisfies EditorContextMenuItem;
}

function deleteItem(
  menu: EditorMenuState,
  onDeleteScene: (scene: EditorScene) => void,
  onDeleteTimeline: (item: EditorTimelineItem) => void
) {
  return {
    danger: true,
    icon: <Trash2 size={16} />,
    id: "delete",
    label: "Delete",
    onSelect: () => deleteSelected(menu, onDeleteScene, onDeleteTimeline)
  } satisfies EditorContextMenuItem;
}

function deleteSelected(
  menu: EditorMenuState,
  onDeleteScene: (scene: EditorScene) => void,
  onDeleteTimeline: (item: EditorTimelineItem) => void
) {
  return menu.kind === "scene" ? onDeleteScene(menu.scene) : onDeleteTimeline(menu.item);
}

function openMenu(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

function menuPoint(event: MouseEvent, hasContinue: boolean) {
  const height = hasContinue ? 116 : 72;
  return {
    x: clamp(event.clientX, window.innerWidth - 294),
    y: clamp(event.clientY, window.innerHeight - height)
  };
}

async function deleteScene(sceneId: string) {
  await fetch(`/api/scenes/${sceneId}`, { method: "DELETE" });
}

function removeMenuListeners(close: () => void) {
  window.removeEventListener("click", close);
  window.removeEventListener("scroll", close, true);
}

function addMenuListeners(close: () => void) {
  window.addEventListener("click", close);
  window.addEventListener("scroll", close, true);
}

function clamp(value: number, max: number) {
  return Math.max(12, Math.min(value, max));
}
