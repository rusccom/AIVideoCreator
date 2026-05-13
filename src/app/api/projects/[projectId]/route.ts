import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { updateProjectSchema } from "@/features/projects/server/project-schema";
import { deleteProject, getProject, updateProject } from "@/features/projects/server/project-service";
import { notFound, parseJson, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { projectId } = await context.params;
    const project = await getProject(user.id, projectId);
    return project ? NextResponse.json({ project }) : notFound();
  } catch {
    return unauthorized();
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await requireCurrentUser();
  const { projectId } = await context.params;
  const parsed = await parseJson(request, updateProjectSchema);
  if (parsed.response) return parsed.response;
  const project = await updateProject(user.id, projectId, parsed.data);
  return NextResponse.json({ project });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await requireCurrentUser();
  const { projectId } = await context.params;
  const project = await deleteProject(user.id, projectId);
  return NextResponse.json({ project });
}
