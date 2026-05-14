import type { EditorIntegrations } from "../editor-integrations";
import type { EditorImageModel, EditorScene, EditorVideoModel } from "../types";
import { DownloadClipButton } from "./DownloadClipButton";

type EditorAccountActionsProps = {
  imageModels: EditorImageModel[];
  integrations: EditorIntegrations;
  projectAspectRatio: string;
  projectId: string;
  projectTitle: string;
  scenes: EditorScene[];
  videoModels: EditorVideoModel[];
};

export function EditorAccountActions(props: EditorAccountActionsProps) {
  const AiCreatorButton = props.integrations.AiCreatorButton;
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
    </div>
  );
}

function hasReadyScenes(scenes: EditorScene[]) {
  return scenes.some((scene) => scene.statusValue === "READY" && Boolean(scene.videoUrl));
}
