import { requireCurrentUser } from "@/features/auth/server/current-user";
import { publishPendingOutboxEvents } from "@/shared/server/outbox-publisher";
import { prisma } from "@/shared/server/prisma";
import { subscribeProjectEvents, type ProjectRealtimeEvent } from "@/shared/server/realtime-bus";
import { unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { projectId } = await context.params;
    await assertProjectOwner(user.id, projectId);
    await publishPendingOutboxEvents();
    return projectEventStream(request, projectId);
  } catch {
    return unauthorized();
  }
}

async function assertProjectOwner(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true }
  });
  if (!project) throw new Error("Project not found");
}

function projectEventStream(request: Request, projectId: string) {
  const encoder = new TextEncoder();
  let cleanup: () => void = () => undefined;
  const stream = new ReadableStream({
    start(controller) {
      cleanup = startProjectStream(request, projectId, controller, encoder);
    },
    cancel() {
      cleanup();
    }
  });
  return new Response(stream, { headers: streamHeaders() });
}

function startProjectStream(
  request: Request,
  projectId: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder
) {
  let active = true;
  const send = (event: ProjectRealtimeEvent) => enqueue(controller, encoder, event);
  const unsubscribe = subscribeProjectEvents(projectId, send);
  const heartbeat = windowlessInterval(() => enqueueComment(controller, encoder), 25000);
  enqueueComment(controller, encoder);
  request.signal.addEventListener("abort", cleanup);
  return cleanup;
  function cleanup() {
    if (!active) return;
    active = false;
    request.signal.removeEventListener("abort", cleanup);
    clearInterval(heartbeat);
    unsubscribe();
    controller.close();
  }
}

function enqueue(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  event: ProjectRealtimeEvent
) {
  controller.enqueue(encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`));
}

function enqueueComment(controller: ReadableStreamDefaultController<Uint8Array>, encoder: TextEncoder) {
  controller.enqueue(encoder.encode(": ping\n\n"));
}

function streamHeaders() {
  return {
    "Cache-Control": "no-store, no-transform",
    Connection: "keep-alive",
    "Content-Type": "text/event-stream; charset=utf-8",
    "X-Accel-Buffering": "no",
    "X-Content-Type-Options": "nosniff"
  };
}

function windowlessInterval(callback: () => void, ms: number) {
  return setInterval(callback, ms);
}
