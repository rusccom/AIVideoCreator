import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { generateVideoSchema } from "@/features/generation/server/generation-schema";
import { generateVideo } from "@/features/generation/server/generation-service";
import { parseJson, serverError, unauthorized } from "@/shared/server/api";

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
    if (error instanceof Error && error.message === "Unauthorized") return unauthorized();
    if (error instanceof Error && error.message === "Insufficient credits") {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    return serverError("Scene regeneration failed");
  }
}
