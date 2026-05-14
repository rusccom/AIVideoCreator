import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/application/auth/server";
import { reorderTimelineSchema } from "@/application/timeline/server";
import { reorderTimelineForUser } from "@/application/timeline/server";
import { parseJson, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { projectId } = await context.params;
    const parsed = await parseJson(request, reorderTimelineSchema);
    if (parsed.response) return parsed.response;
    const items = await reorderTimelineForUser(user.id, projectId, parsed.data);
    return NextResponse.json({ items });
  } catch {
    return unauthorized();
  }
}
