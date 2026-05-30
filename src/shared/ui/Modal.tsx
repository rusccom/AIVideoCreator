"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

type ModalProps = {
  children: ReactNode;
  onClose: () => void;
  subtitle?: string;
  title: string;
};

export function Modal({ children, onClose, subtitle, title }: ModalProps) {
  return (
    <div className="project-modal-backdrop" onClick={onClose} role="presentation">
      <div aria-modal="true" className="project-modal owner-modal" onClick={stopPropagation} role="dialog">
        <div className="project-modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button aria-label="Close" className="project-modal-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function stopPropagation(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}
