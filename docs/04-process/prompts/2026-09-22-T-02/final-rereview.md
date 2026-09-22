# Final fix wave — scoped re-review (feature-dev:code-reviewer, sonnet, read-only)

Range 7718a1e..232bbbc (six commits). Copied verbatim from the reviewer's hand-back by the controller.

### Finding Verdicts

- **Item 1 — no test pins "one transaction" (§2.1)** — ADDRESSED. `tests/api/reset.spec.ts:97-104` (diff hunk) adds the test verbatim as specified in the finding, importing `applyVariant` at line 6. Traced the actual insert order in `src/server/reset.ts:44-51`: truncate → `balance.create` → `transaction.createMany` → `budget.createMany` (fails here on the duplicate category) → `pot.createMany` → `resetLog.create`. `applyVariant(seedRows(), "empty-pots")` only empties `pots` (`src/server/variants.ts:39-41`, comment "delete pots, balance unchanged"), so `before` has non-empty budgets and empty pots. Without `$transaction`, the second call would truncate, re-insert balance/transactions identically (so those don't diverge), then fail on `budget.createMany` (category has `@unique` per `prisma/schema.prisma:87`, confirming the `P2002` code), leaving budgets empty and pots never reached (still empty, matching `before` by coincidence) — this is exactly the discriminator the red-run diff in the report shows (budgets 4→0, pots unchanged). The test is a correct, verified regression guard.
  Restore evidence: the committed hunk to `src/server/reset.ts` only touches the doc comment (diff lines 204-211) — `return db.$transaction(async (tx) => {` at diff line 218 is unchanged context, and the file as read now (lines 37-61) still has the `$transaction` wrapper with `{ maxWait: 10_000, timeout: 30_000 }`, confirming no leaked mutation from the red-run experiment.

- **Item 2 — one-worker rule only in the npm script** — ADDRESSED. `playwright.config.ts` diff adds `workers: 1, fullyParallel: false` to the `api` project object (diff lines 176-179) plus a header comment explaining where the rule lives (diff lines 149-153). `package.json:22` still carries `--workers=1` on `test:api`, so the finding's "keep it in the script too" clause holds. `npm run typecheck` is reported green in the final gates, and `playwright.config.ts` is TypeScript, so `workers` is confirmed a valid `TestProject` key (an unmatched key would be a type error). The report's "Running 17 tests using 1 worker" with no `--workers` flag is informative given Playwright's local default worker count is `cpus/2` and `fullyParallel: false` alone does not collapse separate files onto one worker — so the project-level `workers: 1` is what serialized it, as claimed. Confirmed `tests/e2e/` contains no references to `/api/test/` paths (grep, no matches), so this project-level serialization change doesn't leave a gap against the chromium/firefox/webkit projects sharing the server/database under a bare `npx playwright test`.

- **Item 4 — health checks over Unix socket** — ADDRESSED. `compose.yaml` (diff line 128→131) and `.github/workflows/ci.yml` (diff line 66→67) both changed to `pg_isready -h 127.0.0.1 -U postgres -d personal_finance`, matching the fix exactly, with an explanatory comment added in compose.yaml. Verified locally with `docker compose up -d --wait` (report shows Healthy, volume retained); the CI half is verified by inspection/parity only, which matches the finding's own required verify step (local compose only).

- **Item 5 — ResetLog.at comment names wrong source** — ADDRESSED. `src/server/reset.ts` comment (diff lines 204-211) reworded to the suggested text almost verbatim, keeping the ADR-0005 "no clock" point. Evidence is a query-log capture showing the INSERT explicitly names and binds `"at"` as `$2` with the same timestamp as `createdAt`/`updatedAt`, supporting "Prisma's runtime fills it from the process clock." No code changed, comment-only, as claimed.

- **Item 6 — .env.example still lists /api/test/log** — ADDRESSED. `.env.example` diff (lines 38-40) matches the suggested wording exactly; variable names unchanged, consistent with the `tests/unit/scaffold.test.ts` dependency noted in the finding.

- **Item 7 — other HTTP methods must show 404 outside test** — ADDRESSED. `app/api/test/[...path]/route.ts` diff adds `PUT`, `PATCH`, `DELETE`, `OPTIONS` exports (diff lines 98-112), each delegating to `handleTestSupport` with its own method string, same shape as `POST`/`GET`. `tests/unit/test-support.test.ts` diff replaces named imports with `import * as route`, asserts the exported-name set is exactly `["DELETE","GET","OPTIONS","PATCH","POST","PUT"]`, then calls every exported handler and asserts 404. Checked `src/server/test-support.ts:36-39`: `routes` contains only `POST reset` and `POST seed`, so `handleTestSupport` 404s on any method+path combination that doesn't match — this means the test would catch a handler that failed to answer 404 outside test (dropping an export fails the name-set assertion first; a handler answering non-404 fails the loop assertion). It does not by itself prove each handler passes its *own* method string rather than a hardcoded one, but that is confirmed by direct inspection of the route file (PUT→`"PUT"`, PATCH→`"PATCH"`, DELETE→`"DELETE"`, OPTIONS→`"OPTIONS"`, each a distinct literal). Verified further with a real production server + curl for OPTIONS/PUT/PATCH/DELETE, all 404.

### New Breakage in the Fix Diff

None. The new PUT/PATCH/DELETE/OPTIONS handlers cannot leak test-only behavior outside test env: `handleTestSupport` matches on method+path against a `routes` table that only has `POST reset`/`POST seed`, so any other method 404s in every environment including test. The advisory lock in item 1's new test is `pg_advisory_xact_lock`, which releases automatically on the transaction rollback the test induces, so no lock leak into subsequent tests.

### Out-of-Scope Observations

None.

### Verdict

**Fix round:** All findings addressed, no new Critical/Important breakage.

One non-blocking note carried forward from the implementer's own report: item 7's export-set assertion is intentionally brittle (a future non-handler export added to the route file would fail that assertion first) — already disclosed by the implementer as a deliberate "fail loudly" tradeoff, not a defect found in this review.
