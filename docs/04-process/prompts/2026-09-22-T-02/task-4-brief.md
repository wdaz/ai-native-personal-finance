### Task 4: The test-support routes

**Files:**
- Create: `src/server/http.ts`, `src/server/test-support.ts`,
  `app/api/test/[...path]/route.ts`, `tests/unit/test-support.test.ts`,
  `tests/api/test-support.spec.ts`
- Modify: `tests/api/README.md`, `app/api/README.md`, `tests/fixtures/README.md`

**Interfaces:**
- Consumes: `Env`, `isTestEnv` (Task 1); `getDb` (Task 1); `resetToSeed` (Task 3); `seedRows`
  (Task 2); `SEED_VARIANTS`, `applyVariant`, `isSeedVariant` (Task 2); `storedRows`,
  `insertedRows` (Task 3).
- Produces: `type ApiErrorCode`, `errorResponse(status: number, error: ApiErrorCode, message:
  string): Response` from `src/server/http.ts`; `type TestRoute = { method: "GET" | "POST";
  path: string; handle: (request: Request) => Promise<Response> }`,
  `testSupportRoutes(env?: Env): readonly TestRoute[]`, `handleTestSupport(method: string,
  segments: readonly string[], request: Request, env?: Env): Promise<Response>` from
  `src/server/test-support.ts`; `POST` and `GET` from the route file.

- [ ] **Step 1: Write the failing unit tests**

Create `tests/unit/test-support.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/test/[...path]/route";
import { handleTestSupport, testSupportRoutes } from "@/src/server/test-support";

/**
 * SPEC-reset-and-test-support §2.7: "only when APP_ENV=test; otherwise the routes do not
 * exist — 404 — and a unit test asserts the router has no test/* entries in other envs".
 * None of these touch a database: outside test there is no route to reach one, and inside
 * test the requests below are refused before one would be opened.
 */
const post = (path: string, body?: string) =>
  new Request(`http://localhost/api/test/${path}`, { method: "POST", body });

describe("test-support routes (SPEC-reset-and-test-support §2.7)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([undefined, "development", "production", "Test", "test ", ""])(
    "has no /api/test/* route when APP_ENV is %j",
    (appEnv) => {
      expect(testSupportRoutes({ APP_ENV: appEnv })).toEqual([]);
    },
  );

  it("has reset and seed when APP_ENV=test (the control for the case above)", () => {
    expect(testSupportRoutes({ APP_ENV: "test" }).map((r) => `${r.method} ${r.path}`)).toEqual([
      "POST reset",
      "POST seed",
    ]);
  });

  it.each([
    ["POST", "reset"],
    ["POST", "seed"],
    ["GET", "log"],
  ])("answers %s /api/test/%s with 404 outside test", async (method, path) => {
    const response = await handleTestSupport(method, [path], post(path), { APP_ENV: "production" });
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "not_found", message: "Not found" });
  });

  it("answers 404 through the route file when APP_ENV is not test", async () => {
    vi.stubEnv("APP_ENV", "production");
    const params = Promise.resolve({ path: ["reset"] });
    expect((await POST(post("reset"), { params })).status).toBe(404);
    expect((await GET(post("reset"), { params })).status).toBe(404);
  });

  it("answers an unknown path with 404 in test too", async () => {
    const response = await handleTestSupport("POST", ["nope"], post("nope"), { APP_ENV: "test" });
    expect(response.status).toBe(404);
  });

  it.each([
    ['{"variant":"nope"}', "an unknown variant"],
    ["{}", "a missing variant"],
    ["not json", "a body that is not JSON"],
  ])("refuses %s (%s) with 400 and the error envelope", async (body) => {
    const response = await handleTestSupport("POST", ["seed"], post("seed", body), {
      APP_ENV: "test",
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "validation",
      message:
        "variant must be one of: seed, empty-pots, empty-budgets, few-transactions, no-recurring, empty-all",
    });
  });
});
```

Run: `npx vitest run tests/unit/test-support.test.ts`
Expected: FAIL — `Failed to resolve import "@/app/api/test/[...path]/route"`.

- [ ] **Step 2: Write `src/server/http.ts`**

```ts
/**
 * SPEC-auth §2.10: every API error is `{ error, message }` with one of these codes. T-04
 * adds the `ErrorEnvelope` Zod schema to src/shared/schemas.ts; until then this is the
 * only place that writes one.
 */
export type ApiErrorCode =
  | "validation"
  | "invalid_credentials"
  | "rate_limited"
  | "unauthenticated"
  | "not_found"
  | "conflict"
  | "server_error";

export function errorResponse(status: number, error: ApiErrorCode, message: string): Response {
  return Response.json({ error, message }, { status });
}
```

- [ ] **Step 3: Write `src/server/test-support.ts`**

```ts
import { getDb } from "./db";
import { isTestEnv, type Env } from "./env";
import { errorResponse } from "./http";
import { resetToSeed } from "./reset";
import { seedRows } from "./seed";
import { SEED_VARIANTS, applyVariant, isSeedVariant } from "./variants";

/**
 * SPEC-reset-and-test-support §2.7 — the routes E2E and API tests use to put the database
 * in a known state (ADR-0003, NFR-T3). No session, no rate limit. They exist only when
 * `APP_ENV=test`: in any other environment `testSupportRoutes` is empty and every
 * /api/test/* path answers 404.
 */
