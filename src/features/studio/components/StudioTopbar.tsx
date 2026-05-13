import Link from "next/link";
import { ArrowLeft, Download, UserCircle } from "lucide-react";

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
      <div className="studio-topbar-actions">
        <button className="button button-quiet" type="button">
          <Download size={16} /> Export
        </button>
        <UserCircle aria-label="Profile" size={28} />
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
