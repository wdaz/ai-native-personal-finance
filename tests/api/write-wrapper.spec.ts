import { expect, test } from "@playwright/test";
import { z } from "zod";
import { createDb, type Db } from "@/src/server/db";
import { databaseUrl } from "@/src/server/env";
import { resetToSeed } from "@/src/server/reset";
import { guardedWrite, type GuardedWriteOptions } from "@/src/server/write";
import { Theme } from "@/src/server/generated/prisma/enums";
import { ErrorEnvelopeSchema, PotNameSchema } from "@/src/shared/schemas";

/**
 * SPEC-write-path 2.2 steps 5–10 and 2.9: `guardedWrite`, called directly against the database
 * of DATABASE_URL — no write route exists before T-23 (T-17 plan F6), as `threshold.spec.ts`
 * calls `checkThreshold`. The rows of 7.2 that need a real route run in T-23 and T-25.
 */
let db: Db;
const NOW = new Date("2026-10-10T12:00:00.000Z");
const IP = "203.0.113.20";
const REQUEST_ID = "11111111-2222-4333-8444-555555555555";
const ENV = {
  WRITE_RATE_LIMIT_MAX: "3",
  WRITE_RATE_LIMIT_WINDOW_SECONDS: "60",
  RESET_ROW_THRESHOLD: "2000",
  RESET_BYTES_THRESHOLD: "1000000000",
};
const Body = z.object({ name: PotNameSchema });
const ID = "6f1d3c1e-8a2b-4c3d-9e4f-5a6b7c8d9e0f";

test.beforeAll(() => {
  db = createDb(databaseUrl());
});
test.afterAll(async () => {
  await db.$disconnect();
});
test.beforeEach(async () => {
  await resetToSeed(db, "test");
});

function request(body: string | undefined, method = "POST"): Request {
  return new Request("http://localhost/api/pots", {
    method,
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": IP,
      "x-request-id": REQUEST_ID,
    },
    body,
  });
}

async function freeTheme(): Promise<Theme> {
  const used = new Set((await db.pot.findMany({ select: { theme: true } })).map((p) => p.theme));
  const theme = Object.values(Theme).find((t) => !used.has(t));
  if (theme === undefined) throw new Error("no free theme");
  return theme;
}

/** A create that a pot route might run: one row, answered 201 with its name. */
async function createPot(
  body: string | undefined,
  overrides: Partial<GuardedWriteOptions<{ name: string }>> = {},
) {
  const theme = await freeTheme();
  let ran = 0;
  const response = await guardedWrite(request(body), {
    now: NOW,
    schema: Body,
    db,
    env: ENV,
    run: async (tx, input) => {
      ran += 1;
      const pot = await tx.pot.create({
        data: { name: input!.name, target: 100n, total: 0n, theme },
      });
      return { kind: "ok", status: 201, body: { pot: { name: pot.name } } };
    },
    ...overrides,
  });
  return { response, ran: () => ran };
}

/** Every answer: the proxy's request id and no-store (2.2 step 10). */
function expectAnswerHeaders(response: Response) {
  expect(response.headers.get("x-request-id")).toBe(REQUEST_ID);
  expect(response.headers.get("cache-control")).toBe("no-store");
}

test("US-36 AC1 a valid write commits in one transaction and answers 201 with the route's body", async () => {
  const { response } = await createPot(JSON.stringify({ name: "  Boat  " }));
  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({ pot: { name: "Boat" } });
  expectAnswerHeaders(response);
  expect(await db.pot.count({ where: { name: "Boat" } })).toBe(1);
  expect(await db.writeAttempt.count({ where: { ip: IP } })).toBe(1);
});

test("NFR-S4 over the limit → 429 with Retry-After and retryAfter, before the body is read, nothing written", async () => {
  await db.writeAttempt.createMany({
    data: Array.from({ length: 3 }, () => ({ ip: IP, at: new Date(NOW.getTime() - 30_000) })),
  });
  const { response, ran } = await createPot("not json");
  expect(response.status).toBe(429);
  expect(response.headers.get("retry-after")).toBe("30");
  expect(ErrorEnvelopeSchema.parse(await response.json())).toEqual({
    error: "rate_limited",
    message: "Too many changes",
    retryAfter: 30,
  });
  expectAnswerHeaders(response);
  expect(ran()).toBe(0);
});

