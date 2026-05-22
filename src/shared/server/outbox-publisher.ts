import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";
import { publishProjectEvent } from "./realtime-bus";

const OUTBOX_BATCH_SIZE = 50;
const OUTBOX_INTERVAL_MS = 2500;

const globalOutbox = globalThis as unknown as {
  outboxDispatcher?: NodeJS.Timeout;
};

export async function publishPendingOutboxEvents() {
  const claimed = await claimPendingEvents();
  if (!claimed.length) return;
  const result = dispatchClaimedEvents(claimed);
  if (result.unhandledIds.length) await releaseUnhandled(result.unhandledIds);
  if (result.failed.length) await markDispatchFailed(result.failed);
}

function dispatchClaimedEvents(events: OutboxEventRecord[]) {
  const unhandledIds: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];
  for (const event of events) {
    const result = safeDispatch(event);
    if (result.kind === "no_listener") unhandledIds.push(event.id);
    else if (result.kind === "error") failed.push({ id: event.id, error: result.message });
  }
  return { unhandledIds, failed };
}

type DispatchResult = { kind: "ok" } | { kind: "no_listener" } | { kind: "error"; message: string };

function safeDispatch(event: OutboxEventRecord): DispatchResult {
  try {
    return dispatchEvent(event) ? { kind: "ok" } : { kind: "no_listener" };
  } catch (error) {
    return { kind: "error", message: error instanceof Error ? error.message : "Outbox publish failed" };
  }
}

export function ensureOutboxDispatcherStarted() {
  if (globalOutbox.outboxDispatcher) return;
  globalOutbox.outboxDispatcher = setInterval(() => void publishPendingOutboxEvents(), OUTBOX_INTERVAL_MS);
}

async function claimPendingEvents() {
  return prisma.$queryRaw<OutboxEventRecord[]>`
    WITH claimed AS (
      SELECT id FROM "OutboxEvent"
      WHERE "publishedAt" IS NULL
      ORDER BY "createdAt" ASC
      LIMIT ${OUTBOX_BATCH_SIZE}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE "OutboxEvent" SET "publishedAt" = NOW(), "lastError" = NULL
    WHERE id IN (SELECT id FROM claimed)
    RETURNING id, "aggregateId", "aggregateType", type, payload
  `;
}

function dispatchEvent(event: OutboxEventRecord) {
  if (event.aggregateType !== "project") return true;
  return publishProjectEvent(event.aggregateId, { type: event.type, payload: event.payload });
}

async function releaseUnhandled(ids: string[]) {
  await prisma.outboxEvent.updateMany({
    where: { id: { in: ids } },
    data: { publishedAt: null }
  });
}

async function markDispatchFailed(failed: Array<{ id: string; error: string }>) {
  await Promise.all(failed.map((entry) =>
    prisma.outboxEvent.update({
      where: { id: entry.id },
      data: { publishedAt: null, attempts: { increment: 1 }, lastError: entry.error }
    })
  ));
}

type OutboxEventRecord = {
  aggregateId: string;
  aggregateType: string;
  id: string;
  payload: Prisma.JsonValue;
  type: string;
};
