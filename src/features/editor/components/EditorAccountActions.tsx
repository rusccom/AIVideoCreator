import Link from "next/link";
import { Download, UserCircle } from "lucide-react";

export function EditorAccountActions() {
  return (
    <div className="editor-account-actions">
      <Link className="button button-secondary" href="/app/billing">
        Upgrade
      </Link>
      <button className="button button-quiet" type="button">
        <Download size={16} /> Export
      </button>
      <UserCircle aria-label="Profile" size={28} />
    </div>
  );
}
