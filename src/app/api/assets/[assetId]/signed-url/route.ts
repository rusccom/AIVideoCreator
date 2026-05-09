import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { getAssetReadUrl } from "@/features/assets/server/asset-service";
import { serverError, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ assetId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { assetId } = await context.params;
    const url = await getAssetReadUrl(user.id, assetId);
    return NextResponse.json({ url });
  } catch (error) {
    return error instanceof Error && error.message === "Unauthorized"
      ? unauthorized()
      : serverError("Asset URL failed");
  }
}
