import { EditorAccountActions } from "./EditorAccountActions";
import { EditorBackLink } from "./EditorBackLink";
import { EditorProjectSummary } from "./EditorProjectSummary";
import type { EditorImageModel, EditorVideoModel } from "../types";

type EditorHeaderProps = {
  credits: number;
  imageModels: EditorImageModel[];
  projectId: string;
  title: string;
  sceneCount: number;
  totalDuration: string;
  videoModels: EditorVideoModel[];
};

export function EditorHeader(props: EditorHeaderProps) {
  return (
    <header className="editor-header">
      <div className="editor-header-left">
        <EditorBackLink />
        <EditorProjectSummary
          projectId={props.projectId}
          sceneCount={props.sceneCount}
          title={props.title}
          totalDuration={props.totalDuration}
        />
        <div className="editor-workspace-chip">
          <strong>Creator workspace</strong>
          <span className="badge">{props.credits} credits</span>
        </div>
      </div>
      <div className="editor-header-right">
        <EditorAccountActions
          imageModels={props.imageModels}
          projectId={props.projectId}
          videoModels={props.videoModels}
        />
      </div>
    </header>
  );
}
