import type { ReactNode } from "react";

type EmptyStateProps = {
  createProjectButton: ReactNode;
};

export function EmptyState({ createProjectButton }: EmptyStateProps) {
  return (
    <section className="empty-state">
      <div>
        <h2>Create your first project</h2>
        <p>
          Start a new workspace for your idea, then shape the project as it
          grows.
        </p>
        {createProjectButton}
      </div>
    </section>
  );
}
