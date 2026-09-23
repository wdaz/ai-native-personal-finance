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

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const now = new Date();
  const { pathname, search } = request.nextUrl;
  const requestId = crypto.randomUUID();
  const nonce = crypto.randomUUID();

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
  } else if (!isApi && AUTH_PAGES.test(pathname) && authenticated) {
    response = NextResponse.redirect(new URL("/overview", request.url), 302);
  } else {
    // Next.js reads the nonce back out of this request header while rendering (ADR-0006,
    // content-security-policy.md's "How nonces work in Next.js") and applies it to its own
    // inline RSC-payload scripts, framework scripts and inline styles automatically — no
    // per-tag wiring needed on our side for anything Next itself emits.
    const forwardedHeaders = new Headers(request.headers);
    forwardedHeaders.set("x-nonce", nonce);
    response = NextResponse.next({ request: { headers: forwardedHeaders } });
  }

  // Skip the reissue on logout (and login, which seals its own fresh cookie) — otherwise an
  // old-enough session sends two Set-Cookie headers in one response, and only header-merge
  // order happens to make the clear win (review finding M5).
  const skipsReissue = pathname === "/api/auth/logout" || pathname === "/api/auth/login";
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

  response.headers.set("X-Request-Id", requestId);
  if (!isApi && authenticated) {
    response.headers.set("Cache-Control", "no-store");
  }
  response.headers.set(
    // ADR-0006, 2026-09-23 amendment (restored): Next's own RSC-payload scripts and inline
    // styles are inline on every server-rendered page, so both script-src and style-src need
    // the nonce, not just script-src.
    "Content-Security-Policy",
    `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}'; frame-ancestors 'none'`,
  );
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");

  return response;
}
