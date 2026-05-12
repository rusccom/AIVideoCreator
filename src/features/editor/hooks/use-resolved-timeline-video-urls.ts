"use client";

import { useEffect, useState } from "react";
import type { EditorTimelineItem } from "../types";

export function useResolvedTimelineVideoUrls(items: readonly EditorTimelineItem[]) {
  const [urls, setUrls] = useState<Record<string, string | null>>({});
  useEffect(() => {
    let cancelled = false;
    setUrls((current) => pruneUrls(current, items));
    for (const item of items) {
      if (!item.scene.videoUrl) continue;
      void resolveItemUrl(item, (id, url) => {
        if (!cancelled) setUrls((current) => ({ ...current, [id]: url }));
      });
    }
    return () => {
      cancelled = true;
    };
  }, [items]);
  return urls;
}

async function resolveItemUrl(
  item: EditorTimelineItem,
  setUrl: (itemId: string, url: string | null) => void
) {
  const source = item.scene.videoUrl;
  if (!source) return setUrl(item.id, null);
  if (!source.startsWith("/api/")) return setUrl(item.id, source);
  try {
    const response = await fetch(source, { cache: "no-store" });
    if (!response.ok) return setUrl(item.id, null);
    const data = await response.json();
    setUrl(item.id, typeof data.url === "string" ? data.url : null);
  } catch {
    setUrl(item.id, null);
  }
}

function pruneUrls(current: Record<string, string | null>, items: readonly EditorTimelineItem[]) {
  const ids = new Set(items.map((item) => item.id));
  return Object.fromEntries(Object.entries(current).filter(([id]) => ids.has(id)));
}
