import { EditorAccountActions } from "./EditorAccountActions";
import { EditorBackLink } from "./EditorBackLink";
import { EditorProjectSummary } from "./EditorProjectSummary";

type EditorHeaderProps = {
  credits: number;
  projectId: string;
  title: string;
  sceneCount: number;
  totalDuration: string;
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
        <EditorAccountActions />
      </div>
    </header>
  );
}
