import type { ErrorEnvelope, ErrorIssue } from "@/src/shared/schemas";

/**
 * SPEC-auth §2.10: every API error is an `ErrorEnvelope` (src/shared/schemas.ts). The codes
 * are the schema's own, so this file keeps no list of them.
 */
export type ApiErrorCode = ErrorEnvelope["error"];

/** SPEC-write-path 2.2 step 10: every error answer is `no-store`, like the routes' successes. */
const NO_STORE = { "Cache-Control": "no-store" } as const;

/** Every code with a fixed banner/notice message (401, 403, 404, 409, 429's message half, 500). */
export function errorResponse(status: number, error: ApiErrorCode, message: string): Response {
  const body: ErrorEnvelope = { error, message };
  return Response.json(body, { status, headers: NO_STORE });
}

/**
 * SPEC-auth §2.10: a validation error carries `issues` and no Zod default strings. 400 unless
 * told otherwise; a refused content type is 415 (SPEC-write-path 2.6). Only a route whose spec
 * gives its 400 a `message` passes one (SPEC-transactions 2.13: the allowed values).
 */
export function validationErrorResponse(
  issues: ErrorIssue[],
  status = 400,
  message?: string,
): Response {
  const body: ErrorEnvelope = { error: "validation", ...(message ? { message } : {}), issues };
  return Response.json(body, { status, headers: NO_STORE });
}

/** SPEC-auth §4: `Retry-After` header (seconds) alongside the body's `retryAfter`. */
export function rateLimitedResponse(message: string, retryAfter: number): Response {
  const body: ErrorEnvelope = { error: "rate_limited", message, retryAfter };
  return Response.json(body, {
    status: 429,
    headers: { ...NO_STORE, "Retry-After": String(retryAfter) },
  });
}
