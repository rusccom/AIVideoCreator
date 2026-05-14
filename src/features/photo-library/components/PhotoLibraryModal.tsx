"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { X } from "lucide-react";
import { usePhotoLibrary } from "../hooks/use-photo-library";
import type { PhotoLibraryAsset, PhotoLibraryImageModel, PhotoLibraryMode } from "../types";
import { PhotoLibraryContextMenu } from "./PhotoLibraryContextMenu";
import { PhotoLibraryFooter } from "./PhotoLibraryFooter";
import { PhotoLibraryGrid } from "./PhotoLibraryGrid";
import { PhotoLibraryToolbar } from "./PhotoLibraryToolbar";

const PhotoGenerationModal = dynamic(() => import("./PhotoGenerationModal").then((mod) => mod.PhotoGenerationModal));

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
  const state = usePhotoLibraryState(props);
  return (
    <div className="project-modal-backdrop" role="presentation">
      <div className="project-modal photo-library-modal">
        {modalHeader(props)}
        {modalToolbar(props, state)}
        {state.library.error ? <div className="form-error">{state.library.error}</div> : null}
        {modalGrid(state)}
        {modalMenu(state)}
        {modalFooter(props, state)}
      </div>
      {generationModal(props, state)}
    </div>
  );
}

function usePhotoLibraryState(props: PhotoLibraryModalProps) {
  const library = usePhotoLibrary({ initialAssets: props.assets, projectId: props.projectId });
  const [selectedId, setSelectedId] = useState(props.initialSelectedAssetId);
  const [menu, setMenu] = useState<PhotoMenuState | null>(null);
  const [showGeneration, setShowGeneration] = useState(false);
  const selectedAsset = library.assets.find((asset) => asset.id === selectedId);
  const closeMenu = useCallback(() => setMenu(null), []);

  useEffect(() => {
    if (!menu) return;
    const timer = window.setTimeout(() => addMenuListeners(closeMenu));
    return () => {
      window.clearTimeout(timer);
      removeMenuListeners(closeMenu);
    };
  }, [closeMenu, menu]);
  const deleteAsset = async (assetId: string) => deletePhotoAsset({ assetId, library, props, selectedId, setMenu, setSelectedId });
  return { choose: () => selectedAsset && props.onSelect?.(selectedAsset), deleteAsset, deleteSelected: () => selectedAsset && deleteAsset(selectedAsset.id), generated: (assetId?: string) => generatedPhoto({ assetId, library, props, setSelectedId, setShowGeneration }), library, menu, openMenu: (asset: PhotoLibraryAsset, event: MouseEvent) => openPhotoMenu(asset, event, setMenu, setSelectedId), selectedAsset, selectedId, setSelectedId, setShowGeneration, showGeneration, upload: (file: File) => uploadPhoto(file, library, props, setSelectedId) };
}

type PhotoLibraryState = ReturnType<typeof usePhotoLibraryState>;

function modalHeader(props: PhotoLibraryModalProps) {
  return (
    <div className="project-modal-header">
      <div>
        <h2>{props.mode === "select" ? "Choose photo" : "Project photos"}</h2>
        <p>Use an existing photo, upload from your computer, or generate a new one.</p>
      </div>
      <button className="project-modal-close" onClick={props.onClose} type="button"><X size={18} /></button>
    </div>
  );
}

function modalToolbar(props: PhotoLibraryModalProps, state: PhotoLibraryState) {
  return <PhotoLibraryToolbar canDelete={Boolean(state.selectedAsset)} canGenerate={props.imageModels.length > 0} count={state.library.assets.length} deleting={Boolean(state.library.deletingId)} loading={state.library.loading} onDelete={state.deleteSelected} onGenerate={() => state.setShowGeneration(true)} onRefresh={state.library.refresh} onUpload={state.upload} uploading={state.library.uploading} />;
}

function modalGrid(state: PhotoLibraryState) {
  return <PhotoLibraryGrid assets={state.library.assets} loading={state.library.loading} onContextMenu={state.openMenu} onSelect={(asset) => state.setSelectedId(asset.id)} selectedAssetId={state.selectedId} />;
}

function modalMenu(state: PhotoLibraryState) {
  if (!state.menu) return null;
  return <PhotoLibraryContextMenu asset={state.menu.asset} deleting={state.library.deletingId === state.menu.asset.id} onDelete={state.deleteAsset} x={state.menu.x} y={state.menu.y} />;
}

function modalFooter(props: PhotoLibraryModalProps, state: PhotoLibraryState) {
  return <PhotoLibraryFooter canChoose={Boolean(state.selectedAsset)} mode={props.mode} onChoose={state.choose} onClose={props.onClose} />;
}

function generationModal(props: PhotoLibraryModalProps, state: PhotoLibraryState) {
  if (!state.showGeneration) return null;
  return <PhotoGenerationModal assets={state.library.assets} initialReferenceAssetId={state.selectedId} models={props.imageModels} onClose={() => state.setShowGeneration(false)} onGenerated={state.generated} projectAspectRatio={props.projectAspectRatio} projectId={props.projectId} />;
}

function clearSelectedAsset(
  current: string | undefined,
  setSelectedId: (value?: string) => void,
  assetId: string
) {
  if (current === assetId) setSelectedId(undefined);
}

async function uploadPhoto(
  file: File,
  library: ReturnType<typeof usePhotoLibrary>,
  props: PhotoLibraryModalProps,
  setSelectedId: (value?: string) => void
) {
  const assetId = await library.upload(file);
  if (!assetId) return;
  setSelectedId(assetId);
  props.onChanged?.();
}

async function generatedPhoto(input: GeneratedPhotoInput) {
  input.setShowGeneration(false);
  await input.library.refresh();
  if (input.assetId) input.setSelectedId(input.assetId);
  input.props.onChanged?.();
}

async function deletePhotoAsset(input: DeletePhotoInput) {
  input.setMenu(null);
  clearSelectedAsset(input.selectedId, input.setSelectedId, input.assetId);
  if (await input.library.deleteAsset(input.assetId)) input.props.onChanged?.();
}

function openPhotoMenu(
  asset: PhotoLibraryAsset,
  event: MouseEvent,
  setMenu: (value: PhotoMenuState) => void,
  setSelectedId: (value: string) => void
) {
  event.preventDefault();
  setSelectedId(asset.id);
  setMenu(menuState(asset, event));
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

type GeneratedPhotoInput = {
  assetId?: string;
  library: ReturnType<typeof usePhotoLibrary>;
  props: PhotoLibraryModalProps;
  setSelectedId: (value?: string) => void;
  setShowGeneration: (value: boolean) => void;
};

type DeletePhotoInput = {
  assetId: string;
  library: ReturnType<typeof usePhotoLibrary>;
  props: PhotoLibraryModalProps;
  selectedId?: string;
  setMenu: (value: PhotoMenuState | null) => void;
  setSelectedId: (value?: string) => void;
};
