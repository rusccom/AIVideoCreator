"use client";

import { Download } from "lucide-react";
import { useExportDownload, type ExportDownloadStatus } from "../hooks/use-export-download";

type DownloadClipButtonProps = {
  hasReadyScenes: boolean;
  projectId: string;
  projectTitle: string;
};

export function DownloadClipButton(props: DownloadClipButtonProps) {
  const { error, start, status } = useExportDownload(props.projectId, props.projectTitle);
  const busy = isBusy(status);
  return (
    <div className="download-clip">
      <button
        className="button button-quiet"
        disabled={!props.hasReadyScenes || busy}
        onClick={start}
        title={tooltip(props.hasReadyScenes)}
        type="button"
      >
        {busy ? <span className="download-clip-spinner" aria-hidden /> : <Download size={16} />}
        {label(status)}
      </button>
      {error ? <span className="download-clip-error">{error}</span> : null}
    </div>
  );
}

function isBusy(status: ExportDownloadStatus) {
  return status === "creating" || status === "processing" || status === "ready";
}

function tooltip(hasReadyScenes: boolean) {
  return hasReadyScenes ? "Download timeline as one file" : "Generate clips first";
}

function label(status: ExportDownloadStatus) {
  if (status === "creating") return "Preparing...";
  if (status === "processing") return "Rendering...";
  if (status === "ready") return "Downloading...";
  return "Download clip";
}
