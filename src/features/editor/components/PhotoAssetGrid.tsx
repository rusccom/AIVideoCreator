import type { MouseEvent } from "react";
import type { EditorAsset } from "../types";
import { ResolvedAssetImage } from "./ResolvedAssetImage";

type PhotoAssetGridProps = {
  assets: EditorAsset[];
  onContextMenu: (asset: EditorAsset, event: MouseEvent) => void;
  onSelect: (assetId: string) => void;
  selectedAssetId?: string;
};

export function PhotoAssetGrid(props: PhotoAssetGridProps) {
  return (
    <div className="photo-grid">
      {props.assets.length === 0 ? <p className="form-note">No project photos yet.</p> : null}
      {props.assets.map((asset) => photoButton(props, asset))}
    </div>
  );
}

function photoButton(props: PhotoAssetGridProps, asset: EditorAsset) {
  return <button aria-pressed={asset.id === props.selectedAssetId} className={photoCardClass(asset.id, props.selectedAssetId)} key={asset.id} onClick={() => props.onSelect(asset.id)} onContextMenu={(event) => props.onContextMenu(asset, event)} title={asset.label} type="button">{photoImage(asset)}</button>;
}

function photoImage(asset: EditorAsset) {
  return <ResolvedAssetImage alt={asset.label} className="photo-card-image" fallback="Select photo" source={asset.url} />;
}

function photoCardClass(assetId: string, selectedAssetId?: string) {
  return assetId === selectedAssetId ? "photo-card selected" : "photo-card";
}
