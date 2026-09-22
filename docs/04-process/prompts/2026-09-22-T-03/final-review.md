# T-03 final whole-branch review: 9039dd0..412cb4c (11 commits, 45 files)

The branch is sound. I found no bugs and no Critical or Important issues. Six Minor documentation and test-title items should land before the process-record commit, so the verdict is **With fixes**.

**How I reviewed.** I read the whole diff package (`/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/T-03-domain/.superpowers/sdd/2026-09-22-T-03/review-9039dd0..412cb4c.diff`) in four passes:
1. docs and config;
2. `src/domain` and `src/server/seed.ts`;
3. `src/shared`, the fixtures and `boundaries.test.ts`;
4. the domain, shared and seed-figures tests.

I then checked the head files against:
- plan v0.2: Global Constraints, Decisions, Owner answers, Findings, Hand-offs, Tasks 5–6 and the DoD table;
- SPEC-overview v1.1 and data-model v1.1;
- ADR-0002 and ADR-0005;
- US-04…08, US-11, US-27 and US-28;
- the DoD, build-workflow and governance;
- the ledger and the Task 5/6 reviews and reports.

**What I could not do.** I had no shell and ran nothing. The gate results are the implementers' reports; I checked them by arithmetic and by reading the code.

**What I recomputed by hand.** From `prisma/data.json` I recomputed every §4.3 value, and all of them match:
- budgets spent per category: 15 / 150 / 133 / 40, total 338;
- bills: 4 paid ($190), 4 upcoming ($194.98), 2 due soon ($59.98);
- the latest five transactions, in order.

## Strengths
- **Domain design.** `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/T-03-domain/src/domain/overview.ts` is pure and generic over the caller's rows, and takes the clock as a parameter. It sorts by `seq` itself, totals over all rows and only then slices four or five. That matches §2.3, §2.5 and §6, and US-05 and US-07's "totals include all".
- **`sumCents` after R9 (`src/domain/money.ts:21-33`) is exact.** Two safe integers whose true sum is within the safe range add exactly. Any sum that leaves the range rounds to at least 2^53 and is refused. So every partial sum is either exact or rejected.
- **`formatMoney` (`src/shared/money.ts`) cannot lose a dollar.**
  - Within the safe-integer range, `abs/100` stays below 2^47, where the float step is at most 2^-6.
  - So `k − 0.01` can never round up to `k`, and `Math.floor` never gains a dollar.
  - `-0` prints `$0.00`.
- **`formatDate` is strict.** It refuses text the built-in parser would misread. Its test file runs in UTC+14 and first asserts that the zone took effect (`tests/unit/shared/dates.test.ts:18-21`).
- **The §4.3 mirror test is well built.**
  - It compares cells, not raw lines.
  - A missing table throws instead of passing as empty.
  - Each of the three wrong-on-purpose fixtures asserts that exactly one named row differs.
  - The subprocess test pins the npm script name.
- **The narrowed lint rule matches the ADR-0005 clarification exactly.** The three messages are distinct substrings, so each fixture proves its own selector.
- **ADR-0005 clarification, `eslint.config.mjs:184-207`, `src/domain/README.md:8-9` and `tests/fixtures/boundaries/README.md:33,43` all say the same thing.** The fixtures README claims `src/server` coverage only for the violation half, which is the part that has a fixture.
- **ADR-0002 boundaries hold across the branch:**
  - `src/domain` imports only from within `src/domain`;
  - `src/shared` imports nothing;
  - `scripts` imports `src/domain`, `src/shared` and `prisma/data.json`;
  - `src/server` imports `src/domain`;
  - `tests` imports `scripts`.
- **Test-count trail.**
  - 229 + 11 + 4 + 10 + 10 + 28 + 17 + 24 + 8 = **341**, which is **112 new tests**.
  - The plan's 340 plus R9's regression test (`tests/unit/domain/money.test.ts:35-37`) gives 341.
  - The only committed text that still says 340 or "111 new" is the plan itself (Draft v0.2, committed before the base). That includes its process-log draft and DoD table.
- **R10 held.** In my spot checks, no hand-built amount equals a seed amount.

## Issues

### Critical
None.

### Important
None.

### Minor — fix before merge
Each of these is a false statement in something this PR merges, or a hazard for a named later task, and each sits in a file the branch already changes. All six are doc, comment or test-title edits.

