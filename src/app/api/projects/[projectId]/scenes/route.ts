import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/application/auth/server";
import { createSceneSchema } from "@/application/generation/server";
import { createSceneForUser } from "@/application/generation/server";
import { parseJson, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { projectId } = await context.params;
    const parsed = await parseJson(request, createSceneSchema);
    if (parsed.response) return parsed.response;
    const scene = await createSceneForUser(user.id, projectId, parsed.data);
    return NextResponse.json({ scene });
  } catch {
    return unauthorized();
  }
}
