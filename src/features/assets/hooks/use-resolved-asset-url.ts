"use client";

import { useEffect, useState } from "react";

const SIGNED_URL_CACHE_MS = 12 * 60 * 1000;
const sourceCache: SourceCache = new Map();

type CachedSource = {
  expiresAt: number;
  url: string;
};

type SourceCache = Map<string, CachedSource | Promise<string | null>>;

export function useResolvedAssetUrl(source?: string | null) {
  const [url, setUrl] = useState<string | null>(directUrl(source));

  useEffect(() => {
    let active = true;
    setUrl(directUrl(source));
    if (!source?.startsWith("/api/")) return;
    void resolveSourceUrl(source).then((nextUrl) => {
      if (active) setUrl(nextUrl);
    });
    return () => {
      active = false;
    };
  }, [source]);

  return url;
}

async function resolveSourceUrl(source: string) {
  const cached = sourceCache.get(source);
  if (cached instanceof Promise) return cached;
  if (cached && cached.expiresAt > Date.now()) return cached.url;
  if (cached) sourceCache.delete(source);
  const pending = fetchSignedUrl(source);
  sourceCache.set(source, pending);
  const resolved = await pending;
  if (resolved) sourceCache.set(source, cachedSource(resolved));
  else sourceCache.delete(source);
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

function directUrl(source?: string | null) {
  if (!source || source.startsWith("/api/")) return null;
  return source;
}
