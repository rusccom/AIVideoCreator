"use client";

import { useState, type MouseEvent } from "react";
import type { PlaybackState } from "../hooks/use-playback";
import { useTimelineLayout } from "../hooks/use-timeline-layout";
import type { TimelineLayout } from "../playback/timeline-layout";
import { clampScaleIndex, timelineScales } from "../playback/timeline-scales";
import { TimelinePlayhead } from "./TimelinePlayhead";
import { TimelineScale } from "./TimelineScale";
import { TimelineTrack } from "./TimelineTrack";
import { TimelineTransport } from "./TimelineTransport";
import { TimelineZoomControls } from "./TimelineZoomControls";

type StoryboardTimelineProps = {
  onSelectScene: (sceneId: string) => void;
  playback: PlaybackState;
  selectedSceneId?: string;
};

const VIEWPORT_WIDTH = 720;

export function StoryboardTimeline(props: StoryboardTimelineProps) {
  const [scaleIndex, setScaleIndex] = useState(0);
  const scale = timelineScales[scaleIndex];
  const layout = useTimelineLayout({
    scenes: props.playback.timeline.scenes,
    scale,
    viewportWidth: VIEWPORT_WIDTH,
    contentSeconds: props.playback.timeline.totalDuration
  });
  return (
    <section className="timeline-panel">
      <div className="editor-panel-header">
        <h2>Storyboard Timeline</h2>
        <div className="timeline-header-actions">
          <TimelineTransport
            currentTime={props.playback.currentTime}
            isPlaying={props.playback.isPlaying}
            onToggle={props.playback.toggle}
            totalDuration={props.playback.timeline.totalDuration}
          />
          <TimelineZoomControls
            onZoomIn={() => setScaleIndex(clampScaleIndex(scaleIndex - 1))}
            onZoomOut={() => setScaleIndex(clampScaleIndex(scaleIndex + 1))}
            rangeLabel={scale.label}
          />
        </div>
      </div>
      <div className="timeline-scroll">
        <div
          className="timeline-board"
          onClick={(event) => seekFromClick(event, layout, props.playback.seek)}
          style={{ width: layout.width }}
        >
          <TimelineScale seconds={layout.seconds} step={scale.tickSeconds} width={layout.width} />
          <TimelineTrack
            clipBoxes={layout.clipBoxes}
            onSelect={props.onSelectScene}
            selectedSceneId={props.selectedSceneId}
            width={layout.width}
          />
          <TimelinePlayhead position={layout.timeToPx(props.playback.currentTime)} />
        </div>
      </div>
    </section>
  );
}

function seekFromClick(
  event: MouseEvent<HTMLDivElement>,
  layout: TimelineLayout,
  seek: (time: number) => void
) {
  if (isInteractive(event.target as HTMLElement)) return;
  const board = event.currentTarget.getBoundingClientRect();
  const offsetPx = event.clientX - board.left;
  seek(layout.pxToTime(offsetPx));
}

function isInteractive(target: HTMLElement | null) {
  if (!target) return false;
  return Boolean(target.closest("button"));
}
