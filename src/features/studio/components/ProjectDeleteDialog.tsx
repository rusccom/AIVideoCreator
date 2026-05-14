"use client";

import { ProjectDeleteActions } from "./ProjectDeleteActions";

export type ProjectDeleteDialogProps = {
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
};

export function ProjectDeleteDialog(props: ProjectDeleteDialogProps) {
  return (
    <div className="project-delete-backdrop" role="presentation">
      <div aria-modal="true" className="project-delete-dialog" role="dialog">
        <h2>Delete project?</h2>
        <p>This will permanently delete "{props.title}" and all scenes, photos, videos, and exports inside it.</p>
        <ProjectDeleteActions {...props} />
      </div>
    </div>
  );
}
