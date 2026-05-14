import { ensureOutboxDispatcherStarted, publishPendingOutboxEvents } from "@/shared/server/outbox-publisher";
import { prisma } from "@/shared/server/prisma";
import { subscribeProjectEvents, type ProjectRealtimeEvent } from "@/shared/server/realtime-bus";

export async function openProjectEventStream(userId: string, projectId: string, request: Request) {
  await assertProjectOwner(userId, projectId);
  ensureOutboxDispatcherStarted();
  return projectEventStream(request, projectId);
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
  const state = streamState(controller, encoder);
  const unsubscribe = subscribeProjectEvents(projectId, state.send);
  const heartbeat = setInterval(state.ping, 25000);
  const cleanup = () => {
    request.signal.removeEventListener("abort", cleanup);
    closeStream(state, unsubscribe, heartbeat);
  };
  state.ping();
  void publishPendingOutboxEvents();
  request.signal.addEventListener("abort", cleanup);
  return cleanup;
}

function streamState(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder
) {
  let active = true;
  function close() {
    if (!active) return;
    active = false;
    controller.close();
  }
  return {
    close,
    ping: () => enqueueComment(controller, encoder),
    send: (event: ProjectRealtimeEvent) => enqueue(controller, encoder, event)
  };
}

function closeStream(state: StreamState, unsubscribe: () => void, heartbeat: NodeJS.Timeout) {
  clearInterval(heartbeat);
  unsubscribe();
  state.close();
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

type StreamState = ReturnType<typeof streamState>;
