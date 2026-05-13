import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/server/current-user";
import { ActivityPanel } from "@/features/studio/components/ActivityPanel";
import { DashboardHeader } from "@/features/studio/components/DashboardHeader";
import { EmptyState } from "@/features/studio/components/EmptyState";
import { ProjectCard } from "@/features/studio/components/ProjectCard";
import { UsagePanel } from "@/features/studio/components/UsagePanel";
import { getDashboardData } from "@/features/studio/server/dashboard-service";

export default async function StudioHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await getDashboardData(user.id);

  return (
    <>
      <DashboardHeader />
      <div className="dashboard-grid">
        {data.projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="project-grid">
            {data.projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
        <aside className="side-stack">
          <UsagePanel metrics={data.metrics} />
          <ActivityPanel activity={data.activity} />
        </aside>
      </div>
    </>
  );
}
