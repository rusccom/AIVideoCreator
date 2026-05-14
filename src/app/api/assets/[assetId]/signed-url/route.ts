import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/application/auth/server";
import { getAssetReadUrl } from "@/application/assets/server";
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
