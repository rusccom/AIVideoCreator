import type { Prisma } from "@prisma/client";

export type OutboxEventInput = {
  aggregateType: string;
  aggregateId: string;
  type: string;
  payload: Prisma.InputJsonValue;
};

export async function recordOutboxEvent(tx: Prisma.TransactionClient, event: OutboxEventInput) {
  await tx.outboxEvent.create({ data: event });
}

export async function recordOutboxEvents(tx: Prisma.TransactionClient, events: OutboxEventInput[]) {
  if (!events.length) return;
  await tx.outboxEvent.createMany({ data: events });
}
