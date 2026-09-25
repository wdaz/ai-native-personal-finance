import { sealData, unsealData } from "iron-session";

export type SessionPayload = { sub: "demo"; iat: number; resetEpoch: number };

export const SESSION_COOKIE_NAME = "pf_session";
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
export const SESSION_REISSUE_AFTER_SECONDS = 60 * 60;

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET is not set or shorter than 32 chars (.env.example)");
  }
  return secret;
}

/**
 * `resetEpoch` is stamped at login time from the *current* latest reset, not from `now` —
 * a session logged in after the last reset starts valid; the epoch only ever needs to move
 * forward past a *later* reset (isSessionValid below), never past its own creation.
 */
export async function sealSession(payload: SessionPayload): Promise<string> {
  return sealData(payload, { password: sessionSecret(), ttl: SESSION_TTL_SECONDS });
}

export async function readSession(cookieValue: string | undefined): Promise<SessionPayload | null> {
  if (!cookieValue) return null;
  try {
    const data = await unsealData<SessionPayload>(cookieValue, { password: sessionSecret() });
    return data.sub === "demo" ? data : null;
  } catch {
    return null;
  }
}

export function shouldReissue(session: SessionPayload, now: Date): boolean {
  return now.getTime() - session.iat > SESSION_REISSUE_AFTER_SECONDS * 1000;
}

export function isSessionValid(
  session: SessionPayload,
  now: Date,
  latestReset: Date | null,
): boolean {
  const age = now.getTime() - session.iat;
  if (age < 0 || age > SESSION_TTL_SECONDS * 1000) return false;
  if (latestReset !== null && session.resetEpoch < latestReset.getTime()) return false;
  return true;
}

/**
 * SPEC-auth §2.9: "Secure (except localhost)". `secure` is decided by the caller from the
 * request's own protocol (`request.url.startsWith("https://")`) — not `NODE_ENV`, which is
 * "production" for `next start` locally and in the Playwright/CI webServer too (plain HTTP),
 * where a Secure cookie would be set but never sent back by the browser (found running the
 * API tests against `next start` on http://127.0.0.1).
 */
export function sessionCookieHeader(
  sealed: string,
  maxAgeSeconds: number,
  secure: boolean,
): string {
  const secureFlag = secure ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=${sealed}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}${secureFlag}`;
}

/**
 * RFC 6265 §4.2.1 separates cookie-pairs with "; " (semicolon, space), but not every client
 * sends the space — splitting on the literal "; " only missed a cookie sent as "a=1;b=2"
 * (Copilot review, Medium). Splits on a semicolon and any amount of following whitespace
 * instead.
 *
 * Keeps the LAST match when a name repeats (T-13d finding F-01/TD-12): `proxy.ts`'s own
 * `request.cookies.get` (Next's `@edge-runtime/cookies`) keeps the last of several same-named
 * cookies, so this reader — the only other place `pf_session` is parsed, for the public
 * `GET /api/auth/session` probe — has to agree with it, or the two can answer differently for
 * the same request.
 */
export function readCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const prefix = `${name}=`;
  // .reverse().find(...), not .findLast(...): the project's lib target is ES2022, one short of
  // Array.prototype.findLast (ES2023).
  return cookieHeader
    .split(/;\s*/)
    .reverse()
    .find((pair) => pair.startsWith(prefix))
    ?.slice(prefix.length);
}
