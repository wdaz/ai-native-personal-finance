# Task 4 review — spec + quality (feature-dev:code-reviewer, sonnet, read-only)

Range 120ed4a..49dbec9. Copied verbatim from the reviewer's hand-back by the controller.

### Spec Compliance
- ✅ Spec compliant

Diff-verified against the brief's Files list (Task 4): all five "Create" files (`src/server/http.ts`, `src/server/test-support.ts`, `app/api/test/[...path]/route.ts`, `tests/unit/test-support.test.ts`, `tests/api/test-support.spec.ts`) and all three "Modify" files (`tests/api/README.md`, `app/api/README.md`, `tests/fixtures/README.md`) are present, and no other file is touched (DoD v1.1 "nothing outside the task is changed"). A line-by-line comparison of the diff against the brief's Step 2–5 code blocks shows the implementation is a verbatim transcription — the only deltas are Prettier line-wrap collapses in `tests/api/test-support.spec.ts` and `tests/unit/test-support.test.ts` (whitespace only, content identical).

Interfaces match exactly: `ApiErrorCode`/`errorResponse` (src/server/http.ts:65-76 in diff), `TestRoute`/`testSupportRoutes(env?: Env)`/`handleTestSupport(method, segments, request, env?)` (src/server/test-support.ts:96-144), and `POST`/`GET` from the catch-all route (app/api/test/[...path]/route.ts:47-53). `testSupportRoutes` is empty unless `APP_ENV=test` (test-support.ts:123-125), matching SPEC-reset-and-test-support §2.7 and D10. `POST /api/test/reset` → `resetToSeed(db, "test")` → `{ at }`; `POST /api/test/seed { variant }` → 400 on missing/unknown/non-JSON variant (validated before `getDb()` is ever reached, which mutation check 3 in the report empirically demonstrates via the observed `DATABASE_URL is not set` stack trace) → `{ at, variant }` on success. Error envelope matches SPEC-auth §2.10's `{ error, message }` shape (http.ts:74-75).

Independently derivable from the diff (not just report-trusted): the unit-test file's 400-message assertion pins `SEED_VARIANTS` at 6 entries (`seed, empty-pots, empty-budgets, few-transactions, no-recurring, empty-all` — tests/unit/test-support.test.ts:322), so `test-support.spec.ts`'s variant loop is 6 tests, plus 1 control + 1 US-36 + 1 unknown-variant = 9; combined with reset.spec.ts (4) and schema.spec.ts (3) from prior tasks, that's 16 — matching R4. Likewise the unit file's 15 `it`/`it.each` cases (6+1+3+1+1+3) are visible directly in the diff; with R4's T3 baseline of 214, 214+15=229, matching R4 over the brief's stale 226. The mutation-2 claim (edited `src/server/env.ts`, restored) is corroborated by the diff's changed-file list containing no `src/server/env.ts` entry.

GET /api/test/log is correctly absent from the `routes` table (test-support.ts:118-121) — matches owner answer 5 / global constraint that this is T-12's. NFR-T2: "US-36" appears in the reset test's title (tests/api/test-support.spec.ts:198). ADR-0002: the route handler is thin, reaching Prisma only via `getDb()`/`resetToSeed` from `src/server` (no direct Prisma import in `app/`). ADR-0003: side effects asserted through the DB (`storedRows`, `db.resetLog.findMany()`, `db.loginAttempt.count()`) rather than via response bodies alone.

Confirmed Next.js 16.3.5 is in use (package.json:33), so the `{ params: Promise<{ path: string[] }> }` async-params signature in the route file is the correct App Router contract for this version, not a mismatch.

⚠️ Cannot verify from diff (report-only, as instructed not to re-run): the RED-step failure output, all three mutation-check pass/fail counts, and the final gate results (lint, format:check, typecheck, 229/229 Vitest, 16/16 Playwright). Also outside the diff's scope: the correctness of `isTestEnv`, `getDb`, `resetToSeed`, `seedRows`, `applyVariant`, `isSeedVariant`, `storedRows`, `insertedRows` themselves — these landed in Tasks 1–3 and are assumed reviewed there; this task only wires them.

### Strengths
- Exact interface match to the brief's "Produces" list, including optional-`env` semantics implemented via default parameters (`env: Env = process.env`).
- The 400 validation guard in `seed()` runs before `getDb()` is called — proven, not just asserted, by mutation check 3's observed 500/DB-connection-error when the guard is disabled.
- The "confusable 404" control test (tests/api/test-support.spec.ts:191-196) carries a diagnostic assertion message for the known `next dev`-reusing-port-3000 failure mode (D14), which will save real debugging time.
- Clean scope discipline: exactly the brief's 8 files touched, no drive-by changes.
- READMEs updated precisely as specified and consistent with the actual repo layout (`tests/fixtures/boundaries/` and `database.ts` verified to exist).

### Issues
#### Critical (Must Fix)
None.

#### Important (Should Fix)
None.

#### Minor (Nice to Have)
- `POST /api/test/seed` with a genuinely absent body (no `data` at all, not even `{}`) takes the same code path as "not json" (`request.json()` rejects → caught → `null` → 400) and is correct by construction, but has no dedicated test. This is brief-prescribed scope (the brief specifies exactly three 400 cases: unknown variant, missing variant, non-JSON body) — not a defect, just worth noting for a future task if ever revisited.

Two items worth naming so a later reviewer doesn't re-raise them as findings: the exported `GET` handler in the route file can currently only ever 404 (no GET route is registered) — this is brief-mandated scaffolding for T-12's future `GET /api/test/log`, not scope creep. And `ApiErrorCode` includes codes (`invalid_credentials`, `rate_limited`, `unauthenticated`, `conflict`) unused by this task — deliberate per D11, reserved for T-05/T-08's shared envelope.

### Assessment
**Task quality:** Approved
**Reasoning:** The implementation is a faithful, verifiable transcription of the pre-approved brief; every binding constraint (SPEC-reset-and-test-support §2.7, SPEC-auth §2.10, ADR-0002, ADR-0003, NFR-T2, owner answer 5, and controller ruling R4's 229/16 counts) is satisfied and cross-checked against the diff itself where possible, with no Critical or Important findings.