export type TestRoute = {
  method: "GET" | "POST";
  path: string;
  handle: (request: Request) => Promise<Response>;
};

async function reset(): Promise<Response> {
  const { at } = await resetToSeed(getDb(), "test");
  return Response.json({ at });
}

async function seed(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const variant =
    typeof body === "object" && body !== null && "variant" in body ? body.variant : undefined;
  if (!isSeedVariant(variant)) {
    return errorResponse(400, "validation", `variant must be one of: ${SEED_VARIANTS.join(", ")}`);
  }
  const { at } = await resetToSeed(getDb(), "test", applyVariant(seedRows(), variant));
  return Response.json({ at, variant });
}

const routes: readonly TestRoute[] = [
  { method: "POST", path: "reset", handle: reset },
  { method: "POST", path: "seed", handle: seed },
];

export function testSupportRoutes(env: Env = process.env): readonly TestRoute[] {
  return isTestEnv(env) ? routes : [];
}

export async function handleTestSupport(
  method: string,
  segments: readonly string[],
  request: Request,
  env: Env = process.env,
): Promise<Response> {
  const path = segments.join("/");
  const route = testSupportRoutes(env).find((r) => r.method === method && r.path === path);
  if (!route) {
    return errorResponse(404, "not_found", "Not found");
  }
  try {
    return await route.handle(request);
  } catch (error) {
    console.error(`test-support ${method} /api/test/${path} failed`, error);
    return errorResponse(500, "server_error", "The test-support request failed");
  }
}
```

- [ ] **Step 4: Write `app/api/test/[...path]/route.ts`**

```ts
import { handleTestSupport } from "@/src/server/test-support";

/**
 * SPEC-reset-and-test-support §2.7. One catch-all route: src/server/test-support.ts holds
 * the table of routes, which is empty unless APP_ENV=test, so outside tests every
 * /api/test/* path answers 404.
 */
type Context = { params: Promise<{ path: string[] }> };

export async function POST(request: Request, { params }: Context): Promise<Response> {
  return handleTestSupport("POST", (await params).path, request);
}

export async function GET(request: Request, { params }: Context): Promise<Response> {
  return handleTestSupport("GET", (await params).path, request);
}
```

Run: `npx vitest run tests/unit/test-support.test.ts`
Expected: 15 passed. Mutation checks (E12): make `testSupportRoutes` return `routes`
unconditionally — nine tests fail; make `isTestEnv` compare `env.APP_ENV?.trim().toLowerCase()`
— two fail; replace `if (!isSeedVariant(variant))` with `if (false)` — three fail (the request
reaches `getDb()` and answers 500). Restore each.

- [ ] **Step 5: Write the API tests over HTTP**

Create `tests/api/test-support.spec.ts`:

```ts
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

test("US-36 POST /api/test/reset puts the seed back and answers its time", async ({
  request,
}) => {
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

test("POST /api/test/seed refuses an unknown variant and changes nothing", async ({
  request,
}) => {
  await request.post("/api/test/seed", { data: { variant: "empty-pots" } });
  const before = await storedRows(db);

  const response = await request.post("/api/test/seed", { data: { variant: "nope" } });

  expect(response.status()).toBe(400);
  expect(await response.json()).toMatchObject({ error: "validation" });
  expect(await storedRows(db)).toEqual(before);
});
```

Run: `npm run test:api`
Expected: 16 passed (reset 4, schema 3, test-support 9). The `empty-*` variants exercise
`createMany` with an empty list (E23).

- [ ] **Step 6: Update the three READMEs**

`tests/api/README.md` — replace the last paragraph with:

```markdown
Run: `npm run test:api` — builds the app, starts it with `APP_ENV=test` and runs the tests on
one worker, because they share the database of `DATABASE_URL` (Postgres from `compose.yaml`
locally). Each test resets it; it holds demo data only.

- `reset.spec.ts` — `resetToSeed` (SPEC-reset-and-test-support §2.1, §4)
- `schema.spec.ts` — the constraints the database enforces (data model, NFR-S3)
- `test-support.spec.ts` — `/api/test/reset` and `/api/test/seed` (§2.7)
```

`app/api/README.md` — replace the last line with:

```markdown
Filled by T-02 (`test/[...path]` — test support, only when `APP_ENV=test`), T-05 (auth), T-08
(meta, admin reset), T-09 (overview).
```

`tests/fixtures/README.md` — replace the last line with:

```markdown
T-02: `database.ts` (`storedRows`, `insertedRows`) for the API tests, and the ADR-0002
fixtures in `boundaries/`. T-06 adds the authenticated `storageState`.
```

- [ ] **Step 7: Run every gate**

Run: `npm run lint && npm run format:check && npm run typecheck && npm test && npm run test:api`
Expected: all exit 0; Vitest 226/226 (211 + 15); Playwright api 16 passed.

- [ ] **Step 8: Commit**

```bash
git add src/server/http.ts src/server/test-support.ts "app/api/test/[...path]/route.ts" \
  tests/unit/test-support.test.ts tests/api/test-support.spec.ts tests/api/README.md \
  app/api/README.md tests/fixtures/README.md
GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit -m "feat(test-support): /api/test/reset and /api/test/seed behind APP_ENV=test (T-02)"
```

---

