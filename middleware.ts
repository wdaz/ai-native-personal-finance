import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/src/server/db";
import { latestResetAt } from "@/src/server/reset";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  isSessionValid,
  readSession,
  sealSession,
  sessionCookieHeader,
  shouldReissue,
} from "@/src/server/session";
import { sanitizeNextPath } from "@/src/shared/next-path";

// SPEC-auth §2.9: Node.js runtime, not the Edge default — the reset-epoch check needs the
// same Prisma/pg client src/server/db.ts uses elsewhere (T-05 plan gate Q2). The matcher
// excludes any path with a file extension (avatars and other `public/` assets, favicon) as
// well as `_next/*` — none of these need a session check, and running the resetEpoch DB
// query and setting `Cache-Control: no-store` on every image request for a logged-in visitor
// was needless cost and defeated the browser's own asset caching (review finding M6).
export const config = {
  runtime: "nodejs",
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\..*).*)"],
};

const PROTECTED = /^\/(overview|transactions|budgets|pots|recurring-bills)(\/|$)/;
const AUTH_PAGES = /^\/(login|signup)$/;
const PUBLIC_API = /^\/api\/(auth\/(login|signup|session)|meta)$/;
const TEST_API = /^\/api\/test\//;
// SPEC-auth §2.10 names exactly POST /api/admin/reset as secret-protected — not the whole
// /api/admin/* prefix (review finding M3: the prefix form exempted any other admin path from
// the session check too).
const ADMIN_API = /^\/api\/admin\/reset$/;

// SPEC-auth §2.7–2.8 (v1.0.6), ADR-0006 (2026-09-23, T-07 plan gate): where the logout button
// goes when POST /api/auth/logout failed. The browser still holds the httpOnly session cookie,
// which only a response can clear — so this one navigation clears it and shows the login page
// instead of bouncing a logged-in visitor to /overview. Only a same-origin navigation
// qualifies: a link or form on another site (logout CSRF), a typed URL ("none") or a browser
// that sends no Sec-Fetch-Site keeps the redirect.
function isLogoutFallback(request: NextRequest): boolean {
  return (
    request.nextUrl.pathname === "/login" &&
    request.nextUrl.searchParams.get("reason") === "logout" &&
    request.headers.get("sec-fetch-site") === "same-origin"
  );
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const now = new Date();
  const { pathname, search } = request.nextUrl;
  const requestId = crypto.randomUUID();
  // CSP3's nonce-source grammar is base64-value (A-Z a-z 0-9 + / =); crypto.randomUUID() on
  // its own includes "-", which is not valid base64 and risks a strict CSP parser rejecting
  // the nonce-source expression (review finding, Copilot High). Base64-encoding it, exactly
  // as Next's own docs do (content-security-policy.md), produces a valid token.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}'; frame-ancestors 'none'`;

  const isApi = pathname.startsWith("/api/");
  const isRoot = pathname === "/";
  const needsSession = isApi
    ? !PUBLIC_API.test(pathname) &&
      !TEST_API.test(pathname) &&
      !ADMIN_API.test(pathname) &&
      pathname !== "/api/auth/logout"
    : isRoot || PROTECTED.test(pathname);

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const payload = await readSession(cookie);
  const resetAt = payload ? await latestResetAt(getDb()) : null;
  const authenticated = payload !== null && isSessionValid(payload, now, resetAt);
  // SPEC-reset-and-test-support §2.6: a session rejected *only* because of the resetEpoch
  // check (otherwise still within its TTL) gets its own redirect reason — distinct from
  // never having had a session at all, so the login page can show "The demo data was reset"
  // (review finding I1).
  const resetInvalidated = payload !== null && !authenticated && isSessionValid(payload, now, null);
  const logoutFallback = isLogoutFallback(request);

  let response: NextResponse;

  if (isRoot) {
    response = NextResponse.redirect(
      new URL(
        authenticated ? "/overview" : resetInvalidated ? "/login?reason=reset" : "/login",
        request.url,
      ),
      302,
    );
  } else if (needsSession && !authenticated) {
    if (isApi) {
      response = NextResponse.json(
        { error: "unauthenticated", message: "Log in to continue" },
        { status: 401 },
      );
    } else {
      const next = sanitizeNextPath(`${pathname}${search}`);
      const loginUrl = new URL(resetInvalidated ? "/login?reason=reset" : "/login", request.url);
      loginUrl.searchParams.set("next", next);
      response = NextResponse.redirect(loginUrl, 302);
    }
  } else if (!isApi && AUTH_PAGES.test(pathname) && authenticated && !logoutFallback) {
    response = NextResponse.redirect(new URL("/overview", request.url), 302);
  } else {
    // Next 16 takes the nonce it puts on its own inline scripts and styles from the *request's*
    // Content-Security-Policy header (next/dist/server/app-render/app-render.js:209-210) — set
    // it there, as Next's content-security-policy guide does, rather than relying on Next
    // copying the response header onto the request (TD-1, closed by T-07). `x-nonce` is for our
    // own <Script> components, read with `headers()`.
    const forwardedHeaders = new Headers(request.headers);
    forwardedHeaders.set("Content-Security-Policy", csp);
    forwardedHeaders.set("x-nonce", nonce);
    response = NextResponse.next({ request: { headers: forwardedHeaders } });
  }

  // Skip the reissue on logout (and login, which seals its own fresh cookie) — otherwise an
  // old-enough session sends two Set-Cookie headers in one response, and only header-merge
  // order happens to make the clear win (review finding M5).
  const skipsReissue =
    pathname === "/api/auth/logout" || pathname === "/api/auth/login" || logoutFallback;
  if (!skipsReissue && authenticated && payload && shouldReissue(payload, now)) {
    const secure = request.url.startsWith("https://");
    const resealed = await sealSession({
      sub: "demo",
      iat: now.getTime(),
      resetEpoch: payload.resetEpoch,
    });
    response.headers.append(
      "Set-Cookie",
      sessionCookieHeader(resealed, SESSION_TTL_SECONDS, secure),
    );
  }
  if (logoutFallback && cookie !== undefined) {
    response.headers.append(
      "Set-Cookie",
      sessionCookieHeader("", 0, request.url.startsWith("https://")),
    );
  }

  response.headers.set("X-Request-Id", requestId);
  if (!isApi && authenticated) {
    response.headers.set("Cache-Control", "no-store");
  }
  // ADR-0006, 2026-09-23 amendment (restored): Next's own RSC-payload scripts and inline
  // styles are inline on every server-rendered page, so both script-src and style-src need
  // the nonce, not just script-src.
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");

  return response;
}
