import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/application/auth/server";
import { createExportSchema } from "@/application/exports/server";
import { createExportJob } from "@/application/exports/server";
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
