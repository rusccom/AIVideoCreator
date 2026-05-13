"use client";

import { ImagePlus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { PhotoLibraryUploadButton } from "./PhotoLibraryUploadButton";

type PhotoLibraryToolbarProps = {
  canDelete: boolean;
  canGenerate: boolean;
  count: number;
  deleting: boolean;
  onDelete: () => void;
  loading: boolean;
  onGenerate: () => void;
  onRefresh: () => void;
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
};

export function PhotoLibraryToolbar(props: PhotoLibraryToolbarProps) {
  return (
    <div className="photo-library-toolbar">
      <span className="badge"><ImagePlus size={14} /> {props.count}</span>
      <PhotoLibraryUploadButton onUpload={props.onUpload} uploading={props.uploading} />
      <button className="button button-secondary" disabled={!props.canGenerate} onClick={props.onGenerate} type="button">
        <Sparkles size={16} /> Generate
      </button>
      <button
        className="button button-danger"
        disabled={!props.canDelete || props.deleting}
        onClick={props.onDelete}
        type="button"
      >
        <Trash2 size={16} /> Delete
      </button>
      <button className="button button-quiet" disabled={props.loading} onClick={props.onRefresh} type="button">
        <RefreshCw size={16} /> Refresh
      </button>
    </div>
  );
}
