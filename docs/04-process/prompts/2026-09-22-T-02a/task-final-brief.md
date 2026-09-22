# T-02a — final fix wave (after the whole-branch review)

You fix everything the final whole-branch review requires before merge, in ONE dispatch.
Read first, in this order:

1. `final-review.md` (this directory) — the review. Sections C1, I1, I2, I3, I4, M1–M4 and
   the deferred-minor triage table are your findings. Its measurements are trustworthy.
2. This brief — the controller's rulings on each finding. Where they differ from the review,
   **this brief wins**.
3. `context.md` — the plan's Global Constraints, Decisions D1–D15 and the owner's answers.

`final-scratch/fixed/` holds the reviewer's prototypes. They are **evidence that the fixes
work, not code to paste**: the prototype `secret-scan.sh` deletes every rationale comment,
retitles the header and bundles a scope expansion (the message pass) the controller did not
accept. Edit the shipped files in place; keep their headers and rationale comments; add the
reasons for each change as comments in the same voice.

Never copy anything from `final-scratch/` into `docs/` — it holds materialised fake
credentials and `node_modules` copies.

## Rulings and required changes

### R-C1 (Critical) — pin the git config both scans depend on — FIX

`scripts/secret-scan.sh`:

- Before the `case`, export command-scope config (it outranks every config file):
  `GIT_CONFIG_COUNT=2`, `GIT_CONFIG_KEY_0=color.ui` / `GIT_CONFIG_VALUE_0=never`,
  `GIT_CONFIG_KEY_1=color.diff` / `GIT_CONFIG_VALUE_1=never`. Comment why: gitleaks parses the
  text output of its own `git log -p` / `git diff`; a developer's `color.ui=always` or
  `color.diff=always` turns it into ANSI text, and both scans then pass having read nothing
  (measured in the final review).
- In `history`, replace `-m` with `--diff-merges=separate` inside `--log-opts`, and update
  the comment: `-m` means `--diff-merges=on`, which follows `log.diffMerges`, and
  `combined`/`dense-combined` hide a conflict resolution from the parser. Keep `exec` (no
  second pass, so no status plumbing).

Tests in `tests/unit/secret-guard.test.ts` (both must be red on the shipped script — check by
stashing your script edit in a scratch copy, never with `git stash` on this worktree — and
green after):

- the pre-commit hook blocks a staged leak in a repo whose local config has
  `color.ui=always`, and also with `color.diff=always` (two cases, one test or two);
- the history scan finds the E4 merge-conflict leak in a repo whose local config has
  `log.diffMerges=dense-combined` and `color.ui=always`.

Re-measure and report: with `--diff-merges=separate`, the existing E4 test (conflict
resolution) and E5 test (added and removed inside a merged branch) still pass.

### R-I1 (Important) — redaction with `@` in the password — FIX

