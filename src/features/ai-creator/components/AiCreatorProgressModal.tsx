"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

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

export function AiCreatorProgressModal(props: AiCreatorProgressModalProps) {
  const progress = useProgressStatus(props);

  return (
    <div aria-modal="true" className="project-modal-backdrop" role="dialog">
      <div className="project-modal ai-creator-progress-modal">
        <div className="project-modal-header">
          <div>
            <h2>{progressTitle(progress.total)}</h2>
            <p>{progressText(progress)}</p>
          </div>
        </div>
        <div aria-label="Clip generation progress" {...progressBarProps(progress)}>
          <span />
        </div>
      </div>
    </div>
  );
}

function useProgressStatus(props: AiCreatorProgressModalProps) {
  const [progress, setProgress] = useState(initialProgress(props.total));
  useEffect(() => {
    let active = true;
    const target = progressTarget(props);
    const refresh = () => refreshProgressStatus(target, setProgress, props.onDone, () => active);
    void refresh();
    const timer = window.setInterval(refresh, 4000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [props.jobId, props.onDone, props.sequenceId, props.total]);
  return progress;
}

async function refreshProgressStatus(
  target: ProgressTarget,
  setProgress: (progress: ProgressState) => void,
  onDone: () => void,
  isActive: () => boolean
) {
  const progress = await safeFetchProgress(target);
  if (!progress || !isActive()) return;
  setProgress(progress);
  if (isFinalStatus(progress.status)) onDone();
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

function progressBarProps(progress: ProgressState) {
  return {
    "aria-valuemax": progress.total,
    "aria-valuemin": 0,
    "aria-valuenow": progress.readyCount,
    className: "generation-progress generation-progress-modal",
    "data-mode": progress.total > 1 ? "determinate" : "indeterminate",
    role: "progressbar",
    style: progressStyle(progress)
  };
}

function progressStyle(progress: ProgressState) {
  return { "--progress-value": `${progressPercent(progress)}%` } as CSSProperties;
}

function progressPercent(progress: ProgressState) {
  if (progress.status === "READY") return 100;
  return Math.round((progress.readyCount / Math.max(1, progress.total)) * 100);
}

function initialProgress(total: number) {
  return { readyCount: 0, status: "GENERATING", total };
}

function nextClipNumber(progress: ProgressState) {
  return Math.min(progress.total, progress.readyCount + 1);
}

function readyText(total: number) {
  return total > 1 ? "All clips are ready." : "Clip is ready.";
}
