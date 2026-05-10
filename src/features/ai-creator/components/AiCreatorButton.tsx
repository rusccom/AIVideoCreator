"use client";

import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { defaultAspectRatioPreset } from "@/features/generation/models/aspect-ratio-presets";
import type { StartedCreatorVideo } from "../ai-creator-video-generation";
import type { AiCreatorImageModel, AiCreatorVideoModel } from "../types";
import { AiCreatorModal } from "./AiCreatorModal";
import { AiCreatorProgressModal } from "./AiCreatorProgressModal";

type AiCreatorButtonProps = {
  imageModels?: AiCreatorImageModel[];
  projectAspectRatio?: string;
  projectId?: string;
  videoModels?: AiCreatorVideoModel[];
};

export function AiCreatorButton(props: AiCreatorButtonProps) {
  const launcher = useAiCreatorLauncher(props.projectAspectRatio);
  return (
    <>
      <button className="button button-primary" onClick={() => launcher.setOpen(true)} type="button">
        <Sparkles size={16} /> AI Creator
      </button>
      {modalPortal(props, launcher)}
      {progressPortal(launcher)}
    </>
  );
}

function useAiCreatorLauncher(projectAspectRatio?: string) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [progressJobId, setProgressJobId] = useState<string>();
  const aspectRatio = projectAspectRatio ?? defaultAspectRatioPreset().value;
  const finishProgress = useCallback(() => {
    setProgressJobId(undefined);
    router.refresh();
  }, [router]);
  const startProgress = useCallback((video: StartedCreatorVideo) => {
    setOpen(false);
    setProgressJobId(video.job.id);
  }, []);
  useEffect(() => {
    setMounted(true);
  }, []);
  return { aspectRatio, finishProgress, mounted, open, progressJobId, setOpen, startProgress };
}

type AiCreatorLauncher = ReturnType<typeof useAiCreatorLauncher>;

function modalPortal(props: AiCreatorButtonProps, launcher: AiCreatorLauncher) {
  if (!launcher.open || !launcher.mounted) return null;
  return createPortal(
    <AiCreatorModal
      {...props}
      onClose={() => launcher.setOpen(false)}
      onVideoStarted={launcher.startProgress}
      projectAspectRatio={launcher.aspectRatio}
    />,
    document.body
  );
}

function progressPortal(launcher: AiCreatorLauncher) {
  if (!launcher.progressJobId || !launcher.mounted) return null;
  return createPortal(
    <AiCreatorProgressModal jobId={launcher.progressJobId} onDone={launcher.finishProgress} />,
    document.body
  );
}
