# Task 3 review — spec + quality (feature-dev:code-reviewer, opus, read-only)

Range 005d907..120ed4a. Copied verbatim from the reviewer's hand-back by the controller.

### Spec Compliance
- ✅ **Spec compliant.** Every file in the brief's Files list is in the diff, and each matches the brief's text:
  - `compose.yaml` has R5's top-level `name: ai-native-personal-finance` (diff line 30).
  - `migration.sql` is the brief's SQL with only the two hand-written citext lines prepended.
  - `migration_lock.toml` is committed, as ADR-0005 requires ("migrations committed").
  - `reset.ts`, `seed.ts`, `tests/fixtures/database.ts`, `tests/unit/reset.test.ts`, `tests/api/reset.spec.ts` and `tests/api/schema.spec.ts` all match the brief.
  - `package.json` has `test:api` with `--workers=1` and without `--pass-with-no-tests`, `db:reset`, `tsx ^4.23.15` and `allowScripts` `esbuild@0.28.2`.
  - `playwright.config.ts` loads `.env.local` and sets `webServer.env = { APP_ENV: "test" }`.
- **§2.1 is met in code:** one interactive `$transaction`; TRUNCATE of the six tables (`LoginAttempt` included); seed rows inserted with `seeded: true`; a `ResetLog` row with the reason; returns `{ at, rows }`.
- **§4 is met:** `pg_advisory_xact_lock(42::bigint)`. The literal 42 in the spec resolves to the same bigint overload.
- **ADR-0005 is met:** `reset.ts` has no `new Date()`.
- **NFR-T2 is met:** "US-36" appears in the first test title of `reset.spec.ts`.
- **DoD v1.1 is met:** the new RESET_TABLES guard ships with its violation fixture.
- **Accepted Step 6 deviation:** Prisma 7.10's `--create-only` wrote an empty drift-check folder, which was deleted before the commit. The controller accepted this; I have not re-opened it.
- **Two concrete risks checked outside the diff (both resolved):**
  1. Risk: `prisma/seed.ts` is not type-checked. It is: `tsconfig.json` includes `**/*.ts`, so `npm run typecheck` covers it.
  2. Risk: `db:reset` depends on seed config outside this diff. It exists: `prisma.config.ts:10` has `migrations: { …, seed: "tsx prisma/seed.ts" }`, carried over from Task 1.
- **Extra check against `prisma/schema.prisma`:** it has no `@@map`, so the model names in `RESET_TABLES` are the real table names that TRUNCATE receives.
- **Extra check against `prisma/data.json`:** all 49 transaction dates are distinct, so the `byDate` sort in `tests/fixtures/database.ts` has no ties and the `storedRows`/`insertedRows` comparison is deterministic.
- ⚠️ **Cannot verify from the diff:**
  - The test counts (Vitest 214/214 per R4, Playwright api 7 passed), `npm audit` at 0 (R8), the mutation-check runs, the container's health, and that `.env.local` exists but was not committed. All of these come only from the report.
  - The `api` project block in `playwright.config.ts` is above the shown hunk. The report's `[api] › tests/api/...` lines suggest the new specs run under it.
  - Where `ResetLog.at` comes from:
    - If it is the database's `DEFAULT CURRENT_TIMESTAMP`, it is the *transaction start* time. That is before the lock wait and before the writes.
    - If Prisma's runtime fills in `@default(now())`, the doc comment's "this module reads no clock" holds only in the letter.
    - Either way §2.5 ("lastResetAt always exists") is met. The difference may matter for T-08's threshold logic, and the doc comment at `src/server/reset.ts` (lines 982-987 of the diff) should say which it is.

### Strengths
- **The lock test is sound:** it polls `pg_locks` for an ungranted advisory lock (`objsubid = 1` is correct for the bigint form) instead of relying on timing. The Step 10 mutation shows it fails when the lock line is removed.
- **Lock ordering is right:** the advisory lock is taken before TRUNCATE's ACCESS EXCLUSIVE table locks, so two resets queue on the advisory lock and never deadlock on the table locks.
- **`_prisma_migrations` is protected:** truncating an explicit `RESET_TABLES` list keeps it, and a test asserts exactly that.
- **`Prisma.raw` is safe here:** it only joins a module-level `as const` list, so there is no injection surface.
- **The RESET_TABLES guard needs no database:** the unit test holds the list to `Prisma.ModelName` in both directions, with a deliberate-omission fixture. It runs in CI's `verify` job.
- **The schema tests would each fail if their constraint were dropped:**
  - They use `Gold` and `Education`, which no seed row uses, so each insert collides only on the constraint under test.
  - The citext test upper-cases a seed pot name that is not already all capitals.
  - The money test would fail on a 32-bit `Int` column.
