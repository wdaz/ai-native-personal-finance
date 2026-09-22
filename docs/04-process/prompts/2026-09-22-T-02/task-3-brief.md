### Task 3: Local Postgres, the first migration, `resetToSeed` and `npm run db:reset`

Needs Docker Desktop running.

**Files:**
- Create: `compose.yaml`, `prisma/migrations/<UTC timestamp>_init/migration.sql`,
  `prisma/migrations/migration_lock.toml` (both written by Prisma), `src/server/reset.ts`,
  `prisma/seed.ts`, `tests/unit/reset.test.ts`, `tests/fixtures/database.ts`,
  `tests/api/reset.spec.ts`, `tests/api/schema.spec.ts`
- Modify: `package.json`, `package-lock.json`, `playwright.config.ts`
- Local only (git-ignored): `.env.local`

**Interfaces:**
- Consumes: `Db`, `createDb`, `databaseUrl` (Task 1); `SeedRows`, `seedRows` (Task 2);
  `Prisma`, `ResetReason` from the generated client.
- Produces, from `src/server/reset.ts`: `RESET_TABLES` (the six model names, `as const`),
  `RESET_LOCK_KEY = 42`, `type ResetResult = { at: Date; rows: number }`,
  `resetToSeed(db: Db, reason: ResetReason, rows?: SeedRows): Promise<ResetResult>`. From
  `tests/fixtures/database.ts`: `storedRows(db: Db)` and `insertedRows(rows: SeedRows)`, which
  return the same shape.

- [ ] **Step 1: Write `compose.yaml` and start Postgres**

```yaml
# Local Postgres for development and the API tests (T-02, ADR-0005). The app reaches it at
# localhost:5432 through the DATABASE_URL of .env.example. Start: docker compose up -d --wait
services:
  postgres:
    image: postgres:18.6-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: personal_finance
    ports:
      # Loopback only: the password above is a local default, not a secret.
      - "127.0.0.1:5432:5432"
    volumes:
      # Postgres 18 images keep PGDATA in /var/lib/postgresql/18/docker; mount the parent.
      - postgres-data:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d personal_finance"]
      interval: 2s
      timeout: 5s
      retries: 30

volumes:
  postgres-data:
```

Run: `docker compose up -d --wait && docker compose ps`
Expected: the `postgres` service `Up … (healthy)`.

- [ ] **Step 2: Local settings**

Run: `test -f .env.local || cp .env.example .env.local`
Expected: `.env.local` exists (git-ignored) and its `DATABASE_URL` points at `localhost:5432`
with database `personal_finance`, as `.env.example` already does.

- [ ] **Step 3: Write the failing unit test for `RESET_TABLES`**

Create `tests/unit/reset.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Prisma } from "@/src/server/generated/prisma/client";
import { RESET_TABLES } from "@/src/server/reset";

/**
 * SPEC-reset-and-test-support §2.1: a reset "truncates all tables". RESET_TABLES is written
 * out by hand, so a model added to prisma/schema.prisma later would survive every reset
 * unless this list grows with it.
 */
describe("RESET_TABLES", () => {
  const models = Object.values(Prisma.ModelName);
  const notReset = (tables: readonly string[]) => models.filter((m) => !tables.includes(m));

  it("names every model of prisma/schema.prisma, and nothing else", () => {
    expect(models.length).toBeGreaterThan(0);
    expect(notReset(RESET_TABLES)).toEqual([]);
    expect([...RESET_TABLES].sort()).toEqual([...models].sort());
  });

  it("would report a model left out (violation fixture, DoD v1.1)", () => {
    expect(notReset(RESET_TABLES.filter((table) => table !== "Pot"))).toEqual(["Pot"]);
  });
});
```

Run: `npx vitest run tests/unit/reset.test.ts`
Expected: FAIL — `Failed to resolve import "@/src/server/reset"`. It stays red through Steps
4–6 (the migration comes first, because the API tests of Step 9 need it) and turns green in
Step 7; a gate run in between reports this one failure and nothing else.

- [ ] **Step 4: Create the migration without applying it**

Run: `npx prisma migrate dev --name init --create-only`
Expected: "Prisma Migrate created the following migration without applying it
`<UTC timestamp>_init`", and `prisma/migrations/migration_lock.toml` exists.

- [ ] **Step 5: Add the extension line and review the SQL**

Prepend these two lines to `prisma/migrations/<UTC timestamp>_init/migration.sql`:

```sql
-- CreateExtension (hand-written: Prisma 7 does not manage extensions; Pot.name is citext)
CREATE EXTENSION IF NOT EXISTS "citext";

```

The rest of the file must match what E8 measured (Prisma may or may not add a
`CREATE SCHEMA IF NOT EXISTS "public";` line; either is fine):

