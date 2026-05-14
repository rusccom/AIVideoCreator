import { redirect } from "next/navigation";
import { getCurrentUser } from "@/application/auth/server";
import { ProjectEditor } from "@/application/editor/client";
import { getEditorProject } from "@/application/editor/server";
import { getTopbarData } from "@/application/studio/server";

type ProjectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [topbar, project] = await Promise.all([
    getTopbarData(user.id),
    getEditorProject(user.id, projectId)
  ]);

  if (!project) redirect("/app/projects");

  return <ProjectEditor credits={topbar.credits} project={project} />;
}
