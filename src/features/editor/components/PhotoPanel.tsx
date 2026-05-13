"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";
import { PhotoLibraryModal } from "@/features/photo-library/components/PhotoLibraryModal";
import type { EditorAsset, EditorImageModel } from "../types";
import { PhotoAssetGrid } from "./PhotoAssetGrid";
import { PhotoContextMenu } from "./PhotoContextMenu";

type PhotoPanelProps = {
  assets: EditorAsset[];
  imageModels: EditorImageModel[];
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
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string>();
  const [menu, setMenu] = useState<PhotoMenuState | null>(null);
  const photos = props.assets.filter(isPhotoAsset);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const timer = window.setTimeout(() => addMenuListeners(close));
    return () => {
      window.clearTimeout(timer);
      removeMenuListeners(close);
    };
  }, [menu]);

  function openMenu(asset: EditorAsset, event: MouseEvent) {
    event.preventDefault();
    setSelectedAssetId(asset.id);
    setMenu(menuState(asset, event));
  }

  function createVideoFromPhoto(assetId: string) {
    setMenu(null);
    props.onCreateVideoFromPhoto(assetId);
  }

  async function deletePhoto(assetId: string) {
    setMenu(null);
    clearSelectedAsset(selectedAssetId, setSelectedAssetId, assetId);
    await deleteAsset(assetId);
    router.refresh();
  }

  return (
    <section className="editor-panel photo-panel">
      <div className="editor-panel-header">
        <h2>Photos</h2>
        <div className="photo-panel-actions">
          <span className="badge">{photos.length}</span>
          <button className="button button-secondary" onClick={() => setShowCreate(true)} type="button">
            <Plus size={16} /> Add
          </button>
        </div>
      </div>
      <div className="photo-panel-body">
        <PhotoAssetGrid
          assets={photos}
          onContextMenu={openMenu}
          onSelect={setSelectedAssetId}
          selectedAssetId={selectedAssetId}
        />
      </div>
      {menu ? (
        <PhotoContextMenu
          asset={menu.asset}
          onCreateVideo={createVideoFromPhoto}
          onDelete={deletePhoto}
          x={menu.x}
          y={menu.y}
        />
      ) : null}
      {showCreate ? (
        <PhotoLibraryModal
          assets={photos}
          imageModels={props.imageModels}
          mode="manage"
          onChanged={router.refresh}
          onClose={() => setShowCreate(false)}
          projectAspectRatio={props.projectAspectRatio}
          projectId={props.projectId}
        />
      ) : null}
    </section>
  );
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
