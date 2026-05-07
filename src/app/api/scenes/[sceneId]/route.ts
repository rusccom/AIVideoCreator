import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { updateSceneSchema } from "@/features/generation/server/scene-schema";
import { updateSceneForUser } from "@/features/generation/server/scene-service";
import { parseJson, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ sceneId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { sceneId } = await context.params;
    const parsed = await parseJson(request, updateSceneSchema);
    if (parsed.response) return parsed.response;
    const scene = await updateSceneForUser(user.id, sceneId, parsed.data);
    return NextResponse.json({ scene });
  } catch {
    return unauthorized();
  }
}
