import { connect } from "node:net";
import { type APIRequestContext, type APIResponse, expect, test } from "@playwright/test";
import { createDb, type Db } from "@/src/server/db";
import { databaseUrl } from "@/src/server/env";
import { ErrorEnvelopeSchema } from "@/src/shared/schemas";

/**
 * SPEC-write-path 7.3 (v1.0.3): the proxy's refusals on every planned write path (2.1), before
 * any of their routes exists (T-23, T-25 run them again on the routes). Failing first: on
 * `origin/develop` before T-17 a cross-site or wrongly typed write reached Next's 404 or 405.
 * Mirrors `logout-fallback.spec.ts`. The refusal log line is unit-tested (`write-rules.test.ts`).
 */
const ID = "6f1d3c1e-8a2b-4c3d-9e4f-5a6b7c8d9e0f";
const WRITES = [
  ["POST", "/api/budgets"],
  ["PATCH", `/api/budgets/${ID}`],
  ["DELETE", `/api/budgets/${ID}`],
  ["POST", "/api/pots"],
  ["PATCH", `/api/pots/${ID}`],
  ["DELETE", `/api/pots/${ID}`],
  ["POST", `/api/pots/${ID}/deposit`],
  ["POST", `/api/pots/${ID}/withdraw`],
] as const;
const JSON_TYPE = { "content-type": "application/json" };
const SECURITY_HEADERS = [
  "content-security-policy",
  "referrer-policy",
  "x-content-type-options",
  "origin-agent-cluster",
];

let db: Db;
test.beforeAll(() => {
  db = createDb(databaseUrl());
});
test.afterAll(async () => {
  await db.$disconnect();
});
test.beforeEach(async ({ request }) => {
  expect((await request.post("/api/test/reset")).status()).toBe(200);
});

async function logIn(request: APIRequestContext) {
  const login = await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD_DISPLAY },
  });
  expect(login.status(), "POST /api/auth/login with the demo credentials").toBe(200);
}

const send = (
  request: APIRequestContext,
  method: string,
  path: string,
  headers: Record<string, string>,
  body?: string,
) => request.fetch(path, { method, headers, ...(body === undefined ? {} : { data: body }) });

