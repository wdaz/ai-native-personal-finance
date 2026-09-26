import { expect, test, type APIRequestContext, type APIResponse } from "@playwright/test";
import { inlineTags } from "../fixtures/csp";

test.beforeEach(async ({ request }) => {
  await request.post("/api/test/reset");
});

/**
 * Logs the demo account in and fails right here when that did not work. Unchecked, a failed
 * login leaves the request unauthenticated and the test fails later at an assertion that reads
 * like a proxy bug (measured 2026-09-24 with a wrong password: "Expected: 302, Received:
 * 200" on /login, "/login" instead of "/overview", no `reason=reset`).
 */
async function logInAsDemo(request: APIRequestContext): Promise<void> {
  const login = await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD_DISPLAY },
  });
  expect(login.status(), "POST /api/auth/login with the demo credentials").toBe(200);
}

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

  // Case-insensitive, as the browser is: an unnonced `<SCRIPT>` still runs, and a `<SCRIPT
  // SRC=…>` is still external (CodeQL js/bad-tag-filter, alert #1).
  const inlineScripts = [...html.matchAll(/<script\b[^>]*>/gi)]
    .map(([tag]) => tag)
    .filter((tag) => !/\bsrc=/i.test(tag));
  // Next inlines its RSC payload on every App Router page; none at all would mean this test
  // matched nothing rather than that every tag passed.
  expect(inlineScripts.length).toBeGreaterThan(0);
  // Soft, so one run reports every kind of breakage rather than only the first.
  expect.soft(inlineScripts.filter((tag) => !tag.includes(`nonce="${nonce}"`))).toEqual([]);

  const styles = [...html.matchAll(/<style\b[^>]*>/gi)].map(([tag]) => tag);
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
  await logInAsDemo(request);
  const response = await request.get("/login", { maxRedirects: 0 });
  expect(response.status()).toBe(302);
  expect(response.headers()["location"]).toContain("/overview");
});

test("/ redirects to /overview when authenticated, /login otherwise", async ({ request }) => {
  const loggedOut = await request.get("/", { maxRedirects: 0 });
  expect(loggedOut.headers()["location"]).toContain("/login");

  await logInAsDemo(request);
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
  // proxy still answers first — it intercepts before Next.js resolves the route, so this
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
  // The proxy only ever *writes* a next= param (sanitised, via sanitizeNextPath) on its
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

// ADR-0006 amendment 2026-09-24 (4), TD-6: `next dev` gets a relaxed policy, so this suite —
// which always runs against `next build && next start` (ADR-0003) — pins the production one
// byte for byte. If the development relaxation ever leaked into a build, this fails.
test("ADR-0006 (4): the production CSP is exactly the pinned policy, with no unsafe-* source", async ({
  request,
}) => {
  const response = await request.get("/api/auth/session");
  const csp = response.headers()["content-security-policy"] ?? "";
  const [, nonce] = /'nonce-([^']+)'/.exec(csp) ?? [];
  expect(nonce).toBeTruthy();
  expect(csp).toBe(
    `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}'; frame-ancestors 'none'`,
  );
  expect(csp).not.toContain("unsafe-");
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
  // Without a session a protected path redirects to /login and this would test the wrong
  // page — login must have worked, and no redirect is followed. /overview has a page since
  // T-07 (plan Q2); a path below a protected prefix still passes the session check first.
  await logInAsDemo(request);
  const path = "/transactions/no-such-page";
  const first = await expectNotFoundUnderCsp(await request.get(path, { maxRedirects: 0 }));
  const second = await expectNotFoundUnderCsp(await request.get(path, { maxRedirects: 0 }));
  expect(second).not.toBe(first);
});

test("SPEC-reset-and-test-support §2.6: a reset-invalidated session redirects to /login?reason=reset", async ({
  request,
}) => {
  await logInAsDemo(request);
  await request.post("/api/test/reset"); // a later ResetLog row than the one at login time

  const response = await request.get("/transactions", { maxRedirects: 0 });
  expect(response.status()).toBe(302);
  const location = response.headers()["location"] ?? "";
  expect(location).toContain("reason=reset");
  expect(location).toContain("next=%2Ftransactions");
});

