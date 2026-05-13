import { Trash2, Video } from "lucide-react";
import type { EditorAsset } from "../types";
import { EditorContextMenu } from "./EditorContextMenu";

type PhotoContextMenuProps = {
  asset: EditorAsset;
  onCreateVideo: (assetId: string) => void;
  onDelete: (assetId: string) => void;
  x: number;
  y: number;
};

export function PhotoContextMenu(props: PhotoContextMenuProps) {
  return (
    <EditorContextMenu
      items={[
        createVideoItem(props),
        deleteItem(props)
      ]}
      x={props.x}
      y={props.y}
    />
  );
}

function createVideoItem(props: PhotoContextMenuProps) {
  return {
    icon: <Video size={16} />,
    id: "create-video",
    label: "Create video from this photo",
    onSelect: () => props.onCreateVideo(props.asset.id)
  };
}

function deleteItem(props: PhotoContextMenuProps) {
  return {
    danger: true,
    icon: <Trash2 size={16} />,
    id: "delete",
    label: "Delete",
    onSelect: () => props.onDelete(props.asset.id)
  };
}
