import { timingSafeEqual } from "node:crypto";
import type { z } from "zod";
import { AdminResetSchema, type AdminResetBody, type ErrorIssue } from "@/src/shared/schemas";
import { getDb } from "./db";
import { cronSecret, type Env } from "./env";
import { errorResponse, validationErrorResponse } from "./http";
import { resetToSeed } from "./reset";

/**
 * `Authorization: Bearer <token>` → the token; anything else → null. The scheme is matched
 * case-insensitively (RFC 7235 §2.1: "bearer" and "BEARER" are the same scheme).
 */
export function bearerToken(header: string | null): string | null {
  const match = /^bearer (.*)$/i.exec(header ?? "");
  return match ? (match[1] ?? "") : null;
}

/**
 * Constant-time for equal lengths. A length mismatch returns early (`timingSafeEqual` throws on
 * one), which leaks only the secret's length (T-08 plan D6). A `null` secret — `CRON_SECRET`
 * unset — matches nothing (D7).
 */
function sameSecret(token: string | null, secret: string | null): boolean {
  if (!token || !secret) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * SPEC-reset-and-test-support §2.2–2.3: `RESET_SECRET` or `CRON_SECRET`, the one Vercel sends
 * on a scheduled call. Either may be unset: an unset secret matches nothing, so the route fails
 * closed (401) rather than answering 500. A valid `CRON_SECRET` then still runs the scheduled
 * reset when `RESET_SECRET` is missing (PR #20 review, finding 1). A missing `RESET_SECRET` is
 * still a configuration fault, so it is logged. The token is never logged.
 */
export function isAuthorized(header: string | null, env: Env = process.env): boolean {
  const token = bearerToken(header);
  const reset = env.RESET_SECRET ? env.RESET_SECRET : null;
  const cron = cronSecret(env);
  if (reset === null) {
    console.error(
      "admin reset: RESET_SECRET is not set (.env.example); only CRON_SECRET can match",
    );
  }
  // Both comparisons always run, so the time taken does not say which secret matched.
  const matchesReset = sameSecret(token, reset);
  const matchesCron = sameSecret(token, cron);
  return matchesReset || matchesCron;
}

/**
 * The 400 envelope's issues for a refused body. `toErrorIssues` maps only the codes the auth
 * schemas produce and throws on the others (an unknown enum value, an unlisted key, a body that
 * is not an object); here every issue is an `invalid_format`, and an unlisted key is named in
 * its own path, as `/api/test/seed` does for its variant (T-08 plan v0.5, correction 3).
 */
export function adminResetIssues(issues: readonly z.core.$ZodIssue[]): ErrorIssue[] {
  return issues.flatMap((issue) => {
    const path = issue.path.map((key) => (typeof key === "symbol" ? String(key) : key));
    return issue.code === "unrecognized_keys"
      ? issue.keys.map((key) => ({ path: [...path, key], code: "invalid_format" as const }))
      : [{ path, code: "invalid_format" as const }];
  });
}

type AdminResetReason = AdminResetBody["reason"];

export function parseAdminResetBody(
  body: unknown,
): { success: true; reason: AdminResetReason } | { success: false; issues: ErrorIssue[] } {
  const parsed = AdminResetSchema.safeParse(body);
  return parsed.success
    ? { success: true, reason: parsed.data.reason }
    : { success: false, issues: adminResetIssues(parsed.error.issues) };
}

/** SPEC-reset-and-test-support §2.2's log line. It never names the secret. */
export function resetLogLine(reason: AdminResetReason, rows: number, requestId: string): string {
  return `reset reason=${reason} rows=${rows} requestId=${requestId}`;
}

/** A `POST` body: none at all is `{}` (reason "manual"); text that is not JSON is refused. */
async function readBody(request: Request): Promise<{ ok: true; body: unknown } | { ok: false }> {
  const text = await request.text();
  if (text.trim() === "") return { ok: true, body: {} };
  try {
    return { ok: true, body: JSON.parse(text) as unknown };
  } catch {
    return { ok: false };
  }
}

/**
 * `POST /api/admin/reset` (SPEC-reset-and-test-support §2.2) and `GET /api/admin/reset` — how
 * Vercel's cron calls it: a bodyless GET with the `CRON_SECRET` as its Authorization header,
 * always the scheduled reset (§2.3, T-08 plan Q1 (a)). 204, 400, 401, or the 500 envelope.
 */
export async function handleAdminReset(
  method: "GET" | "POST",
  request: Request,
  env: Env = process.env,
): Promise<Response> {
  try {
    if (!isAuthorized(request.headers.get("authorization"), env)) {
      return errorResponse(401, "unauthenticated", "Missing or wrong reset secret");
    }
    let reason: AdminResetReason = "scheduled";
    if (method === "POST") {
      const read = await readBody(request);
      if (!read.ok) return validationErrorResponse([{ path: [], code: "invalid_format" }]);
      const parsed = parseAdminResetBody(read.body);
      if (!parsed.success) return validationErrorResponse(parsed.issues);
      reason = parsed.reason;
    }
    const { rows } = await resetToSeed(getDb(), reason);
    console.log(resetLogLine(reason, rows, request.headers.get("x-request-id") ?? "none"));
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(`${method} /api/admin/reset failed`, error);
    return errorResponse(500, "server_error", "The reset failed");
  }
}
