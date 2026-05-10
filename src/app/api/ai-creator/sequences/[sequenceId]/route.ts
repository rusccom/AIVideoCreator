import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { getAiCreatorSequenceStatus } from "@/features/ai-creator/server/ai-creator-sequence-service";
import { serverError, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ sequenceId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { sequenceId } = await context.params;
    const status = await getAiCreatorSequenceStatus(user.id, sequenceId);
    return NextResponse.json(status);
  } catch (error) {
    return error instanceof Error && error.message === "Unauthorized"
      ? unauthorized()
      : serverError("AI Creator sequence refresh failed");
  }
}
