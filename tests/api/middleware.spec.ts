import { expect, test, type APIResponse } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  await request.post("/api/test/reset");
});

/** The nonce of the response's `script-src` directive, or undefined when it has none. */
const scriptSrcNonce = (response: APIResponse): string | undefined => {
  const csp = response.headers()["content-security-policy"] ?? "";
  return /'nonce-([^']+)'/.exec(csp.match(/script-src[^;]+/)?.[0] ?? "")?.[1];
};

/**
 * T-06 plan finding F1: a 404 page the browser can run under ADR-0006's CSP. Asserts the
 * status, that every inline `<script>` (one without `src`) and every `<style>` opening tag
 * carries this response's own nonce, and that no `style="…"` attribute is left — a CSP nonce
 * applies to elements, never to attributes, so only markup without them passes `style-src`.
 * Returns the nonce so a caller can compare two requests.
 */
async function expectNotFoundUnderCsp(response: APIResponse): Promise<string> {
  expect(response.status()).toBe(404);
  const nonce = scriptSrcNonce(response);
  expect(nonce, "the response's script-src carries a nonce").toBeTruthy();
  const html = await response.text();

  const inlineScripts = [...html.matchAll(/<script\b[^>]*>/g)]
    .map(([tag]) => tag)
    .filter((tag) => !/\bsrc=/.test(tag));
  // Next inlines its RSC payload on every App Router page; none at all would mean this test
  // matched nothing rather than that every tag passed.
  expect(inlineScripts.length).toBeGreaterThan(0);
  // Soft, so one run reports every kind of breakage rather than only the first.
  expect.soft(inlineScripts.filter((tag) => !tag.includes(`nonce="${nonce}"`))).toEqual([]);

  const styles = [...html.matchAll(/<style\b[^>]*>/g)].map(([tag]) => tag);
  expect.soft(styles.filter((tag) => !tag.includes(`nonce="${nonce}"`))).toEqual([]);

  // Any whitespace, not just a space, may precede an attribute (PR #15 review).
  expect.soft(html.match(/\sstyle="[^"]*"/g) ?? []).toEqual([]);
  return nonce ?? "";
}

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
  // /api/overview has its own route handler since T-09 (tests/api/overview.spec.ts), but the
  // middleware still answers first — it intercepts before Next.js resolves the route, so this
  // asserts the API-side of the protected matrix regardless of what the route itself does.
  const response = await request.get("/api/overview");
  expect(response.status()).toBe(401);
});

test("SPEC-auth §2.10: only POST /api/admin/reset is secret-protected, not the whole /api/admin/* prefix", async ({
  request,
}) => {
  // /api/admin/reset has its own secret check since T-08 (tests/api/admin-reset.spec.ts); the
  // point here is that a *different* admin path still goes through the session check (review
  // finding M3).
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

  // CSP3's nonce-source grammar is base64-value: only A-Z a-z 0-9 + / = (review finding,
  // Copilot High — crypto.randomUUID() alone includes "-", which is not valid base64 and
  // risks a strict CSP parser rejecting the nonce-source expression outright).
  const VALID_BASE64 = /^[A-Za-z0-9+/]+=*$/;

  const first = await request.get("/api/auth/session");
  const firstCsp = first.headers()["content-security-policy"] ?? "";
  const [, firstScriptNonce] =
    NONCE_PATTERN.exec(firstCsp.match(/script-src[^;]+/)?.[0] ?? "") ?? [];
  const [, firstStyleNonce] = NONCE_PATTERN.exec(firstCsp.match(/style-src[^;]+/)?.[0] ?? "") ?? [];
  expect(firstScriptNonce).toBeTruthy();
  expect(firstStyleNonce).toBeTruthy();
  expect(firstScriptNonce).toBe(firstStyleNonce);
  expect(firstScriptNonce ?? "").toMatch(VALID_BASE64);

  const second = await request.get("/api/auth/session");
  const secondCsp = second.headers()["content-security-policy"] ?? "";
  const [, secondScriptNonce] =
    NONCE_PATTERN.exec(secondCsp.match(/script-src[^;]+/)?.[0] ?? "") ?? [];
  expect(secondScriptNonce).toBeTruthy();
  expect(secondScriptNonce).not.toBe(firstScriptNonce);
});

test("ADR-0006, T-06 plan F1: an unknown page's 404 carries the request's nonce on every inline script and style, and no style attribute", async ({
  request,
}) => {
  // Before F1, /_not-found was prerendered at build time: its inline scripts said
  // nonce "$undefined", its <style> had none and Next's default UI used style attributes,
  // so the browser blocked all of them on every 404.
  const first = await expectNotFoundUnderCsp(await request.get("/definitely-not-a-page"));
  const second = await expectNotFoundUnderCsp(await request.get("/definitely-not-a-page"));
  expect(second).not.toBe(first);
});

test("ADR-0006, T-06 plan F1: a logged-in unknown app path 404s under the same nonce rules", async ({
  request,
}) => {
  const login = await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD_DISPLAY },
  });
  // Without a session a protected path redirects to /login and this would test the wrong
  // page — login must have worked, and no redirect is followed. /overview has a page since
  // T-07 (plan Q2); a path below a protected prefix still passes the session check first.
  expect(login.status()).toBe(200);
  const path = "/transactions/no-such-page";
  const first = await expectNotFoundUnderCsp(await request.get(path, { maxRedirects: 0 }));
  const second = await expectNotFoundUnderCsp(await request.get(path, { maxRedirects: 0 }));
  expect(second).not.toBe(first);
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
