import { expect, test } from "@playwright/test";
import { createDb, type Db } from "@/src/server/db";
import { databaseUrl } from "@/src/server/env";

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

test("US-01 correct demo credentials log in, wrong ones answer generic 401", async ({
  request,
}) => {
  const bad = await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: "wrong-password" },
  });
  expect(bad.status()).toBe(401);
  expect(await bad.json()).toEqual({
    error: "invalid_credentials",
    message: "Email or password is incorrect",
  });

  const ok = await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD_DISPLAY },
  });
  expect(ok.status()).toBe(200);
  expect(await ok.json()).toEqual({ ok: true });
  const cookies = await request.storageState();
  const session = cookies.cookies.find((c) => c.name === "pf_session");
  expect(session).toBeTruthy();
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe("Lax");
});

test("a malformed login body answers the same 401 shape as a wrong password (SPEC-auth v1.0.3)", async ({
  request,
}) => {
  const response = await request.post("/api/auth/login", { data: { email: "not-an-email" } });
  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({
    error: "invalid_credentials",
    message: "Email or password is incorrect",
  });
});

test("the 11th failed attempt in 15 minutes answers 429 with Retry-After", async ({ request }) => {
  for (let i = 0; i < 10; i++) {
    await request.post("/api/auth/login", {
      data: { email: process.env.DEMO_EMAIL, password: "wrong" },
    });
  }
  const eleventh = await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: "wrong" },
  });
  expect(eleventh.status()).toBe(429);
  const body = (await eleventh.json()) as { error: string; message: string; retryAfter: number };
  expect(body.error).toBe("rate_limited");
  expect(body.retryAfter).toBeGreaterThan(0);
  expect(eleventh.headers()["retry-after"]).toBe(String(body.retryAfter));
});

test("a successful login clears the IP's failure count", async ({ request }) => {
  await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: "wrong" },
  });
  await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD_DISPLAY },
  });
  expect(await db.loginAttempt.count({ where: { success: false } })).toBe(0);
});

test("US-02 signup always answers demo_instance, 400 on invalid input", async ({ request }) => {
  const ok = await request.post("/api/auth/signup", {
    data: { name: "A", email: "a@b.com", password: "password123" },
  });
  expect(ok.status()).toBe(200);
  expect(await ok.json()).toEqual({ code: "demo_instance" });

  const bad = await request.post("/api/auth/signup", {
    data: { name: "", email: "x", password: "short" },
  });
  expect(bad.status()).toBe(400);
  const body = (await bad.json()) as { error: string; issues: unknown[]; message?: string };
  expect(body.error).toBe("validation");
  expect(body.message).toBeUndefined();
  expect(Array.isArray(body.issues)).toBe(true);
});

test("US-03 logout clears the cookie and works with no session", async ({ request }) => {
  const withoutSession = await request.post("/api/auth/logout");
  expect(withoutSession.status()).toBe(204);

  await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD_DISPLAY },
  });
  const loggedOut = await request.post("/api/auth/logout");
  expect(loggedOut.status()).toBe(204);
  const session = await request.get("/api/auth/session");
  expect(await session.json()).toEqual({ authenticated: false });
});

test("GET /api/auth/session reflects login state, and a reset session answers false", async ({
  request,
}) => {
  expect(await (await request.get("/api/auth/session")).json()).toEqual({ authenticated: false });
  await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD_DISPLAY },
  });
  expect(await (await request.get("/api/auth/session")).json()).toEqual({ authenticated: true });
  await request.post("/api/test/reset");
  expect(await (await request.get("/api/auth/session")).json()).toEqual({ authenticated: false });
});
