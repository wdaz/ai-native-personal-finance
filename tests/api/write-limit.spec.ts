import { expect, test } from "@playwright/test";
import { createDb, type Db } from "@/src/server/db";
import { databaseUrl } from "@/src/server/env";
import { resetToSeed } from "@/src/server/reset";
import { checkThreshold } from "@/src/server/threshold";
import { checkWriteLimit } from "@/src/server/write-limit";

/**
 * SPEC-write-path 2.10 against the database of DATABASE_URL: the write limiter's own functions,
 * called with a small limit (7.3; the server's limit is 1,000 in the suites, so no route test
 * reaches it by accident). The 429 through `guardedWrite` is `write-wrapper.spec.ts`.
 */
let db: Db;
const NOW = new Date("2026-10-10T12:00:00.000Z");
const WINDOW = 60_000;
const IP = "203.0.113.7";

test.beforeAll(() => {
  db = createDb(databaseUrl());
});
test.afterAll(async () => {
  await db.$disconnect();
});
test.beforeEach(async () => {
  await resetToSeed(db, "test");
});

test("US-36 NFR-S4: the third write of a limit of 2 is limited, with retryAfter, and records no row", async () => {
  expect((await checkWriteLimit(db, IP, NOW, 2, WINDOW)).limited).toBe(false);
  expect((await checkWriteLimit(db, IP, new Date(NOW.getTime() + 1000), 2, WINDOW)).limited).toBe(
    false,
  );
  const third = await checkWriteLimit(db, IP, new Date(NOW.getTime() + 2000), 2, WINDOW);
  expect(third).toEqual({ limited: true, retryAfter: 58 });
  expect(await db.writeAttempt.count({ where: { ip: IP } })).toBe(2);
});

test("NFR-S4: another IP has its own count", async () => {
  await checkWriteLimit(db, IP, NOW, 1, WINDOW);
  expect((await checkWriteLimit(db, "198.51.100.1", NOW, 1, WINDOW)).limited).toBe(false);
});

test("NFR-S4: at the window's end the IP may write again, and the old rows are pruned by the check", async () => {
  await checkWriteLimit(db, IP, NOW, 1, WINDOW);
  await db.writeAttempt.create({ data: { ip: "198.51.100.9", at: NOW } });
  const later = new Date(NOW.getTime() + WINDOW + 1);
  expect((await checkWriteLimit(db, IP, later, 1, WINDOW)).limited).toBe(false);
  // Both rows older than the window are gone, whatever their IP; only the new one is left.
  expect(await db.writeAttempt.findMany({ select: { ip: true, at: true } })).toEqual([
    { ip: IP, at: later },
  ]);
});

test("US-37 NFR-S4: a reset empties the table, and its rows never count toward the row threshold", async () => {
  await db.writeAttempt.createMany({
    data: Array.from({ length: 2001 }, (_, i) => ({ ip: `203.0.113.${i % 255}`, at: NOW })),
  });
  const limits = { RESET_ROW_THRESHOLD: "2000", RESET_BYTES_THRESHOLD: "1000000000" };
  expect(await checkThreshold(db, limits)).toEqual({ exceeded: false, reason: null });
  await resetToSeed(db, "test");
  expect(await db.writeAttempt.count()).toBe(0);
});
