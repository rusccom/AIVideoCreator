import type { Prisma } from "@prisma/client";

export type ProjectRealtimeEvent = {
  payload: Prisma.JsonValue;
  type: string;
};

type ProjectListener = (event: ProjectRealtimeEvent) => void;
type ProjectListeners = Map<string, Set<ProjectListener>>;

const globalRealtime = globalThis as unknown as {
  projectRealtimeListeners?: ProjectListeners;
};

const listeners = globalRealtime.projectRealtimeListeners ?? new Map<string, Set<ProjectListener>>();
globalRealtime.projectRealtimeListeners = listeners;

export function subscribeProjectEvents(projectId: string, listener: ProjectListener) {
  const projectListeners = listeners.get(projectId) ?? new Set<ProjectListener>();
  projectListeners.add(listener);
  listeners.set(projectId, projectListeners);
  return () => unsubscribeProjectEvents(projectId, listener);
}

export function publishProjectEvent(projectId: string, event: ProjectRealtimeEvent) {
  const projectListeners = listeners.get(projectId);
  if (!projectListeners?.size) return false;
  projectListeners.forEach((listener) => listener(event));
  return true;
}

function unsubscribeProjectEvents(projectId: string, listener: ProjectListener) {
  const projectListeners = listeners.get(projectId);
  if (!projectListeners) return;
  projectListeners.delete(listener);
  if (!projectListeners.size) listeners.delete(projectId);
}
