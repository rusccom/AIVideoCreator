"use client";

import { useMemo } from "react";
import type { EditorTimelineItem } from "../types";
import { TimelineLayout } from "../playback/timeline-layout";
import type { TimelineScale } from "../playback/timeline-scales";

type UseTimelineLayoutInput = {
  items: readonly EditorTimelineItem[];
  scale: TimelineScale;
  viewportWidth: number;
  contentSeconds: number;
};

export function useTimelineLayout(input: UseTimelineLayoutInput) {
  return useMemo(
    () =>
      new TimelineLayout({
        items: input.items,
        scale: input.scale,
        viewportWidth: input.viewportWidth,
        contentSeconds: input.contentSeconds
      }),
    [input.items, input.scale, input.viewportWidth, input.contentSeconds]
  );
}
