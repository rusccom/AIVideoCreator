import { UserCircle } from "lucide-react";
import { AiCreatorButton } from "@/features/ai-creator/components/AiCreatorButton";
import type { EditorImageModel, EditorScene, EditorVideoModel } from "../types";
import { DownloadClipButton } from "./DownloadClipButton";

type EditorAccountActionsProps = {
  imageModels: EditorImageModel[];
  projectAspectRatio: string;
  projectId: string;
  projectTitle: string;
  scenes: EditorScene[];
  videoModels: EditorVideoModel[];
};

export function EditorAccountActions(props: EditorAccountActionsProps) {
  return (
    <div className="editor-account-actions">
      <AiCreatorButton
        imageModels={props.imageModels}
        projectAspectRatio={props.projectAspectRatio}
        projectId={props.projectId}
        videoModels={props.videoModels}
      />
      <DownloadClipButton
        hasReadyScenes={hasReadyScenes(props.scenes)}
        projectId={props.projectId}
        projectTitle={props.projectTitle}
      />
      <UserCircle aria-label="Profile" size={28} />
    </div>
  );
}

function hasReadyScenes(scenes: EditorScene[]) {
  return scenes.some((scene) => scene.statusValue === "READY" && Boolean(scene.videoUrl));
}
