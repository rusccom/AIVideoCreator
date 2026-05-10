import type { EditorScene } from "../types";
import type { TimelineScale } from "./timeline-scales";

export type ClipBox = {
  scene: EditorScene;
  left: number;
  width: number;
};

export type TimelineLayoutInput = {
  scenes: readonly EditorScene[];
  scale: TimelineScale;
  viewportWidth: number;
  contentSeconds: number;
};

export class TimelineLayout {
  readonly seconds: number;
  readonly pxPerSecond: number;
  readonly width: number;
  readonly clipBoxes: readonly ClipBox[];

  constructor(input: TimelineLayoutInput) {
    this.pxPerSecond = input.viewportWidth / input.scale.visibleSeconds;
    this.seconds = Math.max(input.scale.visibleSeconds, input.contentSeconds);
    this.width = this.seconds * this.pxPerSecond;
    this.clipBoxes = buildClipBoxes(input.scenes, this.pxPerSecond);
  }

  timeToPx(time: number) {
    return Math.max(0, time * this.pxPerSecond);
  }

  pxToTime(px: number) {
    return Math.max(0, px / this.pxPerSecond);
  }
}

function buildClipBoxes(scenes: readonly EditorScene[], pxPerSecond: number): ClipBox[] {
  let cursor = 0;
  return scenes.map((scene) => {
    const left = cursor * pxPerSecond;
    const width = scene.durationSeconds * pxPerSecond;
    cursor += scene.durationSeconds;
    return { scene, left, width };
  });
}
