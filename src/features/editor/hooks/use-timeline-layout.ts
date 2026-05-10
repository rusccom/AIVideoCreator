"use client";

import { useMemo } from "react";
import type { EditorScene } from "../types";
import { TimelineLayout } from "../playback/timeline-layout";
import type { TimelineScale } from "../playback/timeline-scales";

type UseTimelineLayoutInput = {
  scenes: readonly EditorScene[];
  scale: TimelineScale;
  viewportWidth: number;
  contentSeconds: number;
};

export function useTimelineLayout(input: UseTimelineLayoutInput) {
  return useMemo(
    () =>
      new TimelineLayout({
        scenes: input.scenes,
        scale: input.scale,
        viewportWidth: input.viewportWidth,
        contentSeconds: input.contentSeconds
      }),
    [input.scenes, input.scale, input.viewportWidth, input.contentSeconds]
  );
}
