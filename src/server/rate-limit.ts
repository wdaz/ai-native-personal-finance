import type { Db } from "./db";

export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const RATE_LIMIT_MAX_FAILURES = 10;

/**
 * SPEC-auth §4: 10 failed logins / 15 min / IP → 429; a success clears the IP's counter (so
 * `recordAttempt(..., success: true, ...)` also deletes the window's failures, rather than
 * this function seeing a mix of old failures and a success and needing to reason about
 * ordering).
 */
export function evaluateAttempts(
  failuresInWindow: number,
  now: Date,
  oldestFailureAt: Date | null,
): { limited: boolean; retryAfter: number } {
  if (failuresInWindow <= RATE_LIMIT_MAX_FAILURES || oldestFailureAt === null) {
    return { limited: false, retryAfter: 0 };
  }
  const clearsAt = oldestFailureAt.getTime() + RATE_LIMIT_WINDOW_MS;
  const retryAfter = Math.max(1, Math.ceil((clearsAt - now.getTime()) / 1000));
  return { limited: true, retryAfter };
}

export async function checkRateLimit(
  db: Db,
  ip: string,
  now: Date,
): Promise<{ limited: boolean; retryAfter: number }> {
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
  const failures = await db.loginAttempt.findMany({
    where: { ip, success: false, at: { gte: windowStart } },
    orderBy: { at: "asc" },
    select: { at: true },
  });
  return evaluateAttempts(failures.length, now, failures[0]?.at ?? null);
}

export async function recordAttempt(
  db: Db,
  ip: string,
  success: boolean,
  now: Date,
): Promise<void> {
  await db.loginAttempt.create({ data: { ip, success, at: now } });
  // "a successful login clears the IP's counter" (SPEC-auth §4) — delete the prior failures
  // so the very next failed attempt starts a fresh window, not one still holding old ones.
  if (success) {
    await db.loginAttempt.deleteMany({ where: { ip, success: false } });
  }
}
