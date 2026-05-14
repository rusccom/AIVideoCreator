import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function EditorExitButton() {
  return (
    <Link aria-label="Back to projects" className="editor-exit-button" href="/app/projects">
      <ArrowLeft size={18} />
    </Link>
  );
}
