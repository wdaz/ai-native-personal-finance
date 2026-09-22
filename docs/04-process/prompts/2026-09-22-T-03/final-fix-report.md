# T-03 final fix wave — report

Working directory: `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/T-03-domain`
(worktree, branch `task/T-03-domain`). Head before this wave: `412cb4c`.

Source of requirements: `final-fix-findings.md` (this folder), with background from
`final-review.md` section "Minor — fix before merge" (M1–M6) and rulings R13–R15 in
`progress.md`. Six items, two commits, as specified.

## Pre-work checks

- `grep -n "avatarKey\|themeFromHex\|CATEGORY_BY_NAME" src/server/seed.ts` — confirmed all
  three names exist there (`avatarKey` :105, `themeFromHex` :68, `CATEGORY_BY_NAME` :80), so
  M1's clause names real identifiers, all defined in `src/server/seed.ts`.
- `grep -rn "shared/README" tests/` — no output, exit code 1 (no match). Confirms M4: no
  fixture imports `src/shared/README.md`.
- `git diff docs/03-specs/backlog.md` was captured to `/tmp/backlog.diff` before staging, so
  the literal output could be shown even after the commit (the bare command prints nothing
  once the file is staged/committed).
- Baseline `npx prettier --check` on all three target files, before any edit: **passed**
  ("All matched files use Prettier code style!").

## Commit A — `docs/03-specs/backlog.md` (5 line-level edits)

### 1. M2 — T-09 row's `BigInt` instruction (was line 18)

