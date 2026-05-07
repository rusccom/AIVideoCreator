import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { createProjectSchema } from "@/features/projects/server/project-schema";
import { createProject, listProjects } from "@/features/projects/server/project-service";
import { parseJson, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const projects = await listProjects(user.id);
    return NextResponse.json({ projects });
  } catch {
    return unauthorized();
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const parsed = await parseJson(request, createProjectSchema);
    if (parsed.response) return parsed.response;
    const project = await createProject(user.id, parsed.data);
    return NextResponse.json({ id: project.id });
  } catch {
    return unauthorized();
  }
}