test("US-31 a path id that is not a UUID → 400 on id, before the body (4.4)", async () => {
  const { response, ran } = await createPot("not json", { id: "42" });
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({
    error: "validation",
    issues: [{ path: ["id"], code: "invalid_format" }],
  });
  expect(ran()).toBe(0);
});

test("US-31 a body that is not JSON → 400 on [], and run never runs", async () => {
  const { response, ran } = await createPot("{name:");
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({
    error: "validation",
    issues: [{ path: [], code: "invalid_format" }],
  });
  expectAnswerHeaders(response);
  expect(ran()).toBe(0);
});

test("US-31 a body that fails the schema → 400 with the write family's codes", async () => {
  const { response, ran } = await createPot(JSON.stringify({ name: "n".repeat(31) }));
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({
    error: "validation",
    issues: [{ path: ["name"], code: "too_long" }],
  });
  expect(ran()).toBe(0);
});

test("SPEC-write-path 2.2 step 6: a DELETE reads no body, and a 204 has none", async () => {
  let seen: unknown = "unset";
  const response = await guardedWrite(request(undefined, "DELETE"), {
    now: NOW,
    id: ID,
    db,
    env: ENV,
    run: async (_tx, input, id) => {
      seen = { input, id };
      return { kind: "ok", status: 204 };
    },
  });
  expect(response.status).toBe(204);
  expect(await response.text()).toBe("");
  expectAnswerHeaders(response);
  expect(seen).toEqual({ input: undefined, id: ID });
});

test("US-36 run's not_found → 404, and what run wrote before it is rolled back (2.8)", async () => {
  const theme = await freeTheme();
  const response = await guardedWrite(request(JSON.stringify({ name: "Ghost" })), {
    now: NOW,
    schema: Body,
    db,
    env: ENV,
    run: async (tx) => {
      await tx.pot.create({ data: { name: "Ghost", target: 1n, total: 0n, theme } });
      return { kind: "not_found" };
    },
  });
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: "not_found", message: "Not found" });
  expect(await db.pot.count({ where: { name: "Ghost" } })).toBe(0);
});

test("US-31 run's business-rule issues → 400, rolled back", async () => {
  const response = await guardedWrite(request(JSON.stringify({ name: "x" })), {
    now: NOW,
    schema: Body,
    db,
    env: ENV,
    run: async () => ({
      kind: "validation",
      issues: [{ path: ["amount"], code: "exceeds_balance" }],
    }),
  });
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({
    error: "validation",
    issues: [{ path: ["amount"], code: "exceeds_balance" }],
  });
});

test("US-31 a unique-constraint violation in the database → 400 taken on its field (2.8)", async () => {
  // "savings" — Pot.name is citext, so the seed's "Savings" is the same name.
  const { response } = await createPot(JSON.stringify({ name: "savings" }));
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({
    error: "validation",
    issues: [{ path: ["name"], code: "taken" }],
  });
});

test("US-37 AC1 AC3 over the threshold after the commit → the demo resets, 409 conflict, a threshold ResetLog row (2.9)", async () => {
  const { response } = await createPot(JSON.stringify({ name: "Boat" }), {
    env: { ...ENV, RESET_BYTES_THRESHOLD: "1" },
  });
  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({ error: "conflict", message: "Data was reset" });
  expectAnswerHeaders(response);
  expect(await db.pot.count({ where: { name: "Boat" } })).toBe(0);
  const latest = await db.resetLog.findFirstOrThrow({ orderBy: { at: "desc" } });
  expect(latest.reason).toBe("threshold");
});

test("US-37 AC1 a threshold check that throws does not fail the write (2.9)", async () => {
  // An invalid threshold makes checkThreshold throw after the commit.
  const { response } = await createPot(JSON.stringify({ name: "Boat" }), {
    env: { ...ENV, RESET_ROW_THRESHOLD: "lots" },
  });
  expect(response.status).toBe(201);
  expect(await db.pot.count({ where: { name: "Boat" } })).toBe(1);
});

test("SPEC-write-path 2.6: anything unexpected → 500 server_error, with the request id", async () => {
  const response = await guardedWrite(request(JSON.stringify({ name: "x" })), {
    now: NOW,
    schema: Body,
    db,
    env: ENV,
    run: async () => {
      throw new Error("boom");
    },
  });
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "server_error", message: "Something went wrong" });
  expectAnswerHeaders(response);
});
