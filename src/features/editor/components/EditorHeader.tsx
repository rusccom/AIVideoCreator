import { EditorAccountActions } from "./EditorAccountActions";
import { EditorBackLink } from "./EditorBackLink";
import { EditorCreditBalance } from "./EditorCreditBalance";
import { EditorProjectSummary } from "./EditorProjectSummary";
import type { EditorImageModel, EditorScene, EditorVideoModel } from "../types";

type EditorHeaderProps = {
  aspectRatio: string;
  credits: number;
  imageModels: EditorImageModel[];
  projectId: string;
  scenes: EditorScene[];
  title: string;
  videoModels: EditorVideoModel[];
};

export function EditorHeader(props: EditorHeaderProps) {
  return (
    <header className="editor-header">
      <div className="editor-header-left">
        <EditorBackLink />
        <EditorProjectSummary
          aspectRatio={props.aspectRatio}
          title={props.title}
        />
        <EditorCreditBalance credits={props.credits} />
      </div>
      <div className="editor-header-right">
        <EditorAccountActions
          imageModels={props.imageModels}
          projectAspectRatio={props.aspectRatio}
          projectId={props.projectId}
          projectTitle={props.title}
          scenes={props.scenes}
          videoModels={props.videoModels}
        />
      </div>
    </header>
  );
}
