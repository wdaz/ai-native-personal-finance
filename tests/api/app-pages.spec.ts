import { expect, test } from "@playwright/test";
import { inlineTags, scriptNonce } from "../fixtures/csp";

// In Next 16.3.5 `app/not-found.tsx`'s own `connection()` (T-06 F1) already makes every route
// dynamic, and `app/(app)/layout.tsx` calls it too so the app pages stay per-request without
// depending on that file. This spec fails only when both calls are gone.
const APP_PAGES = ["/overview", "/transactions", "/budgets", "/pots", "/recurring-bills"];

// Next's own Cache-Control for a page rendered per request, in production
// (next/dist/server/lib/cache-control.js:14-15, `revalidate: 0`).
const NEXT_DYNAMIC_DEFAULT = "private, no-cache, no-store, max-age=0, must-revalidate";

test.beforeEach(async ({ request }) => {
  expect((await request.post("/api/test/reset")).status()).toBe(200);
  const login = await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD_DISPLAY },
  });
  expect(login.status()).toBe(200);
});

for (const path of APP_PAGES) {
  test(`ADR-0006, SPEC-app-shell §2.1: ${path} renders per request — its inline scripts and styles carry this response's nonce`, async ({
    request,
  }) => {
    const first = await request.get(path, { maxRedirects: 0 });
    expect(first.status()).toBe(200);
    const nonce = scriptNonce(first.headers()["content-security-policy"]);
    expect(nonce).toBeTruthy();
    const html = await first.text();
    const tags = inlineTags(html);
    expect(tags.length).toBeGreaterThan(0);
    for (const tag of tags) expect(tag).toContain(`nonce="${nonce}"`);
    // A `style` attribute is blocked by style-src whatever its nonce.
    expect(html).not.toMatch(/\sstyle="/);

    const second = await request.get(path, { maxRedirects: 0 });
    const secondNonce = scriptNonce(second.headers()["content-security-policy"]);
    expect(secondNonce).toBeTruthy();
    expect(secondNonce).not.toBe(nonce);
    expect(await second.text()).toContain(`nonce="${secondNonce}"`);
  });
}

test("SPEC-auth §2.9 (T-05 hand-off): an authenticated page is no-store because the proxy says so — not Next's default", async ({
  request,
}) => {
  const response = await request.get("/transactions", { maxRedirects: 0 });
  expect(response.status()).toBe(200);
  // The proxy's literal. Next copies proxy headers onto the response before it
  // renders and writes its own Cache-Control only when none is set yet, and its value for a
  // dynamic page is never the bare "no-store" — so an exact match can only be the
  // proxy's (T-07 plan D17).
  expect(response.headers()["cache-control"]).toBe("no-store");
});

test("SPEC-auth §2.9: the contrast — a public page answers Next's own default, so the test above isolates the proxy", async ({
  playwright,
  baseURL,
}) => {
  const anonymous = await playwright.request.newContext({ baseURL });
  const response = await anonymous.get("/login");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe(NEXT_DYNAMIC_DEFAULT);
  await anonymous.dispose();
});
