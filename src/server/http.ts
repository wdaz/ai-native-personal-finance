import type { ErrorEnvelope } from "@/src/shared/schemas";

/**
 * SPEC-auth §2.10: every API error is an `ErrorEnvelope` (src/shared/schemas.ts). The codes
 * are the schema's own, so this file keeps no list of them.
 */
export type ApiErrorCode = ErrorEnvelope["error"];

export function errorResponse(status: number, error: ApiErrorCode, message: string): Response {
  const body: ErrorEnvelope = { error, message };
  return Response.json(body, { status });
}