**M1 — `seedFigures()` rows are not shaped like the database's rows, and the JSDoc overclaims.**
- **Where:** `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/T-03-domain/scripts/seed-figures.ts:15-18`. The raw fields are at :29 (avatar), :30 and :37 (category), :39 and :46 (theme).
- **What:** the rows keep data.json's avatar path, hex theme and display category ("Dining Out"). `src/server/seed.ts` stores the avatar key, the `Theme` enum and `DiningOut`. The comment "tests/unit/seed-figures.test.ts checks the two agree" is true for names, money, dates, categories (after mapping) and recurring flags, but not for avatar or theme.
- **Why it matters:** the backlog makes T-09 and T-10 consumers of `seedFigures()`. A test comparing the DTO to it directly will mismatch on those three fields.
- **Fix:**
  - Say this in the JSDoc.
  - Add one clause to the T-09 and T-10 rows: "`seedFigures()` rows keep data.json's avatar path, hex theme and display category — map them (`avatarKey`, `themeFromHex`, `CATEGORY_BY_NAME`) or compare money, names and order only".
  - Hand the structural fix to T-04: once the enum and theme maps live in `src/shared`, `seedOverviewInput` can emit database-shaped rows.

**M2 — Backlog T-09 row gives two conflicting `BigInt` instructions.**
- **Where:** `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/T-03-domain/docs/03-specs/backlog.md:18`.
- **What:** T-02's clause says "`BigInt` money becomes `Number` at the DTO edge". T-03's clause says "`BigInt` converted to `Number` first (`sumCents` refuses anything else)".
- **Why it matters:** only the second works. `overviewSummary` runs between the repository and the DTO, so converting at the DTO edge is too late and `sumCents` throws. The failure is loud, which keeps this Minor, but it is the clearest inaccuracy v1.8 introduced.
- **Fix:** replace both with one instruction: convert at the repository edge, before `overviewSummary`.
- **Optional:** add the plan's other T-09 notes:
  - DTO dates via `toISOString()`;
  - transactions and budgets must use the same category spelling, because `budgetSpent` compares with `===`. A mismatch shows only as $0 spent, which only the §4.3 API check would catch.

**M3 — The v1.8 changelog overclaims.**
- **Where:** `backlog.md:4`: "Every hand-off the T-03 plan addresses to a later task sits in that task's row".
- **What's missing from the rows:**
  - the plan's T-04 notes;
  - its T-12 note;
  - the rest of T-09 (see M2);
  - its Release 2 notes, including the US-27 AC2 month-end gap: from the 27th, every unpaid bill reads Due Soon.
- **Fix:**
  - Narrow the sentence to "the T-05, T-08, T-09, T-10 and T-13 rows".
  - Record the US-27 AC2 gap where a Release 2 spec author will see it; the process-log "Next" entry at minimum.

**M4 — Backlog T-04 row asks for a fixture repoint that is already done.**
- **Where:** `backlog.md:13` still says "repoint the boundary fixtures that import `src/shared/README.md`".
- **What:** no fixture imports it. The shared-layer fixtures import `@/src/shared/env` (`tests/unit/boundaries.test.ts:202`). v1.8 edited this cell.
- **Fix:** drop the clause.

**M5 — Backlog T-13 says the coverage errors print "on every run".**
- **Where:** `backlog.md:22`.
- **What:** the parse errors appear only on `--coverage` runs. This is also Task 6's deferred Minor.
- **Fix:** "on every coverage run".

**M6 — Two seed-figures test titles claim more than they check.**
- **Where:** `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/T-03-domain/tests/unit/seed-figures.test.ts`.
- **What:**
  - At :96 ("seq in the order the database assigns it"), lines 103-106 build the expected values with the same `i + 1` formula as `seed-figures.ts:36,42`. Nothing consults the database.
  - At :109-113 ("computes the Overview on the business day"), the assertions (5 transactions, pot seqs [1..4]) hold for any clock.
- **Why it matters:** this is the same class of defect R11 fixed in Task 3.
- **Fix:**
  - Retitle :96 to "seq 1…n in file order"; T-09's API test proves the database side.
  - For :109, either retitle it or assert something that depends on the month, e.g. that `overviewSummary(seedOverviewInput(), fixedClock("2026-09-19")).bills` differs from `seedFigures().bills`.

