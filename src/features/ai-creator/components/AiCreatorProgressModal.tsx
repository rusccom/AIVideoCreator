"use client";

import { Pencil, RotateCcw, X } from "lucide-react";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { subscribeProjectEvents } from "@/shared/client/project-events";
import { useAiCreatorProgressRecovery, type AiCreatorProgressRecovery } from "../use-ai-creator-progress-recovery";
import { AiCreatorProgressPulse } from "./AiCreatorProgressPulse";
import { AiCreatorPromptEditModal } from "./AiCreatorPromptEditModal";

type AiCreatorProgressModalProps = {
  jobId: string;
  onDone: () => void;
  projectId?: string;
  sequenceId?: string;
  total: number;
};

type ProgressState = {
  failedScene?: FailedScene | null;
  readyCount: number;
  status: string;
  total: number;
};

type FailedScene = {
  id: string;
  prompt: string;
};

type ProgressTarget = {
  jobId: string;
  projectId?: string;
  sequenceId?: string;
  total: number;
};

type ProgressViewState = {
  progress: ProgressState;
  pulse: number;
};

export function AiCreatorProgressModal(props: AiCreatorProgressModalProps) {
  const progressStatus = useProgressStatus(props);
  const recovery = useAiCreatorProgressRecovery(props, progressStatus);
  const state = progressStatus.state;
  const progress = state.progress;
  return (
    <div aria-modal="true" className="project-modal-backdrop" role="dialog">
      <div className="project-modal ai-creator-progress-modal">
        {progressLayout(props, state, progress, recovery)}
        {editModal(props, progress, recovery)}
      </div>
    </div>
  );
}

function progressLayout(
  props: AiCreatorProgressModalProps,
  state: ProgressViewState,
  progress: ProgressState,
  recovery: AiCreatorProgressRecovery
) {
  return <div className="ai-creator-progress-layout"><AiCreatorProgressPulse pulse={state.pulse} readyCount={progress.readyCount} status={progress.status} total={progress.total} />{progressContent(props, state, progress, recovery)}</div>;
}

function progressContent(
  props: AiCreatorProgressModalProps,
  state: ProgressViewState,
  progress: ProgressState,
  recovery: AiCreatorProgressRecovery
) {
  return <div className="ai-creator-progress-content">{progressHeading(progress)}<div aria-label="Clip generation progress" {...progressBarProps(state)}><span /></div>{progressActions(props, progress, recovery)}{recovery.action.error ? <div className="form-error ai-creator-progress-error">{recovery.action.error}</div> : null}</div>;
}

function progressHeading(progress: ProgressState) {
  return <div><h2>{progressTitle(progress)}</h2><p>{progressText(progress)}</p></div>;
}

function useProgressStatus(props: AiCreatorProgressModalProps) {
  const [state, setState] = useState<ProgressViewState>(() => initialProgressView(props.total));
  const [refreshVersion, setRefreshVersion] = useState(0);
  const restart = () => setRefreshVersion((version) => version + 1);
  useEffect(
    () => runProgressSubscription(props, setState),
    [props.jobId, props.onDone, props.projectId, props.sequenceId, props.total, refreshVersion]
  );
  return { restart, setState, state };
}

function runProgressSubscription(
  props: AiCreatorProgressModalProps,
  setState: Dispatch<SetStateAction<ProgressViewState>>
) {
  let active = true;
  let unsubscribe: (() => void) | undefined;
  const target = progressTarget(props);
  const refresh = async () => {
    setState(nextPulse);
    const progress = await safeFetchProgress(target);
    if (!active) return;
    setState((state) => applyProgress(state, progress));
    if (progress?.status === "READY") props.onDone();
    if (progress?.status === "READY" || isStoppedProgress(progress)) unsubscribe?.();
  };
  void refresh();
  unsubscribe = subscribeProgressEvents(target, refresh);
  return () => {
    active = false;
    unsubscribe?.();
  };
}

function subscribeProgressEvents(target: ProgressTarget, refresh: () => void) {
  if (!target.projectId) return undefined;
  return subscribeProjectEvents(target.projectId, progressEventTypes(), refresh);
}

