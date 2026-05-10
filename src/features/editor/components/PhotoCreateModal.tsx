"use client";

import type { EditorImageModel } from "../types";
import { PhotoGenerateForm } from "./PhotoGenerateForm";
import { PhotoUploadForm } from "./PhotoUploadForm";

type PhotoCreateModalProps = {
  imageModels: EditorImageModel[];
  onClose: () => void;
  onReady: () => void;
  projectAspectRatio: string;
  projectId: string;
};

export function PhotoCreateModal(props: PhotoCreateModalProps) {
  return (
    <div className="project-modal-backdrop" role="presentation">
      <div className="project-modal photo-modal">
        <div className="project-modal-header">
          <div>
            <h2>Add photo</h2>
            <p>Generate a new image or upload an existing project photo.</p>
          </div>
          <button className="project-modal-close" onClick={props.onClose} type="button">x</button>
        </div>
        <div className="photo-modal-grid">
          <PhotoGenerateForm
            models={props.imageModels}
            onGenerated={props.onReady}
            projectAspectRatio={props.projectAspectRatio}
            projectId={props.projectId}
          />
          <PhotoUploadForm onUploaded={props.onReady} projectId={props.projectId} />
        </div>
      </div>
    </div>
  );
}
