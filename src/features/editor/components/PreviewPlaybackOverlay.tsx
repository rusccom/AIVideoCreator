"use client";

import { Pause, Play } from "lucide-react";
import type { ReactNode } from "react";
import type { PlaybackState } from "../hooks/use-playback";

type PreviewPlaybackOverlayProps = {
  playback: PlaybackState;
};

export function PreviewPlaybackOverlay({ playback }: PreviewPlaybackOverlayProps) {
  const empty = playback.timeline.totalDuration === 0;
  return (
    <div className="preview-playback-overlay" aria-label="Preview playback controls">
      {playbackButton("Pause", !playback.isPlaying, empty, playback.pause, <Pause size={28} />)}
      {playbackButton("Play", playback.isPlaying, empty, playback.play, <Play size={32} />)}
    </div>
  );
}

function playbackButton(label: string, active: boolean, disabled: boolean, onClick: () => void, icon: ReactNode) {
  return <button aria-label={label} className={active ? "active" : undefined} disabled={disabled} onClick={onClick} type="button">{icon}</button>;
}
