# Task 5 report: `scripts/seed-figures.ts` and the §4.3 check

## What was implemented

- `scripts/seed-figures.ts` — `seedOverviewInput()`, `seedFigures()`, `workedExample(figures?)`,
  `markdownTable(rows)`, and a `if (import.meta.main)` entry point that prints SPEC-overview
  §4.3 as a Markdown table. Reads `prisma/data.json` and computes everything through
  `src/domain` (`shiftYears`, `toCents`, `overviewSummary`, `fixedClock(BUSINESS_TODAY)`) and
  `src/shared` (`formatMoney`, `formatSignedMoney`, `formatDate`), per ADR-0002's scripts
  boundary.
- `tests/unit/seed-figures.test.ts` — asserts the spec's §4.3 table equals `workedExample()`
  (values and order), checks three deliberately-wrong fixtures are each caught with exactly the
  row(s) named in the brief, asserts `npm run --silent seed:figures` prints the same table, and
  cross-checks `seedOverviewInput()`/`seedFigures()` against `src/server/seed.ts`'s `seedRows()`.
- `tests/fixtures/seed-figures/gift-forty.md.fixture`,
  `tests/fixtures/seed-figures/latest-by-day.md.fixture`,
  `tests/fixtures/seed-figures/no-worked-example.md.fixture` — written verbatim from the brief.
- `package.json` — added `"seed:figures": "tsx scripts/seed-figures.ts"` via `npm pkg set`.
- `docs/03-specs/overview.md` — amended to v1.1 (owner decisions at the T-03 plan gate):
  status line, changelog, §4.2 "Dates" row (three-letter months, not `Intl`), the §4.3 sentence,
  and the "Budgets spent / limit" row (per-budget amounts now in money format with backticks).
- `scripts/README.md`, `README.md` (commands table), `tests/fixtures/README.md` — updated per
  the brief, verbatim.

## Commands run, with real output

### Baseline (before this task)

```
$ npx vitest run
 Test Files  17 passed (17)
      Tests  333 passed (333)
```

### Step 2 (RED): test written, script not yet created

```
$ npx vitest run tests/unit/seed-figures.test.ts
 ❯ tests/unit/seed-figures.test.ts (0 test)
FAIL tests/unit/seed-figures.test.ts [ tests/unit/seed-figures.test.ts ]
Error: Cannot find package '@/scripts/seed-figures' imported from
/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/T-03-domain/tests/unit/seed-figures.test.ts

 Test Files  1 failed (1)
      Tests  no tests
```

Matches the brief's prediction ("the file fails to load — `scripts/seed-figures` does not
exist").

### Step 4 (checkpoint): test run against today's (pre-amendment) spec

```
$ npx vitest run tests/unit/seed-figures.test.ts
 ❯ tests/unit/seed-figures.test.ts (8 tests | 1 failed) 239ms
   ❯ SPEC-overview §4.3 is generated, never typed (build-workflow.md) (5)
     × equals the figures scripts/seed-figures.ts computes from prisma/data.json — values and order

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

FAIL tests/unit/seed-figures.test.ts > SPEC-overview §4.3 is generated, never typed (build-workflow.md) > equals the figures scripts/seed-figures.ts computes from prisma/data.json — values and order
AssertionError: expected [ [ 'Item', 'Value' ], [ …(2) ], …(6) ] to deeply equal [ [ 'Item', 'Value' ], [ …(2) ], …(6) ]

- Expected
+ Received

@@ -15,11 +15,11 @@
      "First four pots",
      "Savings `$159.00`, Concert Ticket `$110.00`, Gift `$110.00`, New Laptop `$10.00`",
    ],
    [
      "Budgets spent / limit",
-     "`$338.00` / `$975.00` (Entertainment `$15.00`, Bills `$150.00`, Dining Out `$133.00`, Personal Care `$40.00`)",
+     "`$338.00` / `$975.00` (Entertainment 15.00, Bills 150.00, Dining Out 133.00, Personal Care 40.00)",
    ],
    [
      "Legend",
      "Entertainment `$50.00`, Bills `$750.00`, Dining Out `$75.00`, Personal Care `$100.00`",
    ],

 ❯ tests/unit/seed-figures.test.ts:46:64

 Test Files  1 failed (1)
      Tests  1 failed | 7 passed (8)
```

