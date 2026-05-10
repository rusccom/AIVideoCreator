import { NextResponse } from "next/server";
import { z } from "zod";

export type ParseResult<T> = {
  data: T;
  response?: never;
} | {
  data?: never;
  response: NextResponse;
};

export async function parseJson<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<ParseResult<T>> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    return result.success ? { data: result.data } : badRequest("Invalid request body");
  } catch {
    return badRequest("Request body must be valid JSON");
  }
}

export function badRequest(message: string): ParseResult<never> {
  return {
    response: NextResponse.json({ error: message }, { status: 400 })
  };
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function paymentRequired(message: string) {
  return NextResponse.json({ error: message }, { status: 402 });
}

export function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export function serverError(message = "Server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}
