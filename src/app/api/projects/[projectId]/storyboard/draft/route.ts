import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/application/auth/server";
import { draftStoryboard, storyboardDraftSchema } from "@/application/ai-creator/server";
import { parseJson, serverError, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { projectId } = await context.params;
    const parsed = await parseJson(request, storyboardDraftSchema);
    if (parsed.response) return parsed.response;
    const result = await draftStoryboard(user.id, projectId, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return error instanceof Error && error.message === "Unauthorized"
      ? unauthorized()
      : serverError("Storyboard draft generation failed");
  }
}
