# Task 3 report — TD-9: a bare `fr` column track fails `npm run lint` and the unit suite (Stylelint)

Status: DONE. Commit `bb6e2fe` — `test(css): fail on a bare fr column track with Stylelint (TD-9)` on
`task/T-13c-tech-debt` (not pushed). Every step ran as written in the brief; every measured number
matched, with two cosmetic differences noted below (which file the RED run names first, and that
the regex mutation also flags `1.5fr` at line 14 besides `11fr`).

## What was implemented

- `stylelint@17.15.0` as a dev dependency (`package.json` `"stylelint": "^17.15.0"`, `package-lock.json`),
  installed with `--ignore-scripts`.
- `stylelint.config.mjs` — one rule, `declaration-property-value-disallowed-list` on
  `grid-template-columns`, a `BARE_FR` regex, no `extends`, `const config = {…}; export default config;`
  (not an anonymous default export). Contents are the brief's, verbatim.
- `package.json` scripts: `lint` = `eslint . --max-warnings 0 && npm run lint:css`; new
  `lint:css` = `stylelint "app/**/*.css" "src/**/*.css" --max-warnings 0`.
- `README.md` scripts table: the `npm run lint` row extended (", then `lint:css`") and a new
  `npm run lint:css` row (the brief's cells, same column width, so Prettier is happy).
- Fixtures `tests/fixtures/css-grid/bare-fr.css.fixture` (8 violations) and
  `tests/fixtures/css-grid/definite-minimum.css.fixture` (control), verbatim from the brief. The
  violation fixture's declarations are on lines 4, 8, 12, 16, 20, 24, 29, 34 (checked with `grep -n`),
  matching the test's expected list exactly.
- `tests/unit/css-grid.test.ts` — 3 tests, verbatim from the brief.

## Step 1: install, install-scripts policy, audit

- `npm install --ignore-scripts --save-dev stylelint@17.15.0` -> `added 75 packages, and audited 691
  packages in 8s`, `found 0 vulnerabilities`. `git diff --stat`: `package-lock.json | 1085 +++---`,
  `package.json | 1 +` (1051 insertions, 35 deletions).
- `npx vitest run tests/unit/install-scripts.test.ts` -> `Test Files 1 passed`, `Tests 3 passed`.
- `npm audit --audit-level=high` -> `found 0 vulnerabilities`, exit 0.
- Q4's two conditions hold; not BLOCKED.

## TDD evidence

RED (fixtures and test written, no `stylelint.config.mjs`):

```
npx vitest run tests/unit/css-grid.test.ts
 Test Files  1 failed (1)
      Tests  3 failed (3)
ConfigurationError: No configuration provided for
  .../app/globals.css                          (real-tree test — the first file the glob reaches)
  .../src/ui/css-grid-fixture.module.css       (both fixture tests)
```

This is the expected failure: Stylelint looks up a configuration for the file, finds none, and
throws before any rule runs. The tests fail because the rule is missing, not because of a typo in
the test, a bad fixture path, or an import error (`stylelint` imported and `lint()` ran).

GREEN (after config + scripts + README):

```
npx vitest run tests/unit/css-grid.test.ts   ->  Test Files 1 passed | Tests 3 passed
npm run lint:css                             ->  prints only the npm header lines, exit 0
```

## Step 7: both guards can fail, then undo

Real-tree mutation (`sed -i.bak` accepted as a single command; `1fr 1fr` in the two overview files):

```
npm run lint:css        -> exit code 2
app/(app)/overview/page.module.css
  40:28  ✖  TD-9: a bare fr column track sizes as minmax(auto, Nfr) and can push a card past the page at 320 px; write minmax(0, Nfr).  declaration-property-value-disallowed-list
src/ui/overview/PotsCard.module.css
  57:26  ✖  TD-9: a bare fr column track sizes as minmax(auto, Nfr) ... declaration-property-value-disallowed-list
✖ 2 problems (2 errors, 0 warnings)

npx vitest run tests/unit/css-grid.test.ts
  Tests  1 failed | 2 passed  — the failing one is "no stylesheet under app/ or src/ has one"
  (received the same two violations, at page.module.css:40 and PotsCard.module.css:57)
```

The glob reaches `app/(app)/…` (a parenthesised directory) and the line:column pairs match the
brief's measurement. Undone with `git checkout -- <both files>` and `rm` of both `.bak` files;
`git status --short` afterwards showed only `README.md`, `package-lock.json`, `package.json`,
`stylelint.config.mjs`, `tests/fixtures/css-grid/`, `tests/unit/css-grid.test.ts` — neither CSS file
changed, no `.bak`.

Regex mutation (deleted the first lookbehind `(?<![\d.])` from `BARE_FR`):

```
npx vitest run tests/unit/css-grid.test.ts
  Tests  1 failed | 2 passed  — "(fixture) accepts a definite minimum, ignores comments, rows and custom properties"
  two false positives in the control fixture: line 14 (`minmax(120px, 1.5fr)` — `5fr` read as bare)
  and line 41 (`minmax(0, 11fr) minmax(0, 1.5fr)` — `1fr`/`5fr` read as bare)
```

Slightly more than the brief's note (which names `11fr`): the decimal `1.5fr` at line 14 is also
caught, since the same lookbehind (`[\d.]`) protects both. Lookbehind put back; test re-run
`3 passed`; `stylelint.config.mjs` is back to the committed content.

## Step 8: checks

- `npm run lint` -> ESLint clean (`--max-warnings 0`), then `lint:css` clean; exit 0.
- `npx prettier --check .` -> `All matched files use Prettier code style!`
- `npx tsc --noEmit` -> no output, exit 0.
- `git add package.json package-lock.json README.md stylelint.config.mjs tests/fixtures/css-grid tests/unit/css-grid.test.ts`
  (explicit paths), then `sh scripts/secret-scan.sh staged` -> silent, exit 0 (no findings; the
  lockfile's integrity hashes are not findings, as the brief predicted).
- Whole unit suite `npx vitest run` -> `Test Files 78 passed (78)`, `Tests 963 passed (963)` —
  exactly the expected 77 -> 78 files and 960 -> 963 tests.
- `git commit -F .../commit-msg-3.txt` succeeded without `--no-verify`; message is the brief's
  subject, a blank line, then the two trailer lines. `git status` clean afterwards. The commit
  printed no hook output; `core.hooksPath` is `/Users/ruslan/Own/ai-native-personal-finance/scripts/git-hooks`
  and an executable `pre-commit` exists there, so it presumably ran silently (I did not observe it).

## Files changed (commit bb6e2fe, 7 files, +1227/-37)

- `package.json`, `package-lock.json` (npm-generated), `README.md`
- `stylelint.config.mjs` (new)
- `tests/fixtures/css-grid/bare-fr.css.fixture`, `tests/fixtures/css-grid/definite-minimum.css.fixture` (new)
- `tests/unit/css-grid.test.ts` (new)

Also written (untracked/ignored, not in the commit): `.superpowers/sdd/2026-09-24-T-13c/commit-msg-3.txt`,
this report.

## Self-review

- Every brief file and step is covered; the config, fixtures and test are byte-for-byte the brief's.
- The test reads the shipped config via `codeFilename` under `src/`, so it tests the real rule
  rather than a copy; the real-tree test also asserts the two known overview stylesheets were
  scanned, so an empty glob cannot pass vacuously.
- Both guards were shown to fail (real-tree regression and the regex's lookbehind) and were undone
  cleanly; nothing outside the task's files is touched.
- Scope of the rule is documented in the config's header comment (rows, `grid-auto-columns`,
  `grid` / `grid-template` shorthands are out of scope, as TD-9 states it).
- `docs/03-specs/tech-debt.md` has the TD-9 entry (table row and section at line 221) that the
  config comment cites. I did not update its status column ("Open") or the process log: the brief
  does not list those files for Task 3, so I left them to the controller / a later task.

## Concerns

- None blocking. Observations only:
  1. The RED output's first failing file for the real-tree test is `app/globals.css` (first file the
     glob reaches), not the `src/ui/…` fixture path — same `ConfigurationError`, just a different
     file name than the brief's example.
  2. `docs/03-specs/tech-debt.md` still lists TD-9 as `Open`, and no process-log entry was added by
     this task (neither is in the brief's file list) — the controller should decide whether a later
     task in the plan closes those.
  3. `stylelint@17.15.0` pulled 75 packages (1085 lines in the lockfile, as measured); audit is 0
     and the install-script policy test still passes.
