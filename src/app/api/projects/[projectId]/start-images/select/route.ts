import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { selectStartImageSchema } from "@/features/generation/server/generation-schema";
import { selectStartImage } from "@/features/generation/server/generation-service";
import { parseJson, serverError, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { projectId } = await context.params;
    const parsed = await parseJson(request, selectStartImageSchema);
    if (parsed.response) return parsed.response;
    const project = await selectStartImage(user.id, projectId, parsed.data);
    return NextResponse.json({ project });
  } catch (error) {
    return error instanceof Error && error.message === "Unauthorized" ? unauthorized() : serverError("Start image selection failed");
  }
}
