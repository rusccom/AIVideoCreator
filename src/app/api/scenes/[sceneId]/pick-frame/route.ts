import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/application/auth/server";
import { pickFrameSchema } from "@/application/generation/server";
import { pickFrameForUser } from "@/application/generation/server";
import { parseJson, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ sceneId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { sceneId } = await context.params;
    const parsed = await parseJson(request, pickFrameSchema);
    if (parsed.response) return parsed.response;
    const job = await pickFrameForUser(user.id, sceneId, parsed.data);
    return NextResponse.json({ job });
  } catch {
    return unauthorized();
  }
}
