import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/application/auth/server";
import { generationErrorResponse } from "@/application/generation/server";
import { generateVideoSchema } from "@/application/generation/server";
import { generateVideo } from "@/application/generation/server";
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
