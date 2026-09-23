import { expect, test } from "@playwright/test";
import { createDb, type Db } from "@/src/server/db";
import { databaseUrl } from "@/src/server/env";
import { SESSION_COOKIE_NAME, sealSession } from "@/src/server/session";

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

test("SPEC-auth §4: attempts 1-10 answer 401, the 11th answers 429 with Retry-After", async ({
  request,
}) => {
  for (let i = 1; i <= 10; i++) {
    const response = await request.post("/api/auth/login", {
      data: { email: process.env.DEMO_EMAIL, password: "wrong" },
    });
    expect(response.status(), `attempt ${i} of 10`).toBe(401);
  }
  const eleventh = await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: "wrong" },
  });
  expect(eleventh.status()).toBe(429);
  const body = (await eleventh.json()) as { error: string; message: string; retryAfter: number };
  expect(body).toEqual({
    error: "rate_limited",
    message: "Too many attempts",
    retryAfter: body.retryAfter,
  });
  expect(body.retryAfter).toBeGreaterThan(0);
  expect(eleventh.headers()["retry-after"]).toBe(String(body.retryAfter));
});

test("SPEC-auth §4: a failure older than the 15-minute window is not counted", async ({
  request,
}) => {
  const staleAt = new Date(Date.now() - 16 * 60 * 1000);
  await db.loginAttempt.createMany({
    data: Array.from({ length: 10 }, () => ({ ip: "local", success: false, at: staleAt })),
  });
  const response = await request.post("/api/auth/login", {
    data: { email: process.env.DEMO_EMAIL, password: "wrong" },
  });
  expect(response.status()).toBe(401);
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

test("GET /api/auth/session answers false for a session past the 7-day TTL", async ({
  request,
}) => {
  const resetLog = await db.resetLog.findFirstOrThrow({ orderBy: { at: "desc" } });
  const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
  const sealed = await sealSession({
    sub: "demo",
    iat: eightDaysAgo,
    resetEpoch: resetLog.at.getTime(),
  });
  const response = await request.get("/api/auth/session", {
    headers: { Cookie: `${SESSION_COOKIE_NAME}=${sealed}` },
  });
  expect(await response.json()).toEqual({ authenticated: false });
});

test("logout with an old-enough-to-reissue session sends exactly one Set-Cookie, and it clears (review finding M5)", async ({
  request,
}) => {
  const resetLog = await db.resetLog.findFirstOrThrow({ orderBy: { at: "desc" } });
  const sealed = await sealSession({
    sub: "demo",
    iat: Date.now() - 61 * 60 * 1000,
    resetEpoch: resetLog.at.getTime(),
  });
  const response = await request.post("/api/auth/logout", {
    headers: { Cookie: `${SESSION_COOKIE_NAME}=${sealed}` },
  });
  expect(response.status()).toBe(204);
  const setCookies = response.headersArray().filter((h) => h.name.toLowerCase() === "set-cookie");
  expect(setCookies).toHaveLength(1);
  expect(setCookies[0]?.value).toContain("Max-Age=0");
});

test("SPEC-auth §2.9: the cookie is not reissued under an hour old, is reissued over an hour old", async ({
  request,
}) => {
  const resetLog = await db.resetLog.findFirstOrThrow({ orderBy: { at: "desc" } });
  const sealFor = (minutesAgo: number) =>
    sealSession({
      sub: "demo",
      iat: Date.now() - minutesAgo * 60 * 1000,
      resetEpoch: resetLog.at.getTime(),
    });

  const under = await request.get("/api/auth/session", {
    headers: { Cookie: `${SESSION_COOKIE_NAME}=${await sealFor(59)}` },
  });
  expect(await under.json()).toEqual({ authenticated: true });
  expect(under.headers()["set-cookie"]).toBeUndefined();

  const over = await request.get("/api/auth/session", {
    headers: { Cookie: `${SESSION_COOKIE_NAME}=${await sealFor(61)}` },
  });
  expect(await over.json()).toEqual({ authenticated: true });
  expect(over.headers()["set-cookie"]).toContain(`${SESSION_COOKIE_NAME}=`);
  expect(over.headers()["set-cookie"]).toContain("Max-Age=604800");
});
