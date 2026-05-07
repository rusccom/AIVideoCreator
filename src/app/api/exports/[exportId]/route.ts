import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { createGetUrl } from "@/features/assets/server/r2-client";
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
    return NextResponse.json({ job: { ...job, url: await exportUrl(job.storageKey) } });
  } catch {
    return unauthorized();
  }
}

async function exportUrl(storageKey?: string | null) {
  if (!storageKey) return null;
  if (storageKey.startsWith("http")) return storageKey;
  return createGetUrl(storageKey);
}
