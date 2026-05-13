"use client";

import { useEffect, useState } from "react";
import { Ellipsis, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProjectDeleteDialog } from "./ProjectDeleteDialog";

type ProjectCardMenuProps = {
  projectId: string;
  title: string;
};

type ProjectCardMenuView = {
  busy: boolean;
  confirming: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
  onDelete: () => void;
  onToggle: () => void;
  open: boolean;
  title: string;
};

export function ProjectCardMenu(props: ProjectCardMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const deleteState = useProjectDeletion(props.projectId, () => setConfirming(false));
  useProjectMenuClose(open, () => setOpen(false));
  return projectCardMenuView({
    ...deleteState,
    confirming,
    onCancel: () => setConfirming(false),
    onDelete: () => startDelete(setOpen, setConfirming),
    onToggle: () => setOpen(!open),
    open,
    title: props.title
  });
}

function projectCardMenuView(props: ProjectCardMenuView) {
  return (
    <div className="project-card-actions" onClick={(event) => event.stopPropagation()}>
      <button aria-label="Project actions" className="project-card-menu-button" onClick={props.onToggle} type="button">
        <Ellipsis size={20} />
      </button>
      {props.open ? projectMenu(props.onDelete) : null}
      {props.confirming ? (
        <ProjectDeleteDialog busy={props.busy} onCancel={props.onCancel} onConfirm={props.onConfirm} title={props.title} />
      ) : null}
      {props.error ? <span className="project-card-error">{props.error}</span> : null}
    </div>
  );
}

function projectMenu(onDelete: () => void) {
  return (
    <div className="project-card-menu" role="menu">
      <button className="danger" onClick={onDelete} role="menuitem" type="button">
        <Trash2 size={16} />
        Delete
      </button>
    </div>
  );
}

function useProjectMenuClose(open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => window.addEventListener("click", close));
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("click", close);
    };
  }, [close, open]);
}

function useProjectDeletion(projectId: string, afterDelete: () => void) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function onConfirm() {
    setBusy(true);
    setError("");
    try {
      await destroyProject(projectId);
      afterDelete();
      router.refresh();
    } catch {
      setError("Project could not be deleted.");
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, onConfirm };
}

function startDelete(setOpen: (value: boolean) => void, setConfirming: (value: boolean) => void) {
  setOpen(false);
  setConfirming(true);
}

async function destroyProject(projectId: string) {
  const response = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Delete failed");
}
