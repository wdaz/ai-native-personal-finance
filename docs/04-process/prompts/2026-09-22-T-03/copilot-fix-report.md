# T-03 — Copilot review fixes on PR #8 — implementation report

Working directory: `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/T-03-domain`
Branch: `task/T-03-domain`. Starting HEAD: `94daedb3ec7632b2bef37c9f58c8ec06f0783aca` (clean working
tree, confirmed with `git status`). Brief:
`/Users/ruslan/.claude/jobs/c1c2d60c/tmp/copilot-fix-brief.md`.

The brief's four numbered items map to five touched files, since item 2 names both the source
file (`src/shared/dates.ts`) and its test (`tests/unit/shared/dates.test.ts`) and explicitly
requires editing the test first for a RED/GREEN pair. All five are within the brief's scope; no
other files were touched.

## What was implemented

### 1. `src/domain/bills.ts` — no list copying when grouping by vendor (Copilot, Medium)

In `recurringBills`, replaced the per-iteration spread-copy with an in-place push, matching the
brief's exact code:

```diff
-    byName.set(transaction.name, [...(byName.get(transaction.name) ?? []), transaction]);
+    const list = byName.get(transaction.name);
+    if (list) list.push(transaction);
+    else byName.set(transaction.name, [transaction]);
```

No behavior change: the arrays are local to the function, order of appearance is preserved, and
existing tests (`tests/unit/domain/bills.test.ts`, `overview.test.ts`, `seed-figures.test.ts`)
cover it, so no test edit was needed for this item.

### 2. `src/shared/dates.ts` — quote string inputs in the error (Copilot, Low)

`formatDate`'s thrown message now quotes string inputs via `JSON.stringify`, leaving `Date`
values as `String(value)`:

```diff
-    throw new Error(`Date ${String(value)} is not a valid ISO-8601 date`);
+    throw new Error(
+      `Date ${typeof value === "string" ? JSON.stringify(value) : String(value)} is not a valid ISO-8601 date`,
+    );
```

Prettier wrapped this onto three lines, as specified ("let Prettier wrap it as it wants").

`tests/unit/shared/dates.test.ts`'s `it.each` "refuses %j, which is not an ISO-8601 date with its
zone" now asserts the full quoted message instead of the substring:

```diff
-    expect(() => formatDate(text)).toThrow("is not a valid ISO-8601 date");
+    expect(() => formatDate(text)).toThrow(
+      `Date ${JSON.stringify(text)} is not a valid ISO-8601 date`,
+    );
```

No other changes in that file (the "refuses an invalid Date" test, which asserts only the
substring against `formatDate(new Date(NaN))`, was left untouched, as the brief specifies — an
invalid `Date` still reads `Date Invalid Date is not …`).

### 3. `tests/unit/domain/transactions.test.ts` — the sort test's title (Copilot, Low)

```diff
-  it("orders names as a reader would, ignoring case", () => {
+  it("orders names A to Z as a reader would, not by code unit", () => {
```

Assertions unchanged.

### 4. `tests/unit/shared/money.test.ts` — `-0` as its own test (Copilot, Low)

Removed the `[-0, "$0.00"],` row from `formatMoney`'s `it.each`, and added a standalone `it` after
that block (before the "refuses" `it.each`):

```diff
     [0, "$0.00"],
-    [-0, "$0.00"],
     [99_999_999_999, "$999,999,999.99"],
   ])("writes %d cents as %s", (cents, text) => {
     expect(formatMoney(cents)).toBe(text);
   });

+  it("writes negative zero as $0.00, not -$0.00", () => {
+    expect(formatMoney(-0)).toBe("$0.00");
+  });
+
   it.each([1.5, Number.NaN, 2 ** 53])(
```

Net test count for this file: −1 row, +1 test → unchanged, as the brief predicted.

## TDD evidence (item 2)

**RED** — edited `tests/unit/shared/dates.test.ts` first (quoted-message assertion), before
touching `src/shared/dates.ts`:

