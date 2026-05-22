"use client";

import { useEffect, useState } from "react";

const TICK_MS = 1200;

type LivenessState = {
  elapsedSeconds: number;
  tick: number;
};

export function useAiCreatorProgressLiveness(active: boolean, resetKey: string) {
  const [state, setState] = useState<LivenessState>(() => initialState());
  useEffect(() => {
    setState(initialState());
    if (!active) return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setState((current) => nextState(current, startedAt));
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [active, resetKey]);
  return { ...state, elapsedLabel: elapsedLabel(state.elapsedSeconds) };
}

function initialState() {
  return { elapsedSeconds: 0, tick: 0 };
}

function nextState(current: LivenessState, startedAt: number) {
  return {
    elapsedSeconds: elapsedSeconds(startedAt),
    tick: current.tick + 1
  };
}

function elapsedSeconds(startedAt: number) {
  return Math.max(1, Math.round((Date.now() - startedAt) / 1000));
}

function elapsedLabel(seconds: number) {
  if (seconds < 1) return "Starting...";
  if (seconds < 60) return `Still working for ${seconds}s.`;
  return `Still working for ${Math.floor(seconds / 60)}m ${seconds % 60}s.`;
}