/** What every refusal carries (2.2 step 10): no-store, a request id, the security headers. */
function expectRefusalHeaders(response: APIResponse) {
  const headers = response.headers();
  expect(headers["cache-control"]).toBe("no-store");
  expect(headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  for (const name of SECURITY_HEADERS) expect(headers[name], name).toBeTruthy();
  expect(response.headersArray().filter(({ name }) => name.toLowerCase() === "set-cookie")).toEqual(
    [],
  );
}

async function storedRows() {
  return {
    budgets: await db.budget.count(),
    pots: await db.pot.count(),
    balance: (await db.balance.findFirstOrThrow()).current,
  };
}

for (const [method, path] of WRITES) {
  test(`US-36 ${method} ${path}: Sec-Fetch-Site cross-site → 403 forbidden, no Set-Cookie, nothing written (2.3)`, async ({
    request,
  }) => {
    await logIn(request);
    const before = await storedRows();
    const response = await send(
      request,
      method,
      path,
      { ...JSON_TYPE, "sec-fetch-site": "cross-site" },
      method === "DELETE" ? undefined : "{}",
    );
    expect(response.status()).toBe(403);
    expect(ErrorEnvelopeSchema.parse(await response.json())).toEqual({
      error: "forbidden",
      message: "This request must be same-origin",
    });
    expectRefusalHeaders(response);
    expect(await storedRows()).toEqual(before);
  });

  test(`US-36 ${method} ${path}: text/plain → 415 validation, nothing written (2.4)`, async ({
    request,
  }) => {
    await logIn(request);
    const before = await storedRows();
    const response = await send(request, method, path, { "content-type": "text/plain" }, "{}");
    expect(response.status()).toBe(415);
    expect(await response.json()).toEqual({
      error: "validation",
      issues: [{ path: [], code: "invalid_format" }],
    });
    expectRefusalHeaders(response);
    expect(await storedRows()).toEqual(before);
  });
}

for (const site of ["same-origin", "same-site", "none", undefined]) {
  test(`US-36 Sec-Fetch-Site ${site ?? "absent"} is not refused as cross-site (2.3)`, async ({
    request,
  }) => {
    await logIn(request);
    const response = await send(
      request,
      "POST",
      "/api/pots",
      { ...JSON_TYPE, ...(site ? { "sec-fetch-site": site } : {}) },
      "{}",
    );
    // No route exists yet (T-25): whatever answers, it is not the proxy's 403 or 415.
    expect([403, 415]).not.toContain(response.status());
  });
}

test("US-36 unauthenticated and cross-site → 401 first, so the caller learns nothing else (2.2 step 2)", async ({
  request,
}) => {
  const response = await send(
    request,
    "POST",
    "/api/budgets",
    { ...JSON_TYPE, "sec-fetch-site": "cross-site" },
    "{}",
  );
  expect(response.status()).toBe(401);
  expect(response.headers()["cache-control"]).toBe("no-store");
});

for (const type of [
  "application/x-www-form-urlencoded",
  "multipart/form-data; boundary=x",
  "text/plain; x=application/json",
  "application/jsonx",
]) {
  test(`US-36 POST with Content-Type ${type} → 415 (2.4)`, async ({ request }) => {
    await logIn(request);
    const response = await send(request, "POST", "/api/pots", { "content-type": type }, "{}");
    expect(response.status()).toBe(415);
  });
}

for (const method of ["POST", "PUT", "PATCH"]) {
  test(`US-36 a ${method} that declares no content type → 415 (2.4)`, async ({ request }) => {
    await logIn(request);
    const response = await request.fetch(`/api/pots/${ID}`, { method });
    expect(response.status()).toBe(415);
  });
}

for (const type of ["application/json", "Application/JSON", "application/json; charset=utf-8"]) {
  test(`US-36 Content-Type ${type} passes the proxy (2.4)`, async ({ request }) => {
    await logIn(request);
    const response = await send(request, "POST", "/api/pots", { "content-type": type }, "{}");
    expect([403, 415]).not.toContain(response.status());
  });
}

test("US-36 a bodiless DELETE passes the proxy; a DELETE declaring text/plain is 415 (2.4)", async ({
  request,
}) => {
  await logIn(request);
  const bare = await request.delete(`/api/pots/${ID}`);
  expect([403, 415]).not.toContain(bare.status());
  const typed = await request.delete(`/api/pots/${ID}`, {
    headers: { "content-type": "text/plain" },
  });
  expect(typed.status()).toBe(415);
});

test("US-36 a lower-case method is answered 400 by Node and reaches no handler, nothing written (7.3 v1.0.3)", async ({
  baseURL,
}) => {
  const before = await storedRows();
  const { hostname, port } = new URL(baseURL!);
  const statusLine = await new Promise<string>((resolve, reject) => {
    const socket = connect(Number(port), hostname, () => {
      socket.write(
        `patch /api/pots/${ID} HTTP/1.1\r\nHost: ${hostname}\r\nContent-Type: text/plain\r\nSec-Fetch-Site: cross-site\r\nContent-Length: 2\r\nConnection: close\r\n\r\n{}`,
      );
    });
    let data = "";
    socket.on("data", (chunk) => (data += chunk.toString()));
    socket.on("end", () => resolve(data.split("\r\n")[0] ?? ""));
    socket.on("error", reject);
  });
  expect(statusLine).toBe("HTTP/1.1 400 Bad Request");
  expect(await storedRows()).toEqual(before);
});

test("US-03 logout's cross-site 403 answers the forbidden envelope (SPEC-write-path 2.6, auth.md v1.0.10)", async ({
  request,
}) => {
  const response = await request.post("/api/auth/logout", {
    headers: { "sec-fetch-site": "cross-site" },
  });
  expect(response.status()).toBe(403);
  expect(ErrorEnvelopeSchema.parse(await response.json())).toEqual({
    error: "forbidden",
    message: "This request must be same-origin",
  });
  expect(response.headers()["cache-control"]).toBe("no-store");
});

test("SPEC-write-path 2.3: the exempt routes are not refused for their content type", async ({
  request,
}) => {
  const login = await request.post("/api/auth/login", {
    headers: { "content-type": "text/plain" },
    data: "not json",
  });
  expect(login.status()).not.toBe(415);
  const testReset = await request.post("/api/test/reset", {
    headers: { "sec-fetch-site": "cross-site" },
  });
  expect(testReset.status()).toBe(200);
});