```
$ npx vitest run tests/unit/shared/dates.test.ts
...
 Test Files  1 failed (1)
      Tests  5 failed | 19 passed (24)
```

Failing output (one representative case):

```
FAIL tests/unit/shared/dates.test.ts > formatDate (SPEC-overview §4.2: `d MMM yyyy`, UTC) > refuses "2026-08-19T20:23:11", which is not an ISO-8601 date with its zone
AssertionError: expected [Function] to throw error including 'Date "2026-08-19T20:23:11" is not a v…' but got 'Date 2026-08-19T20:23:11 is not a val…'

Expected: "Date "2026-08-19T20:23:11" is not a valid ISO-8601 date"
Received: "Date 2026-08-19T20:23:11 is not a valid ISO-8601 date"
```

The summary line reports 5 failed / 19 passed. The captured output (`tail -60`) showed the
failure detail for 3 of those 5 rows (`"2026-08-19T20:23:11"`, `"2026-08-19T25:00:00Z"`, `""`);
the other 2 rows (`"19 August, maybe"`, `"2026-02-30T00:00:00Z"`) scrolled past the tail window
but are counted in the "5 failed" total. The 3 shown all fail the same way — the old source
produced an unquoted message, the new test expects the quoted one. This is expected: the test
was changed to demand quoting that the source does not yet provide.

**GREEN** — after editing `src/shared/dates.ts` to quote string inputs:

```
$ npx vitest run tests/unit/shared/dates.test.ts
...
 Test Files  1 passed (1)
      Tests  24 passed (24)
```

## Gate commands (literal output)

Prettier, first pass (`--write` on the five touched files):

```
$ npx prettier --write src/domain/bills.ts src/shared/dates.ts tests/unit/shared/dates.test.ts tests/unit/domain/transactions.test.ts tests/unit/shared/money.test.ts
src/domain/bills.ts 28ms (unchanged)
src/shared/dates.ts 5ms (unchanged)
tests/unit/shared/dates.test.ts 5ms
tests/unit/domain/transactions.test.ts 5ms (unchanged)
tests/unit/shared/money.test.ts 3ms (unchanged)
```

