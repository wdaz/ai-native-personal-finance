import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/test/[...path]/route";
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

  it("has reset and seed when APP_ENV=test (the control for the case above)", () => {
    expect(testSupportRoutes({ APP_ENV: "test" }).map((r) => `${r.method} ${r.path}`)).toEqual([
      "POST reset",
      "POST seed",
    ]);
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

  it("answers 404 through the route file when APP_ENV is not test", async () => {
    vi.stubEnv("APP_ENV", "production");
    const params = Promise.resolve({ path: ["reset"] });
    expect((await POST(post("reset"), { params })).status).toBe(404);
    expect((await GET(post("reset"), { params })).status).toBe(404);
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
      message:
        "variant must be one of: seed, empty-pots, empty-budgets, few-transactions, no-recurring, empty-all",
    });
  });
});
