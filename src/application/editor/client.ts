"use client";

import { createElement } from "react";
import { AiCreatorButton, AiCreatorProgressModal, startClipGeneration } from "@/application/ai-creator/client";
import { PhotoLibraryModal } from "@/application/photo-library/client";
import { ProjectEditor as FeatureProjectEditor } from "@/features/editor/components/ProjectEditor";
import type { EditorProject } from "@/features/editor/types";

const integrations = {
  AiCreatorButton,
  AiCreatorProgressModal,
  PhotoLibraryModal,
  startClipGeneration
};

type ProjectEditorProps = {
  credits: number;
  project: EditorProject;
};

export function ProjectEditor(props: ProjectEditorProps) {
  return createElement(FeatureProjectEditor, { ...props, integrations });
}
