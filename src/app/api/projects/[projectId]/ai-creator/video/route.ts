import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/application/auth/server";
import { generationErrorResponse } from "@/application/generation/server";
import { aiCreatorVideoSchema } from "@/application/ai-creator/server";
import { startAiCreatorVideo } from "@/application/ai-creator/server";
import { parseJson } from "@/shared/server/api";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { projectId } = await context.params;
    const parsed = await parseJson(request, aiCreatorVideoSchema);
    if (parsed.response) return parsed.response;
    const result = await startAiCreatorVideo(user.id, projectId, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return generationErrorResponse(error, "AI Creator video generation failed");
  }
}
