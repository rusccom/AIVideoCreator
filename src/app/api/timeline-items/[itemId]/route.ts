import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/application/auth/server";
import { deleteTimelineItemForUser } from "@/application/timeline/server";
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
