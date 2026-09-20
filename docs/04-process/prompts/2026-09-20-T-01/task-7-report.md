# Task 7 Implementation Report

## Overview
Implemented Task 7 of the T-01 scaffold: configured Playwright for Chromium, Firefox and
WebKit per ADR-0003, added the T-01 E2E smoke test, and wired `test:api`, `test:e2e`,
`test:e2e:ui` and `test:all` into `package.json`.

## Files Created and Modified

### Created
- `playwright.config.ts` — exact content from the brief. `testDir: "tests"`; four projects
  (`api`, `chromium`, `firefox`, `webkit`); `webServer.command` is `npm run build && npm run
  start` (never `next dev`); retries `1` in CI / `0` locally; `reuseExistingServer:
  !process.env.CI`.
- `tests/e2e/scaffold.spec.ts` — exact content from the brief. One test, role-based locator
  (`getByRole("heading", { level: 1 })`), asserting the text `Personal Finance — scaffold`.
  Verified byte-for-byte (`xxd`) that the em dash in the assertion (`e2 80 94`, U+2014)
  matches the em dash already in `app/page.tsx` — no ASCII hyphen substitution.

### Modified
- `package.json`:
  - Added `@playwright/test: ^1.63.0` to `devDependencies` (via `npm install -D`).
  - Added four scripts via `npm pkg set` (existing scripts untouched, order preserved):
    ```
    "test:api": "playwright test --project=api --pass-with-no-tests",
    "test:e2e": "playwright test --project=chromium --project=firefox --project=webkit",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run lint && npm run format:check && npm run typecheck && npm test && npm run test:api && npm run test:e2e"
    ```
- `package-lock.json`: updated by `npm install` — exactly 3 packages added
  (`@playwright/test@1.63.0`, `playwright@1.63.0`, `playwright-core@1.63.0`). Diff checked
  after install; nothing else changed.
- `.gitignore`: **not modified**. Confirmed it already ignores `playwright-report/` and
  `test-results/` (lines present before this task).

Not touched, as instructed: `.env.example`, `tests/unit/scaffold.test.ts`.

## Verification Commands and Output (verbatim)

### 1. `npx playwright install --with-deps chromium firefox webkit`
Ran in the background (large download). Tail of output:
```
Chrome Headless Shell 153.0.8010.12 (playwright chromium-headless-shell v1243) downloaded to /Users/ruslan/Library/Caches/ms-playwright/chromium_headless_shell-1243
Firefox 155.0 (playwright firefox v1543) downloaded to /Users/ruslan/Library/Caches/ms-playwright/firefox-1543
WebKit 26.6 (playwright webkit v2359) downloaded to /Users/ruslan/Library/Caches/ms-playwright/webkit-2359
[exited with code 0]
```
(`--with-deps` is a no-op on macOS, as the brief notes.)

### 2. `npm run test:e2e`
```
> playwright test --project=chromium --project=firefox --project=webkit

[WebServer]
[WebServer] > ai-native-personal-finance@0.1.0 build
[WebServer] > next build
[WebServer] ▲ Next.js 16.3.5 (Turbopack)
[WebServer] ✓ Compiled successfully in 255ms
[WebServer] ✓ Generating static pages using 4 workers (3/3) in 143ms
[WebServer]
[WebServer] > ai-native-personal-finance@0.1.0 start
[WebServer] > next start
[WebServer] ▲ Next.js 16.3.5
[WebServer] - Local:         http://localhost:3000
[WebServer] ✓ Ready in 47ms

Running 3 tests using 3 workers

  ✓  2 [firefox] › tests/e2e/scaffold.spec.ts:9:1 › scaffold: the application boots and serves the root route (636ms)
  ✓  1 [chromium] › tests/e2e/scaffold.spec.ts:9:1 › scaffold: the application boots and serves the root route (1.6s)
  ✓  3 [webkit] › tests/e2e/scaffold.spec.ts:9:1 › scaffold: the application boots and serves the root route (1.4s)

  3 passed (16.0s)
EXIT:0
```
Confirms: `next build` then `next start` in the web-server log (never `next dev`), 3 passed,
one per browser.

