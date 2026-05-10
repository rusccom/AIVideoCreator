import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { generationErrorResponse } from "@/features/generation/server/generation-api-error";
import { aiCreatorVideoSchema } from "@/features/ai-creator/server/ai-creator-video-schema";
import { startAiCreatorVideo } from "@/features/ai-creator/server/ai-creator-video-service";
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
