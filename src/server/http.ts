import type { ErrorEnvelope, ErrorIssue } from "@/src/shared/schemas";

/**
 * SPEC-auth §2.10: every API error is an `ErrorEnvelope` (src/shared/schemas.ts). The codes
 * are the schema's own, so this file keeps no list of them.
 */
export type ApiErrorCode = ErrorEnvelope["error"];

/** Every code with a fixed banner/notice message (401, 404, 409, 429's message half, 500). */
export function errorResponse(status: number, error: ApiErrorCode, message: string): Response {
  const body: ErrorEnvelope = { error, message };
  return Response.json(body, { status });
}

/** SPEC-auth §2.10: a 400 carries `issues`, never `message` — no Zod default strings. */
export function validationErrorResponse(issues: ErrorIssue[]): Response {
  const body: ErrorEnvelope = { error: "validation", issues };
  return Response.json(body, { status: 400 });
}

/** SPEC-auth §4: `Retry-After` header (seconds) alongside the body's `retryAfter`. */
export function rateLimitedResponse(message: string, retryAfter: number): Response {
  const body: ErrorEnvelope = { error: "rate_limited", message, retryAfter };
  return Response.json(body, { status: 429, headers: { "Retry-After": String(retryAfter) } });
}
