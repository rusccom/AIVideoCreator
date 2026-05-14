import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/application/auth/server";
import { deleteAssetForUser } from "@/application/assets/server";
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
