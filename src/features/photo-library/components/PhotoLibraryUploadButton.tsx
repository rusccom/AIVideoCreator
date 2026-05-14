"use client";

import { useRef, type ChangeEvent } from "react";
import { Upload } from "lucide-react";

type PhotoLibraryUploadButtonProps = {
  disabled?: boolean;
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
};

export function PhotoLibraryUploadButton(props: PhotoLibraryUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input accept="image/*" className="sr-only" disabled={uploadDisabled(props)} onChange={changeUpload(props)} ref={inputRef} type="file" />
      <button className="button button-secondary" disabled={uploadDisabled(props)} onClick={() => inputRef.current?.click()} type="button"><Upload size={16} /> {props.uploading ? "Uploading..." : "Upload"}</button>
    </>
  );
}

function changeUpload(props: PhotoLibraryUploadButtonProps) {
  return async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await props.onUpload(file);
  };
}

function uploadDisabled(props: PhotoLibraryUploadButtonProps) {
  return props.disabled || props.uploading;
}
