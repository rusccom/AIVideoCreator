"use client";

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import {
  repairCreatorSequencePrompt,
  retryCreatorSequence,
  updateCreatorSequencePrompt
} from "./ai-creator-sequence-actions";

type RecoveryProps = {
  sequenceId?: string;
};

type FailedScene = {
  id: string;
  prompt: string;
};

type ProgressViewState = {
  progress: {
    failedScene?: FailedScene | null;
    readyCount: number;
    status: string;
    total: number;
  };
  pulse: number;
};

type ProgressStatus = {
  restart: () => void;
  setState: Dispatch<SetStateAction<ProgressViewState>>;
  state: ProgressViewState;
};

type ActionState = {
  error: string;
  status: "idle" | "retrying";
};

export type AiCreatorProgressRecovery = ReturnType<typeof useAiCreatorProgressRecovery>;

export function useAiCreatorProgressRecovery(props: RecoveryProps, progressStatus: ProgressStatus) {
  const [action, setAction] = useState<ActionState>(idleAction());
  const [editing, setEditing] = useState(false);
  return {
    action,
    editing,
    repairPrompt: (prompt: string) => repairPrompt(props, prompt),
    retry: () => retryFailedClip(props, progressStatus, setAction),
    savePrompt: (prompt: string) => savePrompt(props, progressStatus, setEditing, prompt),
    setEditing
  };
}

async function retryFailedClip(
  props: RecoveryProps,
  progressStatus: ProgressStatus,
  setAction: Dispatch<SetStateAction<ActionState>>
) {
  if (!props.sequenceId || !progressStatus.state.progress.failedScene) return;
  setAction({ error: "", status: "retrying" });
  try {
    await retryCreatorSequence(props.sequenceId);
    progressStatus.setState(retryStartedProgress);
    progressStatus.restart();
    setAction(idleAction());
  } catch (error) {
    setAction(failedAction(error));
  }
}

async function savePrompt(
  props: RecoveryProps,
  progressStatus: ProgressStatus,
  setEditing: (editing: boolean) => void,
  prompt: string
) {
  if (!props.sequenceId) return;
  const result = await updateCreatorSequencePrompt(props.sequenceId, prompt);
  progressStatus.setState((state) => withFailedPrompt(state, result.scene.userPrompt));
  setEditing(false);
}

async function repairPrompt(props: RecoveryProps, prompt: string) {
  if (!props.sequenceId) return prompt;
  const result = await repairCreatorSequencePrompt(props.sequenceId, prompt);
  return result.prompt;
}

function idleAction(): ActionState {
  return { error: "", status: "idle" };
}

function failedAction(error: unknown): ActionState {
  return { error: errorMessage(error), status: "idle" };
}

function retryStartedProgress(state: ProgressViewState) {
  return { ...state, progress: { ...state.progress, failedScene: null, status: "GENERATING" } };
}

function withFailedPrompt(state: ProgressViewState, prompt: string) {
  const failedScene = state.progress.failedScene;
  return failedScene ? { ...state, progress: { ...state.progress, failedScene: { ...failedScene, prompt } } } : state;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Retry could not start.";
}
