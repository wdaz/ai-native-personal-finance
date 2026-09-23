import * as bcrypt from "bcryptjs";
import { COPY } from "@/src/shared/copy";
import { LoginSchema, SignupSchema, toErrorIssues } from "@/src/shared/schemas";
import { getDb } from "./db";
import { errorResponse, rateLimitedResponse, validationErrorResponse } from "./http";
import { checkRateLimit, recordAttempt } from "./rate-limit";
import { latestResetAt } from "./reset";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  isSessionValid,
  readSession,
  sealSession,
  sessionCookieHeader,
} from "./session";

function clientIp(request: Request): string {
  // Vercel and most proxies set this; a direct connection (local dev) has none, so fall
  // back to a constant — the rate limit still works per-process in that case.
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

export async function login(request: Request, now: Date): Promise<Response> {
  const db = getDb();
  const ip = clientIp(request);
  const rate = await checkRateLimit(db, ip, now);
  if (rate.limited) {
    return rateLimitedResponse(
      COPY.loginRateLimited(Math.max(1, Math.ceil(rate.retryAfter / 60))),
      rate.retryAfter,
    );
  }

  const rawBody: unknown = await request.json().catch(() => null);
  const parsed = LoginSchema.safeParse(rawBody);

  // SPEC-auth v1.0.3, T-05 plan gate Q5: run the bcrypt compare on the *submitted* password
  // even when the schema rejected the body, so a malformed body costs the same as a wrong
  // password — the schema-fail path has no expensive step of its own to skip otherwise.
  const passwordToCompare =
    typeof rawBody === "object" &&
    rawBody !== null &&
    "password" in rawBody &&
    typeof (rawBody as { password?: unknown }).password === "string"
      ? (rawBody as { password: string }).password
      : "";
  const passwordMatches = await bcrypt.compare(passwordToCompare, process.env.DEMO_PASSWORD_HASH ?? "");
  const emailMatches = parsed.success && parsed.data.email === process.env.DEMO_EMAIL;

  if (!parsed.success || !emailMatches || !passwordMatches) {
    await recordAttempt(db, ip, false, now);
    return errorResponse(401, "invalid_credentials", COPY.loginIncorrect);
  }

  await recordAttempt(db, ip, true, now);
  const resetAt = await latestResetAt(db);
  const sealed = await sealSession({
    sub: "demo",
    iat: now.getTime(),
    resetEpoch: (resetAt ?? now).getTime(),
  });
  const response = Response.json({ ok: true });
  const secure = request.url.startsWith("https://");
  response.headers.append("Set-Cookie", sessionCookieHeader(sealed, SESSION_TTL_SECONDS, secure));
  return response;
}

export async function signup(request: Request): Promise<Response> {
  const rawBody: unknown = await request.json().catch(() => null);
  const parsed = SignupSchema.safeParse(rawBody);
  if (!parsed.success) {
    return validationErrorResponse(toErrorIssues(parsed.error));
  }
  return Response.json({ code: "demo_instance" });
}

export async function logout(): Promise<Response> {
  const response = new Response(null, { status: 204 });
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
  );
  return response;
}

export async function session(request: Request, now: Date): Promise<Response> {
  const cookie = request.headers
    .get("cookie")
    ?.split("; ")
    .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.slice(SESSION_COOKIE_NAME.length + 1);
  const payload = await readSession(cookie);
  if (!payload) return Response.json({ authenticated: false });
  const resetAt = await latestResetAt(getDb());
  const authenticated = isSessionValid(payload, now, resetAt);
  return Response.json({ authenticated });
}
