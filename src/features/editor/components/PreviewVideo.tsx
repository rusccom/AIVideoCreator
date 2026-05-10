"use client";

import { useEffect, useRef } from "react";
import type { PlaybackState } from "../hooks/use-playback";
import type { ScenePosition } from "../playback/playback-timeline";
import { useResolvedAssetUrl } from "../hooks/use-resolved-asset-url";
import { ResolvedAssetImage } from "./ResolvedAssetImage";

type PreviewVideoProps = {
  playback: PlaybackState;
};

const DRIFT_THRESHOLD_SECONDS = 0.4;

export function PreviewVideo({ playback }: PreviewVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const position = playback.currentPosition;
  const videoUrl = useResolvedAssetUrl(position?.scene.videoUrl ?? null);
  useTimeSync(ref, playback.currentTime, position?.startTime ?? 0);
  usePlaybackSync(ref, playback.isPlaying && Boolean(videoUrl), playback.pause);
  if (!videoUrl) return <FallbackFrame position={position} />;
  return (
    <video
      className="preview-video"
      onEnded={() => advanceOrStop(playback)}
      onLoadedMetadata={() => syncOnLoad(ref.current, playback)}
      onTimeUpdate={() => publishTime(ref.current, position, playback.setCurrentTime)}
      ref={ref}
      src={videoUrl}
    />
  );
}

function FallbackFrame({ position }: { position: ScenePosition | null }) {
  const fallback = position ? "Ready to generate" : "Create a clip first";
  return (
    <ResolvedAssetImage
      alt="Start frame"
      className="preview-image"
      fallback={fallback}
      source={position?.scene.startFrameUrl}
    />
  );
}

function useTimeSync(
  ref: React.RefObject<HTMLVideoElement | null>,
  currentTime: number,
  startTime: number
) {
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const localTime = Math.max(0, currentTime - startTime);
    if (Math.abs(video.currentTime - localTime) > DRIFT_THRESHOLD_SECONDS) {
      video.currentTime = localTime;
    }
  }, [ref, currentTime, startTime]);
}

function usePlaybackSync(
  ref: React.RefObject<HTMLVideoElement | null>,
  shouldPlay: boolean,
  onPlayFail: () => void
) {
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (shouldPlay) void video.play().catch(onPlayFail);
    else if (!video.paused) video.pause();
  }, [ref, shouldPlay, onPlayFail]);
}

function publishTime(
  video: HTMLVideoElement | null,
  position: ScenePosition | null,
  setCurrentTime: (time: number) => void
) {
  if (!video || !position) return;
  setCurrentTime(position.startTime + video.currentTime);
}

function advanceOrStop(playback: PlaybackState) {
  if (!playback.currentPosition) return;
  const next = playback.timeline.nextPlayable(playback.currentPosition);
  if (next) playback.seek(next.startTime);
  else playback.pause();
}

function syncOnLoad(video: HTMLVideoElement | null, playback: PlaybackState) {
  if (!video || !playback.currentPosition) return;
  const localTime = Math.max(0, playback.currentTime - playback.currentPosition.startTime);
  video.currentTime = localTime;
  if (playback.isPlaying) void video.play().catch(playback.pause);
}
