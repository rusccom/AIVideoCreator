import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/features/auth/server/current-user";
import { checkoutSchema } from "@/features/billing/server/billing-schema";
import { createCheckoutSession } from "@/features/billing/server/billing-service";
import { parseJson, serverError, unauthorized } from "@/shared/server/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const parsed = await parseJson(request, checkoutSchema);
    if (parsed.response) return parsed.response;
    const session = await createCheckoutSession(user, parsed.data.priceId);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    return error instanceof Error && error.message === "Unauthorized" ? unauthorized() : serverError("Checkout failed");
  }
}
