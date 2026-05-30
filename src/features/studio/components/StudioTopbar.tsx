import Link from "next/link";
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
          <strong>MySceneAI workspace</strong>
          <Link className="studio-credit-badge" href="/app/billing">{credits} credits</Link>
        </div>
      </div>
    </header>
  );
}