### 3. `npm run test:api`
```
> playwright test --project=api --pass-with-no-tests
[WebServer] ... next build ... next start ... Ready in 47ms
EXIT:0
```
No test files exist yet in `tests/api/`, so no test-result lines are printed; `--pass-with-
no-tests` keeps the exit code at 0. Matches the brief's expectation.

### 4. `npm test`
```
 Test Files  1 passed (1)
      Tests  96 passed (96)
   Duration  76ms
EXIT:0
```
Still 96 unit tests, unchanged by this task.

### 5. `npm run lint`
```
> eslint .
EXIT:0
```
No output, no warnings.

### 6. `npm run typecheck`
```
> tsc --noEmit
EXIT:0
```

### 7. `npm run format:check`
```
> prettier --check .
Checking formatting...
All matched files use Prettier code style!
EXIT:0
```
Passed on the first run — `npm run format` (which is `prettier --write .`, repo-wide) was
never needed. See Deviations for why that matters here.

## Commit Details
- **Commit SHA**: `dc51092944a1fe583624a602367877aca632b5db`
- **Message**: `test(e2e): Playwright on Chromium, Firefox and WebKit per ADR-0003 (T-01)`
- **Files staged and committed** (explicitly, not `git add -A`): `package.json`,
  `package-lock.json`, `playwright.config.ts`, `tests/e2e/scaffold.spec.ts`
- **Stat**: 4 files changed, 117 insertions(+), 1 deletion(-)
- Working tree confirmed clean after commit (`git status --short` empty).

## Test Summary
`npm run test:e2e` → 3/3 passed (chromium, firefox, webkit); `npm run test:api` → exit 0
(no tests, tolerated); `npm test` → 96/96 passed; `npm run lint`, `npm run typecheck`,
`npm run format:check` → all exit 0.

## Deviations and Notes

### None from the brief's file content
`playwright.config.ts` and `tests/e2e/scaffold.spec.ts` were written byte-for-byte from the
brief, including the em dash in the assertion string (verified with `xxd`, not just visual
inspection).

### Sequencing choice: avoided repo-wide *write* commands
This worktree is shared live with other implementation subagents (I never saw a separate
worktree directory for tasks 4/5/6 — `ls .claude/worktrees/` shows only `T-01-scaffold`).
The team lead's brief for this task says, if `format:check` fails, to "run `npm run format`
first" — but `npm run format` is `prettier --write .` across the *entire* repository, and
`npm run lint:fix` is similarly repo-wide and mutating. Either could have rewritten
`.env.example` or `tests/unit/scaffold.test.ts` while another agent was mid-edit on them,
which the brief's context notes explicitly forbid touching. I treated `npm run lint` and
`npm run format:check` as safe (read-only) and ran them repo-wide as instructed, but planned
to scope any *fix* narrowly to my own files (`npx prettier --write playwright.config.ts
tests/e2e/scaffold.spec.ts package.json`) instead of the blanket script if a fix had been
needed. It was not needed — `format:check` passed on the first try — so no deviation
actually occurred in practice, but I flag the reasoning in case a future task's brief
assumes the blanket `npm run format` is always safe to run in this shared worktree.

### Runtime port-collision risk (observation, not a defect in this task's deliverable)
`playwright.config.ts` (per the brief, verbatim) defaults `baseURL` to
`http://127.0.0.1:3000` and sets `reuseExistingServer: !process.env.CI`. Since this worktree
is shared by concurrent subagents on the same machine, if another agent's process were bound
to port 3000 at the same time, Playwright would silently reuse *that* server instead of
starting its own, which could produce a false pass/fail against the wrong build. I checked
`lsof -iTCP:3000` before and after both `test:e2e` and `test:api` runs — port 3000 was free
each time, and I did not modify the config to work around this (it matches the brief and
ADR-0003 verbatim, and neither mentions per-task ports). Noting it as a fragility for the
team lead's awareness, not something I fixed unilaterally.

## Concerns
- The shared-worktree port-collision risk above, if tasks 8/9 or CI ever run E2E suites
  concurrently against the same machine/port.
- None regarding correctness or completeness of this task's own deliverable — all brief
  steps and all requested verification commands passed as specified.
