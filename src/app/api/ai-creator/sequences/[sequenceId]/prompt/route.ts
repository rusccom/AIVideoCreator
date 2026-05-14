import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/application/auth/server";
import { aiCreatorPromptSchema } from "@/application/ai-creator/server";
import { updateFailedAiCreatorPrompt } from "@/application/ai-creator/server";
import { parseJson, serverError, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ sequenceId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { sequenceId } = await context.params;
    const parsed = await parseJson(request, aiCreatorPromptSchema);
    if (parsed.response) return parsed.response;
    const scene = await updateFailedAiCreatorPrompt(user.id, sequenceId, parsed.data.prompt);
    return NextResponse.json({ scene });
  } catch (error) {
    return error instanceof Error && error.message === "Unauthorized"
      ? unauthorized()
      : serverError("AI Creator prompt update failed");
  }
}
