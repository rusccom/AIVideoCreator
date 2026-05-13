"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { X } from "lucide-react";
import { usePhotoLibrary } from "../hooks/use-photo-library";
import type { PhotoLibraryAsset, PhotoLibraryImageModel, PhotoLibraryMode } from "../types";
import { PhotoLibraryContextMenu } from "./PhotoLibraryContextMenu";
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

type PhotoMenuState = {
  asset: PhotoLibraryAsset;
  x: number;
  y: number;
};

export function PhotoLibraryModal(props: PhotoLibraryModalProps) {
  const library = usePhotoLibrary({ initialAssets: props.assets, projectId: props.projectId });
  const [selectedId, setSelectedId] = useState(props.initialSelectedAssetId);
  const [menu, setMenu] = useState<PhotoMenuState | null>(null);
  const [showGeneration, setShowGeneration] = useState(false);
  const selectedAsset = library.assets.find((asset) => asset.id === selectedId);
  const canDelete = props.mode === "manage";

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const timer = window.setTimeout(() => addMenuListeners(close));
    return () => {
      window.clearTimeout(timer);
      removeMenuListeners(close);
    };
  }, [menu]);

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

  async function deleteSelected() {
    if (!selectedAsset || !canDelete) return;
    await deleteAsset(selectedAsset.id);
  }

  async function deleteAsset(assetId: string) {
    setMenu(null);
    clearSelectedAsset(selectedId, setSelectedId, assetId);
    if (await library.deleteAsset(assetId)) props.onChanged?.();
  }

  function openMenu(asset: PhotoLibraryAsset, event: MouseEvent) {
    if (!canDelete) return;
    event.preventDefault();
    setSelectedId(asset.id);
    setMenu(menuState(asset, event));
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
          canDelete={canDelete && Boolean(selectedAsset)}
          canGenerate={props.imageModels.length > 0}
          count={library.assets.length}
          deleting={Boolean(library.deletingId)}
          onDelete={deleteSelected}
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
          onContextMenu={openMenu}
          onSelect={(asset) => setSelectedId(asset.id)}
          selectedAssetId={selectedId}
        />
        {menu ? (
          <PhotoLibraryContextMenu
            asset={menu.asset}
            deleting={library.deletingId === menu.asset.id}
            onDelete={deleteAsset}
            x={menu.x}
            y={menu.y}
          />
        ) : null}
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

function clearSelectedAsset(
  current: string | undefined,
  setSelectedId: (value?: string) => void,
  assetId: string
) {
  if (current === assetId) setSelectedId(undefined);
}

function menuState(asset: PhotoLibraryAsset, event: MouseEvent) {
  return {
    asset,
    x: clamp(event.clientX, window.innerWidth - 232),
    y: clamp(event.clientY, window.innerHeight - 68)
  };
}

function clamp(value: number, max: number) {
  return Math.max(12, Math.min(value, max));
}

function removeMenuListeners(close: () => void) {
  window.removeEventListener("click", close);
  window.removeEventListener("scroll", close, true);
}

function addMenuListeners(close: () => void) {
  window.addEventListener("click", close);
  window.addEventListener("scroll", close, true);
}
