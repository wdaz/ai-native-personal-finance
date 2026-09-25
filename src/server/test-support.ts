import { getDb } from "./db";
import { isTestEnv, type Env } from "./env";
import { errorResponse, validationErrorResponse } from "./http";
import { findViaRequest } from "./request-log";
import { resetToSeed } from "./reset";
import { seedRows } from "./seed";
import { applyVariant, isSeedVariant } from "./variants";

/**
 * SPEC-reset-and-test-support §2.7 — the routes E2E and API tests use to put the database
 * in a known state (ADR-0003, NFR-T3). No session, no rate limit. They exist only when
 * `APP_ENV=test`: in any other environment `testSupportRoutes` is empty and every
 * /api/test/* path answers 404.
 */
export type TestRoute = {
  method: "GET" | "POST";
  path: string;
  handle: (request: Request) => Promise<Response>;
};

async function reset(): Promise<Response> {
  const { at } = await resetToSeed(getDb(), "test");
  return Response.json({ at });
}

async function seed(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const variant =
    typeof body === "object" && body !== null && "variant" in body ? body.variant : undefined;
  if (!isSeedVariant(variant)) {
    return validationErrorResponse([{ path: ["variant"], code: "invalid_format" }]);
  }
  const { at } = await resetToSeed(getDb(), "test", applyVariant(seedRows(), variant));
  return Response.json({ at, variant });
}

/** SPEC-webmcp-tools §2.8: the entry `proxy.ts` recorded for a tool's request. */
async function viaLog(request: Request): Promise<Response> {
  const requestId = new URL(request.url).searchParams.get("requestId");
  const entry = requestId ? findViaRequest(requestId) : undefined;
  return entry ? Response.json(entry) : errorResponse(404, "not_found", "Not found");
}

const routes: readonly TestRoute[] = [
  { method: "POST", path: "reset", handle: reset },
  { method: "POST", path: "seed", handle: seed },
  { method: "GET", path: "log", handle: viaLog },
];

export function testSupportRoutes(env: Env = process.env): readonly TestRoute[] {
  return isTestEnv(env) ? routes : [];
}

export async function handleTestSupport(
  method: string,
  segments: readonly string[],
  request: Request,
  env: Env = process.env,
): Promise<Response> {
  const path = segments.join("/");
  const route = testSupportRoutes(env).find((r) => r.method === method && r.path === path);
  if (!route) {
    return errorResponse(404, "not_found", "Not found");
  }
  try {
    return await route.handle(request);
  } catch (error) {
    console.error(`test-support ${method} /api/test/${path} failed`, error);
    return errorResponse(500, "server_error", "The test-support request failed");
  }
}
