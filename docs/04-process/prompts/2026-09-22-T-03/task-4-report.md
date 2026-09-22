# Task 4 report: The §4.2 formatters

Working directory: `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/T-03-domain`
(branch `task/T-03-domain`).

## What was implemented

Per `task-4-brief.md`, wrote exactly the brief's file contents (verbatim, comments included),
in the brief's step order:

- `src/shared/money.ts` — `formatMoney(cents: number): string`, `formatSignedMoney(cents: number): string`.
- `src/shared/dates.ts` — `formatDate(value: Date | string): string`.
- `tests/unit/shared/money.test.ts` — new file.
- `tests/unit/shared/dates.test.ts` — new file, TZ set to `Pacific/Kiritimati` in `beforeAll`/
  restored in `afterAll`, kept exactly as given.
- `src/shared/README.md` — modified: replaced the "Filled by T-04 …" line with the T-03/T-04
  split paragraph the brief specifies.

No files outside the brief's **Files** list were touched. Neither module has any imports
(consistent with ADR-0002: `src/shared` imports nothing from the rest of the codebase, and here
imports nothing at all).

## Baseline (before this task)

```
$ npx vitest run
 Test Files  15 passed (15)
      Tests  292 passed (292)
```
Matches controller ruling R9 (292/292, 15 files) referenced in the dispatch.

## TDD evidence

### RED — Step 1

Wrote `tests/unit/shared/money.test.ts` and `tests/unit/shared/dates.test.ts` verbatim from the
brief, before either `src/shared/money.ts` or `src/shared/dates.ts` existed.

Command:
```
npx vitest run tests/unit/shared
```
Real output (relevant lines):
```
 ❯ tests/unit/shared/money.test.ts (0 test)
 ❯ tests/unit/shared/dates.test.ts (0 test)

⎯⎯⎯⎯⎯⎯ Failed Suites 2 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/unit/shared/dates.test.ts [ tests/unit/shared/dates.test.ts ]
Error: Cannot find package '@/src/shared/dates' imported from
/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/T-03-domain/tests/unit/shared/dates.test.ts

 FAIL  tests/unit/shared/money.test.ts [ tests/unit/shared/money.test.ts ]
Error: Cannot find package '@/src/shared/money' imported from
/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/T-03-domain/tests/unit/shared/money.test.ts

 Test Files  2 failed (2)
      Tests  no tests
```
Why expected: both modules did not exist yet, so both files failed to load. This matches the
brief's Step 1 prediction ("both files fail to load") exactly.

### GREEN — Step 4

Wrote `src/shared/money.ts` and `src/shared/dates.ts` verbatim from the brief (Steps 2 and 3),
then re-ran the same command.

Command:
```
npx vitest run tests/unit/shared
```
Real output:
```
 Test Files  2 passed (2)
      Tests  41 passed (41)
```
Per-file counts (measured with `--reporter=verbose`, counting lines):
- `tests/unit/shared/money.test.ts` = 17 tests (all `✓`).
- `tests/unit/shared/dates.test.ts` = 24 tests (all `✓`).
- 17 + 24 = 41, matching the total above.

This matches the brief's Step 4 expected per-file counts (money 17, dates 24 — unchanged by
ruling R9) exactly.

## Step 5 — README

`src/shared/README.md` updated: replaced the placeholder "Filled by T-04 …" sentence with the
brief's T-03/T-04 paragraph (see diff below). Left every other line as it already was.

## Step 6 — All unit gates

The brief's chain was run as a single command (no `tail`, so the reported exit code is npm's own,
not a pipe's):

```
NO_COLOR=1 npx prettier --write src/shared tests/unit/shared && NO_COLOR=1 npm run lint && NO_COLOR=1 npm run format:check && npm run typecheck && NO_COLOR=1 npm test; echo "exit=$?"
```

