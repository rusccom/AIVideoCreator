import type { PhotoLibraryAsset } from "../types";

export async function fetchProjectPhotos(projectId: string) {
  const response = await fetch(`/api/projects/${projectId}/photos`, { cache: "no-store" });
  if (!response.ok) throw new Error("Photos could not be loaded.");
  const data = await response.json() as { assets?: PhotoLibraryAsset[] };
  return Array.isArray(data.assets) ? data.assets : [];
}

export async function uploadProjectPhoto(projectId: string, file: File) {
  const response = await fetch(`/api/projects/${projectId}/photos`, uploadOptions(file));
  if (!response.ok) throw new Error("Photo upload failed.");
  const data = await response.json() as { asset?: PhotoLibraryAsset };
  if (!data.asset) throw new Error("Photo upload failed.");
  return data.asset.id;
}

function uploadOptions(file: File) {
  return {
    method: "POST",
    body: uploadBody(file)
  };
}

function uploadBody(file: File) {
  const form = new FormData();
  form.set("file", file);
  return form;
}
