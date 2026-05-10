import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { r2Storage } from "@/features/assets/server/r2-storage";
import { getExportJob } from "@/features/exports/server/export-service";
import { notFound, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ exportId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { exportId } = await context.params;
    const job = await getExportJob(user.id, exportId);
    if (!job) return notFound();
    const url = await exportUrl(job.storageKey, job.project?.title);
    return NextResponse.json({ job: { ...job, url } });
  } catch {
    return unauthorized();
  }
}

async function exportUrl(storageKey: string | null | undefined, projectTitle?: string) {
  if (!storageKey) return null;
  if (storageKey.startsWith("http")) return null;
  return r2Storage.createGetUrl(storageKey, { downloadFileName: downloadName(projectTitle) });
}

function downloadName(projectTitle?: string) {
  const base = projectTitle?.trim() || "export";
  return `${base}.mp4`;
}
