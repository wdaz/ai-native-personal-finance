import { type APIRequestContext, expect, test } from "@playwright/test";
import { SessionResponseSchema } from "@/src/shared/schemas";

/**
 * SPEC-auth §2.7–2.8 (v1.0.6), ADR-0006 (2026-09-23, T-07 plan gate): when
 * POST /api/auth/logout fails, the client navigates to /login?reason=logout. For a same-origin
 * navigation only, the middleware clears the session cookie and renders the login page
 * instead of redirecting a logged-in visitor to /overview. Any other Sec-Fetch-Site — a link
 * on another site (logout CSRF), a typed URL ("none"), a browser that sends none — keeps the
 * redirect and the session.
 */

const demo = { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD_DISPLAY };

async function logIn(request: APIRequestContext) {
  expect((await request.post("/api/auth/login", { data: demo })).status()).toBe(200);
}

async function isLoggedIn(request: APIRequestContext): Promise<boolean> {
  const response = await request.get("/api/auth/session");
  return SessionResponseSchema.parse(await response.json()).authenticated;
}

function setCookies(headers: { name: string; value: string }[]): string[] {
  return headers
    .filter(({ name }) => name.toLowerCase() === "set-cookie")
    .map(({ value }) => value);
}

test.beforeEach(async ({ request }) => {
  expect((await request.post("/api/test/reset")).status()).toBe(200);
});

test("US-03 AC2 a same-origin GET /login?reason=logout clears a live session and renders the login page", async ({
  request,
}) => {
  await logIn(request);
  const response = await request.get("/login?reason=logout", {
    headers: { "sec-fetch-site": "same-origin" },
    maxRedirects: 0,
  });

  expect(response.status()).toBe(200);
  expect(setCookies(response.headersArray())).toEqual([
    expect.stringMatching(/^pf_session=;.*Max-Age=0/),
  ]);
  expect(await isLoggedIn(request)).toBe(false);
});

for (const site of ["cross-site", "same-site", "none", undefined]) {
  test(`US-03 AC2 Sec-Fetch-Site ${site ?? "absent"}: the logout fallback does not apply — 302 /overview, the session lives`, async ({
    request,
  }) => {
    await logIn(request);
    const response = await request.get("/login?reason=logout", {
      headers: site ? { "sec-fetch-site": site } : {},
      maxRedirects: 0,
    });

    expect(response.status()).toBe(302);
    expect(response.headers()["location"]).toContain("/overview");
    expect(await isLoggedIn(request)).toBe(true);
  });
}

test("US-03 AC2 a visitor with no session just gets the login page — nothing to clear", async ({
  request,
}) => {
  const response = await request.get("/login?reason=logout", {
    headers: { "sec-fetch-site": "same-origin" },
    maxRedirects: 0,
  });

  expect(response.status()).toBe(200);
  expect(setCookies(response.headersArray())).toEqual([]);
});

test("SPEC-auth §2.8: any other reason keeps the logged-in redirect", async ({ request }) => {
  await logIn(request);
  const response = await request.get("/login?reason=reset", {
    headers: { "sec-fetch-site": "same-origin" },
    maxRedirects: 0,
  });

  expect(response.status()).toBe(302);
  expect(await isLoggedIn(request)).toBe(true);
});