// NFR-S6 names the referrer policy and ADR-0006 lists `X-Content-Type-Options` with it. The four
// responses below leave the function by four different branches — a page, an API answer, a
// redirect and a 401 — and the headers are set after all of them.
test("NFR-S6, ADR-0006: every branch's response carries Referrer-Policy, X-Content-Type-Options and X-Request-Id", async ({
  request,
}) => {
  const branches: Array<[string, number, () => Promise<APIResponse>]> = [
    ["a public page", 200, () => request.get("/login")],
    ["a public API answer", 200, () => request.get("/api/auth/session")],
    ["a redirect", 302, () => request.get("/transactions", { maxRedirects: 0 })],
    ["a 401", 401, () => request.get("/api/overview")],
  ];
  for (const [label, status, send] of branches) {
    const response = await send();
    expect(response.status(), `${label}: status`).toBe(status);
    const headers = response.headers();
    expect(headers["referrer-policy"], `${label}: Referrer-Policy`).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(headers["x-content-type-options"], `${label}: X-Content-Type-Options`).toBe("nosniff");
    expect(headers["x-request-id"], `${label}: X-Request-Id`).toBeTruthy();
  }
});

// T-13d finding F-05/TD-16: Next's own poweredByHeader default leaked the framework on every
// response, with nothing asserting its absence.
test("T-13d F-05: no response carries X-Powered-By", async ({ request }) => {
  const branches: Array<[string, () => Promise<APIResponse>]> = [
    ["a public page", () => request.get("/login")],
    ["a public API answer", () => request.get("/api/auth/session")],
    ["a redirect", () => request.get("/transactions", { maxRedirects: 0 })],
    ["a 401", () => request.get("/api/overview")],
  ];
  for (const [label, send] of branches) {
    const response = await send();
    expect(response.headers()["x-powered-by"], `${label}: X-Powered-By`).toBeUndefined();
  }
});

// Review finding M6: the matcher excludes any path with a file extension. A logged-in visitor's
// image request must not meet the session check, the reset-epoch query, `no-store` or the
// proxy's headers.
test("review finding M6: a logged-in request for a file with an extension never reaches the proxy", async ({
  request,
}) => {
  await logInAsDemo(request);
  // The control: a page of the same session does reach it, and answers with what it sets.
  const page = await request.get("/overview", { maxRedirects: 0 });
  expect(page.status()).toBe(200);
  expect(page.headers()["x-request-id"], "the control, /overview: X-Request-Id").toBeTruthy();
  expect(page.headers()["cache-control"], "the control, /overview: Cache-Control").toBe("no-store");

  const avatar = await request.get("/avatars/bytewise.jpg", { maxRedirects: 0 });
  expect(avatar.status()).toBe(200);
  expect(avatar.headers()["content-type"]).toBe("image/jpeg");
  // Each of these is set by the proxy and by nothing else.
  expect(avatar.headers()["x-request-id"], "the avatar: X-Request-Id").toBeUndefined();
  expect(avatar.headers()["content-security-policy"], "the avatar: CSP").toBeUndefined();
  expect(avatar.headers()["cache-control"], "the avatar: Cache-Control").not.toBe("no-store");
});

// TD-19: the first matcher skipped every path with a dot, and Next appends `.json`, `.rsc` and
// `.segments/<segment>.segment.rsc` to the path it matches — so on Vercel the proxy never ran for
// the last two of these. `next start` cannot show that (its 404 came without the proxy's headers
// before the fix, which is what the header assertions below catch), but it does show the second
// half: the proxy ran for `.segments/*` and, given the path as requested, did not know it was
// `/overview` and asked for no session.
const TRANSPORT_FORMS: [path: string, status: number, location: string | null][] = [
  ["/overview.rsc", 302, "/login?next=%2Foverview"],
  ["/overview.segments/_tree.segment.rsc", 302, "/login?next=%2Foverview"],
  ["/overview.segments/(app)/overview/__PAGE__.segment.rsc", 302, "/login?next=%2Foverview"],
  ["/transactions.segments/_tree.segment.rsc", 302, "/login?next=%2Ftransactions"],
  ["/api/overview.json", 401, null],
];

test("TD-19: the `.rsc`, `.segments/*` and `.json` forms of a protected page or API need a session and carry the proxy's headers", async ({
  request,
}) => {
  for (const [path, status, location] of TRANSPORT_FORMS) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect.soft(response.status(), `${path}: status`).toBe(status);
    if (location)
      expect.soft(response.headers()["location"], `${path}: Location`).toContain(location);
    // Each of these is set by the proxy and by nothing else.
    expect.soft(response.headers()["x-request-id"], `${path}: X-Request-Id`).toBeTruthy();
    expect.soft(response.headers()["content-security-policy"], `${path}: CSP`).toBeTruthy();
    expect.soft(response.headers()["x-content-type-options"], `${path}: nosniff`).toBe("nosniff");
  }
});

