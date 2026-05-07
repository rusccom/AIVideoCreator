import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function EditorBackLink() {
  return (
    <Link aria-label="Back to projects" className="editor-back-link" href="/app/projects">
      <ArrowLeft size={18} />
    </Link>
  );
}
