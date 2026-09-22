# Task 2 report — Calendar and money helpers in the domain

## What was implemented

- `src/domain/calendar.ts` (new): `SEED_YEAR_SHIFT`, `shiftYears` moved verbatim from
  `src/server/seed.ts`; `isInMonthOf` and `isInMonthUpTo` added (UTC-month helpers).
- `src/domain/money.ts` (new): `toCents` moved verbatim from `src/server/seed.ts`; `sumCents`
  added.
- `tests/unit/domain/calendar.test.ts` (new): tests for `isInMonthOf` / `isInMonthUpTo`.
- `tests/unit/domain/money.test.ts` (new): tests for `sumCents`.
- `src/server/seed.ts` (modified): imports `SEED_YEAR_SHIFT`, `shiftYears` from
  `@/src/domain/calendar` and `toCents` from `@/src/domain/money`; the moved block (the
  `SEED_YEAR_SHIFT` constant, `UTC_TIMESTAMP`, `isLeapYear`, `shiftYears`, and `toCents`, with
  their comments) deleted. The header comment block at the top of the file (lines 6–12,
  `/** The seed (SPEC-reset-and-test-support §2.1): ... */`) is unchanged — only import lines
  and the moved block changed. No re-export of the three names.
- `tests/unit/seed.test.ts` (modified): only the import block changed — `SEED_YEAR_SHIFT` and
  `shiftYears` now imported from `@/src/domain/calendar`, `toCents` from `@/src/domain/money`;
  the rest of the file (test bodies) is untouched.

## Step 1 — RED: write the tests

Wrote `tests/unit/domain/calendar.test.ts` and `tests/unit/domain/money.test.ts` exactly as
given in the brief.

Command:

```
npx vitest run tests/unit/domain/calendar.test.ts tests/unit/domain/money.test.ts
```

Output (relevant lines):

```
 ❯ tests/unit/domain/money.test.ts (0 test)
 ❯ tests/unit/domain/calendar.test.ts (0 test)

⎯⎯⎯⎯⎯⎯ Failed Suites 2 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/unit/domain/calendar.test.ts [ tests/unit/domain/calendar.test.ts ]
Error: Cannot find package '@/src/domain/calendar' imported from
.../tests/unit/domain/calendar.test.ts

 FAIL  tests/unit/domain/money.test.ts [ tests/unit/domain/money.test.ts ]
Error: Cannot find package '@/src/domain/money' imported from
.../tests/unit/domain/money.test.ts

 Test Files  2 failed (2)
      Tests  no tests
```

Matches the brief's *prediction*: both files fail to load — the modules do not exist. RED
confirmed.

## Step 2–3: `src/domain/calendar.ts` and `src/domain/money.ts`

Wrote both files as given in the brief's Step 2 and Step 3 code blocks.

## Verifying the move is verbatim (owner's plan-gate condition, controller ruling)

The assignment requires: "move `toCents` and `shiftYears` **unchanged** into `src/domain`" and
"diff it against what you put in `src/domain` so the move is verbatim (the moved functions'
code and comments are identical; only their new file location differs)."

**First diff attempt found a discrepancy.** The brief's own Step 3 code block for `money.ts`
gives `toCents`'s leading comment as:

```
/**
 * Dollars as data.json writes them to integer cents. A value finer than a cent is refused
 * rather than rounded away.
 */
```

— which drops `(ADR-0005, NFR-D2)` compared to the original in `seed.ts`:

```
/**
 * Dollars as data.json writes them to integer cents (ADR-0005, NFR-D2). A value finer than
 * a cent is refused rather than rounded away.
 */
```

