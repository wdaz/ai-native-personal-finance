import type { Db } from "./db";

export type WriteLimitResult = { limited: boolean; retryAfter: number };

/**
 * SPEC-write-path 2.10: `countInWindow` is the IP's writes already counted in the window (this
 * request not yet recorded), so the `max`-th write goes through and the next is limited. The
 * wait is until the oldest counted write leaves the window, at least one second.
 */
export function evaluateWrites(
  countInWindow: number,
  oldestAt: Date | null,
  now: Date,
  max: number,
  windowMs: number,
): WriteLimitResult {
  if (countInWindow < max || oldestAt === null) return { limited: false, retryAfter: 0 };
  const clearsAt = oldestAt.getTime() + windowMs;
  return { limited: true, retryAfter: Math.max(1, Math.ceil((clearsAt - now.getTime()) / 1000)) };
}

/**
 * SPEC-write-path 2.10: prune the rows older than the window (TD-18's lesson: the check keeps
 * its own table small), count the IP's writes in it (an aggregate, as the login limiter), and,
 * when under the limit, record this one. A refused write records nothing. Two requests racing at
 * the edge can both pass; the spec asks for no stricter count (T-17 plan D5). The limit and the
 * window are arguments, so the database tests use small values.
 */
export async function checkWriteLimit(
  db: Db,
  ip: string,
  now: Date,
  max: number,
  windowMs: number,
): Promise<WriteLimitResult> {
  const windowStart = new Date(now.getTime() - windowMs);
  await db.writeAttempt.deleteMany({ where: { at: { lt: windowStart } } });
  const result = await db.writeAttempt.aggregate({
    where: { ip, at: { gte: windowStart } },
    _count: true,
    _min: { at: true },
  });
  const verdict = evaluateWrites(result._count, result._min.at, now, max, windowMs);
  if (!verdict.limited) await db.writeAttempt.create({ data: { ip, at: now } });
  return verdict;
}
