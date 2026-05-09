"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { AiCreatorImageModel, AiCreatorVideoModel } from "../types";
import { AiCreatorModal } from "./AiCreatorModal";

type AiCreatorButtonProps = {
  imageModels?: AiCreatorImageModel[];
  projectId?: string;
  videoModels?: AiCreatorVideoModel[];
};

export function AiCreatorButton(props: AiCreatorButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const modal = open && mounted
    ? createPortal(<AiCreatorModal {...props} onClose={() => setOpen(false)} />, document.body)
    : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <button className="button button-primary" onClick={() => setOpen(true)} type="button">
        <Sparkles size={16} /> AI Creator
      </button>
      {modal}
    </>
  );
}
