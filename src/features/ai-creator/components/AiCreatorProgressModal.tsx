"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { AiCreatorPollingPulse } from "./AiCreatorPollingPulse";

type AiCreatorProgressModalProps = {
  jobId: string;
  onDone: () => void;
  sequenceId?: string;
  total: number;
};

type ProgressState = {
  readyCount: number;
  status: string;
  total: number;
};

type ProgressTarget = {
  jobId: string;
  sequenceId?: string;
  total: number;
};

type ProgressViewState = {
  progress: ProgressState;
  pulse: number;
};

const POLL_INTERVAL_MS = 4000;

export function AiCreatorProgressModal(props: AiCreatorProgressModalProps) {
  const state = useProgressStatus(props);
  const progress = state.progress;

  return (
    <div aria-modal="true" className="project-modal-backdrop" role="dialog">
      <div className="project-modal ai-creator-progress-modal">
        <div className="ai-creator-progress-layout">
          <AiCreatorPollingPulse
            pulse={state.pulse}
            readyCount={progress.readyCount}
            status={progress.status}
            total={progress.total}
          />
          <div className="ai-creator-progress-content">
            <div>
              <h2>{progressTitle(progress.total)}</h2>
              <p>{progressText(progress)}</p>
            </div>
            <div aria-label="Clip generation progress" {...progressBarProps(state)}>
              <span />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function useProgressStatus(props: AiCreatorProgressModalProps) {
  const [state, setState] = useState(initialProgressView(props.total));
  useEffect(() => runProgressPolling(props, setState), [props.jobId, props.onDone, props.sequenceId, props.total]);
  return state;
}

function runProgressPolling(
  props: AiCreatorProgressModalProps,
  setState: (updater: (state: ProgressViewState) => ProgressViewState) => void
) {
  let active = true;
  let timer: number | undefined;
  const target = progressTarget(props);
  const refresh = async () => {
    setState(nextPulse);
    const progress = await safeFetchProgress(target);
    if (!active) return;
    setState((state) => applyProgress(state, progress));
    if (progress && isFinalStatus(progress.status)) return props.onDone();
    timer = window.setTimeout(refresh, POLL_INTERVAL_MS);
  };
  void refresh();
  return () => {
    active = false;
    if (timer) window.clearTimeout(timer);
  };
}

function applyProgress(state: ProgressViewState, progress: ProgressState | null) {
  return progress ? { ...state, progress } : state;
}

async function safeFetchProgress(target: ProgressTarget) {
  try {
    return target.sequenceId ? await fetchSequence(target.sequenceId) : await fetchJob(target.jobId, target.total);
  } catch {
    return null;
  }
}

async function fetchJob(jobId: string, total: number) {
  const response = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Job refresh failed");
  const job = await response.json() as { status: string };
  return { readyCount: job.status === "READY" ? total : 0, status: job.status, total };
}

async function fetchSequence(sequenceId: string) {
  const response = await fetch(`/api/ai-creator/sequences/${sequenceId}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Sequence refresh failed");
  return response.json() as Promise<ProgressState>;
}

function isFinalStatus(status: string) {
  return status === "READY" || status === "FAILED" || status === "CANCELED";
}

function progressTarget(props: AiCreatorProgressModalProps) {
  return { jobId: props.jobId, sequenceId: props.sequenceId, total: props.total };
}

function progressText(progress: ProgressState) {
  if (progress.status === "READY") return readyText(progress.total);
  if (progress.status === "FAILED" || progress.status === "CANCELED") return "Clip generation stopped.";
  if (progress.total > 1) return `Generating clips ${nextClipNumber(progress)} of ${progress.total}.`;
  return "Please wait while the clip is being created.";
}

function progressTitle(total: number) {
  return total > 1 ? "Generating clips" : "Generating clip";
}

function progressBarProps(state: ProgressViewState) {
  const progress = state.progress;
  return {
    "aria-valuemax": progress.total,
    "aria-valuemin": 0,
    "aria-valuenow": progress.readyCount,
    className: "generation-progress generation-progress-modal",
    "data-mode": progress.total > 1 ? "determinate" : "indeterminate",
    role: "progressbar",
    style: progressStyle(progress, state.pulse)
  };
}

function progressStyle(progress: ProgressState, pulse: number) {
  return {
    "--progress-shift": `${progressShift(pulse)}%`,
    "--progress-value": `${progressPercent(progress)}%`
  } as CSSProperties;
}

function progressPercent(progress: ProgressState) {
  if (progress.status === "READY") return 100;
  return Math.round((progress.readyCount / Math.max(1, progress.total)) * 100);
}

function initialProgress(total: number) {
  return { readyCount: 0, status: "GENERATING", total };
}

function initialProgressView(total: number) {
  return { progress: initialProgress(total), pulse: 0 };
}

function nextPulse(state: ProgressViewState) {
  return { ...state, pulse: state.pulse + 1 };
}

function progressShift(pulse: number) {
  return (pulse % 7) * 55 - 120;
}

function nextClipNumber(progress: ProgressState) {
  return Math.min(progress.total, progress.readyCount + 1);
}

function readyText(total: number) {
  return total > 1 ? "All clips are ready." : "Clip is ready.";
}
