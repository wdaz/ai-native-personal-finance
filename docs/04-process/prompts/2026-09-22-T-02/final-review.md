# Final whole-branch review (feature-dev:code-reviewer, opus, read-only)

Range bbf4606..7718a1e. Copied verbatim from the reviewer's hand-back by the controller. The fix wave that answered it: final-fix-findings.md, final-fix-report.md, and the scoped re-review in final-rereview.md.

## T-02 final review: bbf4606..7718a1e

I found no Critical issues. The code is correct and well gated. It can merge after three fixes: one missing API test, a one-line Playwright config change, and finishing the process-log entry.

Scope: I read all the code, config, test and document diffs; the package-lock only for the Prisma pins and the overrides; and the plan's Decisions, Owner answers and DoD table. I checked named risks in the worktree: the ESLint and Playwright configs, `ci.yml`, `next.config.ts`, the seed dates in `data.json`, the Prisma client runtime and the Playwright types. I ran nothing.

### Strengths
- **Layers (ADR-0002).** Only `src/server` reaches Prisma. The generated client lives in `src/server/generated/prisma`, which is git-ignored and rebuilt by `postinstall`. A new violation fixture (`app-imports-prisma-generated`) shows the `**/prisma/**` guard covers the generated path. The six fixtures are repointed at `src/server/db`.
- **Test-route gate.** The route table is `testSupportRoutes(env)`, read on every request. `next.config.ts` only defines `NEXT_PUBLIC_*` keys, and the code reads `env.APP_ENV` off the object, so nothing is inlined at build time. Unit tests pin six non-test values (including `"Test"` and `"test "`), a control case, and the route file itself through `vi.stubEnv`. E14 measured the same build answering 404 outside test and 200/400 in test.
  - **What a production build exposes:** the catch-all route is compiled in, but every GET or POST answers the 404 envelope and opens no database connection, because `getDb` is only called inside a handler.
- **`resetToSeed`.**
  - The lock is transaction-scoped (`pg_advisory_xact_lock(42::bigint)`), which also works behind Neon's transaction-mode pooler.
  - `TRUNCATE` is transactional, so a rollback restores the previous data.
  - `RESET_TABLES` is held to `Prisma.ModelName` by a unit test, so every model is truncated in one statement. That keeps it safe without `CASCADE` even if foreign keys are added later.
  - `_prisma_migrations` survives a reset (API-tested), `RESTART IDENTITY` restarts `seq` (tested), and `maxWait`/`timeout` are raised with a stated reason.
- **Clock and seed.** No clock is read in `src/server` code: dates are shifted as text, and `toCents` refuses fractions of a cent. The mirror tests read `design-tokens.md` and `data-model.md` and each has a violation case; the checksum test and the NFR-S3 largest-amount round trip are in place. The citext test inserts an upper-case name, so it would fail on a plain `text` column. All 49 seed dates are unique, so the date-sorted comparison in `storedRows` is deterministic.
- **Lock file and CI.**
  - Prisma is 7.10.0 throughout (`prisma`, client, adapter, engines, config).
  - The overrides took effect: deepmerge-ts 8.0.2 and mysql2 3.24.4, with the `"//"` note in `package.json` and the removal on T-13.
  - `pg` 8.23.0 is not marked dev in the lock, because the adapter depends on it, so a production install keeps it.
  - The CI job's `DATABASE_URL` reaches the web server through Playwright's `{...process.env, ...webServer.env}` merge. `npm ci` → `prisma generate` → `migrate deploy` → `test:api` is the right order.
- **Owner answers.** Q1–Q7 and Q9 are all applied, including the Q2 sentence in §5, the one-line Q5 note, and the Q9 disagreement recorded.

### Issues

#### Critical (Must Fix)
None.

