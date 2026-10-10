import type { Db } from "./db";
import { resetBytesThreshold, resetRowThreshold, type Env } from "./env";

export type ThresholdResult = { exceeded: boolean; reason: "rows" | "bytes" | null };

/**
 * SPEC-reset-and-test-support §2.4: "> RESET_ROW_THRESHOLD" or "> RESET_BYTES_THRESHOLD" — a
 * value at the threshold does not trip it. Rows are checked first, so a row breach is reported
 * as "rows" even when the database is also over its byte threshold.
 */
export function evaluateThreshold(
  rows: number,
  bytes: number,
  rowThreshold: number,
  byteThreshold: number,
): ThresholdResult {
  if (rows > rowThreshold) return { exceeded: true, reason: "rows" };
  if (bytes > byteThreshold) return { exceeded: true, reason: "bytes" };
  return { exceeded: false, reason: null };
}

/**
 * SPEC-reset-and-test-support §2.4 (v1.8), SPEC-write-path 2.9: called by the write wrapper
 * after every write commits, as **one query** (§9 Q7). "Rows" are the user-created ones (US-37
 * AC1): non-seed transactions, budgets and pots — never `ResetLog`, `LoginAttempt` or
 * `WriteAttempt`, so failed-login or write-limiter traffic cannot force a reset by rows (T-08
 * plan D3); it can still grow the database toward the byte threshold.
 */
export async function checkThreshold(db: Db, env: Env = process.env): Promise<ThresholdResult> {
  const [counts] = await db.$queryRaw<{ rows: bigint; bytes: bigint }[]>`
    SELECT
      (SELECT count(*) FROM "Transaction" WHERE seeded = false)
      + (SELECT count(*) FROM "Budget" WHERE seeded = false)
      + (SELECT count(*) FROM "Pot" WHERE seeded = false) AS rows,
      pg_database_size(current_database()) AS bytes`;
  return evaluateThreshold(
    Number(counts?.rows ?? 0n),
    Number(counts?.bytes ?? 0n),
    resetRowThreshold(env),
    resetBytesThreshold(env),
  );
}
