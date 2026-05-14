import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";
import { publishProjectEvent } from "./realtime-bus";

const OUTBOX_BATCH_SIZE = 50;
const OUTBOX_INTERVAL_MS = 2500;

const globalOutbox = globalThis as unknown as {
  outboxDispatcher?: NodeJS.Timeout;
};

export async function publishPendingOutboxEvents() {
  const events = await prisma.outboxEvent.findMany({
    where: { publishedAt: null },
    orderBy: { createdAt: "asc" },
    take: OUTBOX_BATCH_SIZE
  });
  await Promise.all(events.map(publishOutboxEvent));
}

export function ensureOutboxDispatcherStarted() {
  if (globalOutbox.outboxDispatcher) return;
  globalOutbox.outboxDispatcher = setInterval(() => void publishPendingOutboxEvents(), OUTBOX_INTERVAL_MS);
}

async function publishOutboxEvent(event: OutboxEventRecord) {
  try {
    if (!publishEvent(event)) return;
    await markPublished(event.id);
  } catch (error) {
    await markFailed(event.id, error);
  }
}

function publishEvent(event: OutboxEventRecord) {
  if (event.aggregateType !== "project") return true;
  return publishProjectEvent(event.aggregateId, { type: event.type, payload: event.payload });
}

function markPublished(eventId: string) {
  return prisma.outboxEvent.updateMany({
    where: { id: eventId, publishedAt: null },
    data: { publishedAt: new Date(), lastError: null }
  });
}

function markFailed(eventId: string, error: unknown) {
  return prisma.outboxEvent.update({
    where: { id: eventId },
    data: { attempts: { increment: 1 }, lastError: errorMessage(error) }
  });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Outbox publish failed";
}

type OutboxEventRecord = {
  aggregateId: string;
  aggregateType: string;
  id: string;
  payload: Prisma.JsonValue;
  type: string;
};
