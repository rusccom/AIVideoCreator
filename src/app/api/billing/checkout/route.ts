import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/application/auth/server";
import { checkoutSchema } from "@/application/billing/server";
import { createTopUpCheckoutSession } from "@/application/billing/server";
import { parseJson, serverError, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const parsed = await parseJson(request, checkoutSchema);
    if (parsed.response) return parsed.response;
    const session = await createTopUpCheckoutSession(user, parsed.data.packageKey);
    if (!session.url) return serverError("Checkout URL missing");
    return NextResponse.json({ url: session.url });
  } catch (error) {
    return error instanceof Error && error.message === "Unauthorized" ? unauthorized() : serverError("Checkout failed");
  }
}
