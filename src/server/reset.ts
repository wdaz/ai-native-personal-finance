import type { Db } from "./db";
import { Prisma } from "./generated/prisma/client";
import type { ResetReason } from "./generated/prisma/enums";
import { seedRows, type SeedRows } from "./seed";

/**
 * SPEC-reset-and-test-support §2.1: "truncates all tables" — every model of
 * prisma/schema.prisma and nothing else, so Prisma's `_prisma_migrations` survives.
 * tests/unit/reset.test.ts holds this list to the schema.
 */
export const RESET_TABLES = [
  "Balance",
  "Transaction",
  "Budget",
  "Pot",
  "ResetLog",
  "LoginAttempt",
] as const;

/** SPEC-reset-and-test-support §4: "reset never runs concurrently". */
export const RESET_LOCK_KEY = 42;

export type ResetResult = { at: Date; rows: number };

/**
 * One transaction: take the advisory lock, truncate, insert the seed rows (`seeded = true`),
 * write the `ResetLog` row. `at` is filled by Prisma's runtime from the server's clock when
 * the row is created (`@default(now())`) — operational time, not the fixed business clock —
 * so this module itself reads no clock (ADR-0005). `rows` counts the seed rows inserted;
 * `LoginAttempt` is emptied by the truncation.
 */
export async function resetToSeed(
  db: Db,
  reason: ResetReason,
  rows: SeedRows = seedRows(),
): Promise<ResetResult> {
  const result = await db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${RESET_LOCK_KEY}::bigint)`;
      // Identifiers cannot be bound parameters; the list is the constant above.
      const tables = Prisma.raw(RESET_TABLES.map((table) => `"${table}"`).join(", "));
      // RESTART IDENTITY restarts the `seq` counters, so seed order is 1, 2, 3… every time.
      await tx.$executeRaw`TRUNCATE TABLE ${tables} RESTART IDENTITY`;
      await tx.balance.create({ data: { ...rows.balance, seeded: true } });
      await tx.transaction.createMany({
        data: rows.transactions.map((transaction) => ({ ...transaction, seeded: true })),
      });
      await tx.budget.createMany({
        data: rows.budgets.map((budget) => ({ ...budget, seeded: true })),
      });
      await tx.pot.createMany({ data: rows.pots.map((pot) => ({ ...pot, seeded: true })) });
      const log = await tx.resetLog.create({ data: { reason } });
      return {
        at: log.at,
        rows: 1 + rows.transactions.length + rows.budgets.length + rows.pots.length,
      };
    },
    // A second reset waits on the lock inside its transaction, so the defaults (2 s to get a
    // connection, 5 s for the whole transaction) would abort it rather than serialise it.
    { maxWait: 10_000, timeout: 30_000 },
  );
  return result;
}

/**
 * SPEC-auth §2.9: the reset-epoch check compares a session's `resetEpoch` against this.
 * `null` when the table is empty — a fresh database before the first seed, which the
 * resetEpoch check treats as "nothing to reject against" (T-05 plan gate, Q4).
 */
export async function latestResetAt(db: Db): Promise<Date | null> {
  const latest = await db.resetLog.findFirst({ orderBy: { at: "desc" }, select: { at: true } });
  return latest?.at ?? null;
}
