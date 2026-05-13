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

  async function change(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await props.onUpload(file);
  }

  return (
    <>
      <input
        accept="image/*"
        className="sr-only"
        disabled={props.disabled || props.uploading}
        onChange={change}
        ref={inputRef}
        type="file"
      />
      <button
        className="button button-secondary"
        disabled={props.disabled || props.uploading}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        <Upload size={16} /> {props.uploading ? "Uploading..." : "Upload"}
      </button>
    </>
  );
}
