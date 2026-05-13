"use client";

import { useRef } from "react";
import { Maximize2 } from "lucide-react";
import type { PlaybackState } from "../hooks/use-playback";
import { usePreviewFit } from "../hooks/use-preview-fit";
import { GenerationProgressBar } from "./GenerationProgressBar";
import { PreviewPlaybackOverlay } from "./PreviewPlaybackOverlay";
import { PreviewVideo } from "./PreviewVideo";

type PreviewPlayerProps = {
  generating: boolean;
  playback: PlaybackState;
  projectAspectRatio: string;
};

export function PreviewPlayer(props: PreviewPlayerProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const preview = usePreviewFit(props.projectAspectRatio);
  return (
    <section className="editor-panel preview-panel">
      <div className="preview-player-body">
        <div className="preview-stage" ref={preview.stageRef}>
          <div className="preview-screen" ref={screenRef} style={preview.screenStyle}>
            <PreviewVideo playback={props.playback} />
            <PreviewPlaybackOverlay playback={props.playback} />
            <button
              aria-label="Open video fullscreen"
              className="preview-fullscreen-button"
              onClick={() => openFullscreen(screenRef.current)}
              type="button"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
        {props.generating ? <GenerationProgressBar /> : null}
      </div>
    </section>
  );
}

function openFullscreen(target: HTMLDivElement | null) {
  void target?.requestFullscreen().catch(() => undefined);
}
