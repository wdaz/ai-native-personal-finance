# T-13 Task 2 report: the coverage gate (NFR-T1)

Worktree `.claude/worktrees/t-13-ci-hardening`, branch `task/T-13-ci-hardening`, base b716787 (Task 1).

## Commit

- `5819364` test(ci): enforce 90 % domain coverage and drop vite-tsconfig-paths (11 files, +116/-59).

## What was done

Brief Steps 1-8 as written, the code taken verbatim from the brief: `tests/fixtures/child-env.ts`,
`tests/fixtures/coverage-gate/{vitest.config.ts,half.test.ts,src/domain/half.ts}`,
`tests/unit/coverage-gate.test.ts`, `vitest.thresholds.json`, rewritten `vitest.config.ts`
(`resolve: { tsconfigPaths: true }`, thresholds imported from the JSON),
`npm uninstall vite-tsconfig-paths --ignore-scripts`, `package.json` `test:all` now uses
`npm run test:coverage`, `ci.yml` unit step renamed and switched to `npm run test:coverage`,
one paragraph added to `tests/unit/README.md`.

## TDD evidence

RED (Step 2, `npx vitest run tests/unit/coverage-gate.test.ts`, before `vitest.thresholds.json` existed;
matched the prediction):

    × names src/domain and demands 90 % of statements
    Error: ENOENT: no such file or directory, open '.../t-13-ci-hardening/vitest.thresholds.json'
    × fails a run whose domain file is mostly untested, and names the threshold
    failed to load config from .../tests/fixtures/coverage-gate/vitest.config.ts
    [UNRESOLVED_IMPORT] Could not resolve '../../../vitest.thresholds.json' ...
    Test Files 1 failed (1) / Tests 2 failed (2)

GREEN (Step 5, after the JSON and the config): `Test Files 1 passed (1) / Tests 2 passed (2)`, and
the nested fixture run really reports 33.33 % against the 90 % threshold (the regex in the test
matches it). The Vite notice about `vite-tsconfig-paths` appears in the RED output only (the plugin
was still imported); it is gone after the rewrite.

## Real-config proof the threshold is not vacuous (Step 6)

`vitest.thresholds.json` temporarily set to `101`, `npx vitest run --coverage tests/unit/domain`:

    domain | 86.25 | 63.63 | 89.65 | 85.91
    Statements   : 17.73% ( 69/389 )
    ERROR: Coverage for statements (86.25%) does not meet "src/domain/**" threshold (101%)
    exit code 1

The same command at the real value 90 also exited 1 with `... (86.25%) does not meet "src/domain/**"
threshold (90%)` (domain measured by its own folder only). The edit was reverted to 90; the committed
file is `{ "src/domain/**": { "statements": 90 } }`.

## Full-suite numbers

- `npm run test:coverage`: 72 files / 877 tests passed; statements 99.22 % (386/389), branches 95.9 %,
  functions 99 %, lines 99.71 %. No `Failed to parse`, no `vite-tsconfig-paths` notice. Identical to
  the brief's measurement, so the nested run did not leak coverage. The full run's text table lists
  only files below 100 % (shared, webmcp); the domain folder is fully covered and therefore absent,
  as the folder-only run above shows domain is measured.
- `npm test` (final): 72 files / 877 tests passed (baseline 875 + these 2).
- `npx vitest run tests/unit/secret-guard.test.ts -t "test:all"`: 1 passed, 25 skipped.
- `npm run typecheck`: clean. `npm run lint`: clean. `npm run format:check`:
  "All matched files use Prettier code style!". `npx prettier --write` over the touched files:
  every file "(unchanged)".
- After the commit `git status --short --branch` in the t-13-ci-hardening worktree: clean tree,
  `ahead 2` of origin/main (nothing new from the nested fixture run).

## package.json / lock

`git diff --stat package.json package-lock.json` (before commit): package-lock.json 57 lines
(7 insertions, 53 deletions), package.json 3 lines (the dependency line removed, `test:all` changed).
`npm uninstall` output: "removed 3 packages ... found 0 vulnerabilities". Removed from the lock:
`vite-tsconfig-paths`, `globrex`, `tsconfck` (its orphaned transitive deps). Six `"dev": true` entries flipped
to `"devOptional": true` (`@babel/helper-string-parser`, `@babel/helper-validator-identifier`,
`@babel/parser`, `@babel/types`, `@types/react-dom`, `magicast`) — npm's own bookkeeping now that `tsconfck`
is gone; not hand-edited.
`npm audit --audit-level=high`: `found 0 vulnerabilities`.