#### Important (Should Fix)
1. **No test checks that a reset is one transaction (§2.1).**
   - **Where:** `tests/api/reset.spec.ts:72` (the lock test) and `src/server/reset.ts:36` (the transaction).
   - **What's wrong:** the lock test only proves that a reset *waits* for key 42. Without `$transaction`, the `pg_advisory_xact_lock` statement still blocks, the poll still sees one waiter, and the reset still resolves. It then takes the lock and drops it at the end of that one statement. Every other test also passes with `$transaction` removed; the ledger says the same.
   - **Why it matters:** a refactor that drops the transaction would go unnoticed. A cron or threshold reset that fails part-way would then leave the tables truncated or half-filled until the next reset, which can be 10 days away.
   - **Fix (about 12 lines):**
     ```ts
     test("US-36 a reset that fails part-way leaves the previous data (§2.1: one transaction)", async () => {
       await resetToSeed(db, "test", applyVariant(seedRows(), "empty-pots"));
       const before = await storedRows(db);
       const rows = seedRows();
       const broken = { ...rows, budgets: [...rows.budgets, rows.budgets[0]!] }; // duplicate category
       await expect(resetToSeed(db, "test", broken)).rejects.toMatchObject({ code: "P2002" });
       expect(await storedRows(db)).toEqual(before);
     });
     ```
     Budgets are inserted after the truncate, the balance and the transactions, so this test goes red without the transaction.
2. **The one-worker rule lives only in the npm script.**
   - **Where:** `playwright.config.ts:21` (`fullyParallel: true`) and `:32-36` (the `api` project).
   - **What's wrong:** `--workers=1` is only in the `test:api` script. Other entry points still run the API files in parallel against one database: `npx playwright test --project=api`, a bare `npx playwright test`, and `npm run test:e2e:ui` (`playwright test --ui`, which runs every project).
   - **Why it matters:** parallel resets clobber each other and give flaky failures.
   - **Fix:** put the rule on the project itself: `{ name: "api", testDir: "tests/api", workers: 1, fullyParallel: false, use: { baseURL } }`. `TestProject.workers` exists in the installed Playwright (`node_modules/playwright/types/test.d.ts:757`). The script flag can stay.
3. **The process record is unfinished.** This is outstanding work, not a code defect.
   - **Where:** `docs/04-process/process-log.md:619-625`.
   - **What's wrong:**
     - "What the agent got right", "wrong or missed" and "Lessons" are still `_(controller, from the execution ledger)_`.
     - The R7 copy of briefs, reports and reviews to `docs/04-process/prompts/2026-09-22-T-02/` is not done.
     - The Task-5 incident (`git checkout 0eec801 -- .` in a shared-`.git` worktree) belongs under "wrong or missed".
     - `:626` "Next: … findings F1, F2 and question 8 if deferred" is stale: they shipped as PRs #4 and #5.
   - **Why it matters:** AGENTS.md calls the process log a first-class deliverable, and the DoD requires the entry and the saved prompts. Complete all of this before merge.

#### Minor (Nice to Have)
4. **Health checks can pass too early on a fresh database.**
   - **Where:** `compose.yaml:18` and `.github/workflows/ci.yml:55`.
   - **What's wrong:** `pg_isready` without `-h` checks over the Unix socket. On first boot the image runs a socket-only temporary server during init, so the check can pass before TCP accepts connections.
   - **Why it matters:** the README runs `docker compose up -d --wait` and `npm run db:reset` back to back, so on a fresh volume the reset can fail once. In CI the `npm ci` step hides the race rather than fixing it.
   - **Fix:** `pg_isready -h 127.0.0.1 -U postgres -d personal_finance` in both files.
5. **The `ResetLog.at` comment names the wrong source.**
   - **Where:** `src/server/reset.ts:27` says `at` "comes from the column's `@default(now())`".
   - **What's wrong:** the Prisma 7 client runtime has a `NowGenerator` that calls `new Date()` (seen in `node_modules/@prisma/client/runtime/client.js.map`). So `at` is almost certainly the app process's clock, sent in the INSERT; the column's `DEFAULT CURRENT_TIMESTAMP` goes unused.
   - **Fix:** confirm once with `log: ["query"]`. Then reword the comment ("filled by Prisma's runtime from the server clock; operational time, not business time") and add it to T-08's hand-off for `resetEpoch`.
