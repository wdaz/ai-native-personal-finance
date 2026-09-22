/**
 * SPEC-auth §2.10: every API error is `{ error, message }` with one of these codes. T-04
 * adds the `ErrorEnvelope` Zod schema to src/shared/schemas.ts; until then this is the
 * only place that writes one.
 */
export type ApiErrorCode =
  | "validation"
  | "invalid_credentials"
  | "rate_limited"
  | "unauthenticated"
  | "not_found"
  | "conflict"
  | "server_error";

export function errorResponse(status: number, error: ApiErrorCode, message: string): Response {
  return Response.json({ error, message }, { status });
}
