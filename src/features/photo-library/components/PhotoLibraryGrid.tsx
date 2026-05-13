"use client";

import { Check } from "lucide-react";
import type { PhotoLibraryAsset } from "../types";
import { PhotoLibraryImage } from "./PhotoLibraryImage";

type PhotoLibraryGridProps = {
  assets: PhotoLibraryAsset[];
  loading: boolean;
  onSelect: (asset: PhotoLibraryAsset) => void;
  selectedAssetId?: string;
};

export function PhotoLibraryGrid(props: PhotoLibraryGridProps) {
  if (props.loading) return <p className="photo-library-note">Loading photos...</p>;
  if (props.assets.length === 0) return <p className="photo-library-note">No project photos yet.</p>;
  return (
    <div className="photo-library-grid">
      {props.assets.map((asset) => (
        <button
          aria-pressed={asset.id === props.selectedAssetId}
          className={cardClass(asset.id, props.selectedAssetId)}
          key={asset.id}
          onClick={() => props.onSelect(asset)}
          title={asset.label}
          type="button"
        >
          <PhotoLibraryImage alt={asset.label} source={asset.url} />
          <span>{asset.label}</span>
          {asset.id === props.selectedAssetId ? <Check className="photo-library-check" size={18} /> : null}
        </button>
      ))}
    </div>
  );
}

function cardClass(assetId: string, selectedAssetId?: string) {
  return assetId === selectedAssetId ? "photo-library-card selected" : "photo-library-card";
}
