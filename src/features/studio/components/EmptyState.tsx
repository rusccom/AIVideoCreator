import { CreateProjectButton } from "@/features/projects/components/CreateProjectButton";

export function EmptyState() {
  return (
    <section className="empty-state">
      <div>
        <h2>Create your first project</h2>
        <p>
          Upload a start frame, build the first 6-second clip, then continue from
          its final frame.
        </p>
        <CreateProjectButton label="Create project" />
      </div>
    </section>
  );
}
