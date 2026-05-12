"use client";

import { useEffect, useState } from "react";
import { DndContext, DragOverlay, pointerWithin } from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import type { EditorProject, EditorScene } from "../types";
import { usePlayback } from "../hooks/use-playback";
import { useTimelineDrag } from "../hooks/use-timeline-drag";
import { useTimelineItems } from "../hooks/use-timeline-items";
import { EditorHeader } from "./EditorHeader";
import { PhotoPanel } from "./PhotoPanel";
import { PreviewPlayer } from "./PreviewPlayer";
import { SceneCreateModal } from "./SceneCreateModal";
import { SceneRail } from "./SceneRail";
import { StoryboardTimeline } from "./StoryboardTimeline";

type ProjectEditorProps = {
  credits: number;
  project: EditorProject;
};

export function ProjectEditor({ credits, project }: ProjectEditorProps) {
  const router = useRouter();
  const timeline = useTimelineItems(project);
  const playback = usePlayback(timeline.items);
  const drag = useTimelineDrag({ ...timeline, project });
  const selectedScene = playback.currentPosition?.scene;
  const selectedTimelineItem = playback.currentPosition?.item;
  const [showCreate, setShowCreate] = useState(false);
  const [sceneAssetId, setSceneAssetId] = useState<string>();
  const generationActive = sceneGenerationActive(selectedScene);
  useGenerationPolling(selectedScene, router);

  function openSceneCreate() {
    setSceneAssetId(undefined);
    setShowCreate(true);
  }

  function openSceneFromPhoto(assetId: string) {
    setSceneAssetId(assetId);
    setShowCreate(true);
  }

  return (
    <div className="editor-shell">
      <EditorHeader
        aspectRatio={project.aspectRatio}
        credits={credits}
        imageModels={project.imageModels}
        projectId={project.id}
        sceneCount={project.scenes.length}
        scenes={project.scenes}
        title={project.title}
        totalDuration={project.totalDuration}
        videoModels={project.videoModels}
      />
      <DndContext
        collisionDetection={pointerWithin}
        onDragCancel={drag.onDragCancel}
        onDragEnd={drag.onDragEnd}
        onDragMove={drag.onDragMove}
        onDragStart={drag.onDragStart}
        sensors={drag.sensors}
      >
        <div className="editor-workspace">
          <SceneRail
            onCreate={openSceneCreate}
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
            onCreateVideoFromPhoto={openSceneFromPhoto}
            projectAspectRatio={project.aspectRatio}
            projectId={project.id}
          />
        </div>
        <StoryboardTimeline
          insertionIndex={drag.insertionIndex}
          onSelectItem={playback.seekToItem}
          playback={playback}
          selectedItemId={selectedTimelineItem?.id}
        />
        <DragOverlay>{drag.activeLabel ? <div className="timeline-drag-overlay">{drag.activeLabel}</div> : null}</DragOverlay>
      </DndContext>
      {showCreate ? (
        <SceneCreateModal
          assets={project.assets}
          defaultPrompt={project.title}
          initialAssetId={sceneAssetId}
          models={project.videoModels}
          onClose={() => setShowCreate(false)}
          onCreated={() => finishCreate(setShowCreate, setSceneAssetId, router)}
          projectId={project.id}
        />
      ) : null}
    </div>
  );
}

function useGenerationPolling(scene: EditorScene | undefined, router: ReturnType<typeof useRouter>) {
  useEffect(() => {
    const jobId = scene?.generationJobId;
    if (!jobId || scene?.statusValue !== "GENERATING") return;
    const timer = window.setInterval(() => pollJob(jobId, router), 5000);
    return () => window.clearInterval(timer);
  }, [router, scene]);
}

function sceneGenerationActive(scene: EditorScene | undefined) {
  return scene?.statusValue === "GENERATING";
}

function finishCreate(
  setShowCreate: (value: boolean) => void,
  setSceneAssetId: (value?: string) => void,
  router: ReturnType<typeof useRouter>
) {
  setShowCreate(false);
  setSceneAssetId(undefined);
  router.refresh();
}

async function pollJob(jobId: string, router: ReturnType<typeof useRouter>) {
  const response = await fetch(`/api/jobs/${jobId}`);
  if (!response.ok) return;
  const data = await response.json();
  if (data.status === "READY" || data.status === "FAILED") router.refresh();
}
