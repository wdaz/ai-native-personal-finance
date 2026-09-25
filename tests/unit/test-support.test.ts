import { afterEach, describe, expect, it, vi } from "vitest";
import * as route from "@/app/api/test/[...path]/route";
import { recordViaRequest } from "@/src/server/request-log";
import { handleTestSupport, testSupportRoutes } from "@/src/server/test-support";

/**
 * SPEC-reset-and-test-support §2.7: "only when APP_ENV=test; otherwise the routes do not
 * exist — 404 — and a unit test asserts the router has no test/* entries in other envs".
 * None of these touch a database: outside test there is no route to reach one, and inside
 * test the requests below are refused before one would be opened.
 */
const post = (path: string, body?: string) =>
  new Request(`http://localhost/api/test/${path}`, { method: "POST", body });

describe("test-support routes (SPEC-reset-and-test-support §2.7)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([undefined, "development", "production", "Test", "test ", ""])(
    "has no /api/test/* route when APP_ENV is %j",
    (appEnv) => {
      expect(testSupportRoutes({ APP_ENV: appEnv })).toEqual([]);
    },
  );

  it("has reset, seed and log when APP_ENV=test (the control for the case above)", () => {
    expect(testSupportRoutes({ APP_ENV: "test" }).map((r) => `${r.method} ${r.path}`)).toEqual([
      "POST reset",
      "POST seed",
      "GET log",
    ]);
  });

  it("has no /api/test/* route for APP_ENV=test on a deployment or against another machine's database (TD-10)", () => {
    const neon = "postgresql://user:password@ep-cool-name-123456.eu-central-1.aws.neon.tech/neondb";
    expect(testSupportRoutes({ APP_ENV: "test", VERCEL: "1" })).toEqual([]);
    expect(testSupportRoutes({ APP_ENV: "test", VERCEL_ENV: "production" })).toEqual([]);
    expect(testSupportRoutes({ APP_ENV: "test", DATABASE_URL: neon })).toEqual([]);
  });

  it("keeps them for APP_ENV=test against the local database (the control for the case above)", () => {
    const local = "postgresql://postgres:postgres@localhost:5432/personal_finance";
    expect(testSupportRoutes({ APP_ENV: "test", DATABASE_URL: local })).toHaveLength(3);
  });

  describe("GET /api/test/log (SPEC-reset-and-test-support §2.7)", () => {
    const get = (query: string) =>
      handleTestSupport("GET", ["log"], new Request(`http://localhost/api/test/log${query}`), {
        APP_ENV: "test",
      });

    it("answers 200 with the recorded entry", async () => {
      recordViaRequest("webmcp", "abc-123", "/api/overview", { APP_ENV: "test" });
      const response = await get("?requestId=abc-123");
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        requestId: "abc-123",
        via: "webmcp",
        route: "/api/overview",
      });
    });

    it.each(["?requestId=never-seen", "?requestId=", "", "?other=1"])(
      "answers 404 for %j — unknown, empty or missing id (plan D7)",
      async (query) => {
        const response = await get(query);
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: "not_found", message: "Not found" });
      },
    );
  });

  it.each([
    ["POST", "reset"],
    ["POST", "seed"],
    ["GET", "log"],
  ])("answers %s /api/test/%s with 404 outside test", async (method, path) => {
    const response = await handleTestSupport(method, [path], post(path), { APP_ENV: "production" });
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "not_found", message: "Not found" });
  });

  it("answers 404 through the route file when APP_ENV is not test, for every exported method", async () => {
    vi.stubEnv("APP_ENV", "production");
    const params = Promise.resolve({ path: ["reset"] });
    const handlers = Object.entries(route) as [
      string,
      (request: Request, context: { params: typeof params }) => Promise<Response>,
    ][];
    // Next.js implements OPTIONS itself and answers 405 to PUT/PATCH/DELETE unless the
    // route file exports them, so this also pins that every one of the six is exported —
    // a handler added later is covered automatically, and dropping one here fails loudly.
    expect(handlers.map(([name]) => name).sort()).toEqual([
      "DELETE",
      "GET",
      "OPTIONS",
      "PATCH",
      "POST",
      "PUT",
    ]);
    for (const [, handler] of handlers) {
      const response = await handler(post("reset"), { params });
      expect(response.status).toBe(404);
    }
  });

  it("answers an unknown path with 404 in test too", async () => {
    const response = await handleTestSupport("POST", ["nope"], post("nope"), { APP_ENV: "test" });
    expect(response.status).toBe(404);
  });

  it.each([
    ['{"variant":"nope"}', "an unknown variant"],
    ["{}", "a missing variant"],
    ["not json", "a body that is not JSON"],
  ])("refuses %s (%s) with 400 and the error envelope", async (body) => {
    const response = await handleTestSupport("POST", ["seed"], post("seed", body), {
      APP_ENV: "test",
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "validation",
      issues: [{ path: ["variant"], code: "invalid_format" }],
    });
  });
});
