import { expect, test } from "@playwright/test";
import pg from "pg";
import { createDb, type Db } from "@/src/server/db";
import { databaseUrl } from "@/src/server/env";
import { RESET_LOCK_KEY, resetToSeed } from "@/src/server/reset";
import { seedRows } from "@/src/server/seed";
import { insertedRows, storedRows } from "@/tests/fixtures/database";

/**
 * SPEC-reset-and-test-support §2.1, §2.5 and §4: `resetToSeed` against the database of
 * DATABASE_URL. US-36 AC2: the data lives in the database; data.json is only the seed.
 */
let db: Db;

test.beforeAll(() => {
  db = createDb(databaseUrl());
});

test.afterAll(async () => {
  await db.$disconnect();
});

test("US-36 resetToSeed replaces whatever the tables hold with the seed", async () => {
  await db.transaction.create({
    data: {
      name: "Not in the seed",
      avatar: "not-in-the-seed",
      category: "General",
      date: "2026-08-01T00:00:00Z",
      amount: -100,
      recurring: false,
    },
  });
  await db.loginAttempt.create({ data: { ip: "203.0.113.7", success: false } });
  const rows = seedRows();

  const result = await resetToSeed(db, "manual");

  expect(await storedRows(db)).toEqual(insertedRows(rows));
  expect(await db.loginAttempt.count()).toBe(0);
  const logs = await db.resetLog.findMany();
  expect(logs.map((log) => ({ at: log.at, reason: log.reason }))).toEqual([
    { at: result.at, reason: "manual" },
  ]);
  expect(result.rows).toBe(1 + rows.transactions.length + rows.budgets.length + rows.pots.length);
});

test("budgets and pots keep the seed's order as their creation order", async () => {
  await resetToSeed(db, "test");

  const budgets = await db.budget.findMany({ orderBy: { seq: "asc" } });
  const pots = await db.pot.findMany({ orderBy: { seq: "asc" } });

  expect(budgets.map((b) => b.category)).toEqual(seedRows().budgets.map((b) => b.category));
  expect(pots.map((p) => p.name)).toEqual(seedRows().pots.map((p) => p.name));
  // RESTART IDENTITY: the counters start again at 1 on every reset.
  expect(budgets.map((b) => b.seq)).toEqual(budgets.map((_, i) => i + 1));
  expect(pots.map((p) => p.seq)).toEqual(pots.map((_, i) => i + 1));
});

test("a reset leaves Prisma's migration history alone", async () => {
  const migrations = () =>
    db.$queryRaw<{ n: number }[]>`SELECT count(*)::int AS n FROM "_prisma_migrations"`;
  const before = await migrations();
  expect(before[0]?.n).toBeGreaterThan(0);

  await resetToSeed(db, "test");

  expect(await migrations()).toEqual(before);
});

test("a reset waits for the advisory lock, so two never run at once (§4)", async () => {
  const holder = new pg.Client({ connectionString: databaseUrl() });
  await holder.connect();
  try {
    await holder.query("SELECT pg_advisory_lock($1)", [RESET_LOCK_KEY]);
    const reset = resetToSeed(db, "test");
    // Postgres lists a session that waits for a lock it has not been granted.
    await expect
      .poll(async () => {
        const { rows } = await holder.query<{ n: number }>(
          `SELECT count(*)::int AS n FROM pg_locks
            WHERE locktype = 'advisory' AND objid = $1 AND objsubid = 1 AND NOT granted`,
          [RESET_LOCK_KEY],
        );
        return rows[0]?.n;
      })
      .toBe(1);
    await holder.query("SELECT pg_advisory_unlock($1)", [RESET_LOCK_KEY]);
    await expect(reset).resolves.toMatchObject({ rows: expect.any(Number) });
  } finally {
    await holder.end();
  }
});
