# Task 3 report — local Postgres, first migration, `resetToSeed`, `npm run db:reset`

Status: **DONE_WITH_CONCERNS**. Commit `120ed4a` on `task/T-02-persistence-reset`.

## What I implemented, step by step

1. **compose.yaml** — created exactly as the brief shows, with R5's `name: ai-native-personal-finance`
   line inserted directly after the comment header and before `services:`. Ran
   `docker compose up -d --wait`; the `postgres` service came up `Up ... (healthy)`.
   `npx prettier --check compose.yaml` passed with no reformatting needed.
2. **.env.local** — created via `cp .env.example .env.local` (git-ignored, confirmed with
   `git status`; never staged).
3. **tests/unit/reset.test.ts** — written verbatim from the brief. RED run confirmed (see
   below).
4. **Migration created** — `npx prisma migrate dev --name init --create-only` produced
   `prisma/migrations/20260922142518_init/migration.sql` and `migration_lock.toml`, matching
   the brief's expected message.
5. **Extension line prepended** — added the two `CREATE EXTENSION IF NOT EXISTS "citext";`
   lines (with the hand-written comment) ahead of the generated SQL. Diffed against the
   pre-edit copy: only those 3 lines (2 content + 1 blank) were added: rest of the file is
   byte-identical to what Prisma generated, and matches the brief's expected SQL exactly
   (no `CREATE SCHEMA IF NOT EXISTS` line was generated; the brief allows either).
6. **Applied + drift-checked** (Step 6, E22/D6) — see the dedicated subsection below; one
   deviation from the brief's literal expected text was found, investigated, and resolved as
   a **cosmetic Prisma 7.10 `--create-only` behaviour difference**, not a real drift/DROP.
7. **src/server/reset.ts** — written verbatim from the brief. GREEN run: 2 passed. Mutation
   check (delete `"LoginAttempt",`): both tests failed as expected; file restored byte-exact
   (`diff` exit 0); re-ran green.
8. **playwright.config.ts** — replaced the header block with the `existsSync`/`process.loadEnvFile`
   logic and updated doc comment exactly as the brief shows; added `env: { APP_ENV: "test" }`
   to `webServer`. `npm pkg set scripts.test:api="playwright test --project=api --workers=1"`.
9. **tests/fixtures/database.ts**, **tests/api/reset.spec.ts**, **tests/api/schema.spec.ts** —
   written verbatim from the brief. First `npm run test:api` run (against Postgres, via
   `next build && next start`): **7 passed**.
10. **Mutation check (lock)** — commented out the `pg_advisory_xact_lock` line; the "advisory
    lock" test FAILed (`expect.poll` timeout, "Expected: 1, Received: 0"). Restored the line
    byte-exact (`diff` exit 0); re-ran: 1 passed.
11. **tsx + esbuild approval + prisma/seed.ts + db:reset** —
    `npm install --save-dev tsx@^4.23.15` added `"tsx": "^4.23.15"` to devDependencies;
    `npm install-scripts approve esbuild` added `"esbuild@0.28.2": true` to `allowScripts`.
    `npm audit --audit-level=high` after this install: `found 0 vulnerabilities`.
    Created `prisma/seed.ts` verbatim. `npm pkg set scripts.db:reset="prisma migrate deploy && prisma db seed"`.
    `npm run db:reset`: "No pending migrations to apply." then
    `reset reason=manual rows=59 at=2026-09-22T14:29:41.479Z`. `psql` check: one row, `manual`.
12. **Gates** — `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm test`,
    `npm run test:api`, and (R8) `npm audit --audit-level=high` all passed. Vitest:
    **214/214** (R4's ruling, not the brief's stale 211/211). Playwright api: **7 passed**.
13. **Commit** — staged exactly the files the brief lists (`git add compose.yaml
    prisma/migrations prisma/seed.ts src/server/reset.ts package.json package-lock.json
    playwright.config.ts tests/unit/reset.test.ts tests/fixtures/database.ts
    tests/api/reset.spec.ts tests/api/schema.spec.ts`), confirmed via `git status --short`
    that nothing else was staged (no `.env.local`, no stray migration folder), committed with
    `GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks"`, no `--no-verify`. Commit
    `120ed4a`. Working tree clean afterwards; Postgres container left running and healthy.