### Minor — can wait
- **M7:** `eslint.config.mjs:16`'s header summary mentions only `new Date()`. It says nothing about `Date()` or `Date.now()`, or that the rule was narrowed. It is incomplete, not false; the block comment at :184-202 is accurate.

## Deferred Minors from the ledger

| Item | Verdict | Reason |
|---|---|---|
| T1 report test-count breakdown wrong | Can wait (Step 4) | Annotate in the process log; don't edit a subagent's report. |
| T1 report paraphrases Step 10 output | Can wait (Step 4) | Same: annotate, don't edit. |
| T1 no `src/server` twin of `parses-date-allowed` | Can wait → T-05 | One rule block covers both folders; T-05 is the next task to touch server time handling. |
| T1 `clock.ts` `!year \|\| !month \|\| !day` redundant | Can wait (no task) | Cosmetic, correct. |
| T1 `globalThis.Date()` and aliases not caught | Can wait → T-05 | The same gap existed under the wide rule. `performance.now()`, `Reflect.construct` and `new Date(...[])` are also not caught. T-05 injects system time and can decide on a broader guard. |
| T2 plan text drops "(ADR-0005, NFR-D2)" | Can wait (Step 4) | The plan is historical; R8 is right. Note it in the process log. |
| T2 "Seed …" wording in domain modules | Can wait → first Release 2 task that reuses `toCents` for form input | The owner asked for an unchanged move, and the wording correctly flags that the function is scoped to seed data. |
| T3 "most recent" pick under-tested (`bills.test.ts:24-25`) | Can wait → Release 2 recurring-bills page (US-27 "Monthly - 2nd") | The code is correct regardless of input order. In R1, `day` is not shown and seed amounts are equal across months. |
| T3 paid-by-any vs paid-by-latest (`bills.test.ts:33-36`) | Can wait → Release 2 recurring-bills page | Unreachable in R1: transactions are read-only and none is dated after today. |
| T3 `bills.ts:38` O(k²) | Can wait (no task) | 49 rows. |
| T3 `types.ts:4-5` "accepted as it is" vs `BigInt` | Can wait → T-09 | The sentence is about extra fields and holds. The T-09 row (fixed per M2) carries the conversion. |
| T3 `transactions.test.ts:27` "ignoring case" | Can wait → Release 2 A-to-Z sort (US-11) | True at the primary level (letters before case). That task should pin the tie between case variants of the same name. |
| T3 `overview.test.ts:19` cites empty-state ACs | No action | Consistent with R11: these are rules, not seed figures. |
| T4 report trims outputs | Can wait (Step 4) | Annotate. |
| T4 `[0]` and `[-0]` produce the same test title | Can wait (no task) | Cosmetic. |
| T4 `formatSignedMoney` throw path and `-0` untested | Can wait → T-10 | By reading: `-0` gives `$0.00`, and the throw comes via `formatMoney`, which is tested. |
| T4 `formatDate("")` message has a double space | Can wait (no task) | Cosmetic. |
| T5 #1 `seedFigures()` raw avatar/theme/category | **Fix before merge** (M1) | False comment, and T-09 and T-10 are named consumers. The structural fix goes to T-04. |
| T5 #2 seq assertion tautological | **Fix before merge** (M6) | Test title overclaims; same file as M1's area. |
| T5 #3 "business day" test does not depend on the clock | **Fix before merge** (M6) | Same. |
| T5 #4 row mapping parallels `seed.ts` | Can wait → T-04 | ADR-0002 forces it for now; once the maps are in `src/shared` the two can share one mapping. |
| T5 #5 fixtures hand-copy every §4.3 row | Can wait (no task) | A legitimate §4.3 change fails loudly and names the rows. |
| T5 #6 `differingRows` walks only the first table | Can wait (no task) | The main test's `toEqual` already catches a row-count difference. |
| T5 #7 coverage "Failed to parse … README.md" | Can wait → T-13 | R6 and F2; already in the T-13 row. |
| T5 #8 §4.2 example not pinned by a test | **No action — false positive** | `dates.test.ts:44-46`, month 9, builds `2026-09-01T00:00:00Z` and expects `1 Sep 2026`, which is the spec example verbatim. |
| T6 T-13 row says "on every run" | **Fix before merge** (M5) | One word, in a file already being corrected. |
| T6 report quotes only Vitest's 2-line summary | No action | That summary is the result. |

## Rulings
I would overturn none. Two premises need correcting, and a few rulings carry obligations into Steps 4–5.

