import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiFailure, ApiSuccess } from "@/types";

export function apiSuccess<T>(data: T, init?: number): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status: init ?? 200 });
}

export function apiError(
  error: string,
  status = 400,
  fieldErrors?: Record<string, string[] | undefined>
) {
  const body: ApiFailure = { success: false, error };
  if (fieldErrors) body.fieldErrors = fieldErrors;
  return NextResponse.json(body, { status });
}

export function apiValidationError(err: ZodError) {
  return apiError("Validation failed", 422, err.flatten().fieldErrors);
}

/** Never leak internals (stack traces, driver errors) to the client — spec section 43. */
export function apiServerError(err: unknown) {
  console.error(err);
  return apiError("Something went wrong. Please try again.", 500);
}
