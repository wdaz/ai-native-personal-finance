import type { z } from "zod";
import { ErrorEnvelopeSchema, type ErrorEnvelope } from "./schemas";

/**
 * SPEC-webmcp-tools §2.5 / ADR-0004: the fetch wrapper WebMCP tools use to reach the same
 * authenticated API as the UI. It never throws: every way a request can end is a value, so a
 * caller (a tool's `execute`) maps it once. It keeps no opinion about tool error codes — that
 * mapping is `src/webmcp/tool-result.ts`. The login and signup forms keep their own `fetch`
 * (moving them here is a separate change).
 */
export type ApiOutcome<T> =
  | { ok: true; data: T }
  /** A non-2xx answer; `error` is its envelope, or `null` when the body was not one. */
  | { ok: false; kind: "http"; status: number; error: ErrorEnvelope | null }
  /** A 2xx answer whose body was not JSON, or did not match the schema (drift, a proxy's page). */
  | { ok: false; kind: "invalid_response"; status: number }
  | { ok: false; kind: "aborted" }
  | { ok: false; kind: "network" };

export interface ApiGetOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

const isAbort = (error: unknown): boolean => error instanceof Error && error.name === "AbortError";

export async function apiGet<T>(
  path: string,
  schema: z.ZodType<T>,
  options: ApiGetOptions = {},
): Promise<ApiOutcome<T>> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "GET",
      headers: options.headers,
      signal: options.signal,
      credentials: "same-origin",
    });
  } catch (error) {
    return isAbort(error) ? { ok: false, kind: "aborted" } : { ok: false, kind: "network" };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    if (isAbort(error)) return { ok: false, kind: "aborted" };
    body = null;
  }

  if (response.ok) {
    const parsed = schema.safeParse(body);
    return parsed.success
      ? { ok: true, data: parsed.data }
      : { ok: false, kind: "invalid_response", status: response.status };
  }
  const envelope = ErrorEnvelopeSchema.safeParse(body);
  return {
    ok: false,
    kind: "http",
    status: response.status,
    error: envelope.success ? envelope.data : null,
  };
}
