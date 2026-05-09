import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { generateProjectImageSchema } from "@/features/image-generation/server/image-generation-schema";
import { startProjectImageGeneration } from "@/features/image-generation/server/project-image-service";
import { parseJson, serverError, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { projectId } = await context.params;
    const parsed = await parseJson(request, generateProjectImageSchema);
    if (parsed.response) return parsed.response;
    const job = await startProjectImageGeneration(user.id, projectId, parsed.data);
    return NextResponse.json({ job });
  } catch (error) {
    return error instanceof Error && error.message === "Unauthorized" ? unauthorized() : serverError("Image generation failed");
  }
}