```sql
-- CreateEnum
CREATE TYPE "Category" AS ENUM ('Entertainment', 'Bills', 'Groceries', 'Dining Out', 'Transportation', 'Personal Care', 'Education', 'Lifestyle', 'Shopping', 'General');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('Green', 'Yellow', 'Cyan', 'Navy', 'Red', 'Purple', 'Turquoise', 'Brown', 'Magenta', 'Blue', 'Navy Grey', 'Army Green', 'Gold', 'Orange', 'Pink');

-- CreateEnum
CREATE TYPE "ResetReason" AS ENUM ('scheduled', 'threshold', 'manual', 'test');

-- CreateTable
CREATE TABLE "Balance" (
    "id" UUID NOT NULL,
    "current" BIGINT NOT NULL,
    "income" BIGINT NOT NULL,
    "expenses" BIGINT NOT NULL,
    "seeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "date" TIMESTAMPTZ(3) NOT NULL,
    "amount" BIGINT NOT NULL,
    "recurring" BOOLEAN NOT NULL,
    "seeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" UUID NOT NULL,
    "seq" SERIAL NOT NULL,
    "category" "Category" NOT NULL,
    "maximum" BIGINT NOT NULL,
    "theme" "Theme" NOT NULL,
    "seeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pot" (
    "id" UUID NOT NULL,
    "seq" SERIAL NOT NULL,
    "name" CITEXT NOT NULL,
    "target" BIGINT NOT NULL,
    "total" BIGINT NOT NULL,
    "theme" "Theme" NOT NULL,
    "seeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Pot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResetLog" (
    "id" UUID NOT NULL,
    "at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" "ResetReason" NOT NULL,
    "seeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ResetLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" UUID NOT NULL,
    "ip" TEXT NOT NULL,
    "at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "seeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Budget_seq_key" ON "Budget"("seq");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_category_key" ON "Budget"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_theme_key" ON "Budget"("theme");

-- CreateIndex
CREATE UNIQUE INDEX "Pot_seq_key" ON "Pot"("seq");

-- CreateIndex
CREATE UNIQUE INDEX "Pot_name_key" ON "Pot"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Pot_theme_key" ON "Pot"("theme");
```

- [ ] **Step 6: Apply it, then prove Prisma leaves the extension alone (E22)**

Run: `npx prisma migrate dev`
Expected: "The following migration(s) have been applied: … `<UTC timestamp>_init`" and "Your
database is now in sync with your schema." (Prisma 7 does not run `generate` or the seed here,
E21.)

Run: `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script --exit-code; echo "exit=$?"`
Expected: an empty script and `exit=0`.

Run: `npx prisma migrate dev --name drift-check --create-only`
Expected: "Already in sync, no schema change or pending migration was found." and no new folder
under `prisma/migrations/`.

**Stop rule:** if either command proposes `DROP EXTENSION "citext"` or any other statement,
stop and report to the owner with the output — decision D6 rests on this.

- [ ] **Step 7: Write `src/server/reset.ts`**

```ts
import type { Db } from "./db";
import { Prisma } from "./generated/prisma/client";
import type { ResetReason } from "./generated/prisma/enums";
import { seedRows, type SeedRows } from "./seed";

/**
 * SPEC-reset-and-test-support §2.1: "truncates all tables" — every model of
 * prisma/schema.prisma and nothing else, so Prisma's `_prisma_migrations` survives.
 * tests/unit/reset.test.ts holds this list to the schema.
 */
export const RESET_TABLES = [
  "Balance",
  "Transaction",
  "Budget",
  "Pot",
  "ResetLog",
  "LoginAttempt",
] as const;

/** SPEC-reset-and-test-support §4: "reset never runs concurrently". */
export const RESET_LOCK_KEY = 42;

export type ResetResult = { at: Date; rows: number };

/**
 * One transaction: take the advisory lock, truncate, insert the seed rows (`seeded = true`),
 * write the `ResetLog` row. `at` comes from the column's `@default(now())`, so this module
 * reads no clock (ADR-0005). `rows` counts the seed rows inserted; `LoginAttempt` is
 * emptied by the truncation.
 */
export async function resetToSeed(
  db: Db,
  reason: ResetReason,
  rows: SeedRows = seedRows(),
): Promise<ResetResult> {
  return db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${RESET_LOCK_KEY}::bigint)`;
      // Identifiers cannot be bound parameters; the list is the constant above.
      const tables = Prisma.raw(RESET_TABLES.map((table) => `"${table}"`).join(", "));
      // RESTART IDENTITY restarts the `seq` counters, so seed order is 1, 2, 3… every time.
      await tx.$executeRaw`TRUNCATE TABLE ${tables} RESTART IDENTITY`;
      await tx.balance.create({ data: { ...rows.balance, seeded: true } });
      await tx.transaction.createMany({
        data: rows.transactions.map((transaction) => ({ ...transaction, seeded: true })),
      });
      await tx.budget.createMany({
        data: rows.budgets.map((budget) => ({ ...budget, seeded: true })),
      });
      await tx.pot.createMany({ data: rows.pots.map((pot) => ({ ...pot, seeded: true })) });
      const log = await tx.resetLog.create({ data: { reason } });
      return {
        at: log.at,
        rows: 1 + rows.transactions.length + rows.budgets.length + rows.pots.length,
      };
    },
    // A second reset waits on the lock inside its transaction, so the defaults (2 s to get a
    // connection, 5 s for the whole transaction) would abort it rather than serialise it.
    { maxWait: 10_000, timeout: 30_000 },
  );
}
```

Run: `npx vitest run tests/unit/reset.test.ts`
Expected: 2 passed. Mutation check: delete the `"LoginAttempt",` line — both tests fail;
restore.

- [ ] **Step 8: Point the web server at test mode and load `.env.local` for the tests**

In `playwright.config.ts`, replace the header comment and the lines up to `const PORT` with:

```ts
import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