I initially wrote `money.ts` following the brief's code block literally, which produced this
diff (not identical, contradicting the owner's condition):

```
$ sed -n '63,73p' src/server/seed.ts > /tmp/seed_tocents_block.txt
$ sed -n '7,17p' src/domain/money.ts > /tmp/money_block2.txt
$ diff /tmp/seed_tocents_block.txt /tmp/money_block2.txt
2,3c2,3
<  * Dollars as data.json writes them to integer cents (ADR-0005, NFR-D2). A value finer than
<  * a cent is refused rather than rounded away.
---
>  * Dollars as data.json writes them to integer cents. A value finer than a cent is refused
>  * rather than rounded away.
diff exit=1
```

Per an advisor consult, I resolved this in favour of the owner's explicit condition (moved
**unchanged**/identical) over the brief's literal example text, since the diff step exists
precisely to catch this kind of drift, and the owner's ruling plus the controller's own
definition of "verbatim" ("code and comments are identical") both say the comment should not
change. I restored the original comment text (with `(ADR-0005, NFR-D2)`) in
`src/domain/money.ts`, keeping `money.ts`'s new file-level header comment exactly as the brief
gives it (that's new content describing the file, not part of the moved block).

Re-diff after the fix:

```
$ sed -n '7,17p' src/domain/money.ts > /tmp/money_block3.txt
$ diff /tmp/seed_tocents_block.txt /tmp/money_block3.txt
diff exit=0
```

`shiftYears` block (the `SEED_YEAR_SHIFT` constant, `UTC_TIMESTAMP`, `isLeapYear`, and the
`shiftYears` function, with comments) diffed identical on the first attempt:

```
$ sed -n '42,61p' src/server/seed.ts > /tmp/seed_shiftyears_block.txt
$ sed -n '6,25p' src/domain/calendar.ts > /tmp/calendar_block_final.txt
$ diff /tmp/seed_shiftyears_block.txt /tmp/calendar_block_final.txt
diff exit=0
```

Both moved blocks are now byte-for-byte identical to what was in `src/server/seed.ts`; only
their file location differs, as required.

**Concern flagged for the controller:** the brief's Step 3 code block (as written) does not
match the "verbatim" requirement for `toCents`'s comment — I departed from the brief's literal
text at that one place, following the owner's condition instead. `src/domain/money.ts` as
committed keeps the original `(ADR-0005, NFR-D2)` comment on `toCents`, not the brief's printed
version.

## Grep confirmation — nothing else imports the three names from `src/server/seed`

```
$ grep -rn "SEED_YEAR_SHIFT\|shiftYears\|toCents" src tests prisma app scripts \
    | grep -v "src/domain/calendar.ts\|src/domain/money.ts\|tests/unit/domain/"
src/server/seed.ts:2:import { SEED_YEAR_SHIFT, shiftYears } from "@/src/domain/calendar";
src/server/seed.ts:3:import { toCents } from "@/src/domain/money";
src/server/seed.ts:116:      current: toCents(file.balance.current),
src/server/seed.ts:117:      income: toCents(file.balance.income),
src/server/seed.ts:118:      expenses: toCents(file.balance.expenses),
src/server/seed.ts:124:      date: shiftYears(transaction.date, SEED_YEAR_SHIFT),
src/server/seed.ts:125:      amount: toCents(transaction.amount),
src/server/seed.ts:130:      maximum: toCents(budget.maximum),
src/server/seed.ts:135:      target: toCents(pot.target),
src/server/seed.ts:136:      total: toCents(pot.total),
tests/unit/seed.test.ts:5:import { SEED_YEAR_SHIFT, shiftYears } from "@/src/domain/calendar";
tests/unit/seed.test.ts:6:import { toCents } from "@/src/domain/money";
tests/unit/seed.test.ts:40:describe("shiftYears", () => {
... (test bodies using the names, no imports from src/server/seed)
```

Only `src/server/seed.ts` (its own new imports and usages) and `tests/unit/seed.test.ts`
reference these three names, and neither imports them from `src/server/seed` — no re-export
exists there.

## Step 4: point the seed at the moved helpers

- `src/server/seed.ts` imports updated (lines 1–4); moved block deleted; header comment block
  (lines 6–12) unchanged.
- `tests/unit/seed.test.ts` import block updated; test bodies unchanged.

## Step 5 — GREEN: run the tests

Command:

```
npx vitest run tests/unit/seed.test.ts tests/unit/domain
```

Output:

```
 Test Files  4 passed (4)
      Tests  68 passed (68)
```

Per-file breakdown (from `--reporter=verbose`, counted per file):

```
  10 tests/unit/domain/calendar.test.ts
  11 tests/unit/domain/clock.test.ts
   9 tests/unit/domain/money.test.ts
  38 tests/unit/seed.test.ts
```

New tests per file: calendar 10, money 9 — both match the brief's *measured per file*
prediction exactly (seed 38, clock 11, calendar 10, money 9; 38+11+10+9 = 68).

## Step 6: all unit gates

Ran each command individually (not piped), capturing the real exit code of each:

```
$ npm run lint; echo "lint exit=$?"
> eslint . --max-warnings 0
lint exit=0
```

```
$ npm run format:check; echo "format:check exit=$?"
> prettier --check .
Checking formatting...
All matched files use Prettier code style!
format:check exit=0
```

```
$ npm run typecheck; echo "typecheck exit=$?"
> tsc --noEmit
typecheck exit=0
```

```
$ npm test; echo "test exit=$?"
> vitest run
 Test Files  11 passed (11)
      Tests  263 passed (263)
test exit=0
```

Total: 244 (before) → 263 (after), all 11 files passing. Matches the brief's Expected exactly
(263/263).

## Step 7: commit

```
$ git status
  modified:   src/server/seed.ts
  modified:   tests/unit/seed.test.ts
  untracked:  src/domain/calendar.ts
  untracked:  src/domain/money.ts
  untracked:  tests/unit/domain/calendar.test.ts
  untracked:  tests/unit/domain/money.test.ts
```

Exactly the 6 brief paths, nothing else.

```
$ git add src/domain/calendar.ts src/domain/money.ts src/server/seed.ts tests/unit/seed.test.ts tests/unit/domain/calendar.test.ts tests/unit/domain/money.test.ts
$ GITLEAKS_CACHE_DIR="/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/T-03-domain/node_modules/.cache/gitleaks" git commit \
    -m "refactor(domain): move toCents and shiftYears into src/domain; add sumCents and the UTC month (T-03)" \
    -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BQp5Lv2Sruz5RCgSMYmHWa"
[task/T-03-domain c5e7d45] refactor(domain): move toCents and shiftYears into src/domain; add sumCents and the UTC month (T-03)
 6 files changed, 139 insertions(+), 36 deletions(-)
 create mode 100644 src/domain/calendar.ts
 create mode 100644 src/domain/money.ts
 create mode 100644 tests/unit/domain/calendar.test.ts
 create mode 100644 tests/unit/domain/money.test.ts
```

Commit succeeded on the first try — no pre-commit hook failure, no `--no-verify` used.

```
$ git status
nothing to commit, working tree clean
```

Commit: `c5e7d45` — "refactor(domain): move toCents and shiftYears into src/domain; add
sumCents and the UTC month (T-03)"

## Self-review findings

1. **`toCents` comment discrepancy in the brief's own Step 3 code block** (see above, under
   "Verifying the move is verbatim"). The brief's printed `money.ts` code for `toCents`'s
   comment differs from a truly-unchanged move by dropping `(ADR-0005, NFR-D2)`. I resolved
   this in favour of the owner's explicit "unchanged"/"identical" condition rather than the
   brief's literal printed text, restoring the original comment. This is the one place my
   committed code differs from the brief's exact printed text. Flagging for controller
   confirmation that this resolution was correct.
