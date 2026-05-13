import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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

function EditorExitButton() {
  return (
    <Link aria-label="Back to projects" className="editor-exit-button" href="/app/projects">
      <ArrowLeft size={18} />
    </Link>
  );
}