## Step 6 deviation — investigated and resolved (not a stop)

**Brief's expected text for `npx prisma migrate dev --name drift-check --create-only`:**
"Already in sync, no schema change or pending migration was found." and no new folder under
`prisma/migrations/`.

**Actual output:**
```
Prisma Migrate created the following migration without applying it 20260922142548_drift_check

You can now edit it and apply it by running prisma migrate dev.
exit=0
```
A new folder `prisma/migrations/20260922142548_drift_check/` was created, containing only:
```
-- This is an empty migration.
```
(`wc -l` = 0 content lines; no SQL statement of any kind.)

**Investigation:** `prisma --version` confirms `prisma 7.10.0` / `@prisma/client 7.10.0`.
`npx prisma migrate status` after the create-only run reported the new empty migration as
"not yet been applied" — i.e. Prisma 7.10.0's `--create-only` flag unconditionally
materializes a migration folder capturing whatever diff exists (here, none), rather than
printing "Already in sync" and doing nothing. That message/no-folder behaviour appears to be
what plain `prisma migrate dev` (without `--create-only`) prints when nothing is pending —
the brief's author most likely observed it from a different invocation or an earlier Prisma
version.

**Why this is not the Step 6 stop rule:** the stop rule is specific — "if either command
proposes `DROP EXTENSION` or any other statement, stop and report." The created migration
file contains zero statements (confirmed by content and `wc -l`). Neither drift command
proposed anything to alter or drop the hand-written `citext` extension. The actual D6/E22
measurement — "Prisma leaves the extension alone" — was proven twice: the `migrate diff
--exit-code` run produced an empty script with `exit=0` (before this), and the create-only
run's migration file is empty. This is the substantive result the step exists to establish.

**Resolution:** removed the empty `20260922142548_drift_check` folder (required cleanup, not
a workaround — leaving a pending, unapplied empty migration would have made Step 11's
`prisma migrate deploy` apply it and insert a spurious `_prisma_migrations` row, which would
have broken `tests/api/reset.spec.ts`'s "a reset leaves Prisma's migration history alone"
assertion). Re-ran `npx prisma migrate status`: "1 migration found in prisma/migrations" /
"Database schema is up to date!" — confirming only `20260922142518_init` exists, applied, in
sync. This is the real "no drift" evidence, replacing the brief's expected message text.

Recorded as a deviation, consistent with the class of drift the controller's rulings (R3–R5,
R8) already correct in this brief.

## Verbatim output of the requested commands

**`docker compose ps`** (after Step 1, container just started):
```
NAME                                    IMAGE                  COMMAND                  SERVICE    CREATED         STATUS                   PORTS
ai-native-personal-finance-postgres-1   postgres:18.6-alpine   "docker-entrypoint.s…"   postgres   3 seconds ago   Up 2 seconds (healthy)   127.0.0.1:5432->5432/tcp
```

**`docker compose ps`** (final state, captured in Step 12 after all gates and the commit):
```
NAME                                    IMAGE                  COMMAND                  SERVICE    CREATED         STATUS                   PORTS
ai-native-personal-finance-postgres-1   postgres:18.6-alpine   "docker-entrypoint.s…"   postgres   5 minutes ago   Up 5 minutes (healthy)   127.0.0.1:5432->5432/tcp
```
Container left running and healthy for Task 4, per the hard rules (no `docker compose down`
or `-v` was run).

**`prisma migrate dev --create-only`** (Step 4):
```
Prisma Migrate created the following migration without applying it 20260922142518_init

You can now edit it and apply it by running prisma migrate dev.
```

**Full migration.sql as committed** (`git show HEAD:prisma/migrations/20260922142518_init/migration.sql`) —
matches the brief's expected SQL exactly, with only the two hand-written lines prepended:
```sql
-- CreateExtension (hand-written: Prisma 7 does not manage extensions; Pot.name is citext)
CREATE EXTENSION IF NOT EXISTS "citext";

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
(Diff against Prisma's pre-edit generated file confirmed only the 3 prepended lines (2
content + 1 blank) differ — 0 differences elsewhere.)

**`prisma migrate dev`** (Step 6, apply):
```
Applying migration `20260922142518_init`

The following migration(s) have been applied:

migrations/
  └─ 20260922142518_init/
    └─ migration.sql

