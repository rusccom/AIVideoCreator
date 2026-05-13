"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { usePhotoLibrary } from "../hooks/use-photo-library";
import type { PhotoLibraryAsset, PhotoLibraryImageModel, PhotoLibraryMode } from "../types";
import { PhotoLibraryFooter } from "./PhotoLibraryFooter";
import { PhotoGenerationModal } from "./PhotoGenerationModal";
import { PhotoLibraryGrid } from "./PhotoLibraryGrid";
import { PhotoLibraryToolbar } from "./PhotoLibraryToolbar";

type PhotoLibraryModalProps = {
  assets?: PhotoLibraryAsset[];
  imageModels: PhotoLibraryImageModel[];
  initialSelectedAssetId?: string;
  mode: PhotoLibraryMode;
  onChanged?: () => void;
  onClose: () => void;
  onSelect?: (asset: PhotoLibraryAsset) => void;
  projectAspectRatio: string;
  projectId: string;
};

export function PhotoLibraryModal(props: PhotoLibraryModalProps) {
  const library = usePhotoLibrary({ initialAssets: props.assets, projectId: props.projectId });
  const [selectedId, setSelectedId] = useState(props.initialSelectedAssetId);
  const [showGeneration, setShowGeneration] = useState(false);
  const selectedAsset = library.assets.find((asset) => asset.id === selectedId);

  async function upload(file: File) {
    const assetId = await library.upload(file);
    if (!assetId) return;
    setSelectedId(assetId);
    props.onChanged?.();
  }

  async function generated(assetId?: string) {
    setShowGeneration(false);
    await library.refresh();
    if (assetId) setSelectedId(assetId);
    props.onChanged?.();
  }

  function choose() {
    if (selectedAsset) props.onSelect?.(selectedAsset);
  }

  return (
    <div className="project-modal-backdrop" role="presentation">
      <div className="project-modal photo-library-modal">
        <div className="project-modal-header">
          <div>
            <h2>{props.mode === "select" ? "Choose photo" : "Project photos"}</h2>
            <p>Use an existing photo, upload from your computer, or generate a new one.</p>
          </div>
          <button className="project-modal-close" onClick={props.onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <PhotoLibraryToolbar
          canGenerate={props.imageModels.length > 0}
          count={library.assets.length}
          loading={library.loading}
          onGenerate={() => setShowGeneration(true)}
          onRefresh={library.refresh}
          onUpload={upload}
          uploading={library.uploading}
        />
        {library.error ? <div className="form-error">{library.error}</div> : null}
        <PhotoLibraryGrid
          assets={library.assets}
          loading={library.loading}
          onSelect={(asset) => setSelectedId(asset.id)}
          selectedAssetId={selectedId}
        />
        <PhotoLibraryFooter
          canChoose={Boolean(selectedAsset)}
          mode={props.mode}
          onChoose={choose}
          onClose={props.onClose}
        />
      </div>
      {showGeneration ? (
        <PhotoGenerationModal
          models={props.imageModels}
          onClose={() => setShowGeneration(false)}
          onGenerated={generated}
          projectAspectRatio={props.projectAspectRatio}
          projectId={props.projectId}
        />
      ) : null}
    </div>
  );
}
