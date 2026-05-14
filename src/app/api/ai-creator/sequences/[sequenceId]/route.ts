import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/application/auth/server";
import { getAiCreatorSequenceStatus } from "@/application/ai-creator/server";
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
