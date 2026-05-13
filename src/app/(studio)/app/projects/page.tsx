import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/server/current-user";
import { DashboardHeader } from "@/features/studio/components/DashboardHeader";
import { EmptyState } from "@/features/studio/components/EmptyState";
import { ProjectCard } from "@/features/studio/components/ProjectCard";
import { getDashboardData } from "@/features/studio/server/dashboard-service";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await getDashboardData(user.id);

  return (
    <>
      <DashboardHeader />
      {data.projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="project-grid">
          {data.projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </>
  );
}