test("TD-19: a signed-in request for those forms is let through, not sent back to /login", async ({
  request,
}) => {
  await logInAsDemo(request);
  for (const [path] of TRANSPORT_FORMS) {
    const response = await request.get(path, { maxRedirects: 0 });
    // What a route answers for a form it does not serve depends on the host (`next start`: 404;
    // Vercel: a static skeleton), so only the proxy's part is asserted: it ran, and it did not
    // redirect a valid session.
    expect.soft(response.headers()["x-request-id"], `${path}: X-Request-Id`).toBeTruthy();
    expect.soft(response.headers()["location"], `${path}: Location`).toBeUndefined();
    expect.soft(response.status(), `${path}: status`).not.toBe(401);
  }
});

test("ADR-0006 (5): every response asks for its own agent cluster, so Firefox and Safari can run the WebMCP polyfill", async ({
  request,
}) => {
  for (const path of ["/login", "/signup", "/no-such-page", "/api/auth/session"]) {
    const response = await request.get(path);
    expect(response.headers()["origin-agent-cluster"], path).toBe("?1");
  }
  // Without a session /overview redirects to /login?next= (a 200 with the header, once followed)
  // and this would test the wrong page — login must have worked, and no redirect is followed.
  await logInAsDemo(request);
  const overview = await request.get("/overview", { maxRedirects: 0 });
  expect(overview.status()).toBe(200);
  expect(overview.headers()["origin-agent-cluster"], "/overview").toBe("?1");
});

// TD-3 (tech-debt.md), investigated at T-13b (2026-09-25): `/_global-error` is Next 16.3.5's own
// synthetic 500-equivalent fallback (UNDERSCORE_GLOBAL_ERROR_ROUTE,
// next/dist/shared/lib/entry-constants.js), forced static unconditionally by `isPageStatic`
// (next/dist/build/utils.js) regardless of `connection()` or `export const dynamic =
// "force-dynamic"`. The app-loader hardcodes this route's page module to its own bundled
// `AppError` (next/dist/client/components/builtin/app-error.js), never the app's
// `global-error.tsx` — measured: a scratch app/global-error.tsx with force-dynamic still produced
// the stock AppError body. No application-level fix exists in this Next version, so this pins the
// gap's exact shape rather than closing it: if a future Next release changes any of this, the
// assertions below fail first.
test("TD-3: /_global-error is reachable directly; its own CSP carries a nonce but its inline tags never do", async ({
  request,
}) => {
  const first = await request.get("/_global-error");
  expect(first.status()).toBe(500);
  const firstNonce = scriptSrcNonce(first);
  expect(firstNonce, "the response's own CSP still carries a nonce").toBeTruthy();
  expect(first.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");

  const second = await request.get("/_global-error");
  const secondNonce = scriptSrcNonce(second);
  // The proxy runs on this path like any other — it has no file extension, so the matcher does
  // not exclude it — and mints a fresh nonce every time; only the prerendered body stays fixed.
  expect(secondNonce, "a fresh nonce on a second request").toBeTruthy();
  expect(secondNonce).not.toBe(firstNonce);

  for (const [label, response, nonce] of [
    ["first", first, firstNonce],
    ["second", second, secondNonce],
  ] as const) {
    const html = await response.text();
    const tags = inlineTags(html);
    // Next's bundled fallback UI always inlines its RSC payload push and one <style>; none at all
    // would mean this matched nothing, not that the page is fixed.
    expect(tags.length, `${label}: at least one inline tag`).toBeGreaterThan(0);
    expect(
      tags.filter((tag) => tag.includes(`nonce="${nonce}"`)),
      `${label}: none of the inline tags carry this response's nonce`,
    ).toEqual([]);
    // Next's own fallback UI still uses style="…" attributes too; style-src-attr falls back to
    // style-src, which has no 'unsafe-inline'/'unsafe-hashes' in this policy — no nonce ever
    // covers an attribute, so a browser drops every one of these regardless.
    expect(
      (html.match(/\sstyle="[^"]*"/g) ?? []).length,
      `${label}: style attributes present (none of which any nonce could allow)`,
    ).toBeGreaterThan(0);
  }
});
