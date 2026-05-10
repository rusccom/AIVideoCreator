import { paymentRequired, serverError, unauthorized } from "@/shared/server/api";

export function generationErrorResponse(error: unknown, fallback: string) {
  if (error instanceof Error && error.message === "Unauthorized") return unauthorized();
  if (error instanceof Error && error.message === "Insufficient credits") return paymentRequired(error.message);
  return serverError(fallback);
}
