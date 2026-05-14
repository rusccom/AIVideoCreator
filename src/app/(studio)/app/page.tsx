import { redirect } from "next/navigation";
import { getCurrentUser } from "@/application/auth/server";
import { ActivityPanel } from "@/application/studio/client";
import { DashboardHeader } from "@/application/studio/client";
import { EmptyState } from "@/application/studio/client";
import { ProjectCard } from "@/application/studio/client";
import { UsagePanel } from "@/application/studio/client";
import { getDashboardData } from "@/application/studio/server";

export default async function StudioHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await getDashboardData(user.id);

  return (
    <>
      <DashboardHeader />
      <div className="dashboard-grid">
        {projectGrid(data.projects)}
        {sideStack(data)}
      </div>
    </>
  );
}

function projectGrid(projects: Awaited<ReturnType<typeof getDashboardData>>["projects"]) {
  if (projects.length === 0) return <EmptyState />;
  return <div className="project-grid">{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</div>;
}

function sideStack(data: Awaited<ReturnType<typeof getDashboardData>>) {
  return <aside className="side-stack"><UsagePanel metrics={data.metrics} /><ActivityPanel activity={data.activity} /></aside>;
}
