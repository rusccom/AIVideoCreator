"use client";

import { Check } from "lucide-react";
import type { MouseEvent } from "react";
import type { PhotoLibraryAsset } from "../types";
import { PhotoLibraryImage } from "./PhotoLibraryImage";

type PhotoLibraryCardProps = {
  asset: PhotoLibraryAsset;
  onContextMenu?: (asset: PhotoLibraryAsset, event: MouseEvent) => void;
  onSelect: (asset: PhotoLibraryAsset) => void;
  selected: boolean;
};

export function PhotoLibraryCard(props: PhotoLibraryCardProps) {
  return (
    <button
      aria-label={props.asset.label}
      aria-pressed={props.selected}
      className={cardClass(props.selected)}
      onClick={() => props.onSelect(props.asset)}
      onContextMenu={(event) => props.onContextMenu?.(props.asset, event)}
      title={props.asset.label}
      type="button"
    >
      <PhotoLibraryImage alt={props.asset.label} source={props.asset.url} />
      {props.selected ? <Check className="photo-library-check" size={18} /> : null}
    </button>
  );
}

function cardClass(selected: boolean) {
  return selected ? "photo-library-card selected" : "photo-library-card";
}
