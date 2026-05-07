"use client";

import { Upload } from "lucide-react";
import { useState, type ChangeEvent, type FormEvent } from "react";

type PhotoUploadFormProps = {
  onUploaded: () => void;
  projectId: string;
};

export function PhotoUploadForm(props: PhotoUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return setError("Choose an image first.");
    setUploading(true);
    setError("");
    const result = await uploadPhoto(props.projectId, file);
    setUploading(false);
    if (!result.ok) return setError(result.error ?? "Upload failed.");
    setFile(null);
    props.onUploaded();
  }

  return (
    <form className="photo-tool-form" onSubmit={submit}>
      <label>
        Upload image
        <input accept="image/*" onChange={(event) => setSelectedFile(event, setFile)} type="file" />
      </label>
      {error ? <div className="form-error">{error}</div> : null}
      <button className="button button-secondary" disabled={uploading} type="submit">
        <Upload size={16} /> {uploading ? "Uploading..." : "Add photo"}
      </button>
    </form>
  );
}

async function uploadPhoto(projectId: string, file: File) {
  try {
    const data = await requestUpload(projectId, file);
    const uploaded = await fetch(data.uploadUrl, { method: "PUT", body: file });
    return uploaded.ok ? { ok: true } : { ok: false, error: "Upload failed." };
  } catch {
    return { ok: false, error: "Upload could not start." };
  }
}

async function requestUpload(projectId: string, file: File) {
  const response = await fetch("/api/assets/upload-url", requestOptions(projectId, file));
  if (!response.ok) throw new Error("Upload URL failed");
  return response.json() as Promise<{ assetId: string; uploadUrl: string }>;
}

function requestOptions(projectId: string, file: File) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, fileName: file.name, mimeType: file.type || "image/png", type: "IMAGE" })
  };
}

function setSelectedFile(event: ChangeEvent<HTMLInputElement>, setFile: (file: File | null) => void) {
  setFile(event.target.files?.[0] ?? null);
}
