"use client";

import { useCallback, useMemo, useState } from "react";
import type { EditorTimelineItem } from "../types";
import { PlaybackTimeline, type ScenePosition } from "../playback/playback-timeline";

export type PlaybackState = {
  timeline: PlaybackTimeline;
  currentTime: number;
  currentPosition: ScenePosition | null;
  isPlaying: boolean;
  setCurrentTime: (time: number) => void;
  seek: (time: number) => void;
  seekToItem: (itemId: string) => void;
  seekToScene: (sceneId: string) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
};

export function usePlayback(items: readonly EditorTimelineItem[]): PlaybackState {
  const timeline = useMemo(() => new PlaybackTimeline(items), [items]);
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
  const seekToItem = useCallback(
    (itemId: string) => seekToItemStart(timeline, itemId, setCurrentTime),
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
    seekToItem,
    seekToScene,
    play,
    pause,
    toggle
  };
}

function seekToItemStart(
  timeline: PlaybackTimeline,
  itemId: string,
  setCurrentTime: (time: number) => void
) {
  const position = timeline.positionForItem(itemId);
  if (position) setCurrentTime(position.startTime);
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