## Deviations

- The README paragraph was added together with the other edits, before Step 7's ordering; same commit.
- actionlint (Step 8, "Task 1 Step 2's command") is not installed here (`which actionlint`: not found),
  and I did not find its invocation in the task files; skipped. The only `ci.yml` change is a step
  `name` and `run` line (`npm run test:coverage`); the job names `E2E (Chromium, polyfill)`,
  `E2E (Chromium, off)` and `secret scan` are untouched.
- No server/Playwright/docker commands were run.

## Concerns

- Environment: the session's working directory silently reverted to another worktree
  (`pr-a-origin-agent-cluster`) after roughly every Bash call, so I re-entered `t-13-ci-hardening`
  with `EnterWorktree` repeatedly. A few reads (`git status --short` showing docs files, one
  `npm test` with 881 tests) ran in the wrong worktree and were discarded; every number above is from a
  run whose `RUN` banner or output path was the t-13 worktree, and `git add` used explicit paths only.
  Nothing in the other worktree was modified. (The `typecheck`/`lint`/`format:check` results were
  re-run in one batch right after re-entering; their output has no path banner, but `npm test` in the
  same batch printed the t-13 path.)
- The gate needs the whole suite: `src/domain` is 100 % in the full run but 86.25 % by
  `tests/unit/domain` alone.

## Follow-up round (Minor 1 and Minor 4)

Commit `f993832` test(ci): pin the real coverage gate's wiring and document the gate fixtures
(3 files, +32/-5; 5819364 untouched).

Minor 1: a third case in `tests/unit/coverage-gate.test.ts`, "is wired into the real config, and its
glob selects domain files". It imports `config from "../../vitest.config"` (typechecks as is), asserts
`config.test?.coverage?.thresholds` deep-equals the parsed `vitest.thresholds.json`, asserts some
`coverage.include` pattern matches `src/domain/x.ts`, and asserts package.json's `test:coverage` is
`vitest run --coverage`. Matching uses `matchesGlob` from `node:path` (Node >= 26 per `engines`,
typed in `@types/node`): `picomatch` is not a direct dependency and has no `@types`, so importing it
would need a new dependency; `matchesGlob("src/domain/x.ts", "src/domain/**/*.{ts,tsx}")` is true
and `src/shared/x.ts` false (checked).

RED by mutation, real output (each mutation reverted; `git diff --stat vitest.config.ts` empty after):

1. `"src/domain/**/*.{ts,tsx}", ` removed from `coverage.include`:

       × is wired into the real config, and its glob selects domain files
       AssertionError: expected false to be true // Object.is equality
        ❯ tests/unit/coverage-gate.test.ts:33:80   (the include.some(matchesGlob) line)
       Tests  1 failed | 2 passed (3)

2. `thresholds,` removed from `coverage`:

       AssertionError: expected undefined to deeply equal { 'src/domain/**': { statements: 90 } }
        ❯ tests/unit/coverage-gate.test.ts:29:34
       Tests  1 failed | 2 passed (3)

GREEN with the real config restored: `Test Files 1 passed (1) / Tests 3 passed (3)`.

Minor 4: `tests/fixtures/README.md` gains a T-13 paragraph for `child-env.ts` and `coverage-gate/`;
`tests/unit/README.md` moves the T-13 paragraph after T-12's, rewritten to list the three checks and to
say that the real gate runs only under `npm run test:coverage` (CI, `npm run test:all`) while `npm test`
runs the checks of it.

Final runs (each its own command, in the t-13 worktree, prettier `--write` left all three touched files
unchanged): `npx vitest run tests/unit/coverage-gate.test.ts` 3 passed; `npm run typecheck` clean;
`npm run lint` clean; `npm run format:check` clean; `npm test` 72 files / 878 tests passed (877 + 1).
`git branch --show-current` before committing: `task/T-13-ci-hardening`.
