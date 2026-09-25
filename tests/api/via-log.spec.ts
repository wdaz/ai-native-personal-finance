import { expect, test, type APIRequestContext } from "@playwright/test";

/**
 * SPEC-webmcp-tools §2.8 over HTTP, against `next start` with APP_ENV=test. The route reading
 * the log and the proxy writing it are different bundles, so a green run here is also the
 * proof that the buffer really is shared through globalThis (plan F6).
 */
test.beforeEach(async ({ request }) => {
  await request.post("/api/test/reset");
});

async function login(request: APIRequestContext) {
  const response = await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD_DISPLAY },
  });
  expect(response.status()).toBe(200);
}

const logged = (request: APIRequestContext, requestId: string | undefined) =>
  request.get("/api/test/log", { params: requestId === undefined ? {} : { requestId } });

test("US-38 SPEC-webmcp-tools §2.8: a request with X-Via: webmcp is on record under its X-Request-Id", async ({
  request,
}) => {
  await login(request);
  const response = await request.get("/api/overview", { headers: { "X-Via": "webmcp" } });
  expect(response.status()).toBe(200);
  const requestId = response.headers()["x-request-id"];
  expect(requestId).toBeTruthy();

  const log = await logged(request, requestId);
  expect(log.status()).toBe(200);
  expect(await log.json()).toEqual({ requestId, via: "webmcp", route: "/api/overview" });
});

test("SPEC-webmcp-tools §2.8: a request without the marker, or with another value, is not recorded", async ({
  request,
}) => {
  await login(request);
  const plain = await request.get("/api/overview");
  const other = await request.get("/api/overview", { headers: { "X-Via": "browser" } });
  for (const response of [plain, other]) {
    const requestId = response.headers()["x-request-id"];
    expect(requestId).toBeTruthy();
    expect((await logged(request, requestId)).status()).toBe(404);
  }
});

test("US-39 AC4 SPEC-webmcp-tools §2.8: an unauthenticated request with the marker is answered 401 and still recorded", async ({
  request,
}) => {
  const response = await request.get("/api/overview", { headers: { "X-Via": "webmcp" } });
  expect(response.status()).toBe(401);
  const requestId = response.headers()["x-request-id"];
  const log = await logged(request, requestId);
  expect(log.status()).toBe(200);
  expect(await log.json()).toEqual({ requestId, via: "webmcp", route: "/api/overview" });
});

test("SPEC-reset-and-test-support §2.7: an unknown, empty or missing requestId answers 404", async ({
  request,
}) => {
  expect((await logged(request, "00000000-0000-4000-8000-000000000000")).status()).toBe(404);
  expect((await logged(request, "")).status()).toBe(404);
  expect((await logged(request, undefined)).status()).toBe(404);
});
