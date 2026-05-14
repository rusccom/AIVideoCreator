"use client";

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { subscribeProjectEvents } from "@/shared/client/project-events";

export type ExportDownloadStatus = "idle" | "creating" | "processing" | "ready" | "error";

type ExportJobResponse = {
  job: {
    id: string;
    status: string;
    url?: string | null;
    errorMessage?: string | null;
  };
};

export function useExportDownload(projectId: string, projectTitle: string) {
  const [status, setStatus] = useState<ExportDownloadStatus>("idle");
  const [error, setError] = useState<string>();
  const subscriptionRef = useRef<(() => void) | null>(null);
  const stopSubscription = useCallback(() => { subscriptionRef.current?.(); subscriptionRef.current = null; }, []);
  useEffect(() => () => stopSubscription(), [stopSubscription]);
  const handleReady = useCallback((url: string) => finishExport(url, projectTitle, stopSubscription, setStatus), [projectTitle, stopSubscription]);
  const handleFailed = useCallback((message: string) => failExport(message, stopSubscription, setError, setStatus), [stopSubscription]);
  const refresh = useCallback(async (jobId: string) => {
    const job = await fetchExportJob(jobId);
    if (job.status === "READY" && job.url) handleReady(job.url);
    else if (job.status === "FAILED") handleFailed(job.error ?? "Export failed");
  }, [handleFailed, handleReady]);
  const start = useCallback(() => startExport({ projectId, refresh, setError, setStatus, stopSubscription, subscriptionRef }), [projectId, refresh, stopSubscription]);
  return { error, start, status };
}

function finishExport(url: string, projectTitle: string, stop: () => void, setStatus: SetStatus) {
  stop();
  triggerDownload(url, `${projectTitle || "export"}.mp4`);
  setStatus("ready");
  window.setTimeout(() => setStatus("idle"), 2000);
}

function failExport(message: string, stop: () => void, setError: SetError, setStatus: SetStatus) {
  stop();
  setError(message);
  setStatus("error");
}

async function startExport(input: StartExportInput) {
  input.stopSubscription();
  input.setError(undefined);
  input.setStatus("creating");
  const created = await createExportJob(input.projectId);
  if (!created.ok) return failStart(created.error, input.setError, input.setStatus);
  input.setStatus("processing");
  input.subscriptionRef.current = subscribeExportEvents(input.projectId, created.jobId, input.refresh);
  void input.refresh(created.jobId);
}

function failStart(error: string, setError: SetError, setStatus: SetStatus) {
  setError(error);
  setStatus("error");
}

async function createExportJob(projectId: string) {
  const response = await fetch("/api/exports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId })
  });
  if (!response.ok) return { ok: false as const, error: await readError(response) };
  const data = await response.json() as { job: { id: string } };
  return { ok: true as const, jobId: data.job.id };
}

function subscribeExportEvents(projectId: string, jobId: string, refresh: (jobId: string) => void) {
  const listener = (event: Event) => {
    if (eventJobId(event) === jobId) refresh(jobId);
  };
  return subscribeProjectEvents(projectId, ["export.ready", "export.failed"], listener as (event: MessageEvent<string>) => void);
}

async function fetchExportJob(jobId: string) {
  const response = await fetch(`/api/exports/${jobId}`, { cache: "no-store" });
  if (!response.ok) return { status: "FAILED" as const, error: "Export refresh failed", url: undefined };
  const data = await response.json() as ExportJobResponse;
  return {
    error: data.job.errorMessage ?? undefined,
    status: data.job.status,
    url: data.job.url ?? undefined
  };
}

function eventJobId(event: Event) {
  try {
    const payload = JSON.parse((event as MessageEvent<string>).data) as { jobId?: string };
    return payload.jobId;
  } catch {
    return undefined;
  }
}

function triggerDownload(url: string, fileName: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function readError(response: Response) {
  try {
    const data = await response.json() as { error?: string };
    return data.error ?? "Export request failed";
  } catch {
    return "Export request failed";
  }
}

type SetError = (value: string | undefined) => void;
type SetStatus = (value: ExportDownloadStatus) => void;
type StartExportInput = {
  projectId: string;
  refresh: (jobId: string) => void;
  setError: SetError;
  setStatus: SetStatus;
  stopSubscription: () => void;
  subscriptionRef: MutableRefObject<(() => void) | null>;
};
