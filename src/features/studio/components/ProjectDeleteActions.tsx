import type { ProjectDeleteDialogProps } from "./ProjectDeleteDialog";

export function ProjectDeleteActions(props: ProjectDeleteDialogProps) {
  return (
    <div className="project-delete-actions">
      <button className="button button-secondary" disabled={props.busy} onClick={props.onCancel} type="button">Cancel</button>
      <button className="button button-danger" disabled={props.busy} onClick={props.onConfirm} type="button">
        {props.busy ? "Deleting..." : "Delete project"}
      </button>
    </div>
  );
}
