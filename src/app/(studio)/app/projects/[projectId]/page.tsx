import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/server/current-user";
import { ProjectEditor } from "@/features/editor/components/ProjectEditor";
import { getEditorProject } from "@/features/editor/server/editor-service";
import { getTopbarData } from "@/features/studio/server/dashboard-service";

type ProjectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const user = await getCurrentUser();
  const topbar = await getTopbarData(user!.id);
  const project = await getEditorProject(user!.id, projectId);

  if (!project) redirect("/app/projects");

  return <ProjectEditor credits={topbar.credits} project={project} />;
}
