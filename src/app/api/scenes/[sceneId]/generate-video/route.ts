import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { generationErrorResponse } from "@/features/generation/server/generation-api-error";
import { generateVideoSchema } from "@/features/generation/server/generation-schema";
import { generateVideo } from "@/features/generation/server/generation-service";
import { parseJson } from "@/shared/server/api";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ sceneId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { sceneId } = await context.params;
    const parsed = await parseJson(request, generateVideoSchema);
    if (parsed.response) return parsed.response;
    const job = await generateVideo(user.id, sceneId, parsed.data);
    return NextResponse.json({ job });
  } catch (error) {
    return generationErrorResponse(error, "Video generation failed");
  }
}
