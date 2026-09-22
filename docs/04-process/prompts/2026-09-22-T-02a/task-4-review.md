# Task 4 review: CI jobs and the run instructions

## Spec Compliance

✅ **Push trigger**: `branches: [main, master]` → `branches: [main]`, comment rewritten to
cite the 2026-09-22 owner decision (`.github/workflows/ci.yml:6-8`). Matches brief Step 1
and plan question 3 verbatim. `pull_request:` (`ci.yml:4`) and `concurrency:` (`ci.yml:10-12`)
are untouched, as T-13 requires.

✅ **`secret-scan` job** (`.github/workflows/ci.yml:41-57`): `name: secret scan`,
`actions/checkout@v5` with `fetch-depth: 0` and `persist-credentials: false`
(`ci.yml:45-50`), single step `scripts/secret-scan.sh history` (`ci.yml:56-57`). No
`setup-node`, no `npm ci` — matches D11 ("no Node, no `npm ci`" for this job). No SARIF
upload, matching D14 and the backlog note (unavailable while private). Byte-for-byte match
against the brief's code block.

✅ **`audit` job** (`.github/workflows/ci.yml:59-79`): `name: npm audit`, checkout with
`persist-credentials: false` only — no `fetch-depth` override, correct, only the tip is
needed (`ci.yml:63-65`); `actions/setup-node@v5` with `node-version-file: .nvmrc`
(`ci.yml:67-69`), same action version and same `.nvmrc` source as the pre-existing `verify`
job's `setup-node` step (`ci.yml:21-23`) — checked directly, no drift. Then
`npm audit --audit-level=high` wrapped in `if ! ...; then echo "::warning ..."; fi`
(`ci.yml:76-79`). Traced the shell semantics: GitHub Actions' default `bash -e` does not
apply `-e` inside an `if` condition, so when `npm audit` exits non-zero the `then` branch
runs and the script's last executed command is `echo` (exit 0); when `npm audit` exits 0
the untaken `if` itself returns 0. Either way the step, and the job, always exit 0 — audit
**reports, never blocks**, exactly per owner decision (plan gate question 4, D11). No
`npm ci` step, matching D11 ("it reads `package-lock.json`, so no `npm ci`").

✅ **`README.md`**: `test:all` comment updated to `secret scan, lint, format, typecheck,
unit, API and E2E` (`README.md:52`); the hook/download/`--no-verify` paragraph inserted
verbatim after the "Executable doesn't exist" paragraph (`README.md:59-64`); the
`npm run secrets:scan` row added to the command table immediately after the `typecheck`
row and before `npm test` (`README.md:74`), column-aligned with the existing table. All
three edits match the brief's text and placement exactly.

✅ **`scripts/README.md`**: "Secret guard (T-02a, NFR-S5)" section appended verbatim,
including the four-row file/role table (`scripts/README.md:14-24`). Content is identical
to the brief; the report's noted Prettier whitespace re-pad (dash-row column width) is
formatting-only, and the file as it stands is the corrected, clean version.

✅ **File set matches the brief exactly**: only `.github/workflows/ci.yml`, `README.md`,
`scripts/README.md` are touched (diff stat: 3 files, 64 insertions, 4 deletions), matching
the brief's "Files: Modify" list. No `package.json`, script or test file changes — correct,
since D12 (`test:all` order) and the scan/hook implementation belong to earlier tasks, and
the DoD forbids drive-by changes outside the task.

No further ⚠️ items — the diff is a clean, literal implementation of the brief's Step 1 YAML
block, Step 3 README edits and Step 4 scripts/README edit.

## Strengths

- Every hunk in the diff is a verifiable, word-for-word match against the brief's
  prescribed replacement text — no paraphrasing, no drift.
- Job separation (`secret-scan` needs no Node/npm; `audit` needs Node but not `npm ci`)
  matches D11's stated rationale and keeps each job's runtime minimal.
- The new jobs' `actions/checkout@v5` / `actions/setup-node@v5` and `.nvmrc` source are
  consistent with the pre-existing `verify` job — no action-version drift introduced.
- Documentation edits (`README.md`, `scripts/README.md`) are placed exactly where the brief
  says and keep table column alignment consistent with the surrounding rows.
- Nothing outside the task's three files was touched — satisfies the DoD's "nothing outside
  the task is changed."

## Issues

### Minor (plan-mandated wording, not a functional block)

- **`.github/workflows/ci.yml:77-79`** — `if ! npm audit --audit-level=high; then echo
  "::warning title=npm audit::high or critical advisories found; ..."; fi` conflates "npm
  audit found high/critical advisories" with "the `npm audit` command failed for any
  reason." A registry outage, a missing/corrupt `package-lock.json`, or `npm` erroring out
  before it can evaluate advisories all produce the same green job plus the same
  misleading annotation text ("high or critical advisories found") even though no
  advisory was found — the command simply didn't run to completion. D11 decides that
  *advisories* don't block; it does not decide that *tool failures* should be
  indistinguishable from advisories, and this is the same failure shape D10 was written
  to prevent elsewhere in this task ("the T-01 lesson — the only symptom was silence").
  This does not change the Approved verdict: the job gates nothing by owner decision, and
  the blast radius is one unsurfaced/misworded warning line, not a missed block.
  `planMandated: true` — the exact snippet is prescribed verbatim in the brief
  (task-4-brief.md, Step 1), so fixing this would mean deviating from the brief's text,
  which is the implementer's and this task's mandate; a fix (e.g. distinguishing a
  non-zero exit with no JSON output, or wording the annotation as "npm audit did not
  complete cleanly — see log" when the command errors) belongs to whoever owns the plan
  text, not to a silent deviation in this task.

## Cannot Verify (outside this diff / spans tasks)

- The full `npm run test:all` green run, the 19 secret-guard unit tests, and the Step 2
  Prettier/YAML checks are reported by the implementer but not independently re-run —
  nothing in the diff contradicts them, and no specific doubt justified a re-run.
- The actual CI run on GitHub (the brief's Step 6 expectation of three green checks and
  the first `linux_x64` gitleaks download) cannot be observed from a diff review — the
  report itself flags this as still pending since `git push` / `gh pr create` were
  deliberately not run for this task (per controller ruling P1).
- `scripts/secret-scan.sh`'s executable bit (mode `100755`, relied on by
  `run: scripts/secret-scan.sh history`) is not visible via a file read and this review
  does not run git commands; context.md notes E14 covers this with its own test.
- The exact final commit message text (trailers, wording) is not part of the file diff and
  was not independently re-inspected; the report's self-description of it is informational
  only.

## Assessment

**Task quality: Approved.** The diff is a precise, verified implementation of Task 4's
three files, matches every task-specific constraint (push trigger → `main` only with
rewritten comment; `secret-scan` job with `fetch-depth: 0` and no Node; `audit` job with
`setup-node`/`.nvmrc` and no `npm ci`, reporting-not-blocking via a correctly-traced shell
guard) and the plan's D11 decision, with no scope creep. One Minor, plan-mandated wording
issue (the audit warning's text conflates "advisories found" with "command failed") does
not block merge.
