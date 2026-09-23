import { expect, test } from "@playwright/test";
import { createDb, type Db } from "@/src/server/db";
import { databaseUrl } from "@/src/server/env";
import { resetToSeed } from "@/src/server/reset";
import { checkThreshold } from "@/src/server/threshold";

/**
 * SPEC-reset-and-test-support §2.4: `checkThreshold` against the database of DATABASE_URL.
 * Release 1 wires it without calling it (no write endpoint yet), so it is exercised directly.
 */
let db: Db;

test.beforeAll(() => {
  db = createDb(databaseUrl());
});

test.afterAll(async () => {
  await db.$disconnect();
});

test.beforeEach(async () => {
  await resetToSeed(db, "test");
});

const LIMITS = { RESET_ROW_THRESHOLD: "2000", RESET_BYTES_THRESHOLD: "1000000000" };

test("US-37 AC1 the seed alone is under both thresholds", async () => {
  expect(await checkThreshold(db, LIMITS)).toEqual({ exceeded: false, reason: null });
});

test("US-37 AC1 2,001 user-created transactions trip the row threshold", async () => {
  await db.transaction.createMany({
    data: Array.from({ length: 2001 }, (_, i) => ({
      name: `Not in the seed ${i}`,
      avatar: "not-in-the-seed",
      category: "General" as const,
      date: "2026-08-01T00:00:00Z",
      amount: -1,
      recurring: false,
    })),
  });
  expect(await checkThreshold(db, LIMITS)).toEqual({ exceeded: true, reason: "rows" });
});

test("T-08 plan D3: 2,001 failed logins alone never trip it", async () => {
  await db.loginAttempt.createMany({
    data: Array.from({ length: 2001 }, (_, i) => ({ ip: `203.0.113.${i % 255}`, success: false })),
  });
  expect(await checkThreshold(db, LIMITS)).toEqual({ exceeded: false, reason: null });
});

test("US-37 AC1 the database's size trips the byte threshold", async () => {
  // Any real database is larger than 1 byte: this runs the pg_database_size query and its
  // BigInt → Number conversion, which the row cases never reach.
  expect(await checkThreshold(db, { ...LIMITS, RESET_BYTES_THRESHOLD: "1" })).toEqual({
    exceeded: true,
    reason: "bytes",
  });
});
