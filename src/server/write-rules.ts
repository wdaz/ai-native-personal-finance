import type { ErrorEnvelope } from "@/src/shared/schemas";

/**
 * SPEC-write-path 2.3–2.5, 2.12 and §6 "API": the proxy's two write checks. Pure and free of
 * Zod — `proxy.ts` imports this file, and a runtime import of `schemas.ts` would pull Zod and
 * `copy.ts` into the proxy bundle (PR #20 review, finding 8; T-17 plan F3). The bodies below are
 * typed against `ErrorEnvelope`, and `write-rules.test.ts` parses each with its schema.
 */

/** Methods that never write (2.1: "No `GET` handler changes data"). */
const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * 2.3: the exempt list, the *only* list (owner, §9 Q8) — exact paths, so `/api/auth/login.json`
 * is a write path; `/api/test/*` by prefix, since the test-support routes are one catch-all.
 */
export const WRITE_EXEMPT_PATHS = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
  "/api/admin/reset",
] as const;
export const WRITE_EXEMPT_PREFIX = "/api/test/";

/**
 * §6 "API": method not `GET`, `HEAD` or `OPTIONS`, in any letter case (Node answers a
 * non-upper-case method 400 before the proxy runs, v1.0.3, but the match costs nothing), path
 * under `/api/`, not exempt.
 */
export function isWriteRequest(method: string, pathname: string): boolean {
  if (READ_METHODS.has(method.toUpperCase())) return false;
  if (!pathname.startsWith("/api/")) return false;
  if (pathname.startsWith(WRITE_EXEMPT_PREFIX)) return false;
  return !(WRITE_EXEMPT_PATHS as readonly string[]).includes(pathname);
}

/** 2.3: exactly `cross-site`; `same-origin`, `same-site`, `none` and an absent header pass. */
export function isCrossSite(headers: Headers): boolean {
  return headers.get("sec-fetch-site") === "cross-site";
}

/**
 * 2.4: the media type before any `;`, compared exactly and case-insensitively with
 * `application/json`. A `POST`, `PUT` or `PATCH` must declare it; a `DELETE` may declare
 * nothing, but not another type.
 */
export function isContentTypeRefused(method: string, headers: Headers): boolean {
  const declared = headers.get("content-type");
  if (declared === null) return method.toUpperCase() !== "DELETE";
  const mediaType = declared.split(";")[0]?.trim().toLowerCase();
  return mediaType !== "application/json";
}

/** 2.6's 403 — also logout's (`auth.md` v1.0.10). */
export const FORBIDDEN_BODY = {
  error: "forbidden",
  message: "This request must be same-origin",
} as const satisfies ErrorEnvelope;

/** 2.6's 415: the shape `/api/admin/reset` uses for a body that is not JSON. */
export const UNSUPPORTED_TYPE_BODY = {
  error: "validation",
  issues: [{ path: [], code: "invalid_format" }],
} as const satisfies ErrorEnvelope;

export type RefusalLogEntry = {
  requestId: string;
  status: 403 | 415;
  method: string;
  route: string;
};

/**
 * 2.12: one structured line per refusal, printed the way the via entry is; a body is never
 * logged. Tested at unit level (7.1, v1.0.3): an API test cannot read the server's output.
 */
export function logRefusal(
  entry: RefusalLogEntry,
  write: (line: string) => void = console.log,
): void {
  write(JSON.stringify(entry));
}
