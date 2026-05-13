"use client";

import { useResolvedAssetUrl } from "@/features/assets/hooks/use-resolved-asset-url";

type PhotoLibraryImageProps = {
  alt: string;
  source?: string | null;
};

export function PhotoLibraryImage(props: PhotoLibraryImageProps) {
  const url = useResolvedAssetUrl(props.source);
  if (!url) return <span className="photo-library-image">No preview</span>;
  return <img alt={props.alt} className="photo-library-image" src={url} />;
}