**Checkpoint verdict:** exactly the expected failure — only the "Budgets spent / limit" row
differs, and only in the `$` and backticks around the four per-budget amounts (the spec side
had the plain numbers, the generator the money-formatted ones). No other row differs. Per the
dispatch instructions this is not a figure error and proceeding to amend the spec is correct
(not BLOCKED).

### Step 6 (GREEN): test run again after the spec amendment

```
$ npx vitest run tests/unit/seed-figures.test.ts
 Test Files  1 passed (1)
      Tests  8 passed (8)
```

### Step 7: the script's own output

```
$ npm run seed:figures

> ai-native-personal-finance@0.1.0 seed:figures
> tsx scripts/seed-figures.ts

| Item | Value |
|------|-------|
| Balance / Income / Expenses | `$4,836.00` / `$3,814.25` / `$1,700.50` |
| Pots total | `$920.00` |
| First four pots | Savings `$159.00`, Concert Ticket `$110.00`, Gift `$110.00`, New Laptop `$10.00` |
| Budgets spent / limit | `$338.00` / `$975.00` (Entertainment `$15.00`, Bills `$150.00`, Dining Out `$133.00`, Personal Care `$40.00`) |
| Legend | Entertainment `$50.00`, Bills `$750.00`, Dining Out `$75.00`, Personal Care `$100.00` |
| Bills | Paid `$190.00`, Upcoming `$194.98`, Due Soon `$59.98` |
| Latest five (timestamp desc, then name) | Savory Bites Bistro `-$55.50` 19 Aug 2026 · Emma Richardson `+$75.50` 19 Aug 2026 · Daniel Carter `-$42.30` 18 Aug 2026 · Urban Services Hub `-$65.00` 17 Aug 2026 · Sun Park `+$120.00` 17 Aug 2026 |
```

Matches the brief's expected output (E13) exactly, byte for byte.

### Step 9: `git diff docs/03-specs/overview.md` (checking only the authorized lines changed)

```
--- a/docs/03-specs/overview.md
+++ b/docs/03-specs/overview.md
@@ -1,7 +1,7 @@
 # SPEC-overview — Overview page

-Status: **Approved** (v1.0, owner approval 2026-09-20) · Author(s): Agent · Date: 2026-09-20
-Changelog: v0.2 — S-01 figures corrected and generated rule added; ...
+Status: **Approved** (v1.1 — 2026-09-22: §4.2 dates with three-letter months, §4.3 per-budget amounts in the money format, owner decisions at the T-03 plan gate; v1.0, owner approval 2026-09-20) · Author(s): Agent · Date: 2026-09-20
+Changelog: v1.1 (2026-09-22, owner decisions at the T-03 plan gate) — §4.2: ... v0.2 — S-01 figures corrected and generated rule added; ...
 Implements: US-04 (AC1, AC3; AC2 tested in R2), US-05, US-06, US-07, US-08, US-32, US-34 · Constrained by: ADR-0002, ADR-0005, data-model.md, design-tokens.md, NFR-A/P · Design: prototype "Overview"

 ## 1. Purpose
@@ -31,16 +31,16 @@ Everything at a glance, computed by the backend from the current dataset, with l
 | Element | Format | Example |
 |---------|--------|---------|
 | All money | `$` + thousands separators + two decimals; negative as `-$55.50`; transaction rows prefix positives with `+` | `$4,836.00`, `-$55.50`, `+$75.50` |
-| Dates | `d MMM yyyy`, **UTC** (`Intl.DateTimeFormat('en-GB', { day:'numeric', month:'short', year:'numeric', timeZone:'UTC' })`) | `19 Aug 2026`; `2026-08-19T20:23:11Z` → `19 Aug 2026` |
+| Dates | `d MMM yyyy`, **UTC**: the day without a leading zero, ... | `19 Aug 2026`; `2026-08-19T20:23:11Z` → `19 Aug 2026`; `2026-09-01T00:00:00Z` → `1 Sep 2026` |

-4.3 Worked example (seed, generated by `scripts/seed-figures.ts` in T-03 — the table below must equal its output):
+4.3 Worked example (seed, generated by `scripts/seed-figures.ts` in T-03 — the table below must equal its output; `npm run seed:figures` prints it, and `tests/unit/seed-figures.test.ts` fails when they differ):

 | Item | Value |
 |------|-------|
 | Balance / Income / Expenses | `$4,836.00` / `$3,814.25` / `$1,700.50` |
 | Pots total | `$920.00` |
 | First four pots | Savings `$159.00`, Concert Ticket `$110.00`, Gift `$110.00`, New Laptop `$10.00` |
-| Budgets spent / limit | `$338.00` / `$975.00` (Entertainment 15.00, Bills 150.00, Dining Out 133.00, Personal Care 40.00) |
+| Budgets spent / limit | `$338.00` / `$975.00` (Entertainment `$15.00`, Bills `$150.00`, Dining Out `$133.00`, Personal Care `$40.00`) |
 | Legend | Entertainment `$50.00`, Bills `$750.00`, Dining Out `$75.00`, Personal Care `$100.00` |
 | Bills | Paid `$190.00`, Upcoming `$194.98`, Due Soon `$59.98` |
 | Latest five (timestamp desc, then name) | Savory Bites Bistro `-$55.50` 19 Aug 2026 · Emma Richardson `+$75.50` 19 Aug 2026 · Daniel Carter `-$42.30` 18 Aug 2026 · Urban Services Hub `-$65.00` 17 Aug 2026 · Sun Park `+$120.00` 17 Aug 2026 |
```

