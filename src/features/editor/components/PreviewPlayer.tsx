"use client";

import { Play } from "lucide-react";
import type { EditorScene } from "../types";
import type { PlaybackState } from "../hooks/use-playback";
import { usePreviewFit } from "../hooks/use-preview-fit";
import { GenerationProgressBar } from "./GenerationProgressBar";
import { PreviewVideo } from "./PreviewVideo";

type PreviewPlayerProps = {
  creditCost?: number | null;
  generating: boolean;
  onGenerate: () => void;
  playback: PlaybackState;
  projectAspectRatio: string;
  submitting: boolean;
};

export function PreviewPlayer(props: PreviewPlayerProps) {
  const scene = props.playback.currentPosition?.scene;
  const preview = usePreviewFit(props.projectAspectRatio);
  return (
    <section className="editor-panel preview-panel">
      <div className="preview-player-body">
        <div className="preview-stage" ref={preview.stageRef}>
          <div className="preview-screen" style={preview.screenStyle}>
            <PreviewVideo playback={props.playback} />
          </div>
        </div>
        {props.generating ? <GenerationProgressBar /> : null}
      </div>
      <div className="preview-controls">
        <span>{scene ? scene.name : "No scene selected"}</span>
        <button
          className="button button-primary"
          disabled={!canGenerate(scene, props.generating)}
          onClick={props.onGenerate}
          type="button"
        >
          <Play size={16} /> {buttonText(props.creditCost, props.generating, props.submitting)}
        </button>
      </div>
    </section>
  );
}

function canGenerate(scene: EditorScene | undefined, generating: boolean) {
  return Boolean(scene) && !generating;
}

function buttonText(creditCost: number | null | undefined, generating: boolean, submitting: boolean) {
  if (submitting) return "Submitting...";
  if (generating) return "Generating...";
  return creditCost ? `Generate clip (${creditCost} credits)` : "Generate clip";
}
