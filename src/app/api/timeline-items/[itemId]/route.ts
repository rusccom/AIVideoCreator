import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { deleteTimelineItemForUser } from "@/features/timeline/server/timeline-service";
import { unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ itemId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { itemId } = await context.params;
    const item = await deleteTimelineItemForUser(user.id, itemId);
    return NextResponse.json({ item });
  } catch {
    return unauthorized();
  }
}