function applyProgress(state: ProgressViewState, progress: ProgressState | null) {
  return progress ? { ...state, progress } : state;
}

async function safeFetchProgress(target: ProgressTarget) {
  try {
    return target.sequenceId ? await fetchSequence(target.sequenceId, target.total) : await fetchJob(target.jobId, target.total);
  } catch {
    return null;
  }
}

async function fetchJob(jobId: string, total: number) {
  const response = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Job refresh failed");
  const job = await response.json() as { status: string };
  return { failedScene: null, readyCount: job.status === "READY" ? total : 0, status: job.status, total };
}

async function fetchSequence(sequenceId: string, total: number) {
  const response = await fetch(`/api/ai-creator/sequences/${sequenceId}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Sequence refresh failed");
  return normalizeSequenceProgress(await response.json() as ProgressState, total);
}

function normalizeSequenceProgress(progress: ProgressState, total: number) {
  return { ...progress, total: progress.total > 0 ? progress.total : total };
}

function isStoppedStatus(status: string) {
  return status === "FAILED" || status === "CANCELED";
}

function isStoppedProgress(progress: ProgressState | null) {
  return Boolean(progress && isStoppedStatus(progress.status));
}

function progressEventTypes() {
  return ["scene.ready", "scene.failed", "images.ready", "images.failed"];
}

function progressActions(
  props: AiCreatorProgressModalProps,
  progress: ProgressState,
  recovery: AiCreatorProgressRecovery
) {
  if (!isStoppedStatus(progress.status)) return null;
  return (
    <div className="ai-creator-progress-actions">
      <button className="button button-primary" disabled={retryDisabled(props, progress, recovery)} onClick={recovery.retry} type="button">
        <RotateCcw size={16} /> {retryText(recovery.action.status)}
      </button>
      <button className="button button-secondary" disabled={!progress.failedScene} onClick={() => recovery.setEditing(true)} type="button">
        <Pencil size={16} /> Изменить запрос
      </button>
      <button className="button button-secondary" onClick={props.onDone} type="button">
        <X size={16} /> Close
      </button>
    </div>
  );
}

function editModal(
  props: AiCreatorProgressModalProps,
  progress: ProgressState,
  recovery: AiCreatorProgressRecovery
) {
  if (!recovery.editing || !props.sequenceId || !progress.failedScene) return null;
  return (
    <AiCreatorPromptEditModal
      initialPrompt={progress.failedScene.prompt}
      key={progress.failedScene.id}
      onCancel={() => recovery.setEditing(false)}
      onRepair={recovery.repairPrompt}
      onSave={recovery.savePrompt}
    />
  );
}

function progressTarget(props: AiCreatorProgressModalProps) {
  return { jobId: props.jobId, projectId: props.projectId, sequenceId: props.sequenceId, total: props.total };
}

function progressText(progress: ProgressState) {
  if (progress.status === "READY") return readyText(progress.total);
  if (isStoppedStatus(progress.status)) return stoppedText(progress);
  if (progress.total > 1) return `Generating clips ${nextClipNumber(progress)} of ${progress.total}.`;
  return "Please wait while the clip is being created.";
}

function progressTitle(progress: ProgressState) {
  if (isStoppedStatus(progress.status)) return "Generation stopped";
  return progress.total > 1 ? "Generating clips" : "Generating clip";
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

function initialProgress(total: number): ProgressState {
  return { failedScene: null, readyCount: 0, status: "GENERATING", total };
}

function initialProgressView(total: number): ProgressViewState {
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

function stoppedText(progress: ProgressState) {
  if (progress.readyCount > 0) return `${progress.readyCount} of ${progress.total} clips were saved.`;
  return "No clips were saved.";
}

function retryDisabled(props: AiCreatorProgressModalProps, progress: ProgressState, recovery: AiCreatorProgressRecovery) {
  return !props.sequenceId || !progress.failedScene || recovery.action.status === "retrying";
}

function retryText(status: AiCreatorProgressRecovery["action"]["status"]) {
  return status === "retrying" ? "Запуск..." : "Попробовать ещё раз";
}
