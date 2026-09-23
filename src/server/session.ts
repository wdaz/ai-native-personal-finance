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

export function sessionCookieHeader(sealed: string, maxAgeSeconds: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=${sealed}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}${secure}`;
}
