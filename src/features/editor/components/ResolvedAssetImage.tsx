"use client";

import { useResolvedAssetUrl } from "../hooks/use-resolved-asset-url";

type ResolvedAssetImageProps = {
  alt: string;
  className: string;
  fallback?: string;
  source?: string | null;
};

export function ResolvedAssetImage(props: ResolvedAssetImageProps) {
  const url = useResolvedAssetUrl(props.source);
  if (!url) return <span className={props.className}>{props.fallback}</span>;
  return <img alt={props.alt} className={props.className} src={url} />;
}
