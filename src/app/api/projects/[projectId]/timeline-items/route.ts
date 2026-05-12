import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { createTimelineItemSchema } from "@/features/timeline/server/timeline-schema";
import { createTimelineItemForUser } from "@/features/timeline/server/timeline-service";
import { parseJson, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { projectId } = await context.params;
    const parsed = await parseJson(request, createTimelineItemSchema);
    if (parsed.response) return parsed.response;
    const item = await createTimelineItemForUser(user.id, projectId, parsed.data);
    return NextResponse.json({ item });
  } catch {
    return unauthorized();
  }
}
