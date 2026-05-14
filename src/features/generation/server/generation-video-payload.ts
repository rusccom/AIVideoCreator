import { Prisma } from "@prisma/client";

export function videoPayload(data: unknown): ReadyVideoPayload | null {
  const source = record(data);
  const video = record(source.video) as VideoPayload;
  return typeof video.url === "string" ? { ...video, url: video.url } : null;
}

export function videoDuration(video: VideoPayload) {
  return Math.max(1, Math.round(Number(video.duration ?? 6)));
}

export function videoAssetData(job: VideoAssetJob, video: ReadyVideoPayload) {
  return {
    durationSeconds: videoDuration(video),
    height: video.height,
    metadataJson: asJson(video),
    mimeType: video.content_type ?? "video/mp4",
    projectId: job.projectId,
    remoteUrl: video.url,
    sizeBytes: video.file_size,
    source: "FAL_GENERATION" as const,
    type: "VIDEO" as const,
    userId: job.userId,
    width: video.width
  };
}

function record(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

type VideoAssetJob = {
  projectId: string;
  userId: string;
};

export type VideoPayload = {
  content_type?: string;
  duration?: number;
  file_size?: number;
  height?: number;
  url?: string;
  width?: number;
};

export type ReadyVideoPayload = VideoPayload & {
  url: string;
};
