"use client";

import { useState } from "react";
import { PhotoLibraryModal } from "@/features/photo-library/components/PhotoLibraryModal";
import type { EditorAsset, EditorImageModel } from "../types";
import { ResolvedAssetImage } from "./ResolvedAssetImage";

type ScenePhotoSelectorProps = {
  assets: EditorAsset[];
  imageModels: EditorImageModel[];
  onChange: (assetId: string) => void;
  projectAspectRatio: string;
  projectId: string;
  selectedAssetId: string;
};

export function ScenePhotoSelector(props: ScenePhotoSelectorProps) {
  const [open, setOpen] = useState(false);
  const [asset, setAsset] = useState(() => selectedAsset(props.assets, props.selectedAssetId));
  const previewAsset = asset ?? selectedAsset(props.assets, props.selectedAssetId);

  return (
    <div className="scene-photo-selector">
      <button
        aria-label="Choose start frame photo"
        className="scene-photo-preview"
        onClick={() => setOpen(true)}
        type="button"
      >
        {previewAsset ? (
          <ResolvedAssetImage
            alt={previewAsset.label}
            className="scene-photo-image"
            fallback="Choose photo"
            source={previewAsset.url}
          />
        ) : (
          <span className="scene-photo-empty">No photo selected</span>
        )}
      </button>
      {open ? (
        <PhotoLibraryModal
          assets={props.assets}
          imageModels={props.imageModels}
          initialSelectedAssetId={props.selectedAssetId}
          mode="select"
          onClose={() => setOpen(false)}
          onSelect={(nextAsset) => selectPhoto(nextAsset, setAsset, props.onChange, setOpen)}
          projectAspectRatio={props.projectAspectRatio}
          projectId={props.projectId}
        />
      ) : null}
    </div>
  );
}

function selectedAsset(assets: EditorAsset[], assetId: string) {
  return assets.find((asset) => asset.id === assetId);
}

function selectPhoto(
  asset: EditorAsset,
  setAsset: (asset: EditorAsset) => void,
  onChange: (assetId: string) => void,
  setOpen: (open: boolean) => void
) {
  setAsset(asset);
  onChange(asset.id);
  setOpen(false);
}