/**
 * ADR-0003 — E2E on Chromium, Firefox and WebKit against `next build && next start`,
 * never `next dev`. Retries: 1 in CI, 0 locally. API tests use the request context and
 * no browser; they share one database, so `npm run test:api` runs them on one worker.
 *
 * The server runs with APP_ENV=test, so the test-support routes exist (SPEC-reset-and-test-
 * support §2.7). API tests also read the database directly (ADR-0003: "side effects via
 * DB"); locally its URL is in .env.local, which Next.js loads for the server and Playwright
 * does not — so it is loaded here. A variable already in the environment (CI's) wins.
 */
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
```

and in `webServer`, after `url: baseURL,`, add:

```ts
    env: { APP_ENV: "test" },
```

Then: `npm pkg set scripts.test:api="playwright test --project=api --workers=1"`
(`--pass-with-no-tests` goes: from this task on, an empty `tests/api` is a failure.)

- [ ] **Step 9: Write the database helpers and the failing API tests**

Create `tests/fixtures/database.ts`:

```ts
import type { Db } from "@/src/server/db";
import type { SeedRows } from "@/src/server/seed";

/**
 * Seed/reset helpers for the API tests (ADR-0003: "asserts … side effects via DB").
 * `storedRows` reads the database back in the terms of SeedRows — cents as numbers, dates
 * as ISO text, budgets and pots in creation order (`seq`) — and `insertedRows` is what it
 * returns once a reset has inserted `rows`. Transactions have no creation order of their
 * own, so both sides list them by date.
 */
const byDate = (a: { date: string }, b: { date: string }) =>
  a.date < b.date ? -1 : a.date > b.date ? 1 : 0;

export async function storedRows(db: Db) {
  const [balances, transactions, budgets, pots] = await Promise.all([
    db.balance.findMany(),
    db.transaction.findMany(),
    db.budget.findMany({ orderBy: { seq: "asc" } }),
    db.pot.findMany({ orderBy: { seq: "asc" } }),
  ]);
  return {
    balances: balances.map((b) => ({
      current: Number(b.current),
      income: Number(b.income),
      expenses: Number(b.expenses),
      seeded: b.seeded,
    })),
    transactions: transactions
      .map((t) => ({
        name: t.name,
        avatar: t.avatar,
        category: t.category,
        date: t.date.toISOString(),
        amount: Number(t.amount),
        recurring: t.recurring,
        seeded: t.seeded,
      }))
      .sort(byDate),
    budgets: budgets.map((b) => ({
      category: b.category,
      maximum: Number(b.maximum),
      theme: b.theme,
      seeded: b.seeded,
    })),
    pots: pots.map((p) => ({
      name: p.name,
      target: Number(p.target),
      total: Number(p.total),
      theme: p.theme,
      seeded: p.seeded,
    })),
  };
}

export function insertedRows(rows: SeedRows) {
  return {
    balances: [{ ...rows.balance, seeded: true }],
    transactions: rows.transactions
      .map((t) => ({ ...t, date: new Date(t.date).toISOString(), seeded: true }))
      .sort(byDate),
    budgets: rows.budgets.map((b) => ({ ...b, seeded: true })),
    pots: rows.pots.map((p) => ({ ...p, seeded: true })),
  };
}
```

Create `tests/api/reset.spec.ts`:

```ts
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
```

Create `tests/api/schema.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { createDb, type Db } from "@/src/server/db";
import { databaseUrl } from "@/src/server/env";
import { resetToSeed } from "@/src/server/reset";