Real output (relevant lines, banner/warning noise from Node's `NO_COLOR`-vs-`FORCE_COLOR`
warning omitted — it is not part of any command's own output):

```
src/shared/dates.ts 21ms (unchanged)
src/shared/env.ts 1ms (unchanged)
src/shared/money.ts 3ms (unchanged)
src/shared/README.md 9ms (unchanged)
tests/unit/shared/dates.test.ts 5ms (unchanged)
tests/unit/shared/money.test.ts 2ms (unchanged)

> ai-native-personal-finance@0.1.0 lint
> eslint . --max-warnings 0

> ai-native-personal-finance@0.1.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!

> ai-native-personal-finance@0.1.0 typecheck
> tsc --noEmit

> ai-native-personal-finance@0.1.0 test
> vitest run

 Test Files  17 passed (17)
      Tests  333 passed (333)
   Start at  22:51:00
   Duration  5.37s (tests 89%, transform 5%, import 5%, worker 1%)

exit=0
```

- `npx prettier --write` reported every touched file as `(unchanged)` — no second `--write` was
  needed, so `format:check` (run right after) passed on the first try.
- `lint` produced no findings (only the npm script banner) — exit folded into the overall
  `exit=0` at the end of the `&&` chain.
- `format:check` — "All matched files use Prettier code style!"
- `typecheck` — no output, no errors.
- `test` — **Test Files 17 passed (17)**, **Tests 333 passed (333)**.

**This differs from the brief's own Step 6 text ("Vitest 332/332")**: the actual, measured total
is **333/333** (17 files). Per dispatch instruction 2 (controller ruling R9), this is expected —
an earlier review added one test between when the brief's numbers were written and now, so
292 (baseline) → 333 (after this task) is correct, not 332. New tests this task added:
41 (17 money + 24 dates); files 15 → 17.

Single combined `echo "exit=$?"` after the `;` confirms the whole chain's last command
(`npm test`) exited 0; every command in the `&&` chain up to it also had to exit 0 for `npm test`
to run at all.

## Files changed

```
$ git status
On branch task/T-03-domain
Your branch is ahead of 'origin/task/T-03-domain' by 7 commits.
  (use "git push" to publish your local commits)

nothing to commit, working tree clean

$ git show --stat --oneline HEAD
a6456b4 feat(shared): formatMoney, formatSignedMoney and formatDate per SPEC-overview §4.2 (T-03)
 src/shared/README.md            |  4 ++-
 src/shared/dates.ts             | 50 ++++++++++++++++++++++++++
 src/shared/money.ts             | 23 ++++++++++++
 tests/unit/shared/dates.test.ts | 77 +++++++++++++++++++++++++++++++++++++++++
 tests/unit/shared/money.test.ts | 37 ++++++++++++++++++++
 5 files changed, 190 insertions(+), 1 deletion(-)
```

Exactly the 5 files in the brief's **Files** list (2 new source files, 2 new test files, 1
modified README), matching `git add src/shared tests/unit/shared`.

## Commits

- `a6456b4` — `feat(shared): formatMoney, formatSignedMoney and formatDate per SPEC-overview §4.2 (T-03)`
  - Committed with `GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit`, no
    `--no-verify`. Pre-commit hook ran and passed (commit succeeded, `commit exit=0`).
  - Attribution trailer used the session's own lines (per dispatch instruction: "If your own
    session gives you attribution lines … use those"), not the rules file's generic Opus
    template:
    ```
    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_01BQp5Lv2Sruz5RCgSMYmHWa
    ```
  - `git status` after the commit: branch `task/T-03-domain`, "nothing to commit, working tree
    clean", ahead of `origin/task/T-03-domain` by 7 commits (was 6 before this task's commit).

## Self-review findings

- Files were written byte-for-byte from the brief's fenced code blocks (money.ts, dates.ts,
  both test files, README paragraph) — no edits, no reformatting beyond what Prettier already
  reported as a no-op.
- `formatMoney`/`formatSignedMoney`/`formatDate` have no imports; `src/shared` still imports
  nothing from the rest of the codebase (ADR-0002), confirmed by `npm run lint` passing (the
  `eslint-plugin-boundaries` rule would have failed otherwise) and by reading both files: neither
  has an `import` statement at all.
- `tests/unit/shared/dates.test.ts`'s `TZ` `beforeAll`/`afterAll` block was kept exactly as
  given in the brief — did not change or "improve" it.
- Confirmed via `git add src/shared tests/unit/shared` + `git status` that exactly the 5 brief
  files were staged and committed — nothing else in the working tree was touched (it was clean
  both before and after, aside from these 5 files).
- Did not `git add` this report file (it is not in the brief's **Files** list).

## Concerns

- None. The one numeric deviation from the brief's literal text (333/333 vs. the brief's written
  332/332) is expected and pre-authorized by controller ruling R9 relayed in the dispatch; it is
  called out explicitly above rather than silently reported as if it matched the brief.
