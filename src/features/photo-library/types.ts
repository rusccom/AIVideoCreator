export type PhotoLibraryAsset = {
  id: string;
  label: string;
  type: string;
  url?: string | null;
};

export type PhotoLibraryImageModel = {
  id: string;
  displayName: string;
  defaultAspectRatio: string;
  defaultResolution: string;
  supportsReferenceImage?: boolean;
  supportedAspectRatios: string[];
  supportedResolutions: string[];
};

export type PhotoLibraryMode = "manage" | "select";
