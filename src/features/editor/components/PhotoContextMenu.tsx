import { Video } from "lucide-react";
import type { EditorAsset } from "../types";

type PhotoContextMenuProps = {
  asset: EditorAsset;
  onCreateVideo: (assetId: string) => void;
  x: number;
  y: number;
};

export function PhotoContextMenu(props: PhotoContextMenuProps) {
  return (
    <div className="photo-context-menu" style={{ left: props.x, top: props.y }}>
      <button onClick={() => props.onCreateVideo(props.asset.id)} type="button">
        <Video size={16} />
        Создать видео из этой фотографии
      </button>
    </div>
  );
}
