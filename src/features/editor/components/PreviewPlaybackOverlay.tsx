"use client";

import { Pause, Play } from "lucide-react";
import type { PlaybackState } from "../hooks/use-playback";

type PreviewPlaybackOverlayProps = {
  playback: PlaybackState;
};

export function PreviewPlaybackOverlay({ playback }: PreviewPlaybackOverlayProps) {
  const empty = playback.timeline.totalDuration === 0;
  return (
    <div className="preview-playback-overlay" aria-label="Preview playback controls">
      <button
        aria-label="Pause"
        className={!playback.isPlaying ? "active" : undefined}
        disabled={empty}
        onClick={playback.pause}
        type="button"
      >
        <Pause size={28} />
      </button>
      <button
        aria-label="Play"
        className={playback.isPlaying ? "active" : undefined}
        disabled={empty}
        onClick={playback.play}
        type="button"
      >
        <Play size={32} />
      </button>
    </div>
  );
}
