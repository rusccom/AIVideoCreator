import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { uploadUrlSchema } from "@/features/assets/server/asset-schema";
import { createUploadUrl } from "@/features/assets/server/asset-service";
import { parseJson, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const parsed = await parseJson(request, uploadUrlSchema);
    if (parsed.response) return parsed.response;
    const result = await createUploadUrl(user.id, parsed.data);
    return NextResponse.json(result);
  } catch {
    return unauthorized();
  }
}
