"use client";

import { useState } from "react";
import type { EditorScene } from "../types";
import { TimelineScale } from "./TimelineScale";
import { TimelineClipCard } from "./TimelineClipCard";
import { TimelineZoomControls } from "./TimelineZoomControls";

type StoryboardTimelineProps = {
  onSelect: (sceneId: string) => void;
  selectedSceneId?: string;
  scenes: EditorScene[];
  totalDuration: string;
};

export function StoryboardTimeline(props: StoryboardTimelineProps) {
  const [scaleIndex, setScaleIndex] = useState(0);
  const scale = timelineScales[scaleIndex];
  const seconds = Math.max(scale.visibleSeconds, timelineSeconds(props.scenes));
  const pxPerSecond = viewportWidth / scale.visibleSeconds;
  const width = Math.max(viewportWidth, seconds * pxPerSecond);
  return (
    <section className="timeline-panel">
      <div className="editor-panel-header">
        <h2>Storyboard Timeline</h2>
        <TimelineZoomControls
          onZoomIn={() => setScaleIndex(zoomIn(scaleIndex))}
          onZoomOut={() => setScaleIndex(zoomOut(scaleIndex))}
          rangeLabel={scale.label}
        />
      </div>
      <div className="timeline-scroll">
        <TimelineScale seconds={seconds} step={scale.tickSeconds} width={width} />
        <div className="timeline-clips" style={{ width }}>
          {props.scenes.length === 0 ? <p className="form-note">No clips in this timeline yet.</p> : null}
          {props.scenes.map((scene) => (
            <TimelineClipCard
              key={scene.id}
              onSelect={props.onSelect}
              scene={scene}
              selected={scene.id === props.selectedSceneId}
              width={clipWidth(scene, pxPerSecond)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

const viewportWidth = 720;

const timelineScales = [
  { label: "30s", tickSeconds: 5, visibleSeconds: 30 },
  { label: "1m", tickSeconds: 10, visibleSeconds: 60 },
  { label: "5m", tickSeconds: 60, visibleSeconds: 300 },
  { label: "10m", tickSeconds: 120, visibleSeconds: 600 },
  { label: "1h", tickSeconds: 600, visibleSeconds: 3600 }
];

function timelineSeconds(scenes: EditorScene[]) {
  const total = scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);
  return Math.max(60, total);
}

function clipWidth(scene: EditorScene, pxPerSecond: number) {
  return Math.max(96, scene.durationSeconds * pxPerSecond);
}

function zoomIn(index: number) {
  return Math.max(0, index - 1);
}

function zoomOut(index: number) {
  return Math.min(timelineScales.length - 1, index + 1);
}
