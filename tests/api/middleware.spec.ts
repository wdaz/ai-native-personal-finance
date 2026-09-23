import { expect, test } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  await request.post("/api/test/reset");
});

test("an unauthenticated request to a protected page redirects to /login?next=", async ({
  request,
}) => {
  const response = await request.get("/transactions", { maxRedirects: 0 });
  expect(response.status()).toBe(302);
  expect(response.headers()["location"]).toContain("/login?next=%2Ftransactions");
});

test("an authenticated request to /login redirects to /overview", async ({ request }) => {
  await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD_DISPLAY },
  });
  const response = await request.get("/login", { maxRedirects: 0 });
  expect(response.status()).toBe(302);
  expect(response.headers()["location"]).toContain("/overview");
});

test("/ redirects to /overview when authenticated, /login otherwise", async ({ request }) => {
  const loggedOut = await request.get("/", { maxRedirects: 0 });
  expect(loggedOut.headers()["location"]).toContain("/login");

  await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD_DISPLAY },
  });
  const loggedIn = await request.get("/", { maxRedirects: 0 });
  expect(loggedIn.headers()["location"]).toContain("/overview");
});

test("authenticated HTML responses send Cache-Control: no-store", async ({ request }) => {
  await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD_DISPLAY },
  });
  const response = await request.get("/overview", { maxRedirects: 0 });
  expect(response.headers()["cache-control"]).toContain("no-store");
});

test("every response carries X-Request-Id", async ({ request }) => {
  const response = await request.get("/api/auth/session");
  expect(response.headers()["x-request-id"]).toBeTruthy();
});

test("/api/test/* is reachable with no session (test env only)", async ({ request }) => {
  const response = await request.post("/api/test/reset");
  expect(response.status()).toBe(200);
});

test("an unauthenticated request to a protected API answers 401 unauthenticated", async ({
  request,
}) => {
  // /api/overview has no route handler yet (T-09) — the middleware intercepts before Next.js
  // resolves the route, so this still asserts the API-side of the protected matrix.
  const response = await request.get("/api/overview");
  expect(response.status()).toBe(401);
});
