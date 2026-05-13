"use client";

import type { PhotoLibraryMode } from "../types";

type PhotoLibraryFooterProps = {
  canChoose: boolean;
  mode: PhotoLibraryMode;
  onChoose: () => void;
  onClose: () => void;
};

export function PhotoLibraryFooter(props: PhotoLibraryFooterProps) {
  return (
    <div className="photo-library-footer">
      <button className="button button-secondary" onClick={props.onClose} type="button">Close</button>
      {props.mode === "select" ? (
        <button className="button button-primary" disabled={!props.canChoose} onClick={props.onChoose} type="button">
          Choose
        </button>
      ) : null}
    </div>
  );
}