This first `--write` reformatted `tests/unit/shared/dates.test.ts` (the long `toThrow` line was
wrapped onto three lines) — the case the implementer rules warn about ("one file in the prototype
needed a second `--write` to settle"). A `--check` pass on the same five paths followed to
confirm it had settled:

```
$ npx prettier --check src/domain/bills.ts src/shared/dates.ts tests/unit/shared/dates.test.ts tests/unit/domain/transactions.test.ts tests/unit/shared/money.test.ts
Checking formatting...
All matched files use Prettier code style!
```

It settled on the first `--write` — the `--check` pass came back clean, so no second `--write`
was needed.

Full gate sequence, chained with `&&` so the reported exit code covers all four gates (not just
the last command run):

```
$ cd /Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/T-03-domain && { npm run format:check && npm run lint && npm run typecheck && npm test; } > /Users/ruslan/.claude/jobs/c1c2d60c/tmp/gates.log 2>&1; echo "exit=$?"; cat /Users/ruslan/.claude/jobs/c1c2d60c/tmp/gates.log
exit=0

> ai-native-personal-finance@0.1.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!

> ai-native-personal-finance@0.1.0 lint
> eslint . --max-warnings 0


> ai-native-personal-finance@0.1.0 typecheck
> tsc --noEmit


> ai-native-personal-finance@0.1.0 test
> vitest run

 Test Files  18 passed (18)
      Tests  341 passed (341)
```

`exit=0` on the `&&`-chained sequence is direct evidence that `format:check`, `lint`, and
`typecheck` each exited 0 (they print nothing on success) before `test` ran and printed
341/341 across 18 files. This matches the brief's *Expected*.

Test-count accounting, checked against the diffs, not assumed:
- `tests/unit/shared/dates.test.ts`: same 5 `it.each` rows before and after (message assertion
  changed, not row count) — directly observed going 24 → 24 in the RED/GREEN runs above; net new
  tests = 0.
- `tests/unit/shared/money.test.ts`: −1 `it.each` row (`-0`), +1 standalone `it`; net new tests
  in this file = 0.
- `tests/unit/domain/transactions.test.ts`: title-only rename; net new tests = 0.
- `src/domain/bills.ts`, `src/shared/dates.ts`: source-only edits, no new tests.
- Total: 341 (per the dispatch brief's count at starting HEAD `94daedb`, not independently
  re-run at that commit) → 341 (observed in the `npm test` run above, and again in the
  `&&`-chained gate run). The suite was not re-run at 94daedb to verify the "before" figure
  independently; it is taken from the dispatch and the task brief, both of which state 341/341,
  18 files.

## Files changed

Literal `git show --stat HEAD`:

```
 src/domain/bills.ts                    | 4 +++-
 src/shared/dates.ts                    | 4 +++-
 tests/unit/domain/transactions.test.ts | 2 +-
 tests/unit/shared/dates.test.ts        | 4 +++-
 tests/unit/shared/money.test.ts        | 5 ++++-
 5 files changed, 14 insertions(+), 5 deletions(-)
```

Per-file insertions/deletions (from the `+`/`-` marks in each stat row, not the total column):
`bills.ts` 3/1, `dates.ts` 3/1, `transactions.test.ts` 1/1, `dates.test.ts` 3/1,
`money.test.ts` 4/1. Sum: 14 insertions, 5 deletions — matches the total line.

## Commit

```
$ git add src/domain/bills.ts src/shared/dates.ts tests/unit/shared/dates.test.ts tests/unit/domain/transactions.test.ts tests/unit/shared/money.test.ts
$ GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit \
  -m "fix(domain,shared): Copilot review on #8 — no list copying in recurringBills, quoted date errors, two test titles (T-03)" \
  -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BQp5Lv2Sruz5RCgSMYmHWa"
[task/T-03-domain cc2882b] fix(domain,shared): Copilot review on #8 — no list copying in recurringBills, quoted date errors, two test titles (T-03)
 5 files changed, 14 insertions(+), 5 deletions(-)
```

The commit command exited successfully and printed the commit summary (`git commit` output
above), so the pre-commit hook did not block it; `--no-verify` was not used. (The hook's own
output was not separately captured.) Commit: short SHA `cc2882b`, full SHA
`cc2882bcd3a9d4d65531669ba3c0cbf1870cb729`.

Attribution: used my own session's system-reminder attribution lines (Claude Sonnet 5 / this
session's `Claude-Session` URL) rather than the brief's default (Claude Opus 5.5) form, per
implementer-rules.md: "If your own session gives you attribution lines... use those — they name
the model that actually wrote the commit."

Not pushed. No PR opened.

## Self-review findings

- All four Copilot comments addressed with the exact code the brief specified; no deviations.
- Diffs verified against the brief line-by-line before committing (`git diff` reviewed in full).
- `git add` was scoped to exactly the five named paths; `git status --short` after commit shows a
  clean working tree, confirming nothing else was staged or left uncommitted.
- Test count net-zero as predicted: bills.ts and dates.ts source edits added no tests (existing
  coverage); dates.test.ts's `it.each` kept the same 5 rows (message assertion changed, not row
  count); money.test.ts is −1 row +1 test (net zero); transactions.test.ts is a title-only
  rename. Vitest confirms 341/341 across 18 files, matching the pre-task count.
- Governance rules honored: no whole-tree-rewriting or shared-git-state commands were run; no
  dependency was installed, added or upgraded; no push; no PR; only the five files named in the
  brief were touched; the pre-commit hook was not bypassed.

## Concerns

The dispatch says "Touch only the four files the brief names," but the brief's item 2
explicitly requires editing a fifth file, `tests/unit/shared/dates.test.ts` (with its own
RED/GREEN steps), alongside `src/shared/dates.ts`. Read as "four Copilot comments, five files
total" this is unambiguous and was followed as written; flagging it here so the process record
is accurate. This did not block anything and needs no revert.

All gates green; no other unexpected failures or judgment calls.
