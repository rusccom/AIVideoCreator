import { CreateProjectButton } from "@/features/projects/components/CreateProjectButton";

export function EmptyState() {
  return (
    <section className="empty-state">
      <div>
        <h2>Create your first project</h2>
        <p>
          Start a new workspace for your idea, then shape the project as it
          grows.
        </p>
        <CreateProjectButton label="Create project" />
      </div>
    </section>
  );
}
