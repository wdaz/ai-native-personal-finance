# Task 3 report: The Overview's arithmetic

Working directory: `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/T-03-domain`
(branch `task/T-03-domain`).

## What was implemented

Per `task-3-brief.md`, written verbatim (Steps 1, 2, 3, 5 copied byte-for-byte from the brief;
comments included):

- `tests/fixtures/domain.ts` — the `transaction()` test factory.
- `tests/unit/domain/transactions.test.ts`, `tests/unit/domain/budgets.test.ts`,
  `tests/unit/domain/bills.test.ts`, `tests/unit/domain/overview.test.ts` — the unit tests.
- `src/domain/types.ts` — `BalanceInput`, `TransactionInput`, `BudgetInput`, `PotInput`.
- `src/domain/transactions.ts` — `compareLatest`, `latestTransactions`.
- `src/domain/budgets.ts` — `budgetSpent`.
- `src/domain/bills.ts` — `BillStatus`, `RecurringBill`, `DUE_SOON_DAYS`, `recurringBills`,
  `BillsSummary`, `billsSummary`.
- `src/domain/overview.ts` — `OVERVIEW_CARD_ITEMS`, `OVERVIEW_TRANSACTIONS`, `OverviewInput`,
  `OverviewSummary`, `overviewSummary`.
- `src/domain/README.md` replaced with the brief's module table (Step 5).

No files outside the brief's **Files** list were touched. No dependency was installed, added or
upgraded. No push, no PR.

## Note on the brief's numbers (controller ruling R9)

Per the dispatch, Task 2's review added one extra `sumCents` test (the "refuses a partial sum"
case), so before this task the suite was **264/264** across 11 files, not the brief's 263/263 —
this starting figure is the dispatch's own statement, not one this task measured directly; it is
consistent with the measured 292 total minus the 28 tests this task added (292 − 28 = 264).
Money's file therefore measured **10** tests, not the brief's 9, and Step 6's target was **292**,
not 291 — both confirmed by the actual runs below.

New tests per file: transactions = 8, budgets = 5, bills = 9, overview = 6 (28 new). Total
264 → 292, files 11 → 15.

## TDD evidence

### RED — before any `src/domain/*.ts` module existed

Command:

```
npx vitest run tests/unit/domain
```

Real output (relevant lines):

```
 ❯ tests/unit/domain/bills.test.ts (0 test)
 ❯ tests/unit/domain/budgets.test.ts (0 test)
 ❯ tests/unit/domain/transactions.test.ts (0 test)
 ❯ tests/unit/domain/overview.test.ts (0 test)

 FAIL  tests/unit/domain/bills.test.ts [ tests/unit/domain/bills.test.ts ]
Error: Cannot find package '@/src/domain/bills' imported from .../tests/unit/domain/bills.test.ts
 FAIL  tests/unit/domain/budgets.test.ts [ tests/unit/domain/budgets.test.ts ]
Error: Cannot find package '@/src/domain/budgets' imported from .../tests/unit/domain/budgets.test.ts
 FAIL  tests/unit/domain/overview.test.ts [ tests/unit/domain/overview.test.ts ]
Error: Cannot find package '@/src/domain/overview' imported from .../tests/unit/domain/overview.test.ts
 FAIL  tests/unit/domain/transactions.test.ts [ tests/unit/domain/transactions.test.ts ]
Error: Cannot find package '@/src/domain/transactions' imported from .../tests/unit/domain/transactions.test.ts

 Test Files  4 failed | 3 passed (7)
      Tests  31 passed (31)
```

Why this was expected: the brief's four new modules (`transactions.ts`, `budgets.ts`, `bills.ts`,
`overview.ts`) did not exist yet, so each of the four new test files fails to load with a module
resolution error; `clock.ts`, `calendar.ts` and `money.ts` (already committed by Tasks 1–2) still
pass — 31 tests across 3 files, matching this run exactly. This matches Step 2's *prediction*
exactly.

### GREEN — after writing the four `src/domain` modules

Command:

```
npx vitest run tests/unit/domain
```

Real output:

```
 Test Files  7 passed (7)
      Tests  59 passed (59)
```

Per-file counts (measured, one file at a time with `npx vitest run tests/unit/domain/<file>`):

| File                                     | Tests   |
| ----------------------------------------- | ------- |
| `tests/unit/domain/transactions.test.ts` | 8       |
| `tests/unit/domain/budgets.test.ts`      | 5       |
| `tests/unit/domain/bills.test.ts`        | 9       |
| `tests/unit/domain/overview.test.ts`     | 6       |
| `tests/unit/domain/clock.test.ts`        | 11      |
| `tests/unit/domain/calendar.test.ts`     | 10      |
| `tests/unit/domain/money.test.ts`        | 10 (brief said 9 — differs, per R9 above) |

8 + 5 + 9 + 6 + 11 + 10 + 10 = 59, matching the combined run. All counts match the brief exactly
except money (10 vs the brief's 9), which is the R9 adjustment.

## Step 5: README

`src/domain/README.md` replaced verbatim with the brief's text (module table for T-03). No other
file references `domain/README.md` (checked with `grep -rl "domain/README" tests/ src/ scripts/`
— no output), so no boundary fixture needed repointing for this task.

## Step 6: gates (run one command at a time, not chained)

| Command | Exit | Output (relevant) |
| --- | --- | --- |
| `npx prettier --write src/domain tests/unit/domain tests/fixtures/domain.ts` | 0 | All 17 files reported `(unchanged)` — no reformatting needed, and no Task 1–2 file was touched |
| `npx prettier --check src/domain tests/unit/domain tests/fixtures/domain.ts` | 0 | `All matched files use Prettier code style!` (no second `--write` needed, unlike the brief's note about the prototype) |
| `npm run lint` | 0 | `> ai-native-personal-finance@0.1.0 lint` / `> eslint . --max-warnings 0` |
| `npm run format:check` | 0 | `prettier --check .` → `All matched files use Prettier code style!` |
| `npm run typecheck` | 0 | `> ai-native-personal-finance@0.1.0 typecheck` / `> tsc --noEmit` |
| `npm test` | 0 | `Test Files  15 passed (15)` / `Tests  292 passed (292)` |

`git status --short` after the `--write` step listed exactly **11 paths**: 10 new files plus
`M src/domain/README.md` — no Task 1–2 file (`clock.ts`, `calendar.ts`, `money.ts`, or their
tests) was modified.

Vitest total: **292/292** across **15 files** — matches the R9-adjusted target (not the brief's
291/291).

## Files changed

- Created: `src/domain/types.ts`, `src/domain/transactions.ts`, `src/domain/budgets.ts`,
  `src/domain/bills.ts`, `src/domain/overview.ts`, `tests/fixtures/domain.ts`,
  `tests/unit/domain/transactions.test.ts`, `tests/unit/domain/budgets.test.ts`,
  `tests/unit/domain/bills.test.ts`, `tests/unit/domain/overview.test.ts`
- Modified: `src/domain/README.md`

## Commit

```
git add src/domain tests/fixtures/domain.ts tests/unit/domain
GITLEAKS_CACHE_DIR="/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/T-03-domain/node_modules/.cache/gitleaks" git commit \
  -m "feat(domain): budgetSpent, latestTransactions, recurringBills and overviewSummary (T-03)" \
  -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BQp5Lv2Sruz5RCgSMYmHWa"
```

Result: `ea103d1` — `feat(domain): budgetSpent, latestTransactions, recurringBills and
overviewSummary (T-03)`, 11 files changed, 509 insertions(+), 4 deletions(-). The commit exited
0, with only git's own summary and the `create mode` lines printed — no hook output was printed
in the captured output; `--no-verify` was not used. `git status --short` after the commit: clean
(no output).

Note: the commit uses this session's own Sonnet 5 attribution lines (from the system reminder),
not the Opus 5.5 template shown in `implementer-rules.md`, per that file's own instruction to
prefer the session's actual attribution when given one.

## Self-review findings

- Verified `src/domain/clock.ts`, `src/domain/calendar.ts`, `src/domain/money.ts` were not
  modified (interfaces used as committed; `git status --short` after `prettier --write` showed
  them untouched).
- All new module and test file contents were copied verbatim from the brief, including comments
  and non-ASCII characters (Σ, ≤, —, …, ×).
- `git add` was scoped to exactly the paths the brief names (`src/domain`,
  `tests/fixtures/domain.ts`, `tests/unit/domain`); `git status --short` before commit showed
  only those 11 paths staged (10 new files, 1 modified — `src/domain/README.md`).
- No `git checkout <rev> -- .`, `git reset --hard`, `git stash`, `git clean`, or argument-less
  `npm install` was run.
- No subagents were spawned; all work was done directly, per the "No subagents" rule.

## Concerns

None. The only deviation from the brief's literal text is the money test count (10 vs 9) and the
Step 6 total (292 vs 291), both of which are the controller's ruling R9 and are called out above
and matched by the actual measured runs.

---

# Fix round 1: hand-built amounts no longer equal seed amounts (D12) + three over-claiming titles

Dispatched after Task 3's review found hand-built test amounts that coincide with §4.3 seed
figures (plan D12: "hand-built amounts never equal a seed amount") and, folded in by controller
ruling R11, three test titles in `overview.test.ts` that cite a specific AC id while using
hand-built data. Scope: test values and titles only, in the six files the coordinator named. No
production code (`src/domain/*.ts`) touched. No test added or removed.

## Before evidence: the review's finding, machine-confirmed

Before editing, the amounts named in the finding (plus every other money literal across the six
files, gathered in one batch) were run through the controller's tool from the worktree root:

```
node .superpowers/sdd/2026-09-22-T-03/seed-amounts.mjs 1000 1500 250 1750 4000 900 800 700 600 300 100000 50000 20000 500 200 400 100 1500 60000 5000 1000 2000 3000 12500 71000 13000 9000 10000 12000 777 3000 3777 2000 12345 10352
```

Output:

```
COLLIDE: 1000 1500 100000 500 1500 5000 1000 2000 3000 10000 12000 3000 2000
```

This confirms every value the reviewer named, **and** three values the reviewer's prose did not
spell out but that the coordinator's criterion ("balance fields", "budget maxima", the derived
pots total) requires checking:

- `balance.current: 100_000` (`overview.test.ts`) — collides (the criterion explicitly lists
  "balance fields"; the reviewer's enumeration did not name it, but it must not equal a seed
  amount either).
- `budget(5, "Education", 1_000)` and `budget(3, "General", 2_000)` — collide (the reviewer's
  prose named only Dining Out's `5_000`; Education's and General's maxima collide too).
- The **derived** pots total `1_500` (`overview.test.ts:38`, was computed from `pot(5, 500)` +
  four others) — collides independently of the `500` literal it is computed from, because
  `$1500` doesn't equal `$500 + …` coincidentally; it happens to be a seed figure itself.

One exception, found by inspection, not by the tool: **`4_000`** (`budgets.test.ts`, "does not
let money in reduce what was spent") — the tool reported `4000` as **not** colliding
(`no collisions` on a solo run), yet the reviewer flagged it as equal to a seed figure. The
tool's regex only matches `$`-prefixed figures in SPEC-overview §4.3 (`/\$([\d,]+\.\d{2})/g`).
That table's budgets line reads: "Budgets spent / limit | `$338.00` / `$975.00` (Entertainment
15.00, Bills 150.00, Dining Out 133.00, **Personal Care 40.00**)" — `overview.md:43`. "Personal
Care 40.00" has no `$` prefix, so the tool never adds `4000` to its seed set even though it is a
real seed-derived figure from the worked example. The reviewer's finding is correct; the tool
under-reports here. `4_000` was replaced regardless of the tool's silence, per the finding.

## Before → after, every changed value

| File:line (after edit) | Before | After | Why |
| --- | --- | --- | --- |
| `tests/fixtures/domain.ts:15`, JSDoc line 4 | `amount: -1_000`, "$10.00" | `amount: -1_037`, "$10.37" | factory default collides (1000) |
| `tests/unit/domain/bills.test.ts:7` | `amount = -1_000` (local `bill()` default) | `amount = -1_037` | same collision, separate literal; never asserted but still a literal in scope |
| `budgets.test.ts:11` | `amount: -1_500` | `amount: -1_537` | 1500 collides |
| `budgets.test.ts:14` | `toBe(1_750)` | `toBe(1_787)` | recompute: 1537 + 250 |
| `budgets.test.ts:19` | `amount: -1_500` | `amount: -1_537` | 1500 collides |
| `budgets.test.ts:20` | `amount: 4_000` | `amount: 4_219` | flagged by reviewer; tool blind spot ("Personal Care 40.00", no `$`) |
| `budgets.test.ts:22` | `toBe(1_500)` | `toBe(1_537)` | recompute: only the negative amount counts, now -1537 |
| `bills.test.ts:25,29` | `-10_000` / `amount: 10_000` | `-10_037` / `amount: 10_037` | 10000 collides |
| `bills.test.ts:65` | `-12_000` (bill "Paid") | `-12_419` | 12000 collides |
| `bills.test.ts:67` | `-3_000` (bill "Later") | `-3_219` | 3000 collides |
| `bills.test.ts:71` | `{ paid: 12_000, upcoming: 3_777, dueSoon: 777 }` | `{ paid: 12_419, upcoming: 3_996, dueSoon: 777 }` | recompute: paid=12419 (Paid only); upcoming=777+3219=3996 (Soon+Later, not paid); dueSoon=777 (Soon only, day22≤24) |
| `overview.test.ts:9` | `current: 100_000` | `current: 100_037` | 100000 collides ("balance fields" per criterion); `income`/`expenses` unchanged, don't collide |
| `overview.test.ts:36` | `pot(5, 500)` | `pot(5, 537)` | 500 collides; other four pot totals (200,400,100,300) don't collide, unchanged |
| `overview.test.ts:38` | `toBe(1_500)` | `toBe(1_537)` | recompute: 537+200+400+100+300; the pre-edit total (1500) collided too |
| `overview.test.ts:45` | `budget(1, "Dining Out", 5_000)` | `budget(1, "Dining Out", 5_037)` | 5000 collides |
| `overview.test.ts:46` | `budget(5, "Education", 1_000)` | `budget(5, "Education", 1_019)` | 1000 collides (not named in reviewer's prose; caught by the criterion's "budget maxima") |
| `overview.test.ts:47` | `budget(3, "General", 2_000)` | `budget(3, "General", 2_231)` | 2000 collides (same) |
| `overview.test.ts:48` | `budget(4, "Shopping", 3_000)` | `budget(4, "Shopping", 3_143)` | 3000 collides |
| `overview.test.ts:52` | `amount: -500` (Education transaction) | `amount: -563` | 500 collides |
| `overview.test.ts:55` | `toBe(71_000)` | `toBe(71_430)` | recompute: 60000+5037+1019+2231+3143 (Bills max 60_000 unchanged, doesn't collide) |
| `overview.test.ts:56` | `toBe(13_000)` | `toBe(13_063)` | recompute: Bills spent 12500 (unchanged, doesn't collide) + Education spent 563 |
| `overview.test.ts:83` | `amount: -12_000` (Power) | `amount: -12_071` | 12000 collides |
| `overview.test.ts:90` | `{ paid: 12_000, upcoming: 777, dueSoon: 777 }` | `{ paid: 12_071, upcoming: 777, dueSoon: 777 }` | recompute: only the paid figure changed; Cloud (-777) unchanged, doesn't collide |
| `money.test.ts:7` | `sumCents([12_345, -2_000, 7])`, `toBe(10_352)` | `sumCents([12_345, -2_119, 7])`, `toBe(10_233)` | 2000 collides; recompute: 12345 − 2119 + 7 |

Values left unchanged because they do not collide (checked, see below): `-250`, `-900`, `-800`,
`-700`, `-600`, `-300`/`300` (budgets.test.ts); `-9_000` (bills.test.ts Power/July); `-777`
(bills.test.ts "Soon"/"Cloud", both files); `income: 50_000`, `expenses: 20_000`, pot totals
`200`/`400`/`100`/`300`, `budget(2, "Bills", 60_000)`, transaction `-12_500` (Bills, appears
twice: input and the unchanged `["budget-2", 12_500]` expected row) (overview.test.ts); `12_345`,
`7`, `99_999_999_999`, `199_999_999_999`, `100`, `250n` (money.test.ts, only the one flagged
literal changed, per the coordinator's explicit instruction).

`tests/unit/domain/transactions.test.ts` has **no diff** — it contains no money literals (only
dates, names and counts). The fixture's default `amount` flows into it (and into overview.test.ts's
"five latest transactions" test and bills.test.ts's bare `transaction()` call), but none of those
tests assert on the amount value, so the default's change did not require any edit there.

## Three test-title fixes (R11)

| Location | Before | After |
| --- | --- | --- |
| `overview.test.ts:35` | `"totals all pots and lists the first four in creation order (US-05 AC1)"` | `"totals all pots and lists the first four in creation order (US-05 AC1's rule)"` |
| `overview.test.ts:42` | `"totals all budgets and lists the first four with what each spent (US-07 AC1)"` | `"totals all budgets and lists the first four with what each spent (US-07 AC1's rule)"` |
| `overview.test.ts:79` | `"totals the recurring bills (US-08 AC1)"` | `"totals the recurring bills (US-08 AC1's rule)"` |

Only these three were changed — the exact set R11 named. The `describe` block at
`overview.test.ts:18` ("SPEC-overview §4.1, §6; US-04…US-08") and the "empty dataset" test title
at `overview.test.ts:19` (which cites four ACs while asserting the genuinely spec'd empty-state
behaviour, not a hand-built-data numeric claim) were left as-is; they were not named by R11.

## Post-edit verification: the full remaining literal set, one tool call

Command (every absolute-cents literal left in the six files after editing, deduplicated):

```
node .superpowers/sdd/2026-09-22-T-03/seed-amounts.mjs 1037 250 1787 1537 4219 900 800 700 600 300 9000 10037 12419 777 3219 3996 100037 50000 20000 537 200 400 100 60000 5037 1019 2231 3143 12500 563 71430 13063 12071 12345 2119 7 10233 99999999999 199999999999 9007199254740991 9007199254740992 1 2 0
```

Output:

```
no collisions
```

Exit code: 0.

## Supplementary check: non-`$`-prefixed §4.3 figures the tool's regex would miss

Because the `4_000` case showed the tool only catches `$`-prefixed figures in §4.3, every kept
value was also checked against every `NNN.NN`-shaped figure in that table regardless of a `$`
prefix, converted to cents in Python (not through the tool, since the tool's own regex is what
has the blind spot):

```
sed -n '/4\.3 Worked example/,/^4\.4/p' docs/03-specs/overview.md | grep -oE '[0-9][0-9,]*\.[0-9]{2}' | sort -u
```

Output: `1,700.50 10.00 100.00 110.00 120.00 133.00 15.00 150.00 159.00 190.00 194.98 3,814.25
338.00 4,836.00 40.00 42.30 50.00 55.50 59.98 65.00 75.00 75.50 750.00 920.00 975.00`

Converted to cents and compared programmatically against the final list of 37 distinct literals
above:

```
python3 -c "
expanded_dollars = ['1,700.50','10.00','100.00','110.00','120.00','133.00','15.00','150.00','159.00','190.00','194.98','3,814.25','338.00','4,836.00','40.00','42.30','50.00','55.50','59.98','65.00','75.00','75.50','750.00','920.00','975.00']
expanded_cents = sorted(round(float(d.replace(',',''))*100) for d in expanded_dollars)
finals = [1037,250,1787,1537,4219,900,800,700,600,300,9000,10037,12419,777,3219,3996,100037,50000,20000,537,200,400,100,60000,5037,1019,2231,3143,12500,563,71430,13063,12071,12345,2119,7,10233]
hits = [f for f in finals if f in expanded_cents]
print('hits:', hits if hits else 'none')
"
```

Output: `hits: none`.

This is the check the reviewer's `4_000` finding showed the tool alone cannot make — it confirms
none of the round values kept unchanged (`9_000`, `50_000`, `20_000`, `60_000`, `12_500`, and the
sub-$10 pot/budget figures `100`–`900`) coincide with a non-`$`-prefixed §4.3 figure either.

## Gates (run one at a time)

| Command | Exit | Output |
| --- | --- | --- |
| `npx prettier --write tests/fixtures/domain.ts tests/unit/domain/{transactions,budgets,bills,overview,money}.test.ts` | 0 | all six files reported `(unchanged)` |
| `npx prettier --check` (same paths) | 0 | `All matched files use Prettier code style!` |
| `npm run lint` | 0 | `> ai-native-personal-finance@0.1.0 lint` / `> eslint . --max-warnings 0` |
| `npm run typecheck` | 0 | `> ai-native-personal-finance@0.1.0 typecheck` / `> tsc --noEmit` |
| `npm test` | 0 | `Test Files  15 passed (15)` / `Tests  292 passed (292)` |

Counts: new tests per file = 0 (values and titles only, no test added or removed). Total
292 → 292, 15 → 15 files — unchanged, as expected for a values-only fix.

## Commit

```
git add tests/fixtures/domain.ts tests/unit/domain/budgets.test.ts tests/unit/domain/bills.test.ts tests/unit/domain/overview.test.ts tests/unit/domain/money.test.ts
GITLEAKS_CACHE_DIR="/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/T-03-domain/node_modules/.cache/gitleaks" git commit \
  -m "test(domain): hand-built amounts no longer equal seed amounts (T-03, D12)" \
  -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BQp5Lv2Sruz5RCgSMYmHWa"
```

Result: `d34ebea` — `test(domain): hand-built amounts no longer equal seed amounts (T-03, D12)`,
5 files changed, 29 insertions(+), 29 deletions(-). The commit exited 0; only git's own summary
line was printed, no hook output — `--no-verify` was not used. `git status --short` after the
commit: clean (no output). `tests/unit/domain/transactions.test.ts` was correctly not staged (no
diff, confirmed above).

## Self-review findings

- `git status --short` before staging showed exactly the five files that needed value changes;
  `transactions.test.ts` was untouched, matching the "no money literals" finding.
- Every recomputed expected value was hand-derived from the new inputs and confirmed by the
  passing test run, not just asserted.
- Test intent, boundary dates, `seq`, days, counts and statuses are unchanged in every edited
  test — only money literals and, in three places, the title wording changed.
- The `seed-amounts.mjs` tool was not committed (it is git-ignored under
  `.superpowers/sdd/.gitignore`, confirmed with `git check-ignore -v`).
- No production file (`src/domain/*.ts`) and no file outside the coordinator's six-file scope was
  touched.

## Concerns for the controller

1. **`seed-amounts.mjs`'s blind spot is real and plan-wide.** Its §4.3 scan only matches
   `$`-prefixed figures (`/\$([\d,]+\.\d{2})/g`), so a worked-example figure written without a
   `$` — like `overview.md:43`'s "Personal Care 40.00" — is invisible to it. This task's `4_000`
   case was only caught because the human review named it by inspection; the tool alone said "no
   collisions" for it. Since D12 is applied plan-wide via this tool, other tasks' collision checks
   may have the same gap. Not fixed here (the dispatch says not to edit or commit the tool); flagged
   for the controller's attention.
2. **`bills.test.ts:61`'s `describe` block still over-claims.** `describe("billsSummary
   (SPEC-overview §2.6, US-28 AC1)", …)` cites US-28 AC1, which (per global-constraints.md) names
   specific seed figures ("Total Bills $384.98; Paid Bills 4 ($190.00); Total Upcoming 4
   ($194.98); Due Soon 2 ($59.98)"), while the test beneath it uses hand-built data — the same
   pattern R11 flagged for the three `overview.test.ts` titles. It was left unchanged because R11
   named only those three locations, not this one. Flagging it in case the controller wants it
   folded into a later round.

---

# Fix round 1, follow-up: bills.test.ts title + re-verify with the fixed tool

Dispatched after the controller accepted concern 2 under ruling R11 and fixed concern 1 in
`seed-amounts.mjs` itself. Scope: one title in one file, plus re-verification. No values changed,
no production code touched.

## 1. Title fix (R11, extended to US-28 AC1)

The controller checked every AC cited in the six files against
`docs/01-requirements/user-stories.md` and found only US-05/07/08 AC1 (already fixed in the
previous round) and US-28 AC1 state seed figures; the rest (US-04 AC3, US-06 AC1/AC3, US-27
AC1/AC2, US-05/07 AC2, US-08 AC3) state rules, not figures, and were left as they are.

`tests/unit/domain/bills.test.ts:61`:

```diff
-describe("billsSummary (SPEC-overview §2.6, US-28 AC1)", () => {
+describe("billsSummary (SPEC-overview §2.6, US-28 AC1's rule)", () => {
```

This is exactly the wording pattern used for the three titles fixed in the previous round.

## 2. Re-verification with the fixed tool

The controller's fix adds §4.3's bare (non-`$`-prefixed) amounts to the tool's seed set — the
regex changed from `/\$([\d,]+\.\d{2})/g` to `/\$?(\d[\d,]*\.\d{2})\b/g`. Confirmed the seed set
grew to the stated 56 amounts:

```
node .superpowers/sdd/2026-09-22-T-03/seed-amounts.mjs | tr ' ' '\n' | wc -l
```

Output: `56`.

Re-ran the same final list of money values from the six files (unchanged since the previous
round — this follow-up changed a title, not a value; `999` from the `.999Z` millisecond fraction
in `budgets.test.ts:28`'s date is correctly excluded, as it is not money) through the fixed tool:

```
node .superpowers/sdd/2026-09-22-T-03/seed-amounts.mjs 1037 250 1787 1537 4219 900 800 700 600 300 9000 10037 12419 777 3219 3996 100037 50000 20000 537 200 400 100 60000 5037 1019 2231 3143 12500 563 71430 13063 12071 12345 2119 7 10233 99999999999 199999999999 9007199254740991 9007199254740992 1 2 0
```

Output:

```
no collisions
```

Exit code: 0. This confirms the fixed tool — now covering the `4_000`/"Personal Care 40.00" case
that the previous round's manual Python check had to cover by hand — independently agrees with
every value chosen in round 1: nothing in the six files' final money-literal set collides with
any of the 56 seed amounts, `$`-prefixed or bare.

## Gates

| Command | Exit | Output |
| --- | --- | --- |
| `npx prettier --check tests/unit/domain/bills.test.ts` | 0 | `All matched files use Prettier code style!` |
| `npm run lint` | 0 | `> ai-native-personal-finance@0.1.0 lint` / `> eslint . --max-warnings 0` |
| `npm test` | 0 | `Test Files  15 passed (15)` / `Tests  292 passed (292)` |

Counts: new tests per file = 0. Total 292 → 292, 15 → 15 files — unchanged (title-only fix).

## Commit

```
git add tests/unit/domain/bills.test.ts
GITLEAKS_CACHE_DIR="/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/T-03-domain/node_modules/.cache/gitleaks" git commit \
  -m "test(domain): billsSummary title names US-28 AC1's rule, not its seed figures (T-03)" \
  -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BQp5Lv2Sruz5RCgSMYmHWa"
```

Result: `b727929` — `test(domain): billsSummary title names US-28 AC1's rule, not its seed
figures (T-03)`, 1 file changed, 1 insertion(+), 1 deletion(-). The commit exited 0; only git's
own summary line was printed, no hook output — `--no-verify` was not used. `git status --short`
after the commit: clean (no output). Only `tests/unit/domain/bills.test.ts` was staged and
committed, confirmed by `git status --short` before `git add`.

## Concerns

None. Both concerns raised at the end of the previous round are now resolved: concern 2 (the
`bills.test.ts` describe title) is fixed here under R11; concern 1 (the tool's blind spot for
non-`$`-prefixed §4.3 figures) was fixed by the controller in `seed-amounts.mjs` and confirmed
above.
