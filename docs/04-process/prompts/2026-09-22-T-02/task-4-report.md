# Task 4 report — the test-support routes

Branch: `task/T-02-persistence-reset`. Starting HEAD `120ed4a`. Commit produced: `49dbec9`.

## What was implemented, step by step

1. **Step 1 (RED).** Wrote `tests/unit/test-support.test.ts` verbatim from the brief (15
   test cases across 6 `it`/`it.each` blocks, covering `testSupportRoutes` env-gating,
   `handleTestSupport` 404s outside test, the route file's 404 passthrough, unknown-path
   404 inside test, and the three invalid-body 400 cases for `/api/test/seed`).
2. **Step 2.** Wrote `src/server/http.ts` verbatim — `ApiErrorCode` union and
   `errorResponse(status, error, message)` returning `Response.json({ error, message },
   { status })`.
3. **Step 3.** Wrote `src/server/test-support.ts` verbatim — `TestRoute` type, `reset()` and
   `seed(request)` handlers wrapping `resetToSeed`/`seedRows`/`applyVariant`/`isSeedVariant`,
   the `routes` table (`POST reset`, `POST seed`), `testSupportRoutes(env)` gated by
   `isTestEnv`, and `handleTestSupport(method, segments, request, env)` which 404s on no
   match and 500s (logging via `console.error`) on a thrown error from the handler.
4. **Step 4.** Created `app/api/test/[...path]/route.ts` verbatim — the catch-all `POST`/
   `GET` handlers delegating to `handleTestSupport`.
5. Reran `tests/unit/test-support.test.ts` — GREEN, 15/15 (R4).
6. Ran the three mutation checks from Step 4 of the brief (details below), restoring each
   by hand and re-running to green after each.
7. **Step 5.** Wrote `tests/api/test-support.spec.ts` verbatim from the brief (the
   APP_ENV=test control test, the `US-36` reset test, one `for` loop over `SEED_VARIANTS`
   generating 6 seed tests, and the "refuses an unknown variant" test).
8. Ran `npm run test:api` — 16 passed (reset 4, schema 3, test-support 9), matching the
   brief.
9. **Step 6.** Updated the three READMEs exactly as the brief's diffs specify:
   `tests/api/README.md`, `app/api/README.md`, `tests/fixtures/README.md`.
