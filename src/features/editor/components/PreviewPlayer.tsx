import { Play } from "lucide-react";
import type { EditorScene } from "../types";
import type { PlaybackState } from "../hooks/use-playback";
import { GenerationProgressBar } from "./GenerationProgressBar";
import { PreviewVideo } from "./PreviewVideo";

type PreviewPlayerProps = {
  creditCost?: number | null;
  generating: boolean;
  onGenerate: () => void;
  playback: PlaybackState;
  submitting: boolean;
};

export function PreviewPlayer(props: PreviewPlayerProps) {
  const scene = props.playback.currentPosition?.scene;
  return (
    <section className="editor-panel preview-panel">
      <div>
        <div className="preview-screen">
          <PreviewVideo playback={props.playback} />
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