Full diff confirmed only these 5 lines changed (status line, changelog line, the §4.2 Dates
row, the §4.3 sentence, the "Budgets spent / limit" row) — nothing else in the file.

### `git diff package.json`

```
     "postinstall": "prisma generate",
-    "db:reset": "prisma migrate deploy && prisma db seed"
+    "db:reset": "prisma migrate deploy && prisma db seed",
+    "seed:figures": "tsx scripts/seed-figures.ts"
   },
```

Only the one new line, plus the comma on `db:reset`'s line, as required.

### `git diff README.md scripts/README.md tests/fixtures/README.md`

Confirmed the exact three edits: one new commands-table row in `README.md` (hand-aligned to
the same pipe positions — column boundaries at characters 0, 32, 147 — as the surrounding
rows, verified with a small script rather than by eye); the `scripts/README.md` paragraph
replaced verbatim; the `tests/fixtures/README.md` second paragraph replaced verbatim. No other
lines touched in any of the three files.

### Step 9: full gate

```
$ npx prettier --write scripts tests/unit/seed-figures.test.ts tests/fixtures/README.md
scripts/README.md 18ms (unchanged)
scripts/seed-figures.ts 26ms (unchanged)
tests/unit/seed-figures.test.ts 9ms (unchanged)
tests/fixtures/README.md 1ms (unchanged)

$ npx prettier --check scripts tests/unit/seed-figures.test.ts tests/fixtures/README.md
Checking formatting...
All matched files use Prettier code style!
(exit 0)

$ npm run lint
> eslint . --max-warnings 0
(exit 0, no output)

$ npm run format:check
> prettier --check .
Checking formatting...
All matched files use Prettier code style!
(exit 0)

$ npm run typecheck
> tsc --noEmit
(exit 0, no output)

$ npm test
> vitest run
 Test Files  18 passed (18)
      Tests  341 passed (341)
```

New tests added by this task: `tests/unit/seed-figures.test.ts` = 8 (checked against the file
as written). Total: 333 → 341, 17 → 18 files. This matches the controller's ruling (333 baseline
+ 8 new = 341), not the brief's superseded "340/340" text.

### Step 9: `npm run test:coverage`

```
$ npm run test:coverage
> vitest run --coverage

Failed to parse file:///.../src/domain/README.md. Excluding it from coverage.
 Error [RolldownError]: Parse failed with 1 error:
Invalid Character ` `
1: # src/domain
    ^
2:
3: Pure functions: money, budgets, pots, bills, sorting, paging, clock (ADR-0002).
    ...
Failed to parse file:///.../src/shared/README.md. Excluding it from coverage.
 Error [RolldownError]: Parse failed with 1 error:
Invalid Character ` `
1: # src/shared
    ^
2:
3: Zod schemas, DTO types, enums (categories, themes), test ids, copy (ADR-0002).
    ...
Failed to parse file:///.../src/webmcp/README.md. Excluding it from coverage.
 Error [RolldownError]: Parse failed with 1 error:
Invalid Character ` `
1: # src/webmcp
    ^
2:
3: WebMCP adapter, per-page tool registry, polyfill loader, readiness signal (ADR-0002/0004).
    ...

 Test Files  18 passed (18)
      Tests  341 passed (341)

 % Coverage report from v8
------------------|---------|----------|---------|---------|-------------------
File              | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
------------------|---------|----------|---------|---------|-------------------
------------------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 100% ( 99/99 )
Branches     : 100% ( 78/78 )
Functions    : 100% ( 33/33 )
Lines        : 100% ( 90/90 )
================================================================================
```

