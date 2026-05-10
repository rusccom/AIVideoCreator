"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { EditorProject, EditorScene, EditorVideoModel } from "../types";
import { usePlayback } from "../hooks/use-playback";
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
  const playback = usePlayback(project.scenes);
  const selectedScene = playback.currentPosition?.scene;
  const [showCreate, setShowCreate] = useState(false);
  const [sceneAssetId, setSceneAssetId] = useState<string>();
  const [generating, setGenerating] = useState(false);
  const [pendingGenerationSceneId, setPendingGenerationSceneId] = useState<string>();
  const [message, setMessage] = useState("");
  const selectedCost = videoCost(project.videoModels, selectedScene);
  const generationActive = generating || sceneGenerationActive(selectedScene, pendingGenerationSceneId);
  useGenerationPolling(selectedScene, router);
  useGenerationCleanup(selectedScene, pendingGenerationSceneId, setPendingGenerationSceneId);

  async function generateClip() {
    if (!selectedScene) return;
    setGenerating(true);
    setMessage("");
    const response = await submitGeneration(selectedScene, project);
    setGenerating(false);
    if (response.ok) setPendingGenerationSceneId(selectedScene.id);
    setMessage(response.ok ? "Generation queued." : await responseError(response));
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
      {message ? <div className="editor-message">{message}</div> : null}
      <div className="editor-workspace">
        <SceneRail
          onCreate={openSceneCreate}
          onSelect={playback.seekToScene}
          scenes={project.scenes}
          selectedSceneId={selectedScene?.id}
        />
        <PreviewPlayer
          creditCost={selectedCost}
          generating={generationActive}
          onGenerate={generateClip}
          playback={playback}
          submitting={generating}
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
        onSelectScene={playback.seekToScene}
        playback={playback}
        selectedSceneId={selectedScene?.id}
      />
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

function useGenerationCleanup(
  scene: EditorScene | undefined,
  pendingId: string | undefined,
  reset: (value: string | undefined) => void
) {
  useEffect(() => {
    if (!scene || scene.id !== pendingId) return;
    if (scene.statusValue === "READY" || scene.statusValue === "FAILED") reset(undefined);
  }, [scene, pendingId, reset]);
}

async function submitGeneration(scene: EditorScene, project: EditorProject) {
  return fetch(`/api/scenes/${scene.id}/generate-video`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(generationBody(scene, project))
  });
}

function generationBody(scene: EditorScene, project: EditorProject) {
  return {
    aspectRatio: videoAspectRatio(project, scene.modelId),
    prompt: scene.prompt,
    modelId: scene.modelId,
    duration: scene.durationSeconds
  };
}

function videoCost(models: readonly EditorVideoModel[], scene?: EditorScene) {
  const model = models.find((item) => item.id === scene?.modelId);
  const price = model?.pricePerSecondByResolution[model.defaultResolution] ?? 0;
  return scene && price > 0 ? Math.ceil(scene.durationSeconds * price) : null;
}

function videoAspectRatio(project: EditorProject, modelId: string) {
  const model = project.videoModels.find((item) => item.id === modelId);
  if (model?.supportedAspectRatios.includes(project.aspectRatio)) return project.aspectRatio;
  return model?.supportedAspectRatios.includes("auto") ? "auto" : model?.defaultAspectRatio;
}

function sceneGenerationActive(scene: EditorScene | undefined, pendingSceneId?: string) {
  return scene?.statusValue === "GENERATING" || Boolean(scene?.id && scene.id === pendingSceneId);
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

async function responseError(response: Response) {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? "Generation could not start.";
  } catch {
    return "Generation could not start.";
  }
}
