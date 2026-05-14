"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteProjectPhoto, fetchProjectPhotos, uploadProjectPhoto } from "../client/photo-library-client";
import type { PhotoLibraryAsset } from "../types";

type UsePhotoLibraryInput = {
  initialAssets?: PhotoLibraryAsset[];
  projectId: string;
};

export function usePhotoLibrary(input: UsePhotoLibraryInput) {
  const [assets, setAssets] = useState(input.initialAssets ?? []);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const refresh = useCallback(() => refreshAssets(input.projectId, setAssets, setError, setLoading), [input.projectId]);

  useEffect(() => { void refresh(); }, [refresh]);
  const upload = (file: File) => uploadAsset(input.projectId, file, refresh, setError, setUploading);
  const deleteAsset = (assetId: string) => removeAsset(assetId, refresh, setError, setDeletingId);
  return { assets, deleteAsset, deletingId, error, loading, refresh, upload, uploading };
}

async function refreshAssets(
  projectId: string,
  setAssets: SetAssets,
  setError: SetError,
  setLoading: SetBoolean
) {
  setLoading(true);
  setError("");
  try {
    setAssets(await fetchProjectPhotos(projectId));
  } catch (error) {
    setError(errorMessage(error));
  } finally {
    setLoading(false);
  }
}

async function uploadAsset(
  projectId: string,
  file: File,
  refresh: () => Promise<void>,
  setError: SetError,
  setUploading: SetBoolean
) {
  setUploading(true);
  setError("");
  try {
    const assetId = await uploadProjectPhoto(projectId, file);
    await refresh();
    return assetId;
  } catch (error) {
    setError(errorMessage(error));
    return null;
  } finally {
    setUploading(false);
  }
}

async function removeAsset(
  assetId: string,
  refresh: () => Promise<void>,
  setError: SetError,
  setDeletingId: SetOptionalString
) {
  setDeletingId(assetId);
  setError("");
  try {
    await deleteProjectPhoto(assetId);
    await refresh();
    return true;
  } catch (error) {
    setError(errorMessage(error));
    return false;
  } finally {
    setDeletingId(undefined);
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Photo library action failed.";
}

type SetAssets = (assets: PhotoLibraryAsset[]) => void;
type SetBoolean = (value: boolean) => void;
type SetError = (value: string) => void;
type SetOptionalString = (value?: string) => void;
