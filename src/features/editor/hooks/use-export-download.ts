"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  const sourceRef = useRef<EventSource | null>(null);

  const stopSubscription = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
  }, []);

  useEffect(() => () => stopSubscription(), [stopSubscription]);

  const handleReady = useCallback((url: string) => {
    stopSubscription();
    triggerDownload(url, `${projectTitle || "export"}.mp4`);
    setStatus("ready");
    window.setTimeout(() => setStatus("idle"), 2000);
  }, [projectTitle, stopSubscription]);

  const handleFailed = useCallback((message: string) => {
    stopSubscription();
    setError(message);
    setStatus("error");
  }, [stopSubscription]);

  const refresh = useCallback(async (jobId: string) => {
    const job = await fetchExportJob(jobId);
    if (job.status === "READY" && job.url) handleReady(job.url);
    else if (job.status === "FAILED") handleFailed(job.error ?? "Export failed");
  }, [handleFailed, handleReady]);

  const start = useCallback(async () => {
    stopSubscription();
    setError(undefined);
    setStatus("creating");
    const created = await createExportJob(projectId);
    if (!created.ok) {
      setError(created.error);
      setStatus("error");
      return;
    }
    setStatus("processing");
    sourceRef.current = subscribeExportEvents(projectId, created.jobId, refresh);
    void refresh(created.jobId);
  }, [projectId, refresh, stopSubscription]);

  return { error, start, status };
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
  const source = new EventSource(`/api/projects/${projectId}/events`);
  const listener = (event: Event) => {
    if (eventJobId(event) === jobId) refresh(jobId);
  };
  source.addEventListener("export.ready", listener);
  source.addEventListener("export.failed", listener);
  source.onerror = () => undefined;
  return source;
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
