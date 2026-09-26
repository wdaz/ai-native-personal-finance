import { NextResponse, type NextRequest } from "next/server";
import { buildCsp } from "@/src/server/csp";
import { getDb } from "@/src/server/db";
import { LAST_RESET_AT_HEADER } from "@/src/server/meta";
import { recordViaRequest } from "@/src/server/request-log";
import { latestResetAt } from "@/src/server/reset";
import { stripTransportSuffix } from "@/src/server/transport-path";
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
import { VIA_HEADER } from "@/src/shared/via";

// Next 16 renamed the `middleware` file convention to `proxy` (TD-2, T-13a). A proxy always runs
// on the Node.js runtime and Next refuses a `runtime` option in this file, so `config` holds the
// matcher only. Node.js is what the reset-epoch check needs: the same Prisma/pg client
// src/server/db.ts uses elsewhere (T-05 plan gate Q2 chose it over the Edge default). The matcher
// excludes static assets — `_next/static`, `_next/image`, the favicon and a path that ends in an
// image, font or text extension (avatars and the other `public/` files) — none of which needs a
// session check: running the resetEpoch DB query and setting `Cache-Control: no-store` on every
// image request for a logged-in visitor was needless cost and defeated the browser's own asset
// caching (review finding M6).
// It must not exclude "any path with a dot": Next appends `(\.json|\.rsc|\.segments/.+\.segment\.rsc)?`
// to a matcher so that the proxy also covers those transport forms of a page or API, and a dot
// exclusion swallows that suffix — on Vercel the proxy then never ran for `/overview.segments/*` or
// `/api/overview.json` (TD-19). `tests/unit/server/proxy-matcher.test.ts` compiles this pattern
// with Next's own function and pins both halves.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|txt|xml)$).*)",
  ],
};

const PROTECTED = /^\/(overview|transactions|budgets|pots|recurring-bills)(\/|$)/;
const AUTH_PAGES = /^\/(login|signup)$/;
const PUBLIC_API = /^\/api\/(auth\/(login|signup|session)|meta)$/;
const TEST_API = /^\/api\/test\//;
// SPEC-auth §2.10 names exactly POST /api/admin/reset as secret-protected — not the whole
// /api/admin/* prefix (review finding M3: the prefix form exempted any other admin path from
// the session check too).
const ADMIN_API = /^\/api\/admin\/reset$/;

