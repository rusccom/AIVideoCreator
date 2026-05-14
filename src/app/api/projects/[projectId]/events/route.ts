import { requireCurrentUser } from "@/application/auth/server";
import { openProjectEventStream } from "@/application/realtime/project-event-stream";
import { unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { projectId } = await context.params;
    return openProjectEventStream(user.id, projectId, request);
  } catch {
    return unauthorized();
  }
}
