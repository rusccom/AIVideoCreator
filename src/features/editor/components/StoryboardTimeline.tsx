"use client";

import { useState, type MouseEvent } from "react";
import type { PlaybackState } from "../hooks/use-playback";
import { useTimelineLayout } from "../hooks/use-timeline-layout";
import type { TimelineLayout } from "../playback/timeline-layout";
import { clampScaleIndex, timelineScales } from "../playback/timeline-scales";
import { TimelinePlayhead } from "./TimelinePlayhead";
import { TimelineScale } from "./TimelineScale";
import { TIMELINE_INSERT_GAP_PX, TimelineTrack } from "./TimelineTrack";
import { TimelineZoomControls } from "./TimelineZoomControls";
import type { EditorTimelineItem } from "../types";

type StoryboardTimelineProps = {
  activeItemId: string | null;
  insertionIndex: number | null;
  onContextMenu: (item: EditorTimelineItem, event: MouseEvent) => void;
  onSelectItem: (itemId: string) => void;
  playback: PlaybackState;
  selectedItemId?: string;
};

const VIEWPORT_WIDTH = 720;

export function StoryboardTimeline(props: StoryboardTimelineProps) {
  const [scaleIndex, setScaleIndex] = useState(0);
  const scale = timelineScales[scaleIndex];
  const layout = useTimelineLayout({
    items: props.playback.timeline.items,
    scale,
    viewportWidth: VIEWPORT_WIDTH,
    contentSeconds: props.playback.timeline.totalDuration
  });
  const boardWidth = timelineWidth(layout.width, props.insertionIndex);
  return (
    <section className="timeline-panel">
      {timelineHeader(scaleIndex, setScaleIndex, scale.label)}
      {timelineBoard(props, layout, scale.tickSeconds, boardWidth)}
    </section>
  );
}

function timelineHeader(scaleIndex: number, setScaleIndex: (index: number) => void, rangeLabel: string) {
  return <div className="editor-panel-header"><h2>Storyboard Timeline</h2><div className="timeline-header-actions"><TimelineZoomControls onZoomIn={() => setScaleIndex(clampScaleIndex(scaleIndex - 1))} onZoomOut={() => setScaleIndex(clampScaleIndex(scaleIndex + 1))} rangeLabel={rangeLabel} /></div></div>;
}

function timelineBoard(props: StoryboardTimelineProps, layout: TimelineLayout, tickSeconds: number, boardWidth: number) {
  return <div className="timeline-scroll"><div className="timeline-board" onClick={(event) => seekFromClick(event, layout, props.playback.seek)} style={{ width: boardWidth }}><TimelineScale seconds={layout.seconds} step={tickSeconds} width={boardWidth} />{timelineTrack(props, layout, boardWidth)}<TimelinePlayhead position={layout.timeToPx(props.playback.currentTime)} /></div></div>;
}

function timelineTrack(props: StoryboardTimelineProps, layout: TimelineLayout, boardWidth: number) {
  return <TimelineTrack activeItemId={props.activeItemId} clipBoxes={layout.clipBoxes} insertionIndex={props.insertionIndex} onContextMenu={props.onContextMenu} onSelect={props.onSelectItem} selectedItemId={props.selectedItemId} width={boardWidth} />;
}

function timelineWidth(width: number, insertionIndex: number | null) {
  return insertionIndex === null ? width : width + TIMELINE_INSERT_GAP_PX;
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
