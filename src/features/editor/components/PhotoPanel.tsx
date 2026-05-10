"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";
import type { EditorAsset, EditorImageModel } from "../types";
import { PhotoAssetGrid } from "./PhotoAssetGrid";
import { PhotoContextMenu } from "./PhotoContextMenu";
import { PhotoCreateModal } from "./PhotoCreateModal";

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
      {menu ? <PhotoContextMenu asset={menu.asset} onCreateVideo={createVideoFromPhoto} x={menu.x} y={menu.y} /> : null}
      {showCreate ? (
        <PhotoCreateModal
          imageModels={props.imageModels}
          onClose={() => setShowCreate(false)}
          onReady={() => finishCreate(setShowCreate, router.refresh)}
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

function finishCreate(setShowCreate: (value: boolean) => void, refresh: () => void) {
  setShowCreate(false);
  refresh();
}

function menuState(asset: EditorAsset, event: MouseEvent) {
  return {
    asset,
    x: clamp(event.clientX, window.innerWidth - 294),
    y: clamp(event.clientY, window.innerHeight - 72)
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
