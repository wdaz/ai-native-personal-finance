import { type APIRequestContext, expect, test } from "@playwright/test";
import { SessionResponseSchema } from "@/src/shared/schemas";

/**
 * SPEC-auth §2.7–2.8 (v1.0.7), ADR-0006 (2026-09-23, T-07 plan gate): when
 * POST /api/auth/logout fails, the client navigates to /login?reason=logout. For a same-origin
 * GET document navigation only, the proxy clears the session cookie and renders the login
 * page instead of redirecting a logged-in visitor to /overview. Any other request — another
 * Sec-Fetch-Site (a link on another site is logout CSRF; "none" is a typed URL), another
 * Sec-Fetch-Mode or -Dest (a same-origin fetch, an iframe), another method, or a browser that
 * sends none of the headers — keeps the redirect and the session.
 */

// What a browser sends for `window.location.assign("/login?reason=logout")` from an app page.
const NAVIGATION = {
  "sec-fetch-site": "same-origin",
  "sec-fetch-mode": "navigate",
  "sec-fetch-dest": "document",
};

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
    headers: NAVIGATION,
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
      // Mode and Dest stay as a navigation's, so only the Site guard is under test.
      headers: {
        "sec-fetch-mode": NAVIGATION["sec-fetch-mode"],
        "sec-fetch-dest": NAVIGATION["sec-fetch-dest"],
        ...(site ? { "sec-fetch-site": site } : {}),
      },
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
    headers: NAVIGATION,
    maxRedirects: 0,
  });

  expect(response.status()).toBe(200);
  expect(setCookies(response.headersArray())).toEqual([]);
});

test("SPEC-auth §2.8: any other reason keeps the logged-in redirect", async ({ request }) => {
  await logIn(request);
  const response = await request.get("/login?reason=reset", {
    headers: NAVIGATION,
    maxRedirects: 0,
  });

  expect(response.status()).toBe(302);
  expect(await isLoggedIn(request)).toBe(true);
});

// A same-origin request that is not a document navigation — a fetch(), an XHR, an iframe, a
// prefetch — must not be able to end the session in the background.
const notANavigation: [string, Record<string, string>][] = [
  ["a fetch (Sec-Fetch-Mode: cors)", { ...NAVIGATION, "sec-fetch-mode": "cors" }],
  ["an iframe (Sec-Fetch-Dest: iframe)", { ...NAVIGATION, "sec-fetch-dest": "iframe" }],
  ["Sec-Fetch-Mode and -Dest absent", { "sec-fetch-site": NAVIGATION["sec-fetch-site"] }],
];

for (const [what, headers] of notANavigation) {
  test(`US-03 AC2 same-origin but ${what}: the logout fallback does not apply — 302 /overview, the session lives`, async ({
    request,
  }) => {
    await logIn(request);
    const response = await request.get("/login?reason=logout", { headers, maxRedirects: 0 });

    expect(response.status()).toBe(302);
    expect(response.headers()["location"]).toContain("/overview");
    expect(setCookies(response.headersArray())).toEqual([]);
    expect(await isLoggedIn(request)).toBe(true);
  });
}

test("US-03 AC2 a same-origin POST to /login?reason=logout does not apply the fallback — the session lives", async ({
  request,
}) => {
  await logIn(request);
  const response = await request.post("/login?reason=logout", {
    headers: NAVIGATION,
    maxRedirects: 0,
  });

  expect(response.status()).toBe(302);
  expect(response.headers()["location"]).toContain("/overview");
  expect(setCookies(response.headersArray())).toEqual([]);
  expect(await isLoggedIn(request)).toBe(true);
});

/**
 * T-13d finding F-04/TD-15: POST /api/auth/logout checked no Sec-Fetch-Site of its own — unlike
 * the GET fallback above, which requires exactly same-origin/navigate/document. A cross-site
 * request (Sec-Fetch-Site: cross-site — what a form on another site sends) is refused; a
 * same-origin one (what the app's own logOut() sends) still works, and so does a request that
 * carries no Sec-Fetch-Site at all (a non-browser client, or a browser predating Fetch
 * Metadata — SameSite=Lax is that case's own defence, as it always has been).
 */
test("T-13d F-04: POST /api/auth/logout refuses a cross-site request; the session lives", async ({
  request,
}) => {
  await logIn(request);
  const response = await request.post("/api/auth/logout", {
    headers: { "sec-fetch-site": "cross-site" },
  });

  expect(response.status()).toBe(403);
  expect(setCookies(response.headersArray())).toEqual([]);
  expect(await isLoggedIn(request)).toBe(true);
});

test("T-13d F-04: POST /api/auth/logout still works same-origin, and with no Sec-Fetch-Site header", async ({
  request,
}) => {
  await logIn(request);
  const sameOrigin = await request.post("/api/auth/logout", {
    headers: { "sec-fetch-site": "same-origin" },
  });
  expect(sameOrigin.status()).toBe(204);
  expect(await isLoggedIn(request)).toBe(false);

  await logIn(request);
  const noHeader = await request.post("/api/auth/logout");
  expect(noHeader.status()).toBe(204);
  expect(await isLoggedIn(request)).toBe(false);
});
