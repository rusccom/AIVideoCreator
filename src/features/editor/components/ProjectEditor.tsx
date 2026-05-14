"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { DndContext, DragOverlay, pointerWithin } from "@dnd-kit/core";
import { Trash2, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { subscribeProjectEvents } from "@/shared/client/project-events";
import type { EditorIntegrations } from "../editor-integrations";
import type { EditorProject, EditorScene, EditorTimelineItem } from "../types";
import { usePlayback } from "../hooks/use-playback";
import { useSceneCreator } from "../hooks/use-scene-creator";
import { useTimelineDrag } from "../hooks/use-timeline-drag";
import { useTimelineItems } from "../hooks/use-timeline-items";
import { EditorHeader } from "./EditorHeader";
import { EditorContextMenu, type EditorContextMenuItem } from "./EditorContextMenu";
import { PhotoPanel } from "./PhotoPanel";
import { PreviewPlayer } from "./PreviewPlayer";
import { SceneCreateModal } from "./SceneCreateModal";
import { SceneRail } from "./SceneRail";
import { StoryboardTimeline } from "./StoryboardTimeline";

type ProjectEditorProps = {
  credits: number;
  integrations: EditorIntegrations;
  project: EditorProject;
};

type EditorMenuState =
  | { kind: "scene"; scene: EditorScene; x: number; y: number }
  | { item: EditorTimelineItem; kind: "timeline"; x: number; y: number };

type ContinueTarget = {
  sceneId?: string;
  timelineItemId?: string;
};

export function ProjectEditor({ credits, integrations, project }: ProjectEditorProps) {
  const state = useProjectEditorState(credits, project);
  return (
    <div className="editor-shell">
      {editorHeader(state, integrations)}
      {editorDnD(state, integrations)}
      {editorMenu(state)}
      {sceneModal(state, integrations)}
      {progressModal(state, integrations)}
    </div>
  );
}

function useProjectEditorState(credits: number, project: EditorProject) {
  const router = useRouter(), timeline = useTimelineItems(project);
  const playback = usePlayback(timeline.items), drag = useTimelineDrag({ ...timeline, project }), creator = useSceneCreator(project);
  const selectedScene = playback.currentPosition?.scene, selectedTimelineItem = playback.currentPosition?.item;
  const [menu, setMenu] = useState<EditorMenuState | null>(null);
  const generationActive = sceneGenerationActive(selectedScene);
  const lastSceneId = project.scenes[project.scenes.length - 1]?.id, lastTimelineItemId = timeline.items[timeline.items.length - 1]?.id;
  const continueTarget = { sceneId: lastSceneId, timelineItemId: lastTimelineItemId }, closeMenu = useCallback(() => setMenu(null), []);
  useProjectRealtime(project.id, router);
  useMenuListeners(menu, closeMenu);
  const openSceneMenu = (scene: EditorScene, event: MouseEvent) => openSceneMenuAt(setMenu, playback.seekToScene, lastSceneId, scene, event);
  const openTimelineMenu = (item: EditorTimelineItem, event: MouseEvent) => openTimelineMenuAt(setMenu, playback.seekToItem, lastTimelineItemId, item, event);
  const deleteSceneFromMenu = async (scene: EditorScene) => { setMenu(null); await deleteScene(scene.id); router.refresh(); };
  const deleteTimelineFromMenu = async (item: EditorTimelineItem) => { setMenu(null); await timeline.deleteItem(item.id); };
  const continueFromScene = (scene: EditorScene) => { setMenu(null); creator.openContinue(scene); };
  return { continueFromScene, continueTarget, creator, credits, deleteSceneFromMenu, deleteTimelineFromMenu, drag, generationActive, menu, openSceneMenu, openTimelineMenu, playback, project, selectedScene, selectedTimelineItem };
}

type ProjectEditorState = ReturnType<typeof useProjectEditorState>;

function editorHeader(state: ProjectEditorState, integrations: EditorIntegrations) {
  return (
      <EditorHeader
      aspectRatio={state.project.aspectRatio}
      credits={state.credits}
      imageModels={state.project.imageModels}
      integrations={integrations}
      projectId={state.project.id}
      scenes={state.project.scenes}
      title={state.project.title}
      videoModels={state.project.videoModels}
      />
  );
}

function editorDnD(state: ProjectEditorState, integrations: EditorIntegrations) {
  return (
      <DndContext
        collisionDetection={pointerWithin}
      id={`editor-${state.project.id}`}
      onDragCancel={state.drag.onDragCancel}
      onDragEnd={state.drag.onDragEnd}
      onDragMove={state.drag.onDragMove}
      onDragStart={state.drag.onDragStart}
      sensors={state.drag.sensors}
      >
      {editorWorkspace(state, integrations)}
      {storyboard(state)}
      <DragOverlay>{state.drag.activeLabel ? <div className="timeline-drag-overlay">{state.drag.activeLabel}</div> : null}</DragOverlay>
      </DndContext>
  );
}

function editorWorkspace(state: ProjectEditorState, integrations: EditorIntegrations) {
  return (
    <div className="editor-workspace">
      <SceneRail onContextMenu={state.openSceneMenu} onCreate={state.creator.openBlank} onSelect={state.playback.seekToScene} scenes={state.project.scenes} selectedSceneId={state.selectedScene?.id} />
      <PreviewPlayer generating={state.generationActive} playback={state.playback} projectAspectRatio={state.project.aspectRatio} />
      <PhotoPanel assets={state.project.assets} imageModels={state.project.imageModels} integrations={integrations} onCreateVideoFromPhoto={state.creator.openFromPhoto} projectAspectRatio={state.project.aspectRatio} projectId={state.project.id} />
    </div>
  );
}

function storyboard(state: ProjectEditorState) {
  return <StoryboardTimeline activeItemId={state.drag.activeItemId} insertionIndex={state.drag.insertionIndex} onContextMenu={state.openTimelineMenu} onSelectItem={state.playback.seekToItem} playback={state.playback} selectedItemId={state.selectedTimelineItem?.id} />;
}

function editorMenu(state: ProjectEditorState) {
  if (!state.menu) return null;
  const items = menuItems(state.menu, state.continueTarget, state.deleteSceneFromMenu, state.deleteTimelineFromMenu, state.continueFromScene);
  return <EditorContextMenu items={items} x={state.menu.x} y={state.menu.y} />;
}

function sceneModal(state: ProjectEditorState, integrations: EditorIntegrations) {
  if (!state.creator.target) return null;
  const target = state.creator.target;
  return <SceneCreateModal assets={state.project.assets} defaultPrompt={target.prompt} imageModels={state.project.imageModels} initialAssetId={target.assetId} integrations={integrations} models={state.project.videoModels} onClose={state.creator.closeCreate} onStarted={state.creator.onStarted} parentSceneId={target.parentSceneId} projectAspectRatio={state.project.aspectRatio} projectId={state.project.id} />;
}

function progressModal(state: ProjectEditorState, integrations: EditorIntegrations) {
  const AiCreatorProgressModal = integrations.AiCreatorProgressModal;
  return state.creator.progressTarget ? <AiCreatorProgressModal {...state.creator.progressTarget} onDone={state.creator.finishProgress} /> : null;
}

function useProjectRealtime(projectId: string, router: ReturnType<typeof useRouter>) {
  useEffect(() => {
    const refresh = () => router.refresh();
    return subscribeProjectEvents(projectId, projectEventTypes(), refresh);
  }, [projectId, router]);
}

function sceneGenerationActive(scene: EditorScene | undefined) {
  return scene?.statusValue === "GENERATING";
}

function openSceneMenuAt(
  setMenu: (menu: EditorMenuState) => void,
  seek: (id: string) => void,
  lastSceneId: string | undefined,
  scene: EditorScene,
  event: MouseEvent
) {
  openMenu(event);
  seek(scene.id);
  setMenu({ kind: "scene", scene, ...menuPoint(event, scene.id === lastSceneId) });
}

function openTimelineMenuAt(
  setMenu: (menu: EditorMenuState) => void,
  seek: (id: string) => void,
  lastItemId: string | undefined,
  item: EditorTimelineItem,
  event: MouseEvent
) {
  openMenu(event);
  seek(item.id);
  setMenu({ item, kind: "timeline", ...menuPoint(event, item.id === lastItemId) });
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
