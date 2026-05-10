"use client";

import { useEffect, useState } from "react";

type AiCreatorProgressModalProps = {
  jobId: string;
  onDone: () => void;
};

type JobState = {
  status: string;
};

export function AiCreatorProgressModal(props: AiCreatorProgressModalProps) {
  const status = useJobStatus(props);

  return (
    <div aria-modal="true" className="project-modal-backdrop" role="dialog">
      <div className="project-modal ai-creator-progress-modal">
        <div className="project-modal-header">
          <div>
            <h2>Generating clip</h2>
            <p>{progressText(status)}</p>
          </div>
        </div>
        <div aria-label="Clip generation progress" className="generation-progress generation-progress-modal" role="progressbar">
          <span />
        </div>
      </div>
    </div>
  );
}

function useJobStatus(props: AiCreatorProgressModalProps) {
  const [status, setStatus] = useState("GENERATING");
  useEffect(() => {
    let active = true;
    const refresh = () => refreshJobStatus(props.jobId, setStatus, props.onDone, () => active);
    void refresh();
    const timer = window.setInterval(refresh, 4000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [props.jobId, props.onDone]);
  return status;
}

async function refreshJobStatus(
  jobId: string,
  setStatus: (status: string) => void,
  onDone: () => void,
  isActive: () => boolean
) {
  const job = await safeFetchJob(jobId);
  if (!job || !isActive()) return;
  setStatus(job.status);
  if (isFinalStatus(job.status)) onDone();
}

async function safeFetchJob(jobId: string) {
  try {
    return await fetchJob(jobId);
  } catch {
    return null;
  }
}

async function fetchJob(jobId: string) {
  const response = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Job refresh failed");
  return response.json() as Promise<JobState>;
}

function isFinalStatus(status: string) {
  return status === "READY" || status === "FAILED" || status === "CANCELED";
}

function progressText(status: string) {
  if (status === "READY") return "Clip is ready.";
  if (status === "FAILED" || status === "CANCELED") return "Clip generation stopped.";
  return "Please wait while the clip is being created.";
}