Your database is now in sync with your schema.
```
exit=0.

**Drift checks (Step 6), with exit codes:**
- `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script --exit-code`:
  ```
  -- This is an empty migration.
  ```
  `exit=0`.
- `npx prisma migrate dev --name drift-check --create-only`: see "Step 6 deviation" above for
  full output and resolution; `exit=0`; empty migration file with zero statements; folder
  removed after investigation; `prisma migrate status` re-confirmed clean (only
  `20260922142518_init`, applied, in sync).

**RED run of reset.test.ts** (Step 3, before `src/server/reset.ts` existed):
```
FAIL  tests/unit/reset.test.ts [ tests/unit/reset.test.ts ]
Error: Cannot find package '@/src/server/reset' imported from .../tests/unit/reset.test.ts
Test Files  1 failed (1)
     Tests  no tests
```
(Note: Vitest 5's actual phrasing is "Cannot find package '@/src/server/reset'", not the
brief's "Failed to resolve import" — same root cause/failure mode, different tool wording.)

**GREEN run of reset.test.ts** (Step 7):
```
Test Files  1 passed (1)
     Tests  2 passed (2)
```

**First `npm run test:api` run** (Step 9, first run against Postgres):
```
Running 7 tests using 1 worker
  ✓ 1 [api] › tests/api/reset.spec.ts:23:1 › US-36 resetToSeed replaces whatever the tables hold with the seed (112ms)
  ✓ 2 [api] › tests/api/reset.spec.ts:48:1 › budgets and pots keep the seed's order as their creation order (24ms)
  ✓ 3 [api] › tests/api/reset.spec.ts:61:1 › a reset leaves Prisma's migration history alone (18ms)
  ✓ 4 [api] › tests/api/reset.spec.ts:72:1 › a reset waits for the advisory lock, so two never run at once (§4) (27ms)
  ✓ 5 [api] › tests/api/schema.spec.ts:28:1 › a pot name is unique whatever its case (44ms)
  ✓ 6 [api] › tests/api/schema.spec.ts:37:1 › a budget category is unique, and so is a theme among budgets and among pots (39ms)
  ✓ 7 [api] › tests/api/schema.spec.ts:51:1 › a money column holds NFR-S3's largest amount, 99,999,999,999 cents (24ms)
  7 passed (6.6s)
```

**Step 10 mutation (RED then GREEN):**
RED (lock line commented out, filtered to "advisory lock"):
```
✘  1 [api] › tests/api/reset.spec.ts:72:1 › a reset waits for the advisory lock, so two never run at once (§4) (4.9s)
Error: expect(received).toBe(expected)
Expected: 1
Received: 0
Call Log:
  - Timeout 5000ms exceeded while waiting on the predicate
1 failed
```
GREEN (line restored, byte-exact via diff, same filter):
```
✓  1 [api] › tests/api/reset.spec.ts:72:1 › a reset waits for the advisory lock, so two never run at once (§4) (207ms)
1 passed (4.4s)
```

**`npm run db:reset`:**
```
1 migration found in prisma/migrations
No pending migrations to apply.
Running seed command `tsx prisma/seed.ts` ...
reset reason=manual rows=59 at=2026-09-22T14:29:41.479Z
🌱  The seed command has been executed.
```

**psql check:**
```
 reason
--------
 manual
