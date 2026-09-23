import { expect, test, type APIResponse } from "@playwright/test";
import { createDb, type Db } from "@/src/server/db";
import { cronSecret, databaseUrl, resetSecret } from "@/src/server/env";
import { ErrorEnvelopeSchema, ScheduledResetSkippedSchema } from "@/src/shared/schemas";

/**
 * SPEC-reset-and-test-support §2.2–2.3: `/api/admin/reset` over HTTP, with its side effect —
 * the `ResetLog` row — read from the database. The secrets are the server's own (.env.local
 * locally, the workflow's env in CI). The unset-CRON_SECRET case cannot be staged here, since
 * the server always has one; tests/unit/server/admin-reset.test.ts covers it (T-08 plan v0.5).
 */
let db: Db;

test.beforeAll(() => {
  db = createDb(databaseUrl());
});

test.afterAll(async () => {
  await db.$disconnect();
});

test.beforeEach(async ({ request }) => {
  await request.post("/api/test/reset");
});

const bearer = (secret: string) => ({ Authorization: `Bearer ${secret}` });

function cron(): string {
  const secret = cronSecret();
  if (!secret) throw new Error("CRON_SECRET must be set for the API tests (.env.example, CI env)");
  return secret;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Moves the latest reset `days` into the past, so the daily check finds a reset due (§2.3 v1.4). */
async function lastResetDaysAgo(days: number): Promise<void> {
  await db.resetLog.updateMany({ data: { at: new Date(Date.now() - days * DAY_MS) } });
}

async function resetReasons(): Promise<string[]> {
  const logs = await db.resetLog.findMany({ orderBy: { at: "asc" } });
  return logs.map((log) => log.reason);
}

async function expectUnauthenticated(response: APIResponse): Promise<void> {
  expect(response.status()).toBe(401);
  expect(ErrorEnvelopeSchema.parse(await response.json()).error).toBe("unauthenticated");
  expect(await resetReasons(), "a refused request resets nothing").toEqual(["test"]);
}

test("US-37 AC1 POST with the reset secret and no body resets, reason manual", async ({
  request,
}) => {
  const response = await request.post("/api/admin/reset", { headers: bearer(resetSecret()) });
  expect(response.status()).toBe(204);
  expect(await resetReasons()).toEqual(["manual"]);
});

test("US-37 AC1 POST with reason threshold records it", async ({ request }) => {
  const response = await request.post("/api/admin/reset", {
    headers: bearer(resetSecret()),
    data: { reason: "threshold" },
  });
  expect(response.status()).toBe(204);
  expect(await resetReasons()).toEqual(["threshold"]);
});

test("US-37 AC1 T-08 plan Q1: GET with CRON_SECRET — Vercel's daily cron call — resets once the interval has passed, reason scheduled", async ({
  request,
}) => {
  await lastResetDaysAgo(10);
  const response = await request.get("/api/admin/reset", {
    headers: { ...bearer(cron()), "User-Agent": "vercel-cron/1.0" },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(204);
  expect(await resetReasons()).toEqual(["scheduled"]);
});

test("US-37 AC1 GET with the reset secret is the scheduled reset too", async ({ request }) => {
  await lastResetDaysAgo(10);
  const response = await request.get("/api/admin/reset", {
    headers: bearer(resetSecret()),
    maxRedirects: 0,
  });
  expect(response.status()).toBe(204);
  expect(await resetReasons()).toEqual(["scheduled"]);
});

test("US-37 AC1 PR #20 review finding 2: the daily check before the interval has passed resets nothing — 200 with the due time", async ({
  request,
}) => {
  const [last] = await db.resetLog.findMany();
  if (!last) throw new Error("beforeEach's reset wrote no ResetLog row");
  for (const daysAgo of [0, 9]) {
    if (daysAgo) await lastResetDaysAgo(daysAgo);
    const { at } = (await db.resetLog.findMany())[0]!;
    const response = await request.get("/api/admin/reset", {
      headers: bearer(cron()),
      maxRedirects: 0,
    });
    expect(response.status()).toBe(200);
    expect(ScheduledResetSkippedSchema.parse(await response.json())).toEqual({
      reset: false,
      dueAt: new Date(at.getTime() + 10 * DAY_MS - 60 * 60 * 1000).toISOString(),
    });
    expect(await resetReasons()).toEqual(["test"]);
  }
});

test("SPEC-reset-and-test-support §2.2: POST always resets, however recent the last reset", async ({
  request,
}) => {
  const response = await request.post("/api/admin/reset", {
    headers: bearer(resetSecret()),
    data: { reason: "scheduled" },
  });
  expect(response.status()).toBe(204);
  expect(await resetReasons()).toEqual(["scheduled"]);
});

test("SPEC-reset-and-test-support §2.3: POST accepts the cron secret as well", async ({
  request,
}) => {
  const response = await request.post("/api/admin/reset", { headers: bearer(cron()) });
  expect(response.status()).toBe(204);
  expect(await resetReasons()).toEqual(["manual"]);
});

test("SPEC-reset-and-test-support §2.2: no Authorization header — 401, nothing reset", async ({
  request,
}) => {
  await expectUnauthenticated(await request.post("/api/admin/reset"));
  await expectUnauthenticated(await request.get("/api/admin/reset", { maxRedirects: 0 }));
});

test("SPEC-reset-and-test-support §2.2: a wrong or empty secret — 401, nothing reset", async ({
  request,
}) => {
  for (const headers of [bearer("not-the-secret"), bearer(""), { Authorization: resetSecret() }]) {
    await expectUnauthenticated(await request.post("/api/admin/reset", { headers }));
  }
});

test("SPEC-reset-and-test-support §2.2: reason test, an unknown reason, an extra field or bad JSON — 400, nothing reset", async ({
  request,
}) => {
  const cases = [
    { data: { reason: "test" }, path: ["reason"] },
    { data: { reason: "weekly" }, path: ["reason"] },
    { data: { reason: "manual", extra: 1 }, path: ["extra"] },
  ];
  for (const { data, path } of cases) {
    const response = await request.post("/api/admin/reset", {
      headers: bearer(resetSecret()),
      data,
    });
    expect(response.status()).toBe(400);
    expect(ErrorEnvelopeSchema.parse(await response.json()).issues).toEqual([
      { path, code: "invalid_format" },
    ]);
  }
  const badJson = await request.post("/api/admin/reset", {
    headers: { ...bearer(resetSecret()), "Content-Type": "application/json" },
    data: "{not json",
  });
  expect(badJson.status()).toBe(400);
  expect(await resetReasons()).toEqual(["test"]);
});

test("SPEC-reset-and-test-support §2.6: an admin reset ends the session (US-03 AC3)", async ({
  request,
}) => {
  await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD_DISPLAY },
  });
  expect((await (await request.get("/api/auth/session")).json()).authenticated).toBe(true);
  await lastResetDaysAgo(10);
  await request.get("/api/admin/reset", { headers: bearer(cron()), maxRedirects: 0 });
  expect((await (await request.get("/api/auth/session")).json()).authenticated).toBe(false);
});
