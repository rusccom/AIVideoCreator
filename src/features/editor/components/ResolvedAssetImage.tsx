"use client";

import { useState } from "react";
import { useResolvedAssetUrl } from "@/shared/client/use-resolved-asset-url";

type ResolvedAssetImageProps = {
  alt: string;
  className: string;
  fallback?: string;
  loading?: "eager" | "lazy";
  source?: string | null;
};

export function ResolvedAssetImage(props: ResolvedAssetImageProps) {
  const url = useResolvedAssetUrl(props.source);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (!url || failedUrl === url) return <span className={props.className}>{fallbackText(props.fallback)}</span>;
  return (
    <img
      alt={props.alt}
      className={props.className}
      decoding="async"
      loading={props.loading ?? "lazy"}
      onError={() => setFailedUrl(url)}
      src={url}
    />
  );
}

function fallbackText(fallback?: string) {
  return fallback ?? "No preview";
}
