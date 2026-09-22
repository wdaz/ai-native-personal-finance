# Task 4 report: CI jobs and the run instructions

## What was implemented

Followed `task-4-brief.md` Steps 1–6 (Step 6 stopped after `git commit`, per controller
ruling P1 — no `git push`, `gh pr create` or `gh pr checks` was run).

1. **`.github/workflows/ci.yml`**
   - Replaced the `push.branches` trigger and its comment: `[main, master]` →
     `[main]`, with the new comment recording the 2026-09-22 owner decision.
   - Appended two jobs after `verify`, copied verbatim from the brief:
     - `secret-scan` (display name `secret scan`): checkout with `fetch-depth: 0` and
       `persist-credentials: false`, then `scripts/secret-scan.sh history`.
     - `audit` (display name `npm audit`): checkout (`persist-credentials: false`),
       `setup-node` from `.nvmrc`, then `npm audit --audit-level=high`, reporting via
       `::warning` on failure without failing the step/job.
2. **`README.md`** ("Run locally")
   - `npm run test:all` comment: `lint, format, typecheck, unit, API and E2E` →
     `secret scan, lint, format, typecheck, unit, API and E2E`.
   - Added the paragraph about `npm ci`/`npm install` installing the pre-commit hook,
     the first-scan download/checksum, `curl`+network requirement, and
     `--no-verify` vs. CI, after the "Executable doesn't exist" paragraph.
   - Added the `npm run secrets:scan` row to the command table, after
     `npm run typecheck`, padded to the existing column widths.
3. **`scripts/README.md`**
   - Appended the "Secret guard (T-02a, NFR-S5)" section verbatim (intro sentence plus
     the four-row file/role table).

No other files were touched (docs/, tests, and scripts/* were left untouched, per the
controller's notes).

## Verification

### Step 2 — workflow file check

```
$ npx prettier --check .github/workflows/ci.yml
Checking formatting...
All matched files use Prettier code style!

$ ruby -ryaml -e 'y = YAML.load_file(".github/workflows/ci.yml"); p y[true]; p y["jobs"].keys; p y["jobs"]["secret-scan"]["steps"][0]["with"]'
{"pull_request"=>nil, "push"=>{"branches"=>["main"]}}
["verify", "secret-scan", "audit"]
{"fetch-depth"=>0, "persist-credentials"=>false}
```

Matches the brief's expected output exactly.

### Step 4 — `scripts/README.md` check

First run of `npx prettier --check scripts/README.md` failed (exit 1, "Code style issues
found"). This is a real, minor deviation from the brief's stated expectation ("expected
clean"): the pasted table's second header-separator row (`| --- | --- |`) had one extra
trailing space inside the "Role" column's dashes compared to what Prettier's own
table-formatter produces for that content width. Running `npx prettier --write
scripts/README.md` reformatted only that whitespace — the diff after `--write` shows no
content change, only column-width normalization of the table — and a second `--check`
came back clean:

```
$ npx prettier --check scripts/README.md
Checking formatting...
[warn] scripts/README.md
[warn] Code style issues found in the above file. Run Prettier with --write to fix.

$ npx prettier --write scripts/README.md
scripts/README.md 15ms

$ npx prettier --check scripts/README.md
Checking formatting...
All matched files use Prettier code style!
```

This is a formatting-only correction (identical text, re-padded columns), not a content
deviation from the brief, so it is not flagged as a concern.

### Step 5 — the whole suite

```
$ npm run test:all
```

Ran to completion, green end to end:

- `secrets:scan` (`scripts/secret-scan.sh history`): `57 commits scanned.` /
  `scanned ~2093476 bytes (2.09 MB) in 149ms` / `no leaks found`. (No
  "downloading gitleaks" line — the cache from earlier task runs in this worktree was
  already populated; the brief's download-line note is conditional on a fresh `npm ci`.)
- `lint`: clean (no output, no warnings, `--max-warnings 0`).
- `format:check`: "All matched files use Prettier code style!"
- `typecheck`: clean (no output).
- `test` (Vitest, `tests/unit`): **3 test files, 144 tests, all passed** (T-01's suite
  plus these 19 — confirmed separately below).
- `test:api` (Playwright, `--project=api --pass-with-no-tests`): built and started the
  app, no API tests exist yet (empty until T-05), no failures.
- `test:e2e` (Playwright, chromium/firefox/webkit): built and started the app again,
  3 tests passed (1 per engine, `tests/e2e/scaffold.spec.ts`).

Playwright browsers were already installed on this machine (from T-01); the run never
hit "Executable doesn't exist", so no `playwright install` was needed.

Isolated confirmation that the 19 secret-guard tests are inside that 144-test total and
did not silently get excluded:

```
$ npx vitest run tests/unit/secret-guard.test.ts
 Test Files  1 passed (1)
      Tests  19 passed (19)
```

## TDD / mutation-testing note

Task 4's brief contains no TDD step and no "make each guarantee fail on purpose" step —
its six steps edit a workflow file and two READMEs, with no new script, config rule or
test to prove. The guarantees this backlog item makes (the gitleaks rule, the pre-commit
hook, the history scan, the installer) were built and mutated-to-red in Tasks 1–3
(`scripts/gitleaks.sh`, `.gitleaks.toml`, `scripts/secret-scan.sh`,
`scripts/git-hooks/pre-commit`, `tests/unit/secret-guard.test.ts` — 19 tests, all
exercised RED→GREEN in those tasks' own reports). Per the controller's notes, Task 4 does
not touch the test file or any script, so there is nothing here to mutate; the RED/GREEN
and mutation sections of this report are intentionally omitted rather than manufactured
against `ci.yml` or the READMEs.

## Files changed

- `.github/workflows/ci.yml` — push trigger `main` only; `secret-scan` and `audit` jobs added.
- `README.md` — "Run locally": `test:all` comment, hook paragraph, `secrets:scan` table row.
- `scripts/README.md` — "Secret guard (T-02a, NFR-S5)" section appended.

```
$ git show --stat HEAD
77f0d2482c0ae2b1a1d2978a59e66d4730db3cf5
 .github/workflows/ci.yml | 46 +++++++++++++++++++++++++++++++++++++++++++---
 README.md                | 10 +++++++++-
 scripts/README.md        | 12 ++++++++++++
 3 files changed, 64 insertions(+), 4 deletions(-)
```

Exactly the three files the brief lists; `git config core.hooksPath` reports
`scripts/git-hooks`, and the commit above went through that hook (no `--no-verify` used).

## Self-review

- Diff for all three files matches the brief's code blocks byte-for-byte, except the
  Prettier whitespace correction on `scripts/README.md` noted above (content identical).
- No YAGNI additions: nothing beyond the brief's Step 1/3/4 content was introduced.
- `git status` before commit showed exactly the three intended files modified, nothing
  else touched (no docs/, no scripts/, no test file).
- Test/CI output above is the actual command output, not paraphrased or invented.
- Commit message is the brief's text verbatim, with the two required trailer lines
  (Opus 5 line from the brief, plus this session's Claude-Session line) and an added
  Sonnet 5 co-author line, per the controller's note that this is permitted.

## Concerns

None that block. The one point worth the owner/controller's attention: this run is on
this Mac (darwin_arm64) with a warm gitleaks cache, so the "first execution of the
`linux_x64` branch" (brief, end of Step 6) has not happened yet — that will be exercised
when CI actually runs after the controller pushes and opens the PR, per the brief's own
note that this is expected to be a first for that platform branch.
