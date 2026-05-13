import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { retryFailedAiCreatorScene } from "@/features/ai-creator/server/ai-creator-sequence-service";
import { generationErrorResponse } from "@/features/generation/server/generation-api-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ sequenceId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { sequenceId } = await context.params;
    const job = await retryFailedAiCreatorScene(user.id, sequenceId);
    return NextResponse.json({ job });
  } catch (error) {
    return generationErrorResponse(error, "AI Creator retry failed");
  }
}
