const extensionByMime: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "video/mp4": "mp4"
};

export function buildStorageKey(input: {
  userId: string;
  projectId?: string;
  assetId: string;
  mimeType: string;
  type: string;
}) {
  const project = input.projectId ?? "library";
  const folder = folderByType(input.type);
  const extension = extensionByMime[input.mimeType] ?? "bin";
  return `users/${input.userId}/projects/${project}/${folder}/${input.assetId}.${extension}`;
}

function folderByType(type: string) {
  if (type === "VIDEO") return "videos";
  if (type === "FRAME") return "frames";
  if (type === "EXPORT") return "exports";
  if (type === "THUMBNAIL") return "thumbnails";
  return "images";
}
