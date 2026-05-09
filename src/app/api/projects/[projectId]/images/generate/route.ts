import { after, NextResponse } from "next/server";
import { moveRemoteAssetToR2 } from "@/features/assets/server/asset-storage-service";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { generateProjectImageSchema } from "@/features/image-generation/server/image-generation-schema";
import { generateProjectImage } from "@/features/image-generation/server/project-image-service";
import { parseJson, serverError, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { projectId } = await context.params;
    const parsed = await parseJson(request, generateProjectImageSchema);
    if (parsed.response) return parsed.response;
    const result = await generateProjectImage(user.id, projectId, parsed.data);
    after(() => moveAssetsToR2(result.transferAssets));
    return NextResponse.json({ assets: result.assets });
  } catch (error) {
    return error instanceof Error && error.message === "Unauthorized" ? unauthorized() : serverError("Image generation failed");
  }
}

async function moveAssetsToR2(assets: Awaited<ReturnType<typeof generateProjectImage>>["transferAssets"]) {
  await Promise.all(assets.map((asset) => moveRemoteAssetToR2(asset).catch(() => null)));
}