(1 row)
```

**Final gates (Step 12):**
- `npm run lint` → exit 0, no output (clean).
- `npm run format:check` → "All matched files use Prettier code style!" exit 0.
- `npm run typecheck` → exit 0, no output.
- `npm test` → `Test Files 7 passed (7)` / `Tests 214 passed (214)` — matches R4.
- `npm run test:api` → `7 passed (4.5s)` — matches brief.
- `npm audit --audit-level=high` → "found 0 vulnerabilities" — matches R8.

## E23 measurements (everything the plan left open, Task 4's variants excluded)

- **Migration applying:** clean apply, "Your database is now in sync with your schema." No
  errors, no manual intervention.
- **citext uniqueness:** `tests/api/schema.spec.ts` "a pot name is unique whatever its case"
  passed — inserting the same pot name in uppercase raised Prisma's P2002 unique-violation
  error, confirming the `CITEXT` column type + unique index works case-insensitively.
- **Truncation/reinsertion:** `tests/api/reset.spec.ts`'s first test seeded stray rows (a
  transaction and a login attempt not in the seed), called `resetToSeed`, and asserted the
  stored rows equal exactly the seed's rows (`storedRows(db)` === `insertedRows(rows)`) and
  `loginAttempt.count() === 0`. Passed on the first run — `TRUNCATE ... RESTART IDENTITY`
  plus reinsertion behaves exactly as designed, including `seq` counters restarting at 1
  (asserted in the second test).
- **BigInt round-trip:** `tests/api/schema.spec.ts`'s money-column test inserted
  99,999,999,999 cents (NFR-S3's largest amount, far beyond 32-bit `Int` range) into a
  `BigInt` column and read it back via `Number(...)`, getting back exactly 99,999,999,999.
  No precision loss, no out-of-range error.
- **Advisory-lock wait:** proven twice — the real test passed on the first `test:api` run
  (a second session holds `pg_advisory_lock`, `resetToSeed` blocks until it's released, then
  proceeds), and the Step 10 mutation proved the test is not vacuously green (it times out
  and fails when the lock statement is removed).
- **DateTime round-trip:** implicit in the truncation/reinsertion test — `storedRows`
  compares `date.toISOString()` against what was inserted; all 49 transaction dates and the
  `ResetLog.at` timestamp round-tripped correctly with no drift.

No stop-rule condition (DROP EXTENSION, a DateTime that doesn't round-trip, BigInt out of
range, or a lock error) was ever observed. The Step 6 folder-creation deviation, above, was
investigated and resolved as cosmetic — it did not require the stop rule.

## Files changed

Created:
- `compose.yaml`
- `prisma/migrations/20260922142518_init/migration.sql`
- `prisma/migrations/migration_lock.toml`
- `prisma/seed.ts`
- `src/server/reset.ts`
- `tests/unit/reset.test.ts`
- `tests/fixtures/database.ts`
- `tests/api/reset.spec.ts`
- `tests/api/schema.spec.ts`
- `.env.local` (git-ignored, not committed)

Modified:
- `package.json` (devDependencies.tsx, allowScripts.esbuild, scripts.test:api,
  scripts.db:reset)
- `package-lock.json` (tsx + esbuild transitive deps)
- `playwright.config.ts` (`.env.local` loading, `APP_ENV: "test"` on `webServer`)

## Self-review findings

- All file contents match the brief verbatim except the one hand-written insertion (the
  citext extension lines), which was diffed and confirmed exact.
- Both mutation checks (Step 7, Step 10) were restored byte-exact, verified with `diff`
  (`exit=0`) before re-running to green — not just "looks the same."
- `git status` was checked after every install/`npm pkg set` step; only `package.json` /
  `package-lock.json` (and later the new files) were ever dirty — no git config or hook files
  were touched, `prepare`'s script never ran (no argument-less `npm install`/`npm ci` was
  used).
- The commit's staged file list was diffed against the brief's exact `git add` list before
  committing; no stray files (no drift-check migration folder, no `.env.local`, no report
  file) were included.
- `RESET_TABLES` mutation test, lock mutation test, and both drift checks all directly
  exercise the parts of `reset.ts` most likely to silently regress (table list, advisory
  lock) — high confidence in correctness, not just green-by-accident.

## Concerns

- **Step 6 deviation** (documented in detail above): Prisma 7.10.0's `--create-only` flag
  always materializes a migration folder, even when the diff is empty, rather than printing
  "Already in sync, no schema change or pending migration was found." as the brief's Step 6
  expects. This is very likely a Prisma-version/flag-combination difference from what the
  brief's author observed (E8's measurement), not a defect in this implementation. Future
  tasks that reuse this drift-check pattern should expect the same folder-creation behaviour
  and should treat an *empty* `migration.sql` (verified by content, not by CLI message text)
  as the sign of "no drift," with `prisma migrate status` as the authoritative confirmation.
- **Step 3's RED message wording** differs from the brief's literal text ("Cannot find
  package" vs. "Failed to resolve import") — this is Vitest 5's actual phrasing for the same
  failure mode (module not found) and is not a functional deviation.
- No other concerns. The Postgres container was left running and healthy for Task 4, as
  instructed. `.env.local` was never staged or committed.
