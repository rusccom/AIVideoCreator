"use client";

import { Trash2 } from "lucide-react";
import type { PhotoLibraryAsset } from "../types";

type PhotoLibraryContextMenuProps = {
  asset: PhotoLibraryAsset;
  deleting: boolean;
  onDelete: (assetId: string) => void;
  x: number;
  y: number;
};

export function PhotoLibraryContextMenu(props: PhotoLibraryContextMenuProps) {
  return (
    <div className="photo-library-context-menu" role="menu" style={{ left: props.x, top: props.y }}>
      <button className="danger" disabled={props.deleting} onClick={() => props.onDelete(props.asset.id)} role="menuitem" type="button">
        <Trash2 size={16} />
        Delete
      </button>
    </div>
  );
}
