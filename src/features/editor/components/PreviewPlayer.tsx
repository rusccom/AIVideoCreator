import { Play } from "lucide-react";
import type { EditorScene } from "../types";
import { useResolvedAssetUrl } from "../hooks/use-resolved-asset-url";
import { ResolvedAssetImage } from "./ResolvedAssetImage";

type PreviewPlayerProps = {
  creditCost?: number | null;
  generating: boolean;
  onGenerate: () => void;
  scene?: EditorScene;
};

export function PreviewPlayer(props: PreviewPlayerProps) {
  const videoUrl = useResolvedAssetUrl(props.scene?.videoUrl);
  return (
    <section className="editor-panel preview-panel">
      <div>
        <div className="preview-screen">
          {videoUrl ? <video controls src={videoUrl} /> : previewFallback(props.scene)}
        </div>
      </div>
      <div className="preview-controls">
        <span>{props.scene ? props.scene.name : "No scene selected"}</span>
        <button className="button button-primary" disabled={!canGenerate(props)} onClick={props.onGenerate} type="button">
          <Play size={16} /> {buttonText(props.generating, props.creditCost)}
        </button>
      </div>
    </section>
  );
}

function previewFallback(scene?: EditorScene) {
  return <ResolvedAssetImage alt="Start frame" className="preview-image" fallback={scene ? "Ready to generate" : "Create a clip first"} source={scene?.startFrameUrl} />;
}

function canGenerate(props: PreviewPlayerProps) {
  return Boolean(props.scene) && !props.generating && props.scene?.statusValue !== "GENERATING";
}

function buttonText(generating: boolean, credits?: number | null) {
  if (generating) return "Submitting...";
  return credits ? `Generate clip (${credits} credits)` : "Generate clip";
}
