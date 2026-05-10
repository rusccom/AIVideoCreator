import Link from "next/link";
import { Download, UserCircle } from "lucide-react";
import { AiCreatorButton } from "@/features/ai-creator/components/AiCreatorButton";
import type { EditorImageModel, EditorVideoModel } from "../types";

type EditorAccountActionsProps = {
  imageModels: EditorImageModel[];
  projectAspectRatio: string;
  projectId: string;
  videoModels: EditorVideoModel[];
};

export function EditorAccountActions(props: EditorAccountActionsProps) {
  return (
    <div className="editor-account-actions">
      <AiCreatorButton
        imageModels={props.imageModels}
        projectAspectRatio={props.projectAspectRatio}
        projectId={props.projectId}
        videoModels={props.videoModels}
      />
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
