"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { defaultAspectRatioPreset } from "@/features/generation/models/aspect-ratio-presets";
import type { AiCreatorImageModel, AiCreatorVideoModel } from "../types";
import { AiCreatorModal } from "./AiCreatorModal";

type AiCreatorButtonProps = {
  imageModels?: AiCreatorImageModel[];
  projectAspectRatio?: string;
  projectId?: string;
  videoModels?: AiCreatorVideoModel[];
};

export function AiCreatorButton(props: AiCreatorButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const aspectRatio = props.projectAspectRatio ?? defaultAspectRatioPreset().value;
  const modal = open && mounted
    ? createPortal(<AiCreatorModal {...props} onClose={() => setOpen(false)} projectAspectRatio={aspectRatio} />, document.body)
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
