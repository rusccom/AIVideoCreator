"use client";

import { useEffect, useMemo, useRef } from "react";
import type { EditorTimelineItem } from "../types";
import type { PlaybackState } from "../hooks/use-playback";
import { useResolvedTimelineVideoUrls } from "../hooks/use-resolved-timeline-video-urls";
import type { ScenePosition } from "../playback/playback-timeline";
import { FallbackFrame } from "./FallbackFrame";

type PreviewVideoProps = {
  playback: PlaybackState;
};

const DRIFT_THRESHOLD_SECONDS = 0.25;
const PUBLISH_INTERVAL_MS = 100;
const SWITCH_MARGIN_SECONDS = 0.12;

export function PreviewVideo({ playback }: PreviewVideoProps) {
  const activeRef = useRef<HTMLVideoElement>(null);
  const preloadRef = useRef<HTMLVideoElement>(null);
  const position = playback.currentPosition;
  const next = position ? playback.timeline.nextPlayable(position) : null;
  const videoItems = useMemo(() => playbackItems(position, next), [position, next]);
  const urls = useResolvedTimelineVideoUrls(videoItems);
  const currentUrl = position ? urls[position.item.id] : null;
  const nextUrl = next ? urls[next.item.id] : null;
  useActiveVideo(activeRef, playback, position, currentUrl);
  usePreloadVideo(preloadRef, nextUrl);
  useTimelineClock(activeRef, playback, position, next);
  if (!currentUrl) return <FallbackFrame position={position} />;
  return (
    <>
      {renderActiveVideo(activeRef, playback, currentUrl)}
      {renderBufferVideo(preloadRef, nextUrl)}
    </>
  );
}

function playbackItems(
  position: ScenePosition | null,
  next: ScenePosition | null
): readonly EditorTimelineItem[] {
  if (!position) return [];
  if (!next) return [position.item];
  return [position.item, next.item];
}

function renderActiveVideo(
  ref: React.RefObject<HTMLVideoElement | null>,
  playback: PlaybackState,
  url: string
) {
  return (
    <video
      className="preview-video"
      onEnded={() => advanceOrStop(playback)}
      playsInline
      preload={playback.isPlaying ? "auto" : "metadata"}
      ref={ref}
      src={url}
    />
  );
}

function renderBufferVideo(ref: React.RefObject<HTMLVideoElement | null>, url?: string | null) {
  if (!url) return null;
  return (
    <video
      aria-hidden
      className="preview-video-buffer"
      muted
      playsInline
      preload="metadata"
      ref={ref}
      src={url}
    />
  );
}

function useActiveVideo(
  ref: React.RefObject<HTMLVideoElement | null>,
  playback: PlaybackState,
  position: ScenePosition | null,
  url: string | null
) {
  useVideoTimeSync(ref, playback.currentTime, position, url);
  useVideoPlaybackSync(ref, playback.isPlaying, playback.pause, url);
}

function useVideoTimeSync(
  ref: React.RefObject<HTMLVideoElement | null>,
  currentTime: number,
  position: ScenePosition | null,
  url: string | null
) {
  useEffect(() => {
    const video = ref.current;
    if (!video || !position || !url) return;
    syncVideoTime(video, currentTime, position.startTime);
  }, [ref, currentTime, position, url]);
}

function useVideoPlaybackSync(
  ref: React.RefObject<HTMLVideoElement | null>,
  isPlaying: boolean,
  pause: () => void,
  url: string | null
) {
  useEffect(() => {
    const video = ref.current;
    if (!video || !url) return;
    if (isPlaying) void video.play().catch(pause);
    else if (!video.paused) video.pause();
  }, [ref, isPlaying, pause, url]);
}

function usePreloadVideo(ref: React.RefObject<HTMLVideoElement | null>, url?: string | null) {
  useEffect(() => {
    const video = ref.current;
    if (!video || !url) return;
    video.load();
  }, [ref, url]);
}

function useTimelineClock(
  ref: React.RefObject<HTMLVideoElement | null>,
  playback: PlaybackState,
  position: ScenePosition | null,
  next: ScenePosition | null
) {
  useEffect(() => {
    if (!playback.isPlaying || !position) return;
    const context = { next, playback, position, ref };
    const clock = { advanced: false, frame: 0, last: 0 };
    const tick = (time: number) => runClock(context, clock, time);
    clock.frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(clock.frame);
  }, [ref, playback.isPlaying, playback.seek, playback.setCurrentTime, position, next]);
}

function runClock(
  context: ClockContext,
  clock: ClockState,
  time: number
) {
  const video = context.ref.current;
  if (!video) return;
  publishClock(video, context.playback, context.position, clock, time);
  if (shouldAdvance(video, context.next, clock)) return advanceToNext(context, clock);
  clock.frame = window.requestAnimationFrame((nextTime) => runClock(context, clock, nextTime));
}

function publishClock(
  video: HTMLVideoElement,
  playback: PlaybackState,
  position: ScenePosition,
  clock: ClockState,
  time: number
) {
  if (time - clock.last < PUBLISH_INTERVAL_MS) return;
  clock.last = time;
  playback.setCurrentTime(position.startTime + video.currentTime);
}

function shouldAdvance(video: HTMLVideoElement, next: ScenePosition | null, clock: ClockState) {
  if (!next || clock.advanced || !Number.isFinite(video.duration)) return false;
  return video.duration - video.currentTime <= SWITCH_MARGIN_SECONDS;
}

function advanceToNext(context: ClockContext, clock: ClockState) {
  if (!context.next) return;
  clock.advanced = true;
  context.playback.seek(context.next.startTime);
}

function advanceOrStop(playback: PlaybackState) {
  if (!playback.currentPosition) return;
  const next = playback.timeline.nextPlayable(playback.currentPosition);
  if (next) playback.seek(next.startTime);
  else playback.pause();
}

function syncVideoTime(video: HTMLVideoElement, currentTime: number, startTime: number) {
  const localTime = Math.max(0, currentTime - startTime);
  if (Math.abs(video.currentTime - localTime) > DRIFT_THRESHOLD_SECONDS) {
    video.currentTime = localTime;
  }
}

type ClockState = {
  advanced: boolean;
  frame: number;
  last: number;
};

type ClockContext = {
  next: ScenePosition | null;
  playback: PlaybackState;
  position: ScenePosition;
  ref: React.RefObject<HTMLVideoElement | null>;
};
