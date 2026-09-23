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
// same Prisma/pg client src/server/db.ts uses elsewhere (T-05 plan gate Q2).
export const config = {
  runtime: "nodejs",
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

const PROTECTED = /^\/(overview|transactions|budgets|pots|recurring-bills)(\/|$)/;
const AUTH_PAGES = /^\/(login|signup)$/;
const PUBLIC_API = /^\/api\/(auth\/(login|signup|session)|meta)$/;
const TEST_API = /^\/api\/test\//;
const ADMIN_API = /^\/api\/admin\//;

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const now = new Date();
  const { pathname, search } = request.nextUrl;
  const requestId = crypto.randomUUID();

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

  let response: NextResponse;

  if (isRoot) {
    response = NextResponse.redirect(
      new URL(authenticated ? "/overview" : "/login", request.url),
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
      response = NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent(next)}`, request.url),
        302,
      );
    }
  } else if (!isApi && AUTH_PAGES.test(pathname) && authenticated) {
    response = NextResponse.redirect(new URL("/overview", request.url), 302);
  } else {
    response = NextResponse.next();
  }

  if (authenticated && payload && shouldReissue(payload, now)) {
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
    // ADR-0006, 2026-09-23 amendment: no inline nonce — R1 has no inline <script>.
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; frame-ancestors 'none'",
  );
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");

  return response;
}