2. No other departures from the brief. `calendar.ts`'s `shiftYears`/`SEED_YEAR_SHIFT` block
   diffed identical against the original on the first attempt, no correction needed there.
3. `format:check` passed without needing a `--write` pass (no prettier drift introduced).

## Concerns

- The one open item is #1 above: confirm the controller agrees that restoring the original
  `(ADR-0005, NFR-D2)` comment on `toCents` (deviating from the brief's printed `money.ts` code
  block) was the correct resolution, given the owner's plan-gate condition and the controller's
  own "verbatim" definition took priority over the brief's literal example text.

---

## Fix report — R9: `sumCents` intermediate-sum overflow (task review, Important finding)

### Finding (verbatim, from the reviewer, via controller ruling R9)

`sumCents` checked `Number.isSafeInteger(amount)` per element and `Number.isSafeInteger(total)`
once after the loop, but never checked the running `total` on each iteration. Concrete case:
`sumCents([Number.MAX_SAFE_INTEGER, 2, -2])` — the running total overflows past
`Number.MAX_SAFE_INTEGER` after the second element (rounds to `9007199254740992`), then the
third element (`-2`) brings the (already-corrupted) total back down to `9007199254740990` —
one cent short of the mathematically correct `9007199254740991`. Since
`Number.isSafeInteger(9007199254740990)` is `true`, the final check passed and the function
returned a silently wrong number instead of throwing. Controller ruling R9: reproduced with
node; fix mandated — check `Number.isSafeInteger(total)` inside the loop, right after
`total += amount;`, not just once at the end; no check remains after the loop (dead code); keep
the same error text.