**Before** (the clause inside T-02's part):
> `**from T-02:** creation order is `seq`; `BigInt` money becomes `Number` at the DTO edge; add overview-shape assertions per seed variant;`

**After:**
> `**from T-02:** creation order is `seq`; `BigInt` money becomes `Number` at the repository edge, before `overviewSummary`; add overview-shape assertions per seed variant;`

**Before** (T-03's clause, end of row):
> `**from T-03:** hand repository rows to `overviewSummary` — `BigInt` converted to `Number` first (`sumCents` refuses anything else), `seq` selected, `id`/`theme`/`avatar` passed through, `fixedClock(BUSINESS_TODAY)` as the clock`

**After** (appended verbatim per the findings file, then M1's `seedFigures()` clause appended
after it — both inside the same "**from T-03:**" text, per the order the findings file lists
them):
> `**from T-03:** hand repository rows to `overviewSummary` — `BigInt` converted to `Number` first (`sumCents` refuses anything else), `seq` selected, `id`/`theme`/`avatar` passed through, `fixedClock(BUSINESS_TODAY)` as the clock; DTO dates via `toISOString()`; transactions and budgets must use the same category spelling — `budgetSpent` compares categories with `===`, and a mismatch shows only as $0 spent; `seedFigures()` rows keep data.json's avatar path, hex theme and display category name — map them (`avatarKey`, `themeFromHex`, `CATEGORY_BY_NAME` in `src/server/seed.ts`) or compare money, names and order only`

### 2. M1 (backlog half) — `seedFigures()` row shape, T-09 and T-10 rows

T-09's append is the same clause shown above (folded into the same edit as M2, since both
land in T-09's "from T-03:" text).

**T-10 row — before:**
> `**from T-03:** seed figures in E2E come from `seedFigures()` in `scripts/seed-figures.ts`, text through the `src/shared` formatters`

**T-10 row — after:**
> `**from T-03:** seed figures in E2E come from `seedFigures()` in `scripts/seed-figures.ts`, text through the `src/shared` formatters; `seedFigures()` rows keep data.json's avatar path, hex theme and display category name — map them (`avatarKey`, `themeFromHex`, `CATEGORY_BY_NAME` in `src/server/seed.ts`) or compare money, names and order only`

Per ruling R14, nothing was added to the T-04 row for this item.

### 3. M4 — T-04 row (was line 13)

**Before:**
> `... `test-ids.ts`, (`money.ts` + `dates.ts` arrived in T-03); repoint the boundary fixtures that import `src/shared/README.md` at the real shared modules | NFR-Q2, ...`

**After:**
> `... `test-ids.ts`, (`money.ts` + `dates.ts` arrived in T-03) | NFR-Q2, ...`

Dropped the clause "repoint the boundary fixtures that import `src/shared/README.md` at the
real shared modules" together with its leading "; ". Note: `final-fix-findings.md` item 3
quotes this clause short, as "repoint the boundary fixtures that import
`src/shared/README.md`" (without "at the real shared modules"); the actual row cell reads
that clause through "at the real shared modules", so all of it was dropped — leaving "at the
real shared modules" in would have left the cell ending "...arrived in T-03) at the real
shared modules", a dangling fragment with no clause to attach to.

### 4. M5 — T-13 row (was line 22)

**Before:** `... prints parse errors on every run; ...`
**After:** `... prints parse errors on every coverage run; ...`

### 5. M3 — changelog (line 4, v1.8 entry)

**Before:**
> `Every hand-off the T-03 plan addresses to a later task sits in that task's row, as in v1.7: T-05 separates system time from the business `Clock` (F3); T-13 narrows the coverage globs (F2).`

**After:**
> `The T-03 hand-offs for T-05, T-08, T-09, T-10 and T-13 sit in those rows, as in v1.7: T-05 separates system time from the business `Clock` (F3); T-13 narrows the coverage globs (F2); T-09's `BigInt` conversion moves to the repository edge.`

Added the one permitted short clause naming what M2 changed, per the findings file's
"optional" allowance.

### `git diff docs/03-specs/backlog.md` (literal command output, captured to `/tmp/backlog.diff` before staging)

Verified identical to the committed diff:
`git diff 412cb4c 2677be0 -- docs/03-specs/backlog.md | cmp - /tmp/backlog.diff && echo identical`
→ `identical`.

```diff
diff --git a/docs/03-specs/backlog.md b/docs/03-specs/backlog.md
index 7a09906..936de29 100644
--- a/docs/03-specs/backlog.md
+++ b/docs/03-specs/backlog.md
@@ -1,7 +1,7 @@
 # Backlog — Release 1 (vertical slice: Auth + Overview)
 
 Status: **Approved** (v1.8 — 2026-09-22: T-03 takes the §4.2 formatters and the ADR-0005 rule fix, T-04 narrowed, T-03 hand-offs written into T-05/T-08/T-09/T-10/T-13, owner decisions at the T-03 plan gate; v1.7 — 2026-09-22: T-02 hand-offs written into T-05/T-06/T-08/T-09/T-13/T-14 rows; v1.6 — 2026-09-22: T-02/T-05/T-12 test-support and CI scope, T-13 overrides removal, owner decisions at the T-02 plan gate; v1.5 — 2026-09-22: T-13 permissions + message-scan evaluation, T-16 ignore-allow + guard-file ownership (T-02a hand-off); v1.4 — 2026-09-22: T-13 `master` trigger removed in T-02a, T-16 scan wording — owner decisions at the T-02a plan gate; v1.3 — 2026-09-20: T-16 licence steps; v1.2 — 2026-09-20: fixture repointing in T-02/T-03/T-04, CI concurrency in T-13; v1.1 T-02a/T-16; v1.0 approved 2026-09-20) · Author(s): Agent · Date: 2026-09-20
-Changelog: v1.8 (2026-09-22, owner decisions at the T-03 plan gate) — T-03 also writes `src/shared/money.ts` and `src/shared/dates.ts` (the SPEC-overview §4.2 formatters), because `scripts/seed-figures.ts` prints §4.3 with them and T-03 runs first; T-04's scope narrows to the schemas, enums, copy and test ids. T-03 moves `toCents` and `shiftYears` from `src/server/seed.ts` into `src/domain` (ADR-0002 lets scripts import domain, not server), and narrows the ADR-0005 lint rule to the calls that read the wall clock (`new Date()` without arguments, `Date()`, `Date.now()`) so that `fixedClock` can build its date. Every hand-off the T-03 plan addresses to a later task sits in that task's row, as in v1.7: T-05 separates system time from the business `Clock` (F3); T-13 narrows the coverage globs (F2). v1.6 (2026-09-22, owner decisions at the T-02 plan gate) — `GET /api/test/log` moves from T-02 to T-12, which writes the entries it returns; the CI API job (Postgres service) moves from T-05 to T-02, where the first database code lands, and T-05's API tests join it; T-13 drops the `package.json` overrides T-02 adds for the Prisma CLI's `deepmerge-ts` and `mysql2` once Prisma ships fixed versions. v1.4 (2026-09-22, owner decisions at the T-02a plan gate) — T-02a removes the stale `master` entry from the CI push trigger (the default branch is `main`), and T-13 keeps the rest of its CI work; T-16's "full-history secret scan as a blocking gate" now names the T-02a `secret scan` check and `npm run secrets:scan`, because a bare `gitleaks git` skips merge commits (43 of 49 commits on 2026-09-22). v1.2 (2026-09-20) — the 21 boundary fixtures import layer README stubs because `src/server`, `src/domain`, `src/shared` are empty; the task that fills each layer repoints its fixtures (was recorded only in `tests/fixtures/boundaries/README.md`); T-13 splits the CI concurrency group so `main` runs are never cancelled. v1.1 (2026-09-20) — new **T-02a secret guard** placed *before* T-02 because the first real `DATABASE_URL` lands in T-02 (proposed by the T-01 agent as part of T-02; split out by the owner to keep tasks one-session sized); new **T-16** hardens the repository before it is made public. v0.3 (2026-09-20) — T-05 deletes the T-01 placeholder page; T-13 install-script policy and `main`-only CI (T-01 hand-off). v0.2 — S-04/S-05 test-support and reset moved early; S-06 traceability scoped per release; S-07 CI from T-01; S-34 T-03/T-07 split; US-35 in R1.
+Changelog: v1.8 (2026-09-22, owner decisions at the T-03 plan gate) — T-03 also writes `src/shared/money.ts` and `src/shared/dates.ts` (the SPEC-overview §4.2 formatters), because `scripts/seed-figures.ts` prints §4.3 with them and T-03 runs first; T-04's scope narrows to the schemas, enums, copy and test ids. T-03 moves `toCents` and `shiftYears` from `src/server/seed.ts` into `src/domain` (ADR-0002 lets scripts import domain, not server), and narrows the ADR-0005 lint rule to the calls that read the wall clock (`new Date()` without arguments, `Date()`, `Date.now()`) so that `fixedClock` can build its date. The T-03 hand-offs for T-05, T-08, T-09, T-10 and T-13 sit in those rows, as in v1.7: T-05 separates system time from the business `Clock` (F3); T-13 narrows the coverage globs (F2); T-09's `BigInt` conversion moves to the repository edge. v1.6 (2026-09-22, owner decisions at the T-02 plan gate) — `GET /api/test/log` moves from T-02 to T-12, which writes the entries it returns; the CI API job (Postgres service) moves from T-05 to T-02, where the first database code lands, and T-05's API tests join it; T-13 drops the `package.json` overrides T-02 adds for the Prisma CLI's `deepmerge-ts` and `mysql2` once Prisma ships fixed versions. v1.4 (2026-09-22, owner decisions at the T-02a plan gate) — T-02a removes the stale `master` entry from the CI push trigger (the default branch is `main`), and T-13 keeps the rest of its CI work; T-16's "full-history secret scan as a blocking gate" now names the T-02a `secret scan` check and `npm run secrets:scan`, because a bare `gitleaks git` skips merge commits (43 of 49 commits on 2026-09-22). v1.2 (2026-09-20) — the 21 boundary fixtures import layer README stubs because `src/server`, `src/domain`, `src/shared` are empty; the task that fills each layer repoints its fixtures (was recorded only in `tests/fixtures/boundaries/README.md`); T-13 splits the CI concurrency group so `main` runs are never cancelled. v1.1 (2026-09-20) — new **T-02a secret guard** placed *before* T-02 because the first real `DATABASE_URL` lands in T-02 (proposed by the T-01 agent as part of T-02; split out by the owner to keep tasks one-session sized); new **T-16** hardens the repository before it is made public. v0.3 (2026-09-20) — T-05 deletes the T-01 placeholder page; T-13 install-script policy and `main`-only CI (T-01 hand-off). v0.2 — S-04/S-05 test-support and reset moved early; S-06 traceability scoped per release; S-07 CI from T-01; S-34 T-03/T-07 split; US-35 in R1.
 Order is the intended execution order; each task is sized for one agent session and ends with the Definition of Done.
 
 | Id | Task | Spec / ADR | Stories | Depends on |
@@ -10,16 +10,16 @@ Order is the intended execution order; each task is sized for one agent session
 | T-02a | **Secret guard** — the first real `DATABASE_URL` lands in T-02, so the guard exists before it: `.gitleaks.toml` extending the default rules with the `postgres_connection_string` case they miss, `.next/` and `docs/00-discovery/inputs/` allowlisted; pre-commit hook; CI `secret scan` job (`fetch-depth: 0`, fails on exit code; SARIF upload needs GitHub Code Security and is unavailable while the repo is private); `npm audit --audit-level=high` in CI; a fixture that proves the scan fires (DoD v1.1) | NFR-S5, ADR-0007 | NFR-S5 | T-01 |
 | T-02 | Prisma schema + migrations; `prisma/data.json` copy with checksum test; `resetToSeed` (+2 y, cents, enums, avatar keys, `ResetLog`, advisory lock); `npm run db:reset`; Docker compose for local Postgres; **test-support routes** `/api/test/reset|seed` gated by `APP_ENV=test` with the absence unit test; **repoint the ADR-0002 boundary fixtures** that currently import `src/server/README.md` at the real modules this task adds (`tests/fixtures/boundaries/README.md`); **CI API job** (Postgres service, `API tests (Postgres)`) | SPEC-reset-and-test-support §2.1, 2.5, 2.7; ADR-0005 | US-36 | T-01, T-02a |
 | T-03 | `src/domain` for R1: `Clock`, money helpers, `budgetSpent`, `latestTransactions`, `recurringBills` summary, `overviewSummary`; `scripts/seed-figures.ts` that prints SPEC-overview §4.3 from `data.json`; unit tests assert the generated figures (values **and order**); repoint the boundary fixtures that import `src/domain/README.md` at the real domain modules; **the SPEC-overview §4.2 formatters** `src/shared/money.ts` + `dates.ts` with their tests (from T-04); `toCents`/`shiftYears` move from `src/server/seed.ts` into `src/domain`; the ADR-0005 lint rule catches `Date()` and allows `new Date(<value>)`, with fixtures | SPEC-overview §4.2, §4.3, data-model; ADR-0005 | US-04…08 (logic) | T-01 |
-| T-04 | `src/shared`: Zod schemas (auth, `OverviewDto`, `ErrorEnvelope`, meta), enums, `copy.ts` (appendix incl. R1 additions), `test-ids.ts`, (`money.ts` + `dates.ts` arrived in T-03); repoint the boundary fixtures that import `src/shared/README.md` at the real shared modules | NFR-Q2, SPEC-auth §2.10, SPEC-overview §6 | US-31 | T-01 |
+| T-04 | `src/shared`: Zod schemas (auth, `OverviewDto`, `ErrorEnvelope`, meta), enums, `copy.ts` (appendix incl. R1 additions), `test-ids.ts`, (`money.ts` + `dates.ts` arrived in T-03) | NFR-Q2, SPEC-auth §2.10, SPEC-overview §6 | US-31 | T-01 |
 | T-05 | Auth API: login/logout/signup/session routes, iron-session with `resetEpoch`, sliding re-issue, rate limit (`LoginAttempt`), middleware (route matrix, redirects, `no-store`), security headers, `X-Request-Id`; API tests; its API tests join the CI API job (T-02); **delete the temporary `app/page.tsx` from T-01** once middleware owns `/` (owner decision 2026-09-20); **from T-02:** index `LoginAttempt (ip, at)`; keep `/api/test/*` outside the session check and the rate limit; **from T-03:** keep **system time** (the session's sliding re-issue, the rate limit's window) apart from the **business `Clock`** (`src/domain/clock.ts`, fixed at 2026-08-19) — the plan names both, and injects system time into `src/server`, where the ADR-0005 rule forbids `new Date()`, `Date()` and `Date.now()`, rather than reading it there | SPEC-auth §2.4, 2.8–2.10, §4, §6; ADR-0006 | US-01…03 | T-02, T-04 |
 | T-06 | Auth UI: `(auth)` layout, `LoginForm`, `SignupForm`, `Field`, `PasswordField`, `Button`, demo box, reset notice; E2E for US-01/02/03 + keyboard + axe; **CI E2E job** (Chromium first); **from T-02:** seeding E2E tests share one database — run with one worker or one database per worker (decide in the Playwright config) | SPEC-auth §2–3, §6 UI | US-01…03, US-31/32 | T-05 |
 | T-07 | App shell part 1: `(app)` layout with `getMeta` and OT meta tag slot, sidebar (expanded/collapsed, US-35), bottom nav, page header, skip link, logout button; placeholder pages for the four R2 routes ("Coming in Release 2"); E2E for US-33/35 + US-32/34 rows + axe | SPEC-app-shell §2.1–2.5, 2.7–2.8 | US-33, US-35, US-32, US-34 | T-05 |
 | T-08 | App shell part 2: `getMeta` + `GET /api/meta`, reset banner with dismiss, `/api/admin/reset` route + Vercel cron config + threshold module (wired, not triggered in R1), session-ends-on-reset check; API tests; E2E for US-37 AC2; **from T-02:** implement `latestReset`/`checkThreshold`; `ResetLog.at` is the app process's clock (Prisma runtime, not a column default); decide whether the threshold counts `ResetLog`/`LoginAttempt` rows; **from T-03:** the banner writes `formatDate(lastResetAt)` — three-letter months | SPEC-app-shell §2.6, §5; SPEC-reset-and-test-support §2.2–2.6 | US-37 AC1/AC2, US-03 AC3 | T-07 |
-| T-09 | Overview server + API: `getOverview`, `GET /api/overview`, DTO schema; API tests incl. 401, `no-store`, seed-variant shapes; **from T-02:** creation order is `seq`; `BigInt` money becomes `Number` at the DTO edge; add overview-shape assertions per seed variant; **from T-03:** hand repository rows to `overviewSummary` — `BigInt` converted to `Number` first (`sumCents` refuses anything else), `seq` selected, `id`/`theme`/`avatar` passed through, `fixedClock(BUSINESS_TODAY)` as the clock | SPEC-overview §6 | US-04…08 | T-03, T-04, T-05 |
-| T-10 | Overview UI: stat cards, pots/transactions/budgets(donut)/bills cards, empty and error states; E2E for US-04 AC1, US-05…08 (incl. seed variants), US-32/34 rows; axe; **from T-03:** seed figures in E2E come from `seedFigures()` in `scripts/seed-figures.ts`, text through the `src/shared` formatters | SPEC-overview §2–4 | US-04…08, US-32, US-34 | T-07, T-09 |
+| T-09 | Overview server + API: `getOverview`, `GET /api/overview`, DTO schema; API tests incl. 401, `no-store`, seed-variant shapes; **from T-02:** creation order is `seq`; `BigInt` money becomes `Number` at the repository edge, before `overviewSummary`; add overview-shape assertions per seed variant; **from T-03:** hand repository rows to `overviewSummary` — `BigInt` converted to `Number` first (`sumCents` refuses anything else), `seq` selected, `id`/`theme`/`avatar` passed through, `fixedClock(BUSINESS_TODAY)` as the clock; DTO dates via `toISOString()`; transactions and budgets must use the same category spelling — `budgetSpent` compares categories with `===`, and a mismatch shows only as $0 spent; `seedFigures()` rows keep data.json's avatar path, hex theme and display category name — map them (`avatarKey`, `themeFromHex`, `CATEGORY_BY_NAME` in `src/server/seed.ts`) or compare money, names and order only | SPEC-overview §6 | US-04…08 | T-03, T-04, T-05 |
+| T-10 | Overview UI: stat cards, pots/transactions/budgets(donut)/bills cards, empty and error states; E2E for US-04 AC1, US-05…08 (incl. seed variants), US-32/34 rows; axe; **from T-03:** seed figures in E2E come from `seedFigures()` in `scripts/seed-figures.ts`, text through the `src/shared` formatters; `seedFigures()` rows keep data.json's avatar path, hex theme and display category name — map them (`avatarKey`, `themeFromHex`, `CATEGORY_BY_NAME` in `src/server/seed.ts`) or compare money, names and order only | SPEC-overview §2–4 | US-04…08, US-32, US-34 | T-07, T-09 |
 | T-11 | WebMCP adapter: `adapter.ts` (modes, generation counter, readiness, `toolchange`), `defineTool`, `WebMcpProvider` + `WebMcpTools`, `AgentToolsStatus` with the four states, lazy loading, test hook; unit tests | SPEC-webmcp-tools §2, §6, §7 Unit; ADR-0004 | US-38, US-41 | T-07 |
 | T-12 | R1 tools `get_balance`, `get_overview_summary`; via-marker logging + `/api/test/log` (moved from T-02); E2E in polyfill and off modes (`WEBMCP_MODE` matrix in CI); headed native runbook page | SPEC-webmcp-tools §3, §7, §2.8 | US-38, US-39, US-41 | T-10, T-11 |
-| T-13 | CI hardening: Firefox + WebKit E2E, axe gate, coverage gate 90 % on `domain`, traceability script scoped to the release's story list (`docs/03-specs/release-1-stories.txt`, generated from PRD §5), PR template with the DoD checklist; **install-script policy**: evaluate `strict-allow-scripts=true` in `.npmrc` after checking the Linux native-binding set (T-01 hand-off, owner decision 2026-09-20); CI triggers on `main` only (the `master` push trigger was removed in T-02a, owner decision 2026-09-22); split the CI `concurrency` group so pushes to `main` never cancel an in-progress run — a follow-up merge currently discards the previous commit's verdict (PR #4); workflow `permissions: contents: read`; evaluate a commit/tag-message secret-scan pass (prototype from T-02a) **with its own failing fixture** before adopting; **drop the `deepmerge-ts`/`mysql2` `overrides`** (and their `"//"` note) from `package.json` once Prisma ships fixed versions — `npm audit --audit-level=high` must stay at 0 (T-02, owner decision 2026-09-22); **from T-02:** schema-vs-migrations drift check in CI; **from T-03:** narrow `vitest.config.ts`'s `coverage.include` to `**/*.ts` — it matches the layers' `README.md` files and prints parse errors on every run; `src/domain` measured 100 % at T-03 | ADR-0003/0007, DoD | NFR-T | T-06…T-12 |
+| T-13 | CI hardening: Firefox + WebKit E2E, axe gate, coverage gate 90 % on `domain`, traceability script scoped to the release's story list (`docs/03-specs/release-1-stories.txt`, generated from PRD §5), PR template with the DoD checklist; **install-script policy**: evaluate `strict-allow-scripts=true` in `.npmrc` after checking the Linux native-binding set (T-01 hand-off, owner decision 2026-09-20); CI triggers on `main` only (the `master` push trigger was removed in T-02a, owner decision 2026-09-22); split the CI `concurrency` group so pushes to `main` never cancel an in-progress run — a follow-up merge currently discards the previous commit's verdict (PR #4); workflow `permissions: contents: read`; evaluate a commit/tag-message secret-scan pass (prototype from T-02a) **with its own failing fixture** before adopting; **drop the `deepmerge-ts`/`mysql2` `overrides`** (and their `"//"` note) from `package.json` once Prisma ships fixed versions — `npm audit --audit-level=high` must stay at 0 (T-02, owner decision 2026-09-22); **from T-02:** schema-vs-migrations drift check in CI; **from T-03:** narrow `vitest.config.ts`'s `coverage.include` to `**/*.ts` — it matches the layers' `README.md` files and prints parse errors on every coverage run; `src/domain` measured 100 % at T-03 | ADR-0003/0007, DoD | NFR-T | T-06…T-12 |
 | T-14 | Deploy: Vercel project, Neon main + preview-branch workflow, env vars, first `resetToSeed`, cron verified, Lighthouse CI on a warm instance, `docs/04-process/runbooks/deploy.md` (OT token, native check, relay demo, secret rotation); **from T-02:** startup guard so `APP_ENV=test` can never run in production; check whether `prisma migrate deploy` needs Neon's direct (non-pooled) URL; guard `test:api`/`db:reset` against a non-local `DATABASE_URL` | ADR-0007 | NFR-D4/D5, P1 | T-13 |
 | T-15 | Release 1 retrospective entry: what the specs missed, what agents got wrong, template/AGENTS.md changes; Release 2 spec work opened | roadmap Phase 5 exit | S4 | T-14 |
 
```

`git diff -U0 docs/03-specs/backlog.md | grep '^@@'` (run before staging) gave:
```
@@ -4 +4 @@ Status: **Approved** (v1.8 — 2026-09-22: T-03 takes the §4.2 formatters and t
@@ -13 +13 @@ Order is the intended execution order; each task is sized for one agent session
@@ -18,2 +18,2 @@ Order is the intended execution order; each task is sized for one agent session
@@ -22 +22 @@ Order is the intended execution order; each task is sized for one agent session
```
Four hunks covering five line-level edits (the T-09 and T-10 row edits, lines 18–19, merged
into one two-line hunk because they are adjacent). No other line in the file changed.

## Commit B — `scripts/seed-figures.ts` and `tests/unit/seed-figures.test.ts`

### 6. M1 (code half) — JSDoc of `seedOverviewInput`

**Before** (`scripts/seed-figures.ts:15-18`):
```
 * ADR-0002 lets scripts import only `src/domain` and `src/shared`, so the rows are built
 * here with the domain's own conversions (+2 years, cents) rather than with
 * `src/server/seed.ts`; tests/unit/seed-figures.test.ts checks the two agree. Budgets and
 * pots get `seq` in file order, as the database assigns it on reset (T-02).
```

**After:**
```
 * ADR-0002 lets scripts import only `src/domain` and `src/shared`, so the rows are built
 * here with the domain's own conversions (+2 years, cents) rather than with
 * `src/server/seed.ts`; tests/unit/seed-figures.test.ts checks that names, money, dates,
 * categories (mapped) and recurring flags agree with `src/server/seed.ts`; the rows keep
 * data.json's avatar path, hex theme and display category name, where the database stores
 * the avatar key and the `Theme`/`Category` enums. Budgets and pots get `seq` in file order,
 * as the database assigns it on reset (T-02).
```
Only the "checks the two agree" sentence changed in substance (replaced with the true,
specific claim); the surrounding sentences are unchanged text, rewrapped to fit the new
sentence.

### 7. M6 — two test titles + one added assertion (`tests/unit/seed-figures.test.ts`)

**Title 1 — before:** `"has the same budgets and pots, with seq in the order the database assigns it"`
**Title 1 — after:** `"has the same budgets and pots, with seq 1…n in file order"`
No assertion change.

**Title 2 — before:** `"computes the Overview on the business day, 19 Aug 2026"`
**Title 2 — after:** `"computes the Overview on the business day, 19 Aug 2026 — another day gives other bills"`

**Added assertion** (kept the two existing assertions, added a third per ruling R15):
```ts
expect(overviewSummary(seedOverviewInput(), fixedClock("2026-09-19")).bills).not.toEqual(
  figures.bills,
);
```
Added imports: `import { fixedClock } from "@/src/domain/clock";` and
`import { overviewSummary } from "@/src/domain/overview";`.

### `git diff` for commit B (captured before staging, matches the committed diff exactly)

```diff
diff --git a/scripts/seed-figures.ts b/scripts/seed-figures.ts
index e089595..6df5169 100644
--- a/scripts/seed-figures.ts
+++ b/scripts/seed-figures.ts
@@ -14,8 +14,11 @@ import { formatMoney, formatSignedMoney } from "@/src/shared/money";
  *
  * ADR-0002 lets scripts import only `src/domain` and `src/shared`, so the rows are built
  * here with the domain's own conversions (+2 years, cents) rather than with
- * `src/server/seed.ts`; tests/unit/seed-figures.test.ts checks the two agree. Budgets and
- * pots get `seq` in file order, as the database assigns it on reset (T-02).
+ * `src/server/seed.ts`; tests/unit/seed-figures.test.ts checks that names, money, dates,
+ * categories (mapped) and recurring flags agree with `src/server/seed.ts`; the rows keep
+ * data.json's avatar path, hex theme and display category name, where the database stores
+ * the avatar key and the `Theme`/`Category` enums. Budgets and pots get `seq` in file order,
+ * as the database assigns it on reset (T-02).
  */
 export function seedOverviewInput() {
   return {
diff --git a/tests/unit/seed-figures.test.ts b/tests/unit/seed-figures.test.ts
index 36c1ee9..5bea54e 100644
--- a/tests/unit/seed-figures.test.ts
+++ b/tests/unit/seed-figures.test.ts
@@ -8,6 +8,8 @@ import {
   seedOverviewInput,
   workedExample,
 } from "@/scripts/seed-figures";
+import { fixedClock } from "@/src/domain/clock";
+import { overviewSummary } from "@/src/domain/overview";
 import { CATEGORY_BY_NAME, seedRows } from "@/src/server/seed";
 
 const repoRoot = join(import.meta.dirname, "..", "..");
@@ -93,7 +95,7 @@ describe("scripts/seed-figures.ts reads the seed as src/server/seed.ts does (T-0
     );
   });
 
-  it("has the same budgets and pots, with seq in the order the database assigns it", () => {
+  it("has the same budgets and pots, with seq 1…n in file order", () => {
     expect(input.budgets.map((b) => [CATEGORY_BY_NAME.get(b.category), b.maximum])).toEqual(
       rows.budgets.map((b) => [b.category, b.maximum]),
     );
@@ -106,9 +108,12 @@ describe("scripts/seed-figures.ts reads the seed as src/server/seed.ts does (T-0
     ]);
   });
 
-  it("computes the Overview on the business day, 19 Aug 2026", () => {
+  it("computes the Overview on the business day, 19 Aug 2026 — another day gives other bills", () => {
     const figures = seedFigures();
     expect(figures.transactions).toHaveLength(5);
     expect(figures.pots.items.map((p) => p.seq)).toEqual([1, 2, 3, 4]);
+    expect(overviewSummary(seedOverviewInput(), fixedClock("2026-09-19")).bills).not.toEqual(
+      figures.bills,
+    );
   });
 });
```

## Gates (run in order, literal output)

### Prettier — before any edit (baseline)
```
$ npx prettier --check docs/03-specs/backlog.md scripts/seed-figures.ts tests/unit/seed-figures.test.ts
Checking formatting...
All matched files use Prettier code style!
```

### Prettier — after backlog.md edits, before touching the other two files
```
$ npx prettier --check docs/03-specs/backlog.md scripts/seed-figures.ts tests/unit/seed-figures.test.ts
Checking formatting...
All matched files use Prettier code style!
```

### Prettier — after the seed-figures.ts and seed-figures.test.ts edits
```
$ npx prettier --check scripts/seed-figures.ts tests/unit/seed-figures.test.ts
Checking formatting...
[warn] tests/unit/seed-figures.test.ts
[warn] Code style issues found in the above file. Run Prettier with --write to fix.
```
Applied `--write` to `tests/unit/seed-figures.test.ts` only (the added-assertion lines needed
re-wrapping); re-checked per the implementer rules' Prettier note:
```
$ npx prettier --write tests/unit/seed-figures.test.ts
tests/unit/seed-figures.test.ts 29ms
$ npx prettier --check docs/03-specs/backlog.md scripts/seed-figures.ts tests/unit/seed-figures.test.ts
Checking formatting...
All matched files use Prettier code style!
```

### Lint (exit code captured explicitly, not through `tail`)
```
$ npm run lint > /tmp/lint.log 2>&1; echo "exit=$?"; cat /tmp/lint.log
exit=0

> ai-native-personal-finance@0.1.0 lint
> eslint . --max-warnings 0
```

### Typecheck (exit code captured explicitly, not through `tail`)
```
$ npm run typecheck > /tmp/tc.log 2>&1; echo "exit=$?"; cat /tmp/tc.log
exit=0

> ai-native-personal-finance@0.1.0 typecheck
> tsc --noEmit
```

### RED — the new assertion, forced to fail

Temporarily changed `fixedClock("2026-09-19")` to `fixedClock("2026-08-19")` in
`tests/unit/seed-figures.test.ts` (same date the seed's own `seedFigures()` uses via
`BUSINESS_TODAY`), then ran:
```
$ npx vitest run tests/unit/seed-figures.test.ts
 ❯ tests/unit/seed-figures.test.ts (8 tests | 1 failed) 220ms
   ❯ scripts/seed-figures.ts reads the seed as src/server/seed.ts does (T-02) (3)
     × computes the Overview on the business day, 19 Aug 2026 — another day gives other bills 2ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

FAIL tests/unit/seed-figures.test.ts > scripts/seed-figures.ts reads the seed as src/server/seed.ts does (T-02) > computes the Overview on the business day, 19 Aug 2026 — another day gives other bills
AssertionError: expected { paid: 19000, upcoming: 19498, …(1) } to not deeply equal { paid: 19000, upcoming: 19498, …(1) }

Compared values have no visual difference.

 ❯ tests/unit/seed-figures.test.ts:115:86
    113|     expect(figures.transactions).toHaveLength(5);
    114|     expect(figures.pots.items.map((p) => p.seq)).toEqual([1, 2, 3, 4]);
    115|     expect(overviewSummary(seedOverviewInput(), fixedClock("2026-08-19...
    |                                                                                      ^
    116|       figures.bills,
    117|     );

 Test Files  1 failed (1)
      Tests  1 failed | 7 passed (8)
```
Failed as expected: with the same clock date as `seedFigures()`, `overviewSummary(...).bills`
equals `figures.bills`, so `.not.toEqual` fails — proving the assertion actually depends on
the clock (this is exactly the defect M6 named: without a clock-dependent assertion, the test
would pass regardless of `fixedClock`'s argument).

### GREEN — restored, and 8/8 pass

Restored `fixedClock("2026-09-19")`. Verified the restore is clean:
```
$ grep -c '"2026-09-19"' tests/unit/seed-figures.test.ts
1
```
Then ran:
```
$ npx vitest run tests/unit/seed-figures.test.ts
 Test Files  1 passed (1)
      Tests  8 passed (8)
```
No temporary change was committed — the RED/GREEN cycle happened entirely between the
prettier/lint/typecheck gates and the final full-suite run, on the already-committed-ready
working tree, and was undone by hand before any commit.

### Full suite

Re-ran prettier/lint/typecheck (all clean, same output as above) after the restore, then:
```
$ npm test

> ai-native-personal-finance@0.1.0 test
> vitest run

 Test Files  18 passed (18)
      Tests  341 passed (341)
```
Test count: new tests per file = 0 (`seed-figures.test.ts` 8 → 8); total 341 → 341. One
assertion was added inside the existing "computes the Overview on the business day" test; no
test was added or removed.

## Files changed

- `docs/03-specs/backlog.md` — 5 lines changed (commit `2677be0`)
- `scripts/seed-figures.ts` — JSDoc only (commit `aa41185`)
- `tests/unit/seed-figures.test.ts` — 2 imports, 2 titles, 1 added assertion (commit `aa41185`)

No other file was touched. `git diff 412cb4c..aa41185 --stat`:
```
 docs/03-specs/backlog.md        | 10 +++++-----
 scripts/seed-figures.ts         |  7 +++++--
 tests/unit/seed-figures.test.ts |  9 +++++++--
 3 files changed, 17 insertions(+), 9 deletions(-)
```

## Commits

- `2677be0` — `docs(backlog): v1.8 corrections from the T-03 final review — one BigInt instruction for T-09, seedFigures() row shape, stale T-04 clause`
- `aa41185` — `test(scripts): seed-figures titles claim only what they check; the business-day test depends on the clock (T-03 final review)`

Both committed with `GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks"` and the Claude
Sonnet 5 attribution trailer (this session's own attribution, per implementer-rules.md's
instruction to prefer the session's own reminder over the example in the rules file). Neither
commit used `--no-verify`, and both `git commit` invocations exited successfully with the
commit SHAs shown above; the pre-commit hook printed no output in either case (whether it ran
silently or the repository has none configured was not checked further — the observable fact
is that neither commit was bypassed and both went through cleanly).

## Self-review findings

- The two appends to T-09's "**from T-03:**" text (M2's DTO-dates/category-spelling clause,
  then M1's `seedFigures()` clause) were applied in the order the findings file lists them
  (item 1 = M2, item 2 = M1). Both land in the same clause, so the row now carries both; this
  reads correctly as one continuous list of `;`-separated notes.
- `git diff -U0 docs/03-specs/backlog.md | grep '^@@'`, run before staging, showed 4 hunks for
  5 named line-level edits, because the T-09 and T-10 row edits (adjacent lines 18–19) merge
  into one 2-line hunk. All five named lines (4, 13, 18, 19, 22) are confirmed changed by that
  same pre-staging run; no other line moved. (The post-commit `cmp` against `/tmp/backlog.diff`
  in the Commit A section above independently confirms the committed diff is byte-identical to
  what was captured pre-staging.)
- Prettier's `--write` on `tests/unit/seed-figures.test.ts` only re-wrapped the new assertion
  lines to fit the project's print width; it did not alter any of the wording specified by the
  findings file. Confirmed by reading the file after `--write` and against the plan.
- Confirmed via `grep` that `src/server/seed.ts` really does define `avatarKey` (:105),
  `themeFromHex` (:68) and `CATEGORY_BY_NAME` (:80) before naming them in the backlog and
  JSDoc text as living there, so the new claims are accurate, not merely plausible.

## Concerns

None. All six items match the findings file's text verbatim where it quoted text; the gates
and the RED/GREEN check are all green; the diff is scoped to the three named files and the
lines the findings file specifically named.
