import type { PhotoLibraryAsset } from "../types";

export async function fetchProjectPhotos(projectId: string) {
  const response = await fetch(`/api/projects/${projectId}/photos`, { cache: "no-store" });
  if (!response.ok) throw new Error("Photos could not be loaded.");
  const data = await response.json() as { assets?: PhotoLibraryAsset[] };
  return Array.isArray(data.assets) ? data.assets : [];
}

export async function uploadProjectPhoto(projectId: string, file: File) {
  const data = await requestUpload(projectId, file);
  const uploaded = await fetch(data.uploadUrl, { method: "PUT", body: file });
  if (!uploaded.ok) throw new Error("Photo upload failed.");
  return data.assetId;
}

async function requestUpload(projectId: string, file: File) {
  const response = await fetch("/api/assets/upload-url", requestOptions(projectId, file));
  if (!response.ok) throw new Error("Upload URL could not be created.");
  return response.json() as Promise<{ assetId: string; uploadUrl: string }>;
}

function requestOptions(projectId: string, file: File) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(uploadBody(projectId, file))
  };
}

function uploadBody(projectId: string, file: File) {
  return {
    fileName: file.name,
    mimeType: file.type || "image/png",
    projectId,
    type: "IMAGE"
  };
}
