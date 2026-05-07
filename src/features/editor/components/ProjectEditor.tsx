"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { EditorProject } from "../types";
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
  const [selectedSceneId, setSelectedSceneId] = useState(project.scenes[0]?.id);
  const [showCreate, setShowCreate] = useState(false);
  const [sceneAssetId, setSceneAssetId] = useState<string>();
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const selectedScene = useMemo(() => selectedSceneById(project, selectedSceneId), [project, selectedSceneId]);

  useEffect(() => {
    const jobId = selectedScene?.generationJobId;
    if (!jobId || selectedScene?.statusValue !== "GENERATING") return;
    const timer = window.setInterval(() => pollJob(jobId, router), 5000);
    return () => window.clearInterval(timer);
  }, [router, selectedScene]);

  async function generateClip() {
    if (!selectedScene) return;
    setGenerating(true);
    setMessage("");
    const response = await submitGeneration(selectedScene);
    setGenerating(false);
    setMessage(response.ok ? "Generation queued." : "Generation could not start.");
    router.refresh();
  }

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
        credits={credits}
        projectId={project.id}
        sceneCount={project.scenes.length}
        title={project.title}
        totalDuration={project.totalDuration}
      />
      {message ? <div className="editor-message">{message}</div> : null}
      <div className="editor-workspace">
        <SceneRail
          onCreate={openSceneCreate}
          onSelect={setSelectedSceneId}
          scenes={project.scenes}
          selectedSceneId={selectedScene?.id}
        />
        <PreviewPlayer generating={generating} onGenerate={generateClip} scene={selectedScene} />
        <PhotoPanel
          assets={project.assets}
          imageModels={project.imageModels}
          onCreateVideoFromPhoto={openSceneFromPhoto}
          projectId={project.id}
        />
      </div>
      <StoryboardTimeline
        onSelect={setSelectedSceneId}
        scenes={project.scenes}
        selectedSceneId={selectedScene?.id}
        totalDuration={project.totalDuration}
      />
      {showCreate ? (
        <SceneCreateModal
          assets={project.assets}
          defaultPrompt={project.description}
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

async function submitGeneration(scene: NonNullable<ReturnType<typeof selectedSceneById>>) {
  return fetch(`/api/scenes/${scene.id}/generate-video`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(generationBody(scene))
  });
}

function generationBody(scene: NonNullable<ReturnType<typeof selectedSceneById>>) {
  return { prompt: scene.prompt, modelId: scene.modelId, duration: scene.durationSeconds };
}

function selectedSceneById(project: EditorProject, sceneId?: string) {
  return project.scenes.find((scene) => scene.id === sceneId) ?? project.scenes[0];
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
