"use client";

type ProjectDeleteDialogProps = {
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
        <p>
          This will permanently delete "{props.title}" and all scenes, photos,
          videos, and exports inside it.
        </p>
        <div className="project-delete-actions">
          <button className="button button-secondary" disabled={props.busy} onClick={props.onCancel} type="button">
            Cancel
          </button>
          <button className="button button-danger" disabled={props.busy} onClick={props.onConfirm} type="button">
            {props.busy ? "Deleting..." : "Delete project"}
          </button>
        </div>
      </div>
    </div>
  );
}
