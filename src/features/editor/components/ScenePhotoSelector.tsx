"use client";

import { useState } from "react";
import type { EditorIntegrations } from "../editor-integrations";
import type { EditorAsset, EditorImageModel } from "../types";
import { ResolvedAssetImage } from "./ResolvedAssetImage";

type ScenePhotoSelectorProps = {
  assets: EditorAsset[];
  imageModels: EditorImageModel[];
  integrations: EditorIntegrations;
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
      {previewButton(previewAsset, setOpen)}
      {photoModal(props, open, setOpen, setAsset)}
    </div>
  );
}

function previewButton(asset: EditorAsset | undefined, setOpen: (open: boolean) => void) {
  return <button aria-label="Choose start frame photo" className="scene-photo-preview" onClick={() => setOpen(true)} type="button">{asset ? previewImage(asset) : <span className="scene-photo-empty">No photo selected</span>}</button>;
}

function previewImage(asset: EditorAsset) {
  return <ResolvedAssetImage alt={asset.label} className="scene-photo-image" fallback="Choose photo" source={asset.url} />;
}

function photoModal(
  props: ScenePhotoSelectorProps,
  open: boolean,
  setOpen: (open: boolean) => void,
  setAsset: (asset: EditorAsset) => void
) {
  if (!open) return null;
  const PhotoLibraryModal = props.integrations.PhotoLibraryModal;
  return <PhotoLibraryModal assets={props.assets} imageModels={props.imageModels} initialSelectedAssetId={props.selectedAssetId} mode="select" onClose={() => setOpen(false)} onSelect={(asset) => selectPhoto(asset, setAsset, props.onChange, setOpen)} projectAspectRatio={props.projectAspectRatio} projectId={props.projectId} />;
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
