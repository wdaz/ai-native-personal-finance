# Task 1 report: TD-7, the indicator hears that a failure is gone

Status: DONE
Commit: 7b37e18 `fix(webmcp): tell status listeners a failure is cleared before the tools settle (TD-7)` on `task/T-13c-tech-debt` (not pushed).

## What I implemented

- `src/webmcp/adapter.ts`, `register()`: after `generation = controller;` it now reads `const hadFailed = registrationFailed;`, calls `clearFailure()`, then `if (hadFailed) notify();`. The comment block from the brief is included verbatim. A cleared failure is pushed to every `onStatus` listener at once, with `{ mode: resolvedMode, count: registeredNames.length }`. A `register()` that follows no failure pushes nothing before its tools settle.
- `tests/unit/webmcp/adapter.test.ts`: two tests added to "a rejected registration is reported, not swallowed", inserted after "the next register() clears the previous failure without an unregisterAll in between", exactly as in the brief's diff.
  - `TD-7 — the next register() tells the listeners the failure is gone before its tools settle` (red before the fix).
  - `TD-7 — a register() that follows no failure pushes nothing before its tools settle` (control, green before and after).

## TDD evidence

RED (tests written, fix not yet applied):

```
npx vitest run tests/unit/webmcp/adapter.test.ts -t "TD-7"
 × TD-7 — the next register() tells the listeners the failure is gone before its tools settle
AssertionError: expected { mode: 'unavailable', count: +0 } to deeply equal { mode: 'polyfill', count: +0 }
  ❯ tests/unit/webmcp/adapter.test.ts:331:43
     330| expect(adapter.mode()).toBe("polyfill");
     331| expect(statuses[statuses.length - 1]).toEqual({ mode: "polyfill", …
 Test Files 1 failed (1)
      Tests 1 failed | 1 passed | 20 skipped (22)
```

This is the expected failure and matches the brief's measured numbers. `adapter.mode()` already returned `polyfill` on line 330, because `clearFailure()` had reset the flag. The listener's last pushed status was still `unavailable` on line 331. `register()` did not call `notify()` until its tools settled, and that gap is the bug. The control test passed, which shows the failing assertion is specific to the cleared-failure path.

GREEN (after the fix):

```
npx vitest run tests/unit/webmcp/adapter.test.ts -t "TD-7"
 Test Files 1 passed (1)
      Tests 2 passed | 20 skipped (22)

npx vitest run tests/unit/webmcp
 Test Files 8 passed (8)
      Tests 89 passed (89)          (87 before, +2, as the brief expected)
```

Extra check, full suite: `npx vitest run` gave `Test Files 77 passed (77)`, `Tests 960 passed (960)`. That is 958 baseline + 2.

Static checks, all clean with no output or warnings:

- `npx prettier --check src/webmcp/adapter.ts tests/unit/webmcp/adapter.test.ts`: "All matched files use Prettier code style!"
- `npx tsc --noEmit`: exit 0, no output
- `npx eslint src/webmcp tests/unit/webmcp --max-warnings 0`: exit 0, no output

The pre-commit hook (gitleaks) ran on the staged diff and the commit succeeded without `--no-verify`.

## Files changed

- `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/t-13c-tech-debt/src/webmcp/adapter.ts` (+5 lines, -0; the `clearFailure()` line stays, with 4 new lines and a comment around it)
- `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/t-13c-tech-debt/tests/unit/webmcp/adapter.test.ts` (+57 lines, two tests)

Commit stat: 2 files changed, 62 insertions. Working tree is clean after the commit.

## Self-review

- Only consumer of `onStatus` in `src` is `src/webmcp/WebMcpProvider.tsx` (the indicator's provider). It just sets state from `{ mode, count }`, so an extra earlier `notify()` is harmless and idempotent.
- `notify()` is called synchronously before the first `await`, so a listener sees the cleared state before `getModelContext()` resolves. This also covers the `context === null` early return, where nothing else would ever have notified.
- Only a cleared failure changes what `status()` reports at this point. Other state (`resolvedMode`, `registeredNames`) is untouched by `clearFailure()`. So gating on `hadFailed` is correct, and the second test guards against noisy pushes.
- `unregisterAll()` already calls `notify()` after `clearFailure()`, so it needed no change.
- Expected numbers matched the brief exactly (1 failed / 1 passed / 20 skipped; 8 files / 89 tests). I edited no expectations.

## Concerns

None. One observation for the controller: `register()` now can notify twice per failed-then-cleared cycle (once immediately, once after settling). This is intended and pinned by the first test's two assertions.
