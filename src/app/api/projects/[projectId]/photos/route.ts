import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { listProjectPhotos } from "@/features/photo-library/server/photo-library-service";
import { serverError, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { projectId } = await context.params;
    const assets = await listProjectPhotos(user.id, projectId);
    return NextResponse.json({ assets });
  } catch (error) {
    return error instanceof Error && error.message === "Unauthorized"
      ? unauthorized()
      : serverError("Project photos could not be loaded");
  }
}