Exit 0. Three "Failed to parse … README.md" errors printed, for `src/domain`, `src/shared` and
`src/webmcp` — matches F2, left to T-13 (R6: `vitest.config.ts` untouched).

**Difference from what was asked:** the dispatch asked me to "report the coverage table lines
for `src/domain` and `src/shared`." The literal `text` table this run printed has **no per-file
rows at all** — only the header, the two separator lines and the four-line summary above, copied
in full. There is no row naming `src/domain` or `src/shared` to quote. As supplementary
evidence (not a substitute for the requested table, and explicitly labelled as a different
source), `coverage/lcov.info` from this same run has one `SF:`/`LF:`/`LH:` triple per file, all
with `LH == LF` (100% covered):

```
SF:src/domain/bills.ts        LF:18  LH:18
SF:src/domain/budgets.ts      LF:4   LH:4
SF:src/domain/calendar.ts     LF:13  LH:13
SF:src/domain/clock.ts        LF:7   LH:7
SF:src/domain/money.ts        LF:12  LH:12
SF:src/domain/overview.ts     LF:9   LH:9
SF:src/domain/transactions.ts LF:6   LH:6
SF:src/domain/types.ts        LF:0   LH:0
SF:src/shared/dates.ts        LF:11  LH:11
SF:src/shared/env.ts          LF:1   LH:1
SF:src/shared/money.ts        LF:9   LH:9
```

## Files changed

Commit 1 (`e3eca6a`):
- `README.md` (commands table row)
- `package.json` (`scripts.seed:figures`)
- `scripts/README.md` (`seed-figures.ts` paragraph)
- `scripts/seed-figures.ts` (new)
- `tests/fixtures/README.md` (second paragraph)
- `tests/fixtures/seed-figures/gift-forty.md.fixture` (new)
- `tests/fixtures/seed-figures/latest-by-day.md.fixture` (new)
- `tests/fixtures/seed-figures/no-worked-example.md.fixture` (new)
- `tests/unit/seed-figures.test.ts` (new)

Commit 2 (`9c5e8c5`):
- `docs/03-specs/overview.md` (v1.1)

## Commits

- `e3eca6a` — `feat(scripts): seed-figures prints SPEC-overview §4.3 from the seed; the spec is checked against it (T-03)`
- `9c5e8c5` — `docs(overview): v1.1 — three-letter months; per-budget amounts in the money format (T-03)`

Both committed with `GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit`, no
`--no-verify`; the pre-commit hook (gitleaks) ran and passed both times. Attribution used the
lines from this session's own system reminder (Claude Sonnet 5), not the rules file's Opus 5.5
template, per the implementer rules' "if your own session gives you attribution lines, use
those" clause.

## Self-review findings / concerns

1. **Commit 1 alone leaves a red test.** Between `e3eca6a` and `9c5e8c5`, the repository state
   has `tests/unit/seed-figures.test.ts` present but `docs/03-specs/overview.md` still at v1.0,
   so the "equals the figures…" test fails (the same failure captured in the Step 4 log above).
   This is the two-commit split the brief asked for (code, then spec amendment) working as
   intended, not an error, but it means a reviewer bisecting between the two commits will see a
   failing `npm test`. The pre-commit hook only runs gitleaks, so nothing blocked either commit.
2. **`npm run test:coverage`'s text table has no per-file rows** — see the "Difference from what
   was asked" note above. This is the actual, literal output of the command as configured
   (`vitest.config.ts` untouched, per R6); I did not find a way to get per-file `src/domain` /
   `src/shared` lines from the `text` reporter as it behaved in this run. I've supplied
   `lcov.info`'s per-file lines as the closest available substitute, clearly labelled.
3. The generic-test brief's Step 9 "Expected: Vitest 340/340" is superseded by the controller's
   ruling (R9: baseline is 333, so target is 341); I ran and reported the real 341/341 result,
   not the brief's stale number, per "Reported output is copied from the run, never from the
   brief."

No other findings. Interfaces from earlier tasks (`calendar.ts`, `money.ts`, `clock.ts`,
`overview.ts`, `src/shared/money.ts`, `src/shared/dates.ts`, `src/server/seed.ts`) were used as
committed and not modified.
