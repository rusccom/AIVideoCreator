import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { createExportSchema } from "@/features/exports/server/export-schema";
import { createExportJob } from "@/features/exports/server/export-service";
import { parseJson, serverError, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const parsed = await parseJson(request, createExportSchema);
    if (parsed.response) return parsed.response;
    const job = await createExportJob(user.id, parsed.data);
    return NextResponse.json({ job });
  } catch (error) {
    return error instanceof Error && error.message === "Unauthorized" ? unauthorized() : serverError("Export failed");
  }
}
