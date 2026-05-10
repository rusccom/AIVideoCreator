"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ExportDownloadStatus = "idle" | "creating" | "processing" | "ready" | "error";

type ExportJobResponse = {
  job: {
    id: string;
    status: string;
    url?: string | null;
    errorJson?: { message?: string } | null;
  };
};

const POLL_INTERVAL_MS = 3000;

export function useExportDownload(projectId: string, projectTitle: string) {
  const [status, setStatus] = useState<ExportDownloadStatus>("idle");
  const [error, setError] = useState<string>();
  const intervalRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current === null) return;
    window.clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleReady = useCallback((url: string) => {
    stopPolling();
    triggerDownload(url, `${projectTitle || "export"}.mp4`);
    setStatus("ready");
    window.setTimeout(() => setStatus("idle"), 2000);
  }, [projectTitle, stopPolling]);

  const handleFailed = useCallback((message: string) => {
    stopPolling();
    setError(message);
    setStatus("error");
  }, [stopPolling]);

  const tick = useCallback(async (jobId: string) => {
    const polled = await pollExportJob(jobId);
    if (polled.status === "READY" && polled.url) handleReady(polled.url);
    else if (polled.status === "FAILED") handleFailed(polled.error ?? "Export failed");
  }, [handleFailed, handleReady]);

  const start = useCallback(async () => {
    stopPolling();
    setError(undefined);
    setStatus("creating");
    const created = await createExportJob(projectId);
    if (!created.ok) {
      setError(created.error);
      setStatus("error");
      return;
    }
    setStatus("processing");
    intervalRef.current = window.setInterval(() => void tick(created.jobId), POLL_INTERVAL_MS);
  }, [projectId, stopPolling, tick]);

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

async function pollExportJob(jobId: string) {
  const response = await fetch(`/api/exports/${jobId}`, { cache: "no-store" });
  if (!response.ok) return { status: "FAILED" as const, error: "Failed to poll", url: undefined };
  const data = await response.json() as ExportJobResponse;
  return {
    error: data.job.errorJson?.message,
    status: data.job.status,
    url: data.job.url ?? undefined
  };
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