- **R1 (go-ahead):** accept. The plan header still reads "Draft (v0.2 … waiting for the go-ahead)", so the prompt record must quote the skill invocation and "continue" verbatim.
- **R2 (final review before the process record):** accept. Add `.superpowers/sdd/2026-09-22-T-03/seed-amounts.mjs` to the copy list. R10's pass/fail criterion depends on it, and it cannot be re-run once the workspace is deleted.
- **R3 (two date round trips kept separate):** accept. ADR-0002 would allow domain → shared. What decides it is that §4.2 asks for no non-formatter export in `src/shared`, and the two round trips have different error contracts.
- **R4 (`seed.ts` header unchanged):** accept, with a corrected premise. The owner's "dəyişdirilmədən" covered the moved functions, not the header comment. What justifies keeping it is that the header is still literally true under the narrowed rule.
- **R5, R6, R7, R8:** accept.
- **R9 (`sumCents` partial-sum fix):** accept; the fix is correct. List it in the PR as a deviation from the plan's code.
- **R10 (change the values, not D12):** accept. List it in the PR as a deviation.
- **R11 (retitle seed-AC test titles):** accept. M6 applies the same logic to seed-figures.test.ts.
- **R12 (keep the red code commit before the spec commit):** accept, with a corrected premise. Owner answer 6 asks for the three document changes to be *listed separately in the PR description*; it says nothing about commit order. What justifies keeping it is the cost of rewriting history versus one `git bisect skip` at `e3eca6a`.
- **Owner answer 1 deviation:** the owner asked for a new `Date.now()` fixture. The plan reused T-01's `domain-uses-date-now` and `server-uses-date-now` instead, and disclosed that before the go-ahead. It doesn't block, but the PR description must list it as a deviation.

## Recommendations
- **Order of work before merge:**
  1. Land M1–M6 as their own small commits (e.g. `docs(backlog): …`, `test(scripts): …`) before the process-record commit.
  2. Re-run `npm test` and `format:check`.
- **Merge condition:** CI must be green on the draft PR. E15's CI half (`npm run seed:figures` via tsx inside the `verify` job's Vitest run) is still a prediction.
- **Process log and PR description (Steps 4–5):**
  - State Vitest 229 → 341 and 112 new tests, citing R9. Do not copy the plan's 340 or "111".
  - List the deviations: the `Date.now()` fixture choice, R8, R9, R10 and R12.
  - Name US-11 AC1, US-27 AC2 and US-28 AC1 alongside US-04…08, since the tests cite them.
  - List the three document changes separately (owner answer 6).
  - Annotate the defects in the task reports rather than editing the reports.
- **Unverified observations** (no shell; these are not findings):
  - (a) `toCents`'s 1e-6 tolerance: once dollars × 100 reaches 2^33 cents (above ~$85.9M), a float step is at least 1.9e-6, so some valid amounts might be refused. This doesn't affect data.json. Revisit if Release 2 reuses `toCents` for amounts across NFR-S3's full range.
  - (b) `boundaries/include` does not list `prisma/**`. `scripts` importing `@/prisma/data.json` passes as an unknown file, and so would `@/prisma/seed.ts`, which imports `src/server`. That would be an indirect scripts → server path. This is outside T-03's scope; send it to a separate PR or T-13.
  - (c) `scripts/seed-figures.ts` has been imported by Vitest and run by tsx, but not yet loaded by Playwright. The JSON import attribute already works under Playwright (tests/api import `src/server/seed.ts`); `import.meta.main` is the untested part. T-09/T-10 will be first.
  - (d) Seed variants: the §7 E2E rows are derivable from `seedFigures()`: few-transactions is the first three of the latest five, and the empty and no-recurring variants show zeros. If T-10 asserts other cards under few-transactions (e.g. budgets spent $55.50), `seedFigures` will need an input parameter.

## Assessment

**Ready to merge? With fixes**

**Reasoning:** The domain arithmetic, the formatters, the narrowed lint rule and the §4.3 mirror are correct, and they follow the spec, the owner's plan-gate answers and ADR-0002. The six fixes are documentation, comment and test-title corrections: the `BigInt` contradiction and the stale T-04 clause in the backlog, the changelog overclaim, the `seedFigures()` contract for T-09/T-10, and two overclaiming test titles. Each should land as its own small commit before the process-record commit, with green CI on the draft PR.