/**
 * docs/02-architecture/data-model.md, the rules the database itself enforces: unique
 * budget categories, themes unique among budgets and among pots, pot names unique whatever
 * their case — and NFR-S3's largest amount, 99,999,999,999 cents, fits a money column.
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

// Prisma's code for a unique-constraint violation.
const UNIQUE_VIOLATION = { code: "P2002" };

test("a pot name is unique whatever its case", async () => {
  const pot = await db.pot.findFirstOrThrow();
  await expect(
    db.pot.create({
      data: { name: pot.name.toUpperCase(), target: 100, total: 0, theme: "Gold" },
    }),
  ).rejects.toMatchObject(UNIQUE_VIOLATION);
});

test("a budget category is unique, and so is a theme among budgets and among pots", async () => {
  const budget = await db.budget.findFirstOrThrow();
  const pot = await db.pot.findFirstOrThrow();
  await expect(
    db.budget.create({ data: { category: budget.category, maximum: 100, theme: "Gold" } }),
  ).rejects.toMatchObject(UNIQUE_VIOLATION);
  await expect(
    db.budget.create({ data: { category: "Education", maximum: 100, theme: budget.theme } }),
  ).rejects.toMatchObject(UNIQUE_VIOLATION);
  await expect(
    db.pot.create({ data: { name: "Unique name", target: 100, total: 0, theme: pot.theme } }),
  ).rejects.toMatchObject(UNIQUE_VIOLATION);
});

test("a money column holds NFR-S3's largest amount, 99,999,999,999 cents", async () => {
  const largest = 99_999_999_999;
  const budget = await db.budget.create({
    data: { category: "Education", maximum: largest, theme: "Gold" },
  });
  expect(Number((await db.budget.findUniqueOrThrow({ where: { id: budget.id } })).maximum)).toBe(
    largest,
  );
});
```

(`Gold` and `Education` are used by no seed row — `THEME_BY_HEX` maps only five hexes into the
seed, E3 — so these inserts collide only where the test means them to.)

Run: `npm run test:api`
Expected: **7 passed** (reset 4, schema 3) — the first run against Postgres, and the
measurement of every E23 item except the variants (Task 4). `reset.ts` was driven red-to-green
by the unit test of Step 3; Step 10 shows these API tests can fail. Any other result — a
`DateTime` that does not round-trip, `BigInt` out of range, a lock error — contradicts this
plan: stop and report it. (With question 2 answered "keep 32-bit", the money test is dropped.)

- [ ] **Step 10: Prove the lock test can fail**

Comment out the `pg_advisory_xact_lock` line in `src/server/reset.ts`, then run
`npx playwright test --project=api --workers=1 -g "advisory lock"`.
Expected: FAIL — `expect.poll` times out, because nothing waits for the lock. Restore the line
and rerun: 1 passed.

- [ ] **Step 11: `prisma/seed.ts` and `npm run db:reset`**

Run: `npm install --save-dev tsx@^4.23.15 && npm install-scripts approve esbuild`
Expected: `"tsx": "^4.23.15"` under `devDependencies`, `"esbuild@0.28.2": true` added to
`allowScripts` (esbuild's postinstall checks its platform binary, D17).

Create `prisma/seed.ts`:

```ts
import { createDb } from "@/src/server/db";
import { databaseUrl } from "@/src/server/env";
import { resetToSeed } from "@/src/server/reset";

/**
 * `npm run db:reset` and Prisma's seed step (prisma.config.ts): SPEC-reset-and-test-support
 * §2.5 — the seed goes in with a `ResetLog` row of reason "manual", so the last reset time
 * always exists.
 */
const db = createDb(databaseUrl());
try {
  const { at, rows } = await resetToSeed(db, "manual");
  console.log(`reset reason=manual rows=${rows} at=${at.toISOString()}`);
} finally {
  await db.$disconnect();
}
```

Run: `npm pkg set scripts.db:reset="prisma migrate deploy && prisma db seed"`
Then: `npm run db:reset`
Expected: "No pending migrations to apply." then a line
`reset reason=manual rows=59 at=2026-…Z` (1 balance + 49 + 4 + 5, E2). Then
`docker compose exec postgres psql -U postgres -d personal_finance -c 'SELECT reason FROM "ResetLog"'`
prints one row, `manual`.

- [ ] **Step 12: Run every gate**

Run: `npm run lint && npm run format:check && npm run typecheck && npm test && npm run test:api`
Expected: all exit 0; Vitest 211/211 (209 + 2); Playwright api 7 passed.

- [ ] **Step 13: Commit**

```bash
git add compose.yaml prisma/migrations prisma/seed.ts src/server/reset.ts package.json \
  package-lock.json playwright.config.ts tests/unit/reset.test.ts tests/fixtures/database.ts \
  tests/api/reset.spec.ts tests/api/schema.spec.ts
GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit -m "feat(reset): resetToSeed, local Postgres and npm run db:reset (T-02)"
```

---

