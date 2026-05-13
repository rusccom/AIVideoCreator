"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StartedCreatorVideo } from "@/features/ai-creator/ai-creator-video-generation";
import type { EditorProject, EditorScene } from "../types";

export type SceneCreateTarget = {
  assetId?: string;
  parentSceneId?: string;
  prompt: string;
};

export type SceneProgressTarget = {
  jobId: string;
  projectId: string;
  sequenceId?: string;
  total: number;
};

export function useSceneCreator(project: EditorProject) {
  const router = useRouter();
  const [target, setTarget] = useState<SceneCreateTarget | null>(null);
  const [progressTarget, setProgressTarget] = useState<SceneProgressTarget | null>(null);

  return {
    closeCreate: () => setTarget(null),
    finishProgress: () => finishProgress(setProgressTarget, router),
    openBlank: () => setTarget({ prompt: project.title }),
    openContinue: (scene: EditorScene) => openContinue(setTarget, scene),
    openFromPhoto: (assetId: string) => setTarget({ assetId, prompt: project.title }),
    onStarted: (video: StartedCreatorVideo) => onStarted(setTarget, setProgressTarget, router, project.id, video),
    progressTarget,
    target
  };
}

function openContinue(setTarget: SetTarget, scene: EditorScene) {
  if (!scene.endFrameAssetId) return;
  setTarget({ assetId: scene.endFrameAssetId, parentSceneId: scene.id, prompt: scene.prompt });
}

function onStarted(
  setTarget: SetTarget,
  setProgressTarget: SetProgressTarget,
  router: ReturnType<typeof useRouter>,
  projectId: string,
  video: StartedCreatorVideo
) {
  setTarget(null);
  setProgressTarget(progressTargetFromVideo(video, projectId));
  router.refresh();
}

function finishProgress(setProgressTarget: SetProgressTarget, router: ReturnType<typeof useRouter>) {
  setProgressTarget(null);
  router.refresh();
}

function progressTargetFromVideo(video: StartedCreatorVideo, projectId: string): SceneProgressTarget {
  return {
    jobId: video.job.id,
    projectId,
    sequenceId: video.sequence?.id,
    total: video.sequence?.total ?? 1
  };
}

type SetTarget = (value: SceneCreateTarget | null) => void;
type SetProgressTarget = (value: SceneProgressTarget | null) => void;
