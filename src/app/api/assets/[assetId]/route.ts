import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { deleteAssetForUser } from "@/features/assets/server/asset-service";
import { unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ assetId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { assetId } = await context.params;
    const asset = await deleteAssetForUser(user.id, assetId);
    return NextResponse.json({ asset });
  } catch {
    return unauthorized();
  }
}