6. **`.env.example:31` is stale.** It still says `APP_ENV=test enables /api/test/reset|seed|log`, but `log` moved to T-12 in this PR (backlog v1.6, §2.7 note), and this PR already edits that file.
7. **§2.7's "routes do not exist — 404" holds for GET and POST only.**
   - **Where:** `app/api/test/[...path]/route.ts`.
   - **What's wrong:** in every environment, Next implements OPTIONS automatically (answering with `Allow: GET, HEAD, OPTIONS, POST`) and answers 405 to PUT, PATCH and DELETE. So the route's existence is visible outside test.
   - **Why it matters:** there is no security impact, since nothing is reachable. It is a small spec deviation.
   - **Fix:** either note it in the PR, or export the remaining methods and delegate them to `handleTestSupport`.

### Deferred-minor triage
1. ESLint does not ignore `src/server/generated/` (T1): **leave**. E11 measured `eslint .` clean, and a future breakage would be loud (an unused-directive warning under `--max-warnings 0`), not silent.
2. esbuild@0.28.2 read as drift from D17 (T1): **leave**. It is not drift; esbuild arrives with tsx in T3, and the lock shows 0.28.2.
3. `result.rows` assertion restates the formula (T3, `reset.spec.ts:45`): **leave**. Low value; comparing against database counts can come later.
4. No test pins "in one transaction" (T3): **fix before merge** (Important 1). The lock test does not cover it.
5. One-worker rule lives only in the script (T3): **fix before merge** (Important 2). It is one line.
6. `pg_isready` over the socket (T3): **fix before merge**. It is cheap, the README runs the two commands back to back, and `ci.yml:55` needs the same change. It would not block on its own.
7. `ResetLog.at` source (T3): **fix the comment before merge**, since it is cheap. The substantive decision stays with T-08 as a hand-off.
8. `test:api` needs Postgres, so CI needs a Postgres job (T3): **leave**. Resolved by 24084b9.
9. POST `/api/test/seed` with no body has no dedicated test (T4): **leave**. It takes the same `request.json().catch` path as the tested non-JSON body.
10. ASCII "basla"/"S5" in the 7718a1e commit body (T5): **leave**. The documents are correct, and rewriting would need a force-push.

### Recommendations
- **T-14 hand-off: `APP_ENV`.** `APP_ENV` must never be `test` in Vercel production. That one variable is all that stands between a public URL and an unauthenticated truncate of six tables. Consider a startup guard that refuses `APP_ENV=test` when `VERCEL_ENV=production`, and decide deliberately before enabling it on previews.
- **T-14 hand-off: migrations on Neon.** Check whether `prisma migrate deploy` needs Neon's direct (non-pooled) URL. `prisma.config.ts` uses `DATABASE_URL` for both the CLI and the app.
- **Guard the destructive tests (T-13 or T-14).** `test:api` and `db:reset` truncate whatever `DATABASE_URL` in `.env.local` points at. A guard that refuses non-local hosts outside CI would stop a Neon URL there from being wiped.
- **CI hardening (T-13).** Add a schema-vs-migrations drift check (`prisma migrate diff … --exit-code`), and upload the Playwright HTML report as an artifact when the `api` job fails.
- **Tests I would run:**
  - `npx playwright test --project=api` without `--workers`: expect flakes today and green after fix 2.
  - The new atomicity test with `$transaction` temporarily removed: it must go red.
  - `docker compose down -v && docker compose up -d --wait && npm run db:reset` on a fresh volume, to exercise the health-check race.
  - `npm run build && APP_ENV=production npm start`, then `curl -X POST :3000/api/test/reset` (expect 404) and `curl -i -X OPTIONS :3000/api/test/reset` (shows item 7).
  - `npm run test:all` after the fixes.

### Assessment
**Ready to merge?** With fixes

**Reasoning:** The implementation matches the plan, the owner's answers and the ADRs, and it has no correctness or security defect. Before merge, add the one-transaction test, put `workers: 1` on the `api` project, and complete the process-log entry and the R7 prompt record. The Minor items are one-line changes.
