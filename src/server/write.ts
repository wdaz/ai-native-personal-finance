import type { z } from "zod";
import { RecordIdSchema, toWriteIssues, type ErrorIssue } from "@/src/shared/schemas";
import { clientIp } from "./client-ip";
import { getDb, type Db } from "./db";
import { writeRateLimitMax, writeRateLimitWindowSeconds, type Env } from "./env";
import { Prisma } from "./generated/prisma/client";
import { errorResponse, rateLimitedResponse, validationErrorResponse } from "./http";
import { resetToSeed } from "./reset";
import { checkThreshold } from "./threshold";
import { checkWriteLimit } from "./write-limit";

/** The client of one write's transaction. */
export type WriteTx = Prisma.TransactionClient;

/**
 * What a route's `run` ends with. Anything but `ok` rolls the whole transaction back
 * (SPEC-write-path 2.8: a conditional update that touched no row means nothing is written).
 */
export type WriteOutcome =
  | { kind: "ok"; status: 200 | 201; body: unknown }
  | { kind: "ok"; status: 204 }
  | { kind: "not_found" }
  | { kind: "validation"; issues: ErrorIssue[] };

export interface GuardedWriteOptions<T> {
  /** The request's time, read by the route (ADR-0005: no clock in server business code). */
  now: Date;
  /** The body's schema (2.7); a `DELETE` has none and reads no body (2.2 step 6). */
  schema?: z.ZodType<T>;
  /** The path `id` when the route has one, validated before the body (4.4). */
  id?: string;
  run: (tx: WriteTx, input: T | undefined, id: string | undefined) => Promise<WriteOutcome>;
  /** For tests: the database and the environment. */
  db?: Db;
  env?: Env;
}

class Rollback extends Error {
  constructor(readonly outcome: Exclude<WriteOutcome, { kind: "ok" }>) {
    super("rollback");
  }
}

const INVALID_BODY: ErrorIssue[] = [{ path: [], code: "invalid_format" }];

/**
 * A unique constraint the database enforced (2.8, "the last line of defence for `taken`"):
 * Prisma's P2002, on the field it names. `meta.target` is the field list on a direct
 * connection; through the pg driver adapter only the index is named, as Prisma names it:
 * `<Model>_<field>[_<field>…]_key` (field names are camelCase, so `_` separates them).
 */
function takenIssue(error: unknown): ErrorIssue[] | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return null;
  }
  const meta = error.meta as
    | {
        target?: unknown;
        driverAdapterError?: {
          cause?: { constraint?: { fields?: unknown; index?: unknown }; table?: unknown };
        };
      }
    | undefined;
  const cause = meta?.driverAdapterError?.cause;
  let field: unknown = Array.isArray(meta?.target) ? meta.target[0] : undefined;
  if (field === undefined && Array.isArray(cause?.constraint?.fields)) {
    field = cause.constraint.fields[0];
  }
  if (field === undefined && typeof cause?.constraint?.index === "string") {
    const match = /^[^_]+_(.+)_key$/.exec(cause.constraint.index);
    field = match?.[1]?.split("_")[0];
  }
  const path = typeof field === "string" ? [field.replaceAll('"', "")] : [];
  return [{ path, code: "taken" }];
}

/**
 * SPEC-write-path 2.2 steps 5–10 and §6 "API": every write route's handler. In order: the
 * rate limit (429) → the path `id` (400) → the body, read as JSON and validated (400) → `run`
 * in one transaction (404, 400, or the success) → the threshold check after the commit (409
 * when it resets) → the answer. Every answer carries the proxy's `X-Request-Id` and
 * `Cache-Control: no-store`.
 */
export async function guardedWrite<T>(
  request: Request,
  options: GuardedWriteOptions<T>,
): Promise<Response> {
  const requestId = request.headers.get("x-request-id") ?? "";
  const finish = (response: Response): Response => {
    if (requestId !== "") response.headers.set("X-Request-Id", requestId);
    response.headers.set("Cache-Control", "no-store");
    return response;
  };
  const db = options.db ?? getDb();
  const env = options.env ?? process.env;

  try {
    // Step 5: before the body is read, so a flood costs one small query and no parsing.
    const rate = await checkWriteLimit(
      db,
      clientIp(request),
      options.now,
      writeRateLimitMax(env),
      writeRateLimitWindowSeconds(env) * 1000,
    );
    if (rate.limited) return finish(rateLimitedResponse("Too many changes", rate.retryAfter));

    // Step 6: the path id, then the body (none for a DELETE).
    if (options.id !== undefined && !RecordIdSchema.safeParse(options.id).success) {
      return finish(validationErrorResponse([{ path: ["id"], code: "invalid_format" }]));
    }
    let input: T | undefined;
    if (options.schema !== undefined) {
      let raw: unknown;
      try {
        raw = await request.json();
      } catch {
        return finish(validationErrorResponse(INVALID_BODY));
      }
      const parsed = options.schema.safeParse(raw);
      if (!parsed.success) return finish(validationErrorResponse(toWriteIssues(parsed.error, raw)));
      input = parsed.data;
    }

    // Step 7: one transaction; anything but success rolls it back.
    let outcome: Extract<WriteOutcome, { kind: "ok" }>;
    try {
      outcome = await db.$transaction(async (tx) => {
        const result = await options.run(tx, input, options.id);
        if (result.kind !== "ok") throw new Rollback(result);
        return result;
      });
    } catch (error) {
      if (error instanceof Rollback) {
        return finish(
          error.outcome.kind === "not_found"
            ? errorResponse(404, "not_found", "Not found")
            : validationErrorResponse(error.outcome.issues),
        );
      }
      const taken = takenIssue(error);
      if (taken !== null) return finish(validationErrorResponse(taken));
      throw error;
    }

    // Step 8 (2.9): the write has committed. A throwing check is logged and the write stands;
    // an exceeded one resets the demo, and a reset that throws is a 500 (below).
    let exceeded = false;
    try {
      exceeded = (await checkThreshold(db, env)).exceeded;
    } catch (error) {
      console.error(JSON.stringify({ requestId, event: "threshold_check_failed" }), error);
    }
    if (exceeded) {
      await resetToSeed(db, "threshold");
      return finish(errorResponse(409, "conflict", "Data was reset"));
    }

    // Step 9.
    return finish(
      outcome.status === 204
        ? new Response(null, { status: 204 })
        : Response.json(outcome.body, { status: outcome.status }),
    );
  } catch (error) {
    console.error(JSON.stringify({ requestId, event: "write_failed" }), error);
    return finish(errorResponse(500, "server_error", "Something went wrong"));
  }
}
