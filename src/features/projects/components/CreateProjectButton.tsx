"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { ProjectCreateModal } from "./ProjectCreateModal";

type CreateProjectButtonProps = {
  label: string;
};

export function CreateProjectButton({ label }: CreateProjectButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="button button-primary" onClick={() => setOpen(true)} type="button">
        <Plus size={17} /> {label}
      </button>
      {open ? <ProjectCreateModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}
