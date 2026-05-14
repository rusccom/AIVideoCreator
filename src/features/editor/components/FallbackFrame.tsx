import type { ScenePosition } from "../playback/playback-timeline";
import { ResolvedAssetImage } from "./ResolvedAssetImage";

type FallbackFrameProps = {
  position: ScenePosition | null;
};

export function FallbackFrame({ position }: FallbackFrameProps) {
  const fallback = position ? "Ready to generate" : "Add clips to the timeline";
  return (
    <ResolvedAssetImage
      alt="Start frame"
      className="preview-image"
      fallback={fallback}
      loading="eager"
      source={position?.scene.startFrameUrl}
    />
  );
}
