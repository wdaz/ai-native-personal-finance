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
 * SPEC-reset-and-test-support §2.4. "Rows" are the user-created ones (US-37 AC1): non-seed
 * transactions, budgets and pots — never `ResetLog` or `LoginAttempt`, so failed-login spam
 * cannot force a reset (T-08 plan D3). Release 1 wires this but nothing calls it yet: the
 * write endpoints that will call it after every write arrive in Release 2.
 */
export async function checkThreshold(db: Db, env: Env = process.env): Promise<ThresholdResult> {
  const [transactions, budgets, pots, size] = await Promise.all([
    db.transaction.count({ where: { seeded: false } }),
    db.budget.count({ where: { seeded: false } }),
    db.pot.count({ where: { seeded: false } }),
    db.$queryRaw<{ bytes: bigint }[]>`SELECT pg_database_size(current_database()) AS bytes`,
  ]);
  const bytes = Number(size[0]?.bytes ?? 0n);
  return evaluateThreshold(
    transactions + budgets + pots,
    bytes,
    resetRowThreshold(env),
    resetBytesThreshold(env),
  );
}
