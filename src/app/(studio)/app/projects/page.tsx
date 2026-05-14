import { redirect } from "next/navigation";
import { getCurrentUser } from "@/application/auth/server";
import { DashboardHeader } from "@/application/studio/client";
import { EmptyState } from "@/application/studio/client";
import { ProjectCard } from "@/application/studio/client";
import { getDashboardData } from "@/application/studio/server";

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