`.gitleaks.toml`: password group `([^/\s'"`]+)`, host group `([^@/:?\s'"`]+)`. Update the rule
comment: why `@` belongs to the password (gitleaks re-scans percent-decoded text, and a
decoded `%40` otherwise ends the secret early and prints the rest as the host); the residual
(a query string containing `@localhost` after a remote host would read as local — contrived).
In the same edit, add one comment line to the global path allowlist (deferred minor #3):
`(?:^|/)` also exempts nested copies of the two folders; it is needed because `gitleaks dir`
reports absolute paths.

Test: commit the whole materialised violations fixture in a temp repo, run the history scan,
expect status 1, and assert that neither `N0tReal` nor `T3st` nor `FAKE_PASSWORD` appears in
stdout + stderr.

This is the highest-risk edit: the local-host exemption `@(?:localhost|127\.0\.0\.1)$` is
anchored on the match's end. You must report, with the commands and output:
7/7 violation lines still reported; all 10 control lines silent (lines 1–3 — `localhost`,
strong password on `localhost`, `127.0.0.1` — named explicitly); both committed fixtures
silent as stored; this repository's full history clean (`npm run secrets:scan`).

### R-I2 (Important) — outside a work tree — FIX

`scripts/secret-scan.sh history`: before the shallow check,
`git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "secret-scan: not inside a git work tree; nothing to scan" >&2; exit 2; }`
(an `if` block is fine), with a comment: otherwise gitleaks prints "no leaks found" and exits 0
having scanned nothing (e.g. an `actions/checkout` tarball fallback with no `.git`). Test with
`GIT_CEILING_DIRECTORIES`: status 2 and the message.

### R-I3 (Important) — D10 fail-closed has a test that can fail — FIX

Test "blocks the commit when gitleaks cannot run": a hooked temp repo; `git commit` run with
`env: { ...testEnv, GITLEAKS_CACHE_DIR: scratch(), GITLEAKS_BASE_URL: \`file://${emptyDir}\` }`
where `emptyDir = scratch()`; expect a non-zero status, `commit blocked` on stderr, and no
commit (`git rev-parse --verify HEAD` fails in that repo — use `run`, not `git`, for that
check). Report it green on the shipped hook and red on a fail-open mutant hook (one that exits
0 unless `secret-scan.sh staged` returned exactly 1), run in a scratch copy.

### R-I4 (Important → documentation only) — commit and tag messages are not scanned

Ruling: document the limitation now; do NOT add the message pass. The review classifies the
pass as scope beyond the backlog row; the owner decides it (it goes to the owner as a
question and to T-16).

- `tests/fixtures/secret-scan/README.md`, "Not covered by the rule": commit messages and
  annotated tag messages are never scanned — `gitleaks git` reads diffs only (measured
  2026-09-22 in the final review).
- `scripts/README.md`, the `secret-scan.sh` row: say `history` scans the changes in every
  commit, merges included, and not commit or tag messages.
- `README.md` command-table row for `npm run secrets:scan`: say it scans every commit's
  changes, not messages. The second cell must fit the table's 65-character column (pad with
  spaces to keep the table aligned; `README.md` is in `.prettierignore`).

### R-M2 — the checksum claim — FIX

`scripts/gitleaks.sh` header and the `gitleaks.sh` row of `scripts/README.md`: the SHA-256 is
checked once, when the binary is downloaded; a cached binary is trusted. No behaviour change.

### R-M3 — README accuracy — FIX

`README.md` "Run locally" paragraph about the hook: it runs on `git commit`; commits written
by `git rebase` or `git cherry-pick` skip it (CI does not); the download needs the network
once per `npm ci`, which wipes the cache.

### R-#7 — the npm audit warning text — FIX

`.github/workflows/ci.yml`, the annotation: `npm audit failed or found high or critical
advisories; see this step's log`. Keep the non-blocking form.

### Not in this wave (deferred, recorded in the ledger)

Deferred minors #1 (parseReport stderr), #2 (checksum test temp-dir assertion), #5 (trailer),
the review's recommendation 3 (`--ignore-gitleaks-allow`, CODEOWNERS / ruleset → T-16) and 4
(workflow `permissions: contents: read` → T-13). Do not implement them.

## Process record (same dispatch, separate commit)

- `docs/04-process/process-log.md`, the T-02a entry only (the last entry, added in this PR;
  edit it, change nothing above it):
  - "Produced": the test count becomes the new total of `secret-guard.test.ts`; replace "each
    guarantee mutation-checked" with "each mutation listed in the PR description turned a test
    red".
  - "Execution": "two fix rounds (Task 1, verification only; Task 3) and one final fix wave"
    instead of "One fix round (Task 3)"; add the final review (Opus) and its verification
    (three Sonnet skeptics per blocking finding).
  - "What the agent got wrong or missed": add (6) the final review found four defects in code
    the plan mandated and E17 had verified — a developer's `color.ui`/`color.diff=always` or
    `log.diffMerges=combined` silently disabled the hook and the local history scan; redaction
    printed most of a password containing `@`; the history scan passed outside a work tree; the
    D10 fail-closed guarantee had no test that could fail. Lesson: E17 measured under a neutral
    git config (`GIT_CONFIG_GLOBAL=/dev/null`) and one fixture line; the evidence proved what it
    measured, not the environment the hook runs in. (7) During the final review's
    verification, one subagent broke the read-only rule: it set `user.name`/`user.email`
    ("Scratch") in the repository's shared `.git/config` and committed two commits ("add leak",
    "remove leak") on the task branch; they were never pushed, the controller moved the branch
    back and removed the identity keys, and the two commits are kept on a local backup branch
    for the owner to inspect.
  - Record the deviations of the test file from plan Appendix A: Task 3's one assertion and
    this wave's new tests (name them). Do not edit the plan.
  - "Next": add the owner decisions this review raised — scanning commit and tag messages
    (a second pass through `gitleaks stdin`, prototyped and measured clean); for T-16,
    `--ignore-gitleaks-allow` and owner review of the guard files (CODEOWNERS or the `main`
    ruleset); for T-13, workflow `permissions: contents: read`.
- `docs/04-process/prompts/2026-09-22-T-02a/`: copy `task-5-review.md`, `final-review.md`,
  this brief and your `task-final-report.md` (when complete), and the current `progress.md`.
  **Before staging `final-review.md`:** after your regex change, its quoted example line
  `postgresql://app:{{PASSWORD}}@10.0.0.12` is itself detectable (the password class
  now takes `@`) and the hook will block it. In the copied file only, replace that URI's
  password part with `{{PASSWORD}}` and say so in the folder README. Do the same for any other
  detectable quoted string the hook reports; never use `--no-verify`.
  Update `README.md` in that folder: Task 5 was also reviewed by Sonnet; the final review and
  fix wave files; the deliberate absences (the `review-*.diff` files; `final-scratch/`, which
  held materialised fake credentials and `node_modules` copies; `final-review-result.json`;
  the final re-review, added by the controller's last copy).
- `.superpowers/sdd/2026-09-22-T-02a/pr-body.md`: update the test count, add the new mutations
  to the mutation list, record the Appendix A deviations, and make the `test:all` line true for
  the final head (see below).

## Verification before you report

1. Focused: `npx vitest run tests/unit/secret-guard.test.ts` — all green; state the count.
2. Each new test red on its mutant (the shipped code, or the fail-open hook for R-I3), run in a
   scratch copy under `.superpowers/sdd/2026-09-22-T-02a/final-fix-scratch/`, never by
   reverting files in this worktree.
3. `npm run test:all` once at your final head: every step green; record the secret-scan line,
   unit count, API, E2E per engine.
4. `git status` clean; both commits went through the hook (no `--no-verify`); shell files
   still mode 100755.

## Commits

1. `fix(secret-guard): final review — pin git colour and diff-merges, redact passwords with @, refuse a non-work-tree, test fail-closed (T-02a)` — code, tests, config, READMEs, ci.yml.
2. `docs(process): T-02a final review record` — process log, session-record copies, folder README.

End each message with the brief-style trailers (`Co-Authored-By: Claude Opus 5 (1M context)
<noreply@anthropic.com>`, your own model's `Co-Authored-By` if different, and
`Claude-Session: https://claude.ai/code/session_01KxS8aoYzGp7ikX4BgnqQ5u`).
