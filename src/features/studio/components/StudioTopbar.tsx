import { EditorExitButton } from "./EditorExitButton";

type StudioTopbarProps = {
  credits: number;
  editorMode?: boolean;
};

export function StudioTopbar({ credits, editorMode = false }: StudioTopbarProps) {
  return (
    <header className="studio-topbar">
      <div className="studio-topbar-left">
        {editorMode ? <EditorExitButton /> : null}
        <div>
          <strong>Creator workspace</strong>
          <span className="badge">{credits} credits</span>
        </div>
      </div>
    </header>
  );
}