10. **Step 7.** Ran every gate: lint, format:check (after letting Prettier normalize
    `tests/api/test-support.spec.ts`'s line wrapping — see Self-review), typecheck, `npm
    test` (229/229, per ruling R4), `npm run test:api` (16/16, rerun after the Prettier
    reformat touched that file).
11. **Step 8.** Staged exactly the 8 files the brief lists and committed with the
    `GITLEAKS_CACHE_DIR` prefix, no `--no-verify`, message and attribution exactly as
    instructed. Commit hooks ran normally (gitleaks, etc.) and passed.

## TDD evidence

### RED

Command: `npx vitest run tests/unit/test-support.test.ts` (run immediately after Step 1,
before `src/server/http.ts`, `src/server/test-support.ts` or the route file existed).

Output (relevant lines):
```
 ❯ tests/unit/test-support.test.ts (0 test)

⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/unit/test-support.test.ts [ tests/unit/test-support.test.ts ]
Error: Cannot find package '@/app/api/test/[...path]/route' imported from
/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/T-02-persistence-reset/tests/unit/test-support.test.ts
 ❯ tests/unit/test-support.test.ts:2:1
    1| import { afterEach, describe, expect, it, vi } from "vitest";
    2| import { GET, POST } from "@/app/api/test/[...path]/route";
    3| import { handleTestSupport, testSupportRoutes } from "@/src/server/tes…

 Test Files  1 failed (1)
      Tests  no tests
```
Why expected: the route file (and the modules it and the test import) did not exist yet;
this is exactly the brief's stated "FAIL — `Failed to resolve import
"@/app/api/test/[...path]/route"`" (Vitest 5's error text differs slightly — "Cannot find
package" vs. "Failed to resolve import" — but names the same missing module for the same
reason).

### GREEN

Command: `npx vitest run tests/unit/test-support.test.ts` (after Steps 2–4).

Output:
```
 Test Files  1 passed (1)
      Tests  15 passed (15)
```
Matches ruling R4 (15 tests in `tests/unit/test-support.test.ts`).

## Mutation checks (Step 4 of the brief)

All three were applied to the **uncommitted** working files (`src/server/test-support.ts`,
`src/server/env.ts`), run, then undone by hand, then reran to green — per the task's
"Rulings that override the brief".

### Mutation 1 — `testSupportRoutes` returns `routes` unconditionally

Edit (`src/server/test-support.ts`):
```diff
 export function testSupportRoutes(env: Env = process.env): readonly TestRoute[] {
-  return isTestEnv(env) ? routes : [];
+  return routes;
 }
```
Command: `npx vitest run tests/unit/test-support.test.ts`

Failing (×) lines observed, verbatim:
```
     × has no /api/test/* route when APP_ENV is undefined 3ms
     × has no /api/test/* route when APP_ENV is "development" 0ms
     × has no /api/test/* route when APP_ENV is "production" 0ms
     × has no /api/test/* route when APP_ENV is "Test" 0ms
     × has no /api/test/* route when APP_ENV is "test " 0ms
     × has no /api/test/* route when APP_ENV is "" 0ms
     × answers POST /api/test/reset with 404 outside test 8ms
     × answers POST /api/test/seed with 404 outside test 0ms
     × answers 404 through the route file when APP_ENV is not test 0ms
```
Count: `Tests  9 failed | 6 passed (15)` — matches the brief's "nine tests fail".

Restore: reverted the line back to `return isTestEnv(env) ? routes : [];`. Re-run: `Tests
15 passed (15)`.

### Mutation 2 — `isTestEnv` compares `env.APP_ENV?.trim().toLowerCase()`

Edit (`src/server/env.ts`):
```diff
 export function isTestEnv(env: Env = process.env): boolean {
-  return env.APP_ENV === "test";
+  return env.APP_ENV?.trim().toLowerCase() === "test";
 }
```
Command: `npx vitest run tests/unit/test-support.test.ts`

Failing (×) lines observed, verbatim:
```
     × has no /api/test/* route when APP_ENV is "Test" 3ms
     × has no /api/test/* route when APP_ENV is "test " 0ms
```
Count: `Tests  2 failed | 13 passed (15)` — matches the brief's "two fail".

Restore: reverted to `return env.APP_ENV === "test";`. Re-run: `Tests 15 passed (15)`.

### Mutation 3 — `if (!isSeedVariant(variant))` → `if (false)`

Edit (`src/server/test-support.ts`):
```diff
-  if (!isSeedVariant(variant)) {
+  if (false) {
```
Command: `npx vitest run tests/unit/test-support.test.ts`

Failing (×) lines observed, verbatim:
```
     × refuses {"variant":"nope"} (an unknown variant) with 400 and the error envelope 3ms
     × refuses {} (a missing variant) with 400 and the error envelope 0ms
     × refuses not json (a body that is not JSON) with 400 and the error envelope 0ms
```
Stderr observed for each (confirms the request reached `getDb()`):
```
test-support POST /api/test/seed failed Error: DATABASE_URL is not set: copy .env.example to .env.local (README, Run locally)
    at databaseUrl (.../src/server/env.ts:19:11)
    at getDb (.../src/server/db.ts:21:30)
    at Object.seed [as handle] (.../src/server/test-support.ts:32:36)
```
One assertion detail observed: `AssertionError: expected 500 to be 400`, confirming the
route answered 500 (via the `catch` in `handleTestSupport`), exactly as the brief predicts
("the request reaches `getDb()` and answers 500").

Count: `Tests  3 failed | 12 passed (15)` — matches the brief's "three fail".

Restore: reverted to `if (!isSeedVariant(variant)) {`. Re-run: `Tests 15 passed (15)`.
`git diff` on the tracked files (`src/server/env.ts`, and the not-yet-tracked
`src/server/test-support.ts` compared against what was written in Step 3) showed no
unintended residue after each restore.

## `npm run test:api` output (all 16 test lines)

Command: `npm run test:api` (Postgres container `ai-native-personal-finance-postgres-1` was
already up and healthy; port 3000 was free both times this ran; the webServer built with
`next build` and started with `next start` under `APP_ENV=test`, per `playwright.config.ts`).

```
Running 16 tests using 1 worker

  ✓   1 [api] › tests/api/reset.spec.ts:23:1 › US-36 resetToSeed replaces whatever the tables hold with the seed (109ms)
  ✓   2 [api] › tests/api/reset.spec.ts:48:1 › budgets and pots keep the seed's order as their creation order (26ms)
  ✓   3 [api] › tests/api/reset.spec.ts:61:1 › a reset leaves Prisma's migration history alone (20ms)
  ✓   4 [api] › tests/api/reset.spec.ts:72:1 › a reset waits for the advisory lock, so two never run at once (§4) (27ms)
  ✓   5 [api] › tests/api/schema.spec.ts:28:1 › a pot name is unique whatever its case (46ms)
  ✓   6 [api] › tests/api/schema.spec.ts:37:1 › a budget category is unique, and so is a theme among budgets and among pots (36ms)
  ✓   7 [api] › tests/api/schema.spec.ts:51:1 › a money column holds NFR-S3's largest amount, 99,999,999,999 cents (21ms)
  ✓   8 [api] › tests/api/test-support.spec.ts:22:1 › the server under test has the test-support routes (APP_ENV=test) (35ms)
  ✓   9 [api] › tests/api/test-support.spec.ts:29:1 › US-36 POST /api/test/reset puts the seed back and answers its time (120ms)
  ✓  10 [api] › tests/api/test-support.spec.ts:45:3 › POST /api/test/seed seed stores the seed rows (31ms)
  ✓  11 [api] › tests/api/test-support.spec.ts:45:3 › POST /api/test/seed empty-pots stores the empty-pots rows (26ms)
  ✓  12 [api] › tests/api/test-support.spec.ts:45:3 › POST /api/test/seed empty-budgets stores the empty-budgets rows (29ms)
  ✓  13 [api] › tests/api/test-support.spec.ts:45:3 › POST /api/test/seed few-transactions stores the few-transactions rows (17ms)
  ✓  14 [api] › tests/api/test-support.spec.ts:45:3 › POST /api/test/seed no-recurring stores the no-recurring rows (27ms)
  ✓  15 [api] › tests/api/test-support.spec.ts:45:3 › POST /api/test/seed empty-all stores the empty-all rows (13ms)
  ✓  16 [api] › tests/api/test-support.spec.ts:59:1 › POST /api/test/seed refuses an unknown variant and changes nothing (27ms)

  16 passed (4.8s)
```
(This is the rerun after Prettier reformatted `tests/api/test-support.spec.ts`'s line
wrapping — line numbers for a few tests shifted by 2 relative to the first run, content
unchanged. The first run, before that reformat, also showed 16 passed with the same test
names at slightly different line numbers.)

## Final gates

| Gate | Command | Result |
|---|---|---|
| Lint | `npm run lint` | exit 0, no output |
| Format | `npm run format:check` | exit 0 (after `npx prettier --write tests/api/test-support.spec.ts` — see Self-review) — "All matched files use Prettier code style!" |
| Typecheck | `npm run typecheck` | exit 0, no output |
| Vitest | `npm test` | `Test Files 8 passed (8)` / `Tests 229 passed (229)` — matches ruling R4 (229/229, not the brief's 226) |
| Playwright api | `npm run test:api` | `16 passed (4.8s)` — reset 4, schema 3, test-support 9 |

## Files changed

Committed in `49dbec9` (`feat(test-support): /api/test/reset and /api/test/seed behind
APP_ENV=test (T-02)`):
- `src/server/http.ts` (new) — `ApiErrorCode`, `errorResponse`
- `src/server/test-support.ts` (new) — `TestRoute`, `testSupportRoutes`, `handleTestSupport`
- `app/api/test/[...path]/route.ts` (new) — `POST`, `GET`
- `tests/unit/test-support.test.ts` (new) — 15 unit tests
- `tests/api/test-support.spec.ts` (new) — 9 Playwright tests
- `tests/api/README.md` (modified) — run instructions + per-file index
- `app/api/README.md` (modified) — "Filled by" line reordered/expanded
- `tests/fixtures/README.md` (modified) — replaced "Filled by" line with the `database.ts`/
  `boundaries/` detail

Not committed (unrelated to this task, already present before Task 4 started): none — `git
status` was clean before Step 1 and clean again after the commit.

## Self-review findings

- **Prettier reformatting.** `npx prettier --check .` failed once, on
  `tests/api/test-support.spec.ts` only, because two `async ({ request }) => {` and one
  `async ({\n  request,\n}) => {`-style test callback signatures the brief's verbatim text
  wraps onto multiple lines now fit on one line under this repo's Prettier config (line
  width), so Prettier collapsed them. I ran `npx prettier --write` on that one file, which
  changed only whitespace/line-breaks (three call signatures: lines ~22, ~29, ~61 in the
  brief's numbering) — no logic, string, or assertion changed. I verified this by rerunning
  `npm run test:api` afterward (still 16/16) and diffing the file mentally against the
  brief's text (identical except those three line-wraps). No other file needed
  reformatting; `tests/unit/test-support.test.ts`, `src/server/http.ts`,
  `src/server/test-support.ts` and the route file all matched Prettier's style as typed.
- **RED-step wording.** The actual Vitest 5 error text is `Cannot find package
  '@/app/api/test/[...path]/route' imported from ...` rather than the brief's `Failed to
  resolve import "@/app/api/test/[...path]/route"`. Both name the same missing module for
  the same reason (the route file did not exist yet); I judged this a Vitest-version wording
  difference, not a contradiction of the brief's intent, and proceeded per the "Hard rules"
  guidance to stop only when a command's output *contradicts* the brief's Expected — this
  doesn't contradict, it corroborates.
- **Mutation-check restores.** After each of the three mutation checks I diffed
  `src/server/env.ts` (tracked, unmodified before Task 4) via `git diff` and found no
  residual change after restoring; `src/server/test-support.ts` (untracked until the final
  commit) was restored by re-editing back to the Step 3 text and reconfirmed with a full
  15/15 green run before moving on, each time.
- **Route dynamic marking.** The Next.js build output logged `ƒ /api/test/[...path]`
  (dynamic, server-rendered on demand) as expected for a catch-all API route — no static
  optimization surprises.
- **`npm run test:api` "confusable 404" test.** The first test in
  `tests/api/test-support.spec.ts` (`the server under test has the test-support routes`)
  passed with status 400 both times, confirming the webServer really ran with
  `APP_ENV=test` and not a stray `next dev` process reusing port 3000.

## Concerns

None outstanding. All steps of the brief were followed, R4's overriding counts (15 unit
tests, 229/229 Vitest, 16 Playwright api) were met exactly, all three mutation checks
matched the brief's predicted failure counts and were restored cleanly, and the commit was
made exactly as Step 8 specifies with no `--no-verify` and no destructive git operations.
The only deviation from the brief's literal file text is the Prettier-driven line-wrap
normalization in `tests/api/test-support.spec.ts`, which is mechanical and required to pass
the `format:check` gate in Step 7.