- **The reset test checks through the database:** it seeds a stray transaction and a login attempt, and would catch a missing TRUNCATE, a missing `seeded: true`, a missing `ResetLog` row or a `LoginAttempt` that is not cleared.
- **Commit hygiene is good:** only the listed files are staged, both mutation restores were confirmed with `diff`, the commit used the gitleaks prefix, and `--no-verify` was not used. The Step 6 deviation was investigated before anything was deleted.

### Issues

#### Critical (Must Fix)
None.

#### Important (Should Fix)
None.

#### Minor (Nice to Have)
1. **`tests/api/reset.spec.ts:23` (diff line 1069): the `result.rows` assertion repeats the implementation's own formula.** It restates `1 + rows.transactions.length + rows.budgets.length + rows.pots.length` from `src/server/reset.ts` (diff line 1011). So it would not notice if the formula and the inserts drifted apart. `rows` itself is computed from the input lengths, not from `createMany`'s `{ count }`.
   - The `storedRows`/`insertedRows` equality next to it does catch missing inserts, which is why this is Minor.
   - Fix: compare against counts read from the database (`balance.count() + transaction.count() + budget.count() + pot.count()`), and optionally make `reset.ts` add up the `count`s that `createMany` returns.
2. **No test covers "in one transaction" (§2.1) (`tests/api/reset.spec.ts`).**
   - Nothing fails if a reset breaks partway through: no test checks that the earlier state survives.
   - The lock test only shows that a reset blocks on a lock held at its start. If the `$transaction` wrapper were lost, the xact lock would be released after its own statement and the test would still pass, even though the title claims "two never run at once".
   - This matters now because the third parameter `rows` is the route Task 4's variants will use.
   - Fix: call `resetToSeed(db, "test", { ...seedRows(), budgets: [b, b] })`, expect a `P2002` rejection, and assert that the previous `ResetLog` row and data are unchanged. This test was not in the brief.
3. **`playwright.config.ts` (unchanged `fullyParallel: true`) with `package.json` `test:api`: the one-worker rule lives only in the npm script (plan-mandated, Step 8 / D14).**
   - Running `npx playwright test --project=api` directly (locally `workers` is undefined) runs `reset.spec.ts` and `schema.spec.ts` at the same time against one database.
   - The advisory lock serialises the resets but not each test's read-then-assert window. The lock test's `NOT granted = 1` poll can also see a second waiter.
   - `test:all` goes through the script, so today's gate is safe.
   - Fix: pin serial execution in config, with `fullyParallel: false` on the `api` project or a per-project `workers: 1` if the installed Playwright supports it.
4. **`compose.yaml:18` (diff line 45): the health check connects over the Unix socket (plan-mandated, brief verbatim).**
   - On a first start, the postgres image's entrypoint runs a temporary init server with `listen_addresses=''`. That server listens only on the socket.
   - So `docker compose up -d --wait` can report healthy during init, and a command run straight afterwards can hit the restart window.
   - Fix: `pg_isready -h 127.0.0.1 -U postgres -d personal_finance`. It only affects the first boot of a fresh volume.
5. **`package.json` `test:api` now needs a running Postgres,** so `npm run test:all` (DoD v1.1) needs Docker locally and fails in CI until Task 5 adds the Postgres job (owner answer 6). This follows the plan's order and is noted here only so the CI job is not forgotten.

### Assessment
**Task quality:** Approved

**Reasoning:** The code is the brief's text, including R5's compose `name`. The pieces most likely to break quietly (the table list and the advisory lock) are each pinned by a test that has been shown to fail when broken, and the one deviation was investigated and accepted by the controller. The Minor items are about how strong the tests are and how robust the local tooling is. None of them makes this task untrustworthy.
