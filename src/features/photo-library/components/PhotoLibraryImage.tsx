"use client";

import { useState } from "react";
import { useResolvedAssetUrl } from "@/features/assets/hooks/use-resolved-asset-url";

type PhotoLibraryImageProps = {
  alt: string;
  fallback?: string;
  source?: string | null;
};

export function PhotoLibraryImage(props: PhotoLibraryImageProps) {
  const url = useResolvedAssetUrl(props.source);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (!url || failedUrl === url) return <span className="photo-library-image">{fallbackText(props.fallback)}</span>;
  return <img alt={props.alt} className="photo-library-image" onError={() => setFailedUrl(url)} src={url} />;
}

function fallbackText(fallback?: string) {
  return fallback ?? "No preview";
}
