"use client";

import { useEffect, useRef, useState } from "react";
import type { EditorTimelineItem } from "../types";

const SIGNED_URL_CACHE_MS = 12 * 60 * 1000;

type CachedSource = {
  expiresAt: number;
  url: string;
};

type SourceCache = Map<string, CachedSource | Promise<string | null>>;

export function useResolvedTimelineVideoUrls(items: readonly EditorTimelineItem[]) {
  const cacheRef = useRef<SourceCache>(new Map());
  const [urls, setUrls] = useState<Record<string, string | null>>({});
  useEffect(() => {
    let cancelled = false;
    void resolveTimelineUrls(items, cacheRef.current).then((next) => {
      if (!cancelled) setUrls(next);
    });
    return () => {
      cancelled = true;
    };
  }, [items]);
  return urls;
}

async function resolveTimelineUrls(items: readonly EditorTimelineItem[], cache: SourceCache) {
  const entries = await Promise.all(items.map((item) => resolveItemEntry(item, cache)));
  return Object.fromEntries(entries);
}

async function resolveItemEntry(item: EditorTimelineItem, cache: SourceCache) {
  const source = item.scene.videoUrl;
  if (!source) return [item.id, null] as const;
  return [item.id, await resolveSourceUrl(source, cache)] as const;
}

async function resolveSourceUrl(source: string, cache: SourceCache) {
  if (!source.startsWith("/api/")) return source;
  const cached = cache.get(source);
  if (cached instanceof Promise) return cached;
  if (cached && cached.expiresAt > Date.now()) return cached.url;
  if (cached) cache.delete(source);
  const pending = fetchSignedUrl(source);
  cache.set(source, pending);
  const resolved = await pending;
  if (resolved) cache.set(source, cachedSource(resolved));
  else cache.delete(source);
  return resolved;
}

function cachedSource(url: string): CachedSource {
  return {
    expiresAt: Date.now() + SIGNED_URL_CACHE_MS,
    url
  };
}

async function fetchSignedUrl(source: string) {
  try {
    const response = await fetch(source, { cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data.url === "string" ? data.url : null;
  } catch {
    return null;
  }
}