### Change

`src/domain/money.ts` — moved the safe-integer check on `total` from after the loop to inside
it, immediately after `total += amount;`; removed the now-dead post-loop check; extended the
doc comment to state the running-total check explicitly, since the old comment ("Anything else
is refused... instead of summing to a wrong figure") no longer fully described the guarantee
(it now also covers a partial sum that leaves range and comes back):

```ts
export function sumCents(amounts: readonly number[]): number {
  let total = 0;
  for (const amount of amounts) {
    if (!Number.isSafeInteger(amount)) {
      throw new Error(`Amount ${String(amount)} is not a whole number of cents`);
    }
    total += amount;
    if (!Number.isSafeInteger(total)) {
      throw new Error(`Total ${total} is beyond the exact range of a number`);
    }
  }
  return total;
}
```

### Covering test

`tests/unit/domain/money.test.ts` — added, after "refuses a total beyond the exact range of a
number":

```ts
it("refuses a partial sum beyond the exact range, even when later amounts bring it back", () => {
  expect(() => sumCents([Number.MAX_SAFE_INTEGER, 2, -2])).toThrow("beyond the exact range");
});
```

### RED

Added the test first, before the fix, and ran:

```
$ npx vitest run tests/unit/domain/money.test.ts
```

Output (relevant lines):

```
 ❯ tests/unit/domain/money.test.ts (10 tests | 1 failed) 4ms
   ❯ sumCents (ADR-0005: money is integer cents) (10)
     × refuses a partial sum beyond the exact range, even when later amounts bring it back 2ms

 FAIL  tests/unit/domain/money.test.ts > sumCents (ADR-0005: money is integer cents) > refuses a partial sum beyond the exact range, even when later amounts bring it back
AssertionError: expected [Function] to throw an error

- Expected:
null

+ Received:
undefined

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
```

Confirms the bug: `sumCents` returned without throwing (no error thrown at all) for
`[Number.MAX_SAFE_INTEGER, 2, -2]`, matching the reviewer's analysis.

### GREEN

Applied the fix in `src/domain/money.ts`, then:

```
$ npx vitest run tests/unit/domain/money.test.ts
```

Output:

```
 Test Files  1 passed (1)
      Tests  10 passed (10)
```

money 10/10, as expected.

### Unit gates

```
$ npx prettier --check src/domain/money.ts tests/unit/domain/money.test.ts; echo "prettier exit=$?"
Checking formatting...
All matched files use Prettier code style!
prettier exit=0
```

```
$ npm run lint; echo "lint exit=$?"
> eslint . --max-warnings 0
lint exit=0
```

```
$ npm run typecheck; echo "typecheck exit=$?"
> tsc --noEmit
typecheck exit=0
```

```
$ npm test; echo "test exit=$?"
> vitest run
 Test Files  11 passed (11)
      Tests  264 passed (264)
test exit=0
```

Total: 263 (before this fix) → **264/264** (after), all 11 files passing. Matches the expected
count exactly.

### Commit

```
$ git status
  modified:   src/domain/money.ts
  modified:   tests/unit/domain/money.test.ts
```

Exactly the two files the ruling named, nothing else.

```
$ git add src/domain/money.ts tests/unit/domain/money.test.ts
$ GITLEAKS_CACHE_DIR="/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/T-03-domain/node_modules/.cache/gitleaks" git commit \
    -m "fix(domain): sumCents refuses a partial sum beyond the exact range (T-03)" \
    -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BQp5Lv2Sruz5RCgSMYmHWa"
[task/T-03-domain 568e972] fix(domain): sumCents refuses a partial sum beyond the exact range (T-03)
 2 files changed, 10 insertions(+), 4 deletions(-)
```

Commit succeeded on the first try — no pre-commit hook failure, no `--no-verify` used.

```
$ git status
nothing to commit, working tree clean
```

Commit: `568e972` — "fix(domain): sumCents refuses a partial sum beyond the exact range
(T-03)"

### Concerns

None. The fix is scoped exactly to the ruling, the regression test reproduces the reviewer's
exact case, RED confirmed the bug before the fix, GREEN confirms it after, and all gates pass
at the expected 264/264.