// SPEC-auth §2.7–2.8 (v1.0.7), ADR-0006 (2026-09-23, T-07 plan gate): where the logout button
// goes when POST /api/auth/logout failed. The browser still holds the httpOnly session cookie,
// which only a response can clear — so this one navigation clears it and shows the login page
// instead of bouncing a logged-in visitor to /overview. Only a same-origin GET *document
// navigation* qualifies (Copilot review of PR #19): a link or form on another site (logout
// CSRF), a typed URL ("none"), a same-origin fetch()/XHR/iframe/prefetch (Sec-Fetch-Mode or
// -Dest differ), a non-GET method, or a browser that sends no fetch metadata keeps the
// redirect — an absent header fails closed. logOut()'s `window.location.assign` is exactly
// such a navigation, so the button's path is unchanged.
function isLogoutFallback(request: NextRequest): boolean {
  return (
    request.method === "GET" &&
    request.nextUrl.pathname === "/login" &&
    request.nextUrl.searchParams.get("reason") === "logout" &&
    request.headers.get("sec-fetch-site") === "same-origin" &&
    request.headers.get("sec-fetch-mode") === "navigate" &&
    request.headers.get("sec-fetch-dest") === "document"
  );
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const now = new Date();
  const { pathname, search } = request.nextUrl;
  const requestId = crypto.randomUUID();
  // CSP3's nonce-source grammar is base64-value (A-Z a-z 0-9 + / =); crypto.randomUUID() on
  // its own includes "-", which is not valid base64 and risks a strict CSP parser rejecting
  // the nonce-source expression (review finding, Copilot High). Base64-encoding it, exactly
  // as Next's own docs do (content-security-policy.md), produces a valid token.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  // One policy per environment, built in src/server/csp.ts: the production string is pinned
  // there and by the API suite; only `next dev` relaxes it (ADR-0006 amendment (4), TD-6).
  const csp = buildCsp(nonce, process.env.NODE_ENV);

  const isApi = pathname.startsWith("/api/");
  // SPEC-webmcp-tools §2.8: an API request a WebMCP tool made is recorded under this
  // response's request id — before the auth branch below, so a 401 is on record too.
  if (isApi) recordViaRequest(request.headers.get(VIA_HEADER), requestId, pathname);
  // TD-19: a page's `.rsc`, `.segments/*` and `.json` forms are the page, for the route matrix.
  // An API path is matched as requested — `/api/meta.json` is not the public `/api/meta`, so it
  // meets the session check and fails closed.
  const routePath = isApi ? pathname : stripTransportSuffix(pathname);
  const isRoot = routePath === "/";
  const needsSession = isApi
    ? !PUBLIC_API.test(pathname) &&
      !TEST_API.test(pathname) &&
      !ADMIN_API.test(pathname) &&
      pathname !== "/api/auth/logout"
    : isRoot || PROTECTED.test(routePath);

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
  const crossSiteLogout =
    pathname === "/api/auth/logout" &&
    request.method === "POST" &&
    request.headers.get("sec-fetch-site") === "cross-site";

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
      const next = sanitizeNextPath(`${routePath}${search}`);
      const loginUrl = new URL(resetInvalidated ? "/login?reason=reset" : "/login", request.url);
      loginUrl.searchParams.set("next", next);
      response = NextResponse.redirect(loginUrl, 302);
    }
  } else if (!isApi && AUTH_PAGES.test(routePath) && authenticated && !logoutFallback) {
    response = NextResponse.redirect(new URL("/overview", request.url), 302);
  } else if (crossSiteLogout) {
    // T-13d finding F-04/TD-15: POST /api/auth/logout needs no session (SPEC-auth §2.10), by
    // design — so, unlike every other route here, it had no check of its own against a
    // cross-site request (a hostile page auto-submitting a form to it) at all, relying only on
    // SameSite=Lax. A same-origin fetch (this app's own logOut(), or a client with no Fetch
    // Metadata support) still passes: only an explicit Sec-Fetch-Site: cross-site is refused.
    // Not run through ErrorEnvelope/SPEC-auth §2.10 — logout has no documented error shape,
    // and this is a proxy-level rejection, not a route-handler answer.
    response = NextResponse.json({ message: "This request must be same-origin" }, { status: 403 });
  } else {
    // Next 16 takes the nonce it puts on its own inline scripts and styles from the *request's*
    // Content-Security-Policy header (next/dist/server/app-render/app-render.js:209-210) — set
    // it there, as Next's content-security-policy guide does, rather than relying on Next
    // copying the response header onto the request (TD-1, closed by T-07). `x-nonce` is for our
    // own <Script> components, read with `headers()`. `x-request-id` carries the id this
    // response's X-Request-Id header gets, so a route handler's log line can name the same id
    // (SPEC-reset-and-test-support §2.2; T-08 plan D12).
    const forwardedHeaders = new Headers(request.headers);
    forwardedHeaders.set("Content-Security-Policy", csp);
    forwardedHeaders.set("x-nonce", nonce);
    forwardedHeaders.set("x-request-id", requestId);
    // The latest reset time, already read for the session check, for the (app) layout's banner:
    // one ResetLog read per page instead of two. A client's own copy is always removed, and the
    // value is set only when this request read it (PR #20 review).
    forwardedHeaders.delete(LAST_RESET_AT_HEADER);
    if (resetAt) forwardedHeaders.set(LAST_RESET_AT_HEADER, resetAt.toISOString());
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
  // ADR-0006, amendment (5): a document served without this header reports
  // `originAgentCluster === false` in Firefox and WebKit, and @mcp-b/webmcp-polyfill@5.1.0
  // (validateOriginAgentCluster) then throws SecurityError from registerTool, getTools and
  // executeTool — no WebMCP tool works there. Chromium's default is already true.
  response.headers.set("Origin-Agent-Cluster", "?1");

  return response;
}
