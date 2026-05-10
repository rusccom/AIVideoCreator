"use client";

import { X } from "lucide-react";
import { ProjectWizard } from "./ProjectWizard";

type ProjectCreateModalProps = {
  onClose: () => void;
};

export function ProjectCreateModal({ onClose }: ProjectCreateModalProps) {
  return (
    <div aria-modal="true" className="project-modal-backdrop" role="dialog">
      <div className="project-modal">
        <div className="project-modal-header">
          <div>
            <h2>Create new project</h2>
            <p>Set up the core project details.</p>
          </div>
          <button aria-label="Close" className="project-modal-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <ProjectWizard />
      </div>
    </div>
  );
}
