import type { ReactNode } from "react";

type DashboardHeaderProps = {
  createProjectButton: ReactNode;
};

export function DashboardHeader({ createProjectButton }: DashboardHeaderProps) {
  return (
    <div className="studio-page-header">
      <div>
        <h1>Projects</h1>
        <p>Manage linked AI video timelines, current jobs, credits, and exports.</p>
      </div>
      {createProjectButton}
    </div>
  );
}
