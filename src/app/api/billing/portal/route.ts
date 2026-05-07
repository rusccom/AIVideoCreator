import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { createPortalSession } from "@/features/billing/server/billing-service";
import { serverError, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await requireCurrentUser();
    const session = await createPortalSession(user.id);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    return error instanceof Error && error.message === "Unauthorized" ? unauthorized() : serverError("Portal failed");
  }
}
