import { expect, test } from "@playwright/test";
import { createDb, type Db } from "@/src/server/db";
import { databaseUrl } from "@/src/server/env";
import { seedRows } from "@/src/server/seed";
import { SEED_VARIANTS, applyVariant } from "@/src/server/variants";
import { insertedRows, storedRows } from "@/tests/fixtures/database";

/**
 * SPEC-reset-and-test-support §2.7 over HTTP, against `next start` with APP_ENV=test
 * (playwright.config.ts). Outside test the routes answer 404 — tests/unit/test-support.test.ts.
 */
let db: Db;

test.beforeAll(() => {
  db = createDb(databaseUrl());
});

test.afterAll(async () => {
  await db.$disconnect();
});

test("the server under test has the test-support routes (APP_ENV=test)", async ({ request }) => {
  const response = await request.post("/api/test/seed", { data: {} });
  // 404 means a server without APP_ENV=test — typically `npm run dev` on the same port,
  // which Playwright reuses outside CI. Stop it, or run the tests on another PORT.
  expect(response.status(), "is the server running with APP_ENV=test?").toBe(400);
});

test("US-36 POST /api/test/reset puts the seed back and answers its time", async ({ request }) => {
  await db.loginAttempt.create({ data: { ip: "203.0.113.7", success: false } });

  const response = await request.post("/api/test/reset");

  expect(response.status()).toBe(200);
  const body = (await response.json()) as { at: string };
  expect(await storedRows(db)).toEqual(insertedRows(seedRows()));
  expect(await db.loginAttempt.count()).toBe(0);
  const logs = await db.resetLog.findMany();
  expect(logs.map((log) => ({ at: log.at.toISOString(), reason: log.reason }))).toEqual([
    { at: body.at, reason: "test" },
  ]);
});

for (const variant of SEED_VARIANTS) {
  test(`POST /api/test/seed ${variant} stores the ${variant} rows`, async ({ request }) => {
    const response = await request.post("/api/test/seed", { data: { variant } });

    expect(response.status()).toBe(200);
    const body = (await response.json()) as { at: string; variant: string };
    expect(body.variant).toBe(variant);
    expect(await storedRows(db)).toEqual(insertedRows(applyVariant(seedRows(), variant)));
    const logs = await db.resetLog.findMany();
    expect(logs.map((log) => ({ at: log.at.toISOString(), reason: log.reason }))).toEqual([
      { at: body.at, reason: "test" },
    ]);
  });
}

test("POST /api/test/seed refuses an unknown variant and changes nothing", async ({ request }) => {
  await request.post("/api/test/seed", { data: { variant: "empty-pots" } });
  const before = await storedRows(db);

  const response = await request.post("/api/test/seed", { data: { variant: "nope" } });

  expect(response.status()).toBe(400);
  expect(await response.json()).toMatchObject({ error: "validation" });
  expect(await storedRows(db)).toEqual(before);
});
