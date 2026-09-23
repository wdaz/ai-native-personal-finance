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
  // Known limitation (review finding I4): every R1 app page is a 404 today (T-07/T-09/T-10
  // haven't run), and Next's own 404 render already answers no-store to an unauthenticated
  // request too (verified: a fresh /some-page-not-in-r1 gets "private, no-cache, no-store,
  // max-age=0, must-revalidate" with no cookie at all) — so this test can only confirm the
  // header is present on an authenticated response, not that this middleware is the one
  // adding it rather than Next's 404 default. T-07 owns the real isolating test, against a
  // genuinely cacheable 200 page, once one exists.
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

test("SPEC-auth §2.10: only POST /api/admin/reset is secret-protected, not the whole /api/admin/* prefix", async ({
  request,
}) => {
  // /api/admin/reset itself has no route handler yet (T-08) — 404 either way; the point is
  // that a *different* admin path still goes through the session check (review finding M3).
  const response = await request.get("/api/admin/something-else");
  expect(response.status()).toBe(401);
});

test("an incoming ?next= on /login passes through unsanitised — T-06's client sanitises it before navigating", async ({
  request,
}) => {
  // The middleware only ever *writes* a next= param (sanitised, via sanitizeNextPath) on its
  // own protected-page redirect; it never reads one back on GET /login itself. This is a
  // deliberate hand-off, not a gap: T-06's page must call sanitizeNextPath (src/shared/
  // next-path.ts) before using next for the post-login navigation (SPEC-auth §2.4).
  const response = await request.get("/login?next=//evil.com", { maxRedirects: 0 });
  expect(response.status()).not.toBe(302);
});

test("ADR-0006: the CSP carries a nonce on script-src and style-src, fresh per request", async ({
  request,
}) => {
  const NONCE_PATTERN = /'nonce-([^']+)'/;

  const first = await request.get("/api/auth/session");
  const firstCsp = first.headers()["content-security-policy"] ?? "";
  const [, firstScriptNonce] =
    NONCE_PATTERN.exec(firstCsp.match(/script-src[^;]+/)?.[0] ?? "") ?? [];
  const [, firstStyleNonce] = NONCE_PATTERN.exec(firstCsp.match(/style-src[^;]+/)?.[0] ?? "") ?? [];
  expect(firstScriptNonce).toBeTruthy();
  expect(firstStyleNonce).toBeTruthy();
  expect(firstScriptNonce).toBe(firstStyleNonce);

  const second = await request.get("/api/auth/session");
  const secondCsp = second.headers()["content-security-policy"] ?? "";
  const [, secondScriptNonce] =
    NONCE_PATTERN.exec(secondCsp.match(/script-src[^;]+/)?.[0] ?? "") ?? [];
  expect(secondScriptNonce).toBeTruthy();
  expect(secondScriptNonce).not.toBe(firstScriptNonce);
});

test("SPEC-reset-and-test-support §2.6: a reset-invalidated session redirects to /login?reason=reset", async ({
  request,
}) => {
  await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD_DISPLAY },
  });
  await request.post("/api/test/reset"); // a later ResetLog row than the one at login time

  const response = await request.get("/transactions", { maxRedirects: 0 });
  expect(response.status()).toBe(302);
  const location = response.headers()["location"] ?? "";
  expect(location).toContain("reason=reset");
  expect(location).toContain("next=%2Ftransactions");
});
