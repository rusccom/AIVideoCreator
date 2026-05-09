import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { refreshGenerationJobForUser } from "@/features/generation/server/job-service";
import { serverError, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { jobId } = await context.params;
    const job = await refreshGenerationJobForUser(user.id, jobId);
    return NextResponse.json(job);
  } catch (error) {
    return error instanceof Error && error.message === "Unauthorized" ? unauthorized() : serverError("Job refresh failed");
  }
}
