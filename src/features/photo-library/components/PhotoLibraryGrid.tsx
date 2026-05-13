"use client";

import type { MouseEvent } from "react";
import type { PhotoLibraryAsset } from "../types";
import { PhotoLibraryCard } from "./PhotoLibraryCard";

type PhotoLibraryGridProps = {
  assets: PhotoLibraryAsset[];
  loading: boolean;
  onContextMenu?: (asset: PhotoLibraryAsset, event: MouseEvent) => void;
  onSelect: (asset: PhotoLibraryAsset) => void;
  selectedAssetId?: string;
};

export function PhotoLibraryGrid(props: PhotoLibraryGridProps) {
  if (props.loading) return <p className="photo-library-note">Loading photos...</p>;
  if (props.assets.length === 0) return <p className="photo-library-note">No project photos yet.</p>;
  return (
    <div className="photo-library-grid">
      {props.assets.map((asset) => (
        <PhotoLibraryCard
          asset={asset}
          key={asset.id}
          onContextMenu={props.onContextMenu}
          onSelect={props.onSelect}
          selected={asset.id === props.selectedAssetId}
        />
      ))}
    </div>
  );
}
