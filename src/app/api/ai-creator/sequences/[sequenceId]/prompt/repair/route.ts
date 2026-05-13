import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { aiCreatorPromptSchema } from "@/features/ai-creator/server/ai-creator-prompt-schema";
import { repairAiCreatorPrompt } from "@/features/ai-creator/server/ai-creator-prompt-repair-service";
import { parseJson, serverError, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ sequenceId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { sequenceId } = await context.params;
    const parsed = await parseJson(request, aiCreatorPromptSchema);
    if (parsed.response) return parsed.response;
    const result = await repairAiCreatorPrompt(user.id, sequenceId, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return error instanceof Error && error.message === "Unauthorized"
      ? unauthorized()
      : serverError("AI Creator prompt repair failed");
  }
}
