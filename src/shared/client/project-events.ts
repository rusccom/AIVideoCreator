"use client";

type ProjectEventListener = (event: MessageEvent<string>) => void;

type ProjectEventEntry = {
  listeners: Map<string, Set<ProjectEventListener>>;
  source: EventSource;
};

const entries = new Map<string, ProjectEventEntry>();

export function subscribeProjectEvents(projectId: string, types: readonly string[], listener: ProjectEventListener) {
  const cleanups = types.map((type) => subscribeProjectEvent(projectId, type, listener));
  return () => cleanups.forEach((cleanup) => cleanup());
}

export function subscribeProjectEvent(projectId: string, type: string, listener: ProjectEventListener) {
  const entry = projectEntry(projectId);
  const listeners = listenersForType(entry, type);
  listeners.add(listener);
  entry.source.addEventListener(type, listener as EventListener);
  return () => unsubscribeProjectEvent(projectId, type, listener);
}

function projectEntry(projectId: string) {
  const existing = entries.get(projectId);
  if (existing) return existing;
  const source = new EventSource(`/api/projects/${projectId}/events`);
  source.onerror = () => undefined;
  const entry = { listeners: new Map<string, Set<ProjectEventListener>>(), source };
  entries.set(projectId, entry);
  return entry;
}

function listenersForType(entry: ProjectEventEntry, type: string) {
  const existing = entry.listeners.get(type);
  if (existing) return existing;
  const listeners = new Set<ProjectEventListener>();
  entry.listeners.set(type, listeners);
  return listeners;
}

function unsubscribeProjectEvent(projectId: string, type: string, listener: ProjectEventListener) {
  const entry = entries.get(projectId);
  if (!entry) return;
  entry.source.removeEventListener(type, listener as EventListener);
  entry.listeners.get(type)?.delete(listener);
  if (entry.listeners.get(type)?.size === 0) entry.listeners.delete(type);
  closeIfUnused(projectId, entry);
}

function closeIfUnused(projectId: string, entry: ProjectEventEntry) {
  if (entry.listeners.size > 0) return;
  entry.source.close();
  entries.delete(projectId);
}
