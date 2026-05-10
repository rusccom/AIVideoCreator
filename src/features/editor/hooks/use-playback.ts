"use client";

import { useCallback, useMemo, useState } from "react";
import type { EditorScene } from "../types";
import { PlaybackTimeline, type ScenePosition } from "../playback/playback-timeline";

export type PlaybackState = {
  timeline: PlaybackTimeline;
  currentTime: number;
  currentPosition: ScenePosition | null;
  isPlaying: boolean;
  setCurrentTime: (time: number) => void;
  seek: (time: number) => void;
  seekToScene: (sceneId: string) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
};

export function usePlayback(scenes: readonly EditorScene[]): PlaybackState {
  const timeline = useMemo(() => new PlaybackTimeline(scenes), [scenes]);
  const [currentTime, setCurrentTimeRaw] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const setCurrentTime = useCallback(
    (time: number) => setCurrentTimeRaw(clamp(time, 0, timeline.totalDuration)),
    [timeline]
  );
  const seek = setCurrentTime;
  const seekToScene = useCallback(
    (sceneId: string) => seekToSceneStart(timeline, sceneId, setCurrentTime),
    [timeline, setCurrentTime]
  );
  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const toggle = useCallback(() => setIsPlaying((value) => !value), []);
  const currentPosition = timeline.positionAtTime(currentTime);
  return {
    timeline,
    currentTime,
    currentPosition,
    isPlaying,
    setCurrentTime,
    seek,
    seekToScene,
    play,
    pause,
    toggle
  };
}

function seekToSceneStart(
  timeline: PlaybackTimeline,
  sceneId: string,
  setCurrentTime: (time: number) => void
) {
  const position = timeline.positionForScene(sceneId);
  if (position) setCurrentTime(position.startTime);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
