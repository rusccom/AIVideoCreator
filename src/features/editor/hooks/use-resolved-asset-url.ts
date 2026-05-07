"use client";

import { useEffect, useState } from "react";

export function useResolvedAssetUrl(source?: string | null) {
  const [url, setUrl] = useState<string | null>(directUrl(source));

  useEffect(() => {
    let cancelled = false;
    setUrl(directUrl(source));
    if (!source?.startsWith("/api/")) return;
    void resolveUrl(source, (nextUrl) => {
      if (!cancelled) setUrl(nextUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [source]);

  return url;
}

async function resolveUrl(source: string, setUrl: (url: string | null) => void) {
  try {
    const response = await fetch(source);
    if (!response.ok) return setUrl(null);
    const data = await response.json();
    setUrl(typeof data.url === "string" ? data.url : null);
  } catch {
    setUrl(null);
  }
}

function directUrl(source?: string | null) {
  if (!source || source.startsWith("/api/")) return null;
  return source;
}
