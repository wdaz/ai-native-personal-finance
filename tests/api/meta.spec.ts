import { expect, test } from "@playwright/test";
import { createDb, type Db } from "@/src/server/db";
import { databaseUrl } from "@/src/server/env";
import { ErrorEnvelopeSchema, MetaDtoSchema } from "@/src/shared/schemas";

/** SPEC-app-shell §3, §5: `GET /api/meta` and the "meta unavailable" state. */
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

test("US-37 AC2 GET /api/meta answers MetaDtoSchema with no session", async ({ request }) => {
  const response = await request.get("/api/meta");
  expect(response.status()).toBe(200);
  const meta = MetaDtoSchema.parse(await response.json());
  expect(meta.resetIntervalDays).toBe(10);
  expect(meta.webmcp).toEqual({ configuredMode: "polyfill", originTrial: false });
});

test("SPEC-app-shell §5: exactly Cache-Control: no-store", async ({ request }) => {
  const response = await request.get("/api/meta");
  expect(response.headers()["cache-control"]).toBe("no-store");
});

test("US-37 AC2 lastResetAt is the ResetLog row the latest reset wrote — nothing cached", async ({
  request,
}) => {
  const before = MetaDtoSchema.parse(await (await request.get("/api/meta")).json());
  const reset = await request.post("/api/test/reset");
  const { at } = (await reset.json()) as { at: string };
  const after = MetaDtoSchema.parse(await (await request.get("/api/meta")).json());
  expect(after.lastResetAt).toBe(at);
  expect(after.lastResetAt).not.toBe(before.lastResetAt);
});

test("SPEC-app-shell §3: with no ResetLog row, meta is unavailable — a 500, not a made-up date", async ({
  request,
}) => {
  await db.resetLog.deleteMany();
  const response = await request.get("/api/meta");
  expect(response.status()).toBe(500);
  expect(ErrorEnvelopeSchema.parse(await response.json()).error).toBe("server_error");
});

test("PR #20 review: the layout never shows a reset time a client sent as x-last-reset-at", async ({
  request,
}) => {
  const login = await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD_DISPLAY },
  });
  expect(login.status()).toBe(200);
  // With no ResetLog row the middleware reads no reset time and forwards none of its own: only
  // its delete stands between the client's header and the layout.
  await db.resetLog.deleteMany();

  const page = await request.get("/overview", {
    headers: { "x-last-reset-at": "2000-01-01T00:00:00.000Z" },
    maxRedirects: 0,
  });
  expect(page.status()).toBe(200);
  const html = await page.text();
  expect(html).toContain("Overview");
  expect(html).not.toContain("last reset 1 Jan 2000");
});
