"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import type { EditorIntegrations } from "../editor-integrations";
import type { EditorAsset, EditorImageModel } from "../types";
import { PhotoAssetGrid } from "./PhotoAssetGrid";
import { PhotoContextMenu } from "./PhotoContextMenu";

type PhotoPanelProps = {
  assets: EditorAsset[];
  imageModels: EditorImageModel[];
  integrations: EditorIntegrations;
  onCreateVideoFromPhoto: (assetId: string) => void;
  projectAspectRatio: string;
  projectId: string;
};

type PhotoMenuState = {
  asset: EditorAsset;
  x: number;
  y: number;
};

export function PhotoPanel(props: PhotoPanelProps) {
  const state = usePhotoPanelState(props);
  return (
    <section className="editor-panel photo-panel">
      {photoPanelHeader(state)}
      {photoPanelGrid(state)}
      {photoPanelMenu(state)}
      {photoLibraryModal(props, state)}
    </section>
  );
}

function usePhotoPanelState(props: PhotoPanelProps) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string>();
  const [menu, setMenu] = useState<PhotoMenuState | null>(null);
  const photos = useMemo(() => props.assets.filter(isPhotoAsset), [props.assets]);
  const closeMenu = useCallback(() => setMenu(null), []);
  usePhotoMenuClose(menu, closeMenu);
  const createVideo = (assetId: string) => { setMenu(null); props.onCreateVideoFromPhoto(assetId); };
  const deletePhoto = async (assetId: string) => deletePhotoAsset(assetId, selectedAssetId, setSelectedAssetId, setMenu, router.refresh);
  const openMenu = (asset: EditorAsset, event: MouseEvent) => openPhotoMenu(asset, event, setMenu, setSelectedAssetId);
  return { createVideo, deletePhoto, menu, openMenu, photos, router, selectedAssetId, setSelectedAssetId, setShowCreate, showCreate };
}

function usePhotoMenuClose(menu: PhotoMenuState | null, closeMenu: () => void) {
  useEffect(() => {
    if (!menu) return;
    const timer = window.setTimeout(() => addMenuListeners(closeMenu));
    return () => { window.clearTimeout(timer); removeMenuListeners(closeMenu); };
  }, [closeMenu, menu]);
}

type PhotoPanelState = ReturnType<typeof usePhotoPanelState>;

function photoPanelHeader(state: PhotoPanelState) {
  return (
      <div className="editor-panel-header">
        <h2>Photos</h2>
        <div className="photo-panel-actions">
        <span className="badge">{state.photos.length}</span>
        <button className="button button-secondary" onClick={() => state.setShowCreate(true)} type="button">
            <Plus size={16} /> Add
          </button>
        </div>
      </div>
  );
}

function photoPanelGrid(state: PhotoPanelState) {
  return <div className="photo-panel-body"><PhotoAssetGrid assets={state.photos} onContextMenu={state.openMenu} onSelect={state.setSelectedAssetId} selectedAssetId={state.selectedAssetId} /></div>;
}

function photoPanelMenu(state: PhotoPanelState) {
  if (!state.menu) return null;
  return <PhotoContextMenu asset={state.menu.asset} onCreateVideo={state.createVideo} onDelete={state.deletePhoto} x={state.menu.x} y={state.menu.y} />;
}

function photoLibraryModal(props: PhotoPanelProps, state: PhotoPanelState) {
  if (!state.showCreate) return null;
  const PhotoLibraryModal = props.integrations.PhotoLibraryModal;
  return <PhotoLibraryModal assets={state.photos} imageModels={props.imageModels} mode="manage" onChanged={state.router.refresh} onClose={() => state.setShowCreate(false)} projectAspectRatio={props.projectAspectRatio} projectId={props.projectId} />;
}

function isPhotoAsset(asset: EditorAsset) {
  return asset.type === "IMAGE" || asset.type === "FRAME" || asset.type === "THUMBNAIL";
}

function clearSelectedAsset(
  current: string | undefined,
  setSelectedAssetId: (value?: string) => void,
  assetId: string
) {
  if (current === assetId) setSelectedAssetId(undefined);
}

async function deleteAsset(assetId: string) {
  await fetch(`/api/assets/${assetId}`, { method: "DELETE" });
}

async function deletePhotoAsset(
  assetId: string,
  selectedAssetId: string | undefined,
  setSelectedAssetId: (value?: string) => void,
  setMenu: (value: PhotoMenuState | null) => void,
  refresh: () => void
) {
  setMenu(null);
  clearSelectedAsset(selectedAssetId, setSelectedAssetId, assetId);
  await deleteAsset(assetId);
  refresh();
}

function openPhotoMenu(
  asset: EditorAsset,
  event: MouseEvent,
  setMenu: (value: PhotoMenuState) => void,
  setSelectedAssetId: (value: string) => void
) {
  event.preventDefault();
  setSelectedAssetId(asset.id);
  setMenu(menuState(asset, event));
}

function menuState(asset: EditorAsset, event: MouseEvent) {
  return {
    asset,
    x: clamp(event.clientX, window.innerWidth - 294),
    y: clamp(event.clientY, window.innerHeight - 116)
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
