import { CreateProjectButton } from "@/features/projects/components/CreateProjectButton";

export function DashboardHeader() {
  return (
    <div className="studio-page-header">
      <div>
        <h1>Projects</h1>
        <p>Manage linked AI video timelines, current jobs, credits, and exports.</p>
      </div>
      <CreateProjectButton label="Create new project" />
    </div>
  );
}
