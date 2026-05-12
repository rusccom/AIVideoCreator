import type { EditorTimelineItem } from "../types";
import type { TimelineScale } from "./timeline-scales";

export type ClipBox = {
  item: EditorTimelineItem;
  left: number;
  width: number;
};

export type TimelineLayoutInput = {
  items: readonly EditorTimelineItem[];
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
    this.clipBoxes = buildClipBoxes(input.items, this.pxPerSecond);
  }

  timeToPx(time: number) {
    return Math.max(0, time * this.pxPerSecond);
  }

  pxToTime(px: number) {
    return Math.max(0, px / this.pxPerSecond);
  }
}

function buildClipBoxes(items: readonly EditorTimelineItem[], pxPerSecond: number): ClipBox[] {
  let cursor = 0;
  return items.map((item) => {
    const left = cursor * pxPerSecond;
    const width = item.durationSeconds * pxPerSecond;
    cursor += item.durationSeconds;
    return { item, left, width };
  });
}
