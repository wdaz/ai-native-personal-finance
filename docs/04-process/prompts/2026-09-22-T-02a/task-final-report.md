# T-02a final fix wave — implementer report (fix round 1)

Implementer: Claude Opus 5 (1M context). FIX_BASE `4a1276b`. No previous report existed for
this wave, so this round did the whole wave from `task-final-brief.md` and `final-review.md`.
Nothing was copied from `final-scratch/fixed/`: its regex and `GIT_CONFIG_*` block matched
the brief and were typed into the shipped files, whose headers and rationale comments were
kept. The prototype's message pass (I4) was not taken.

## Commits

1. `248ba41` fix(secret-guard): final review — pin git colour and diff-merges, redact
   passwords with @, refuse a non-work-tree, test fail-closed (T-02a). Code, tests, config,
   READMEs, ci.yml (8 files).
2. docs(process): T-02a final review record. Process log, session-record copies, folder
   README (hash in the structured result).

Both went through the installed hook (`core.hooksPath=scripts/git-hooks`), no `--no-verify`.

## What changed, per finding

| Finding | Change |
|---|---|
| R-C1 | `scripts/secret-scan.sh`: exports `GIT_CONFIG_COUNT=2`, `color.ui=never`, `color.diff=never` before the `case`, with the reason; history `--log-opts="--all --diff-merges=separate"` instead of `-m`, comment says why (`-m` = `--diff-merges=on`, follows `log.diffMerges`; `combined`/`dense-combined` hide a conflict resolution). `exec` kept, single pass. |
| R-I1 | `.gitleaks.toml`: password `([^/\s'"`]+)`, host `([^@/:?\s'"`]+)`; comment on why `@` belongs to the password (percent-decoded re-scan) and the `@localhost`-in-query residual; one comment on the path allowlist (`(?:^|/)` exempts nested copies; needed because `gitleaks dir` reports absolute paths). |
| R-I2 | `scripts/secret-scan.sh history`: `git rev-parse --is-inside-work-tree` guard before the shallow check, exit 2, `secret-scan: not inside a git work tree; nothing to scan`, with the reason. |
| R-I3 | Test "blocks the commit when gitleaks cannot run (fails closed, D10)". |
| R-I4 | Documentation only: fixture README "Not covered by the rule" paragraph; `scripts/README.md` `secret-scan.sh` row ("the changes in every commit, merges included, not commit or tag messages"); `README.md` row "Gitleaks on all commit diffs, not messages — first in `test:all`" (64 characters + 1 pad = the 65-character column, measured with `wc -m`). No message pass. |
| R-M2 | `scripts/gitleaks.sh` header and `scripts/README.md` row: SHA-256 checked once, at download; a cached binary is trusted. |
| R-M3 | `README.md` hook paragraph: runs on `git commit`; commits written by `git rebase`/`git cherry-pick` skip it, CI does not; network once per `npm ci`, which wipes the cache. |
| R-#7 | `ci.yml` annotation: `npm audit failed or found high or critical advisories; see this step's log`; still `if ! …; then echo ::warning …; fi` (non-blocking). |
| M1/M4 | Process-log entry, session-record copies, folder README, `pr-body.md` (commit 2 and the git-ignored PR body). |

## Tests (`tests/unit/secret-guard.test.ts`, 19 → 25)

- Renamed: "finds a secret typed only while resolving a merge conflict (--diff-merges=separate)"
  (body unchanged; its repo setup moved into a `conflictLeakRepo` helper shared with the next test).
- New, history: "still finds it under a developer's log.diffMerges=dense-combined and
  color.ui=always"; "never prints any part of a password, one with a percent-encoded @
  included" (commits the whole materialised violations fixture; status 1; none of `N0tReal`,
  `T3st`, `FAKE_PASSWORD` in stdout+stderr); "refuses a directory that is not a git work tree
  instead of passing on nothing" (`GIT_CEILING_DIRECTORIES`; status 2 and the message).
- New, hook: `it.each(["color.ui","color.diff"])` "blocks a staged secret when the developer
  sets %s=always" (non-zero, `commit blocked`, still one commit); "blocks the commit when
  gitleaks cannot run (fails closed, D10)" (empty `GITLEAKS_CACHE_DIR`, `GITLEAKS_BASE_URL`
  `file://<empty scratch>`; non-zero, `commit blocked`, `run("git", ["rev-parse","--verify",
  "-q","HEAD"])` non-zero).

### Focused run (worktree)

Command: `npx vitest run tests/unit/secret-guard.test.ts`

```
 Test Files  1 passed (1)
      Tests  25 passed (25)
```

E4 (the renamed merge-conflict test) and E5 ("finds a secret added and removed inside a
merged branch (no --first-parent)") both pass under `--diff-merges=separate`.

### Mutant runs (scratch copies, never this worktree)

`.superpowers/sdd/2026-09-22-T-02a/final-fix-scratch/suite.sh <variant>` copies the guard
from the worktree into `final-fix-scratch/suite-<variant>/`, applies one mutant, commits it in
a scratch repo and runs the real test file with `node_modules/.bin/vitest run --root <copy>`.
`shipped/` holds `git show 4a1276b:` copies of the shipped `secret-scan.sh` and
`.gitleaks.toml`. Driver: `sh final-fix-scratch/all.sh`.

| Variant | Mutant | Result | Red tests |
|---|---|---|---|
| fixed | none | 25 passed | — |
| shipped-scan | `secret-scan.sh` as at 4a1276b | 4 failed, 21 passed | dense-combined+color.ui history; not a work tree; color.ui hook; color.diff hook |
| nopin | only the three `export GIT_CONFIG_*` lines removed | 3 failed | dense-combined+color.ui history; color.ui hook; color.diff hook |
| dashm | only `--diff-merges=separate` → `-m` | 1 failed | dense-combined+color.ui history |
| noguard | only the work-tree `if` made `if false` | 1 failed | not a work tree |
| shipped-toml | `.gitleaks.toml` as at 4a1276b | 1 failed | never prints any part of a password |
| failopen | hook blocks only on rc 1, exits 0 otherwise | 1 failed | fails closed (D10) |

The D10 test is green on the shipped hook (the fixed run) and red on the fail-open mutant.

## R-I1 measurements (the regex change)

Script: `final-fix-scratch/measure-regex.sh` (fills the placeholders with the test's fake
credentials, scans through `scripts/gitleaks.sh stdin` with the edited config, then commits
the materialised violations in a scratch repo and runs `scripts/secret-scan.sh history`).

- Materialised violations: findings on lines 1, 2, 3, 4, 5, 6, 7 (7/7), all
  `postgres_connection_string`; line 4 reported a second time with tags
  `decoded:percent, decode-depth:1`.
- Materialised controls: 0 findings over all 10 lines. Alone: line 1 (the `.env.example`
  default on `localhost`) 0 findings; line 2 (a strong password on `localhost`) 0 findings;
  line 3 (`127.0.0.1`) 0 findings.
- Committed fixtures as stored: `postgres-violations.txt.fixture` 0 findings,
  `postgres-controls.txt.fixture` 0 findings.
- History scan of the materialised violations: status 1, 8 findings, the password shown as
  `REDACTED` in each; the decoded line 4 finding now ends `REDACTED@` followed by the IP host
  (before the fix it printed the tail of the password as the host). Occurrences of
  `N0tReal`, `T3st` or the Neon-shaped fake password in the log: 0.
- This repository's full history: `npm run secrets:scan` (first step of `test:all`, below) —
  no leaks found.

## Other checks

- `npx eslint tests/unit/secret-guard.test.ts`, `npx tsc --noEmit`, `npx prettier --check .`:
  clean. Prettier re-padded the `scripts/README.md` table.
- Shell files in the index after commit 1: `scripts/git-hooks/pre-commit`,
  `scripts/gitleaks.sh`, `scripts/install-git-hooks.sh`, `scripts/secret-scan.sh` all
  `100755`.

## Deviation to note: reviewer scratch removed

The first `npm run test:all` at `248ba41` stopped at `lint`: `eslint .` linted
`final-scratch/M3-reproduce/repo` (a 588 MB repo copy with a `.next` build) and
`final-scratch/I1-reproduce/materialise.cjs` — 86 errors, all in those two folders, left by
the review's verification subagents (the review says its scratch repositories were deleted;
these were not). `secrets:scan` in that run: 61 commits scanned, no leaks found. I deleted
those two folders (they held materialised fake credentials; everything cited in
`final-review.md` — `probe.sh`, `suite.sh`, `fixed/`, and the `suite-*`, `repos`,
`verify-repo`, `i4-verify`, `tool` and `fixedtool` folders — is untouched, so the review's
commands stay re-runnable) and my own
`final-fix-scratch/regex/repo`. `npx eslint . --max-warnings 0` then exited 0. No ESLint or
ignore config was changed.

## Process record (commit 2)

- `docs/04-process/process-log.md`, the T-02a entry only: 25 tests and "each mutation listed
  in the PR description turned a test red"; two fix rounds and one final fix wave; the final
  review (Opus) and its verification (three Sonnet skeptics per blocking finding); a "Final
  review" line; the Appendix A deviations (Task 3's assertion; this wave's rename, helper and
  six new tests, named); wrong-or-missed items 6 and 7 as the brief words them; the owner
  decisions in "Next".
- `docs/04-process/prompts/2026-09-22-T-02a/`: `task-5-review.md`, `final-review.md`,
  `task-final-brief.md`, `task-final-report.md` (this file, as of commit 2) and the current
  `progress.md` copied; detectable quoted URIs placeholdered in the copies only (see the
  folder README); folder README corrected.
- `pr-body.md` (git-ignored): 25 tests, the new mutations, the Appendix A deviations, the
  `test:all` line for the final head.

## Final-head verification (after commit 2; commit 2 was amended so the docs/ copy carries this section)

Commits: `248ba41` (code) and the process-record commit (`4520d08` before its amend; the amended hash is in the structured result). Both passed the installed hook;
the hook's own scan of commit 2 was clean after the placeholders. A separate check,
`final-fix-scratch/check-copies.sh`, showed the originals are detectable and the copies are
not: the original `final-review.md` has 2 findings (lines 94 and 95) and the original
`task-final-brief.md` has 1 (line 155); both copies have 0.

Command: `npm run test:all` at `4520d08`, re-run at the amended head (below) (log: `final-fix-scratch/test-all-final.log`), exit 0:

```
2:48PM INF 62 commits scanned.
2:48PM INF no leaks found
lint (eslint . --max-warnings 0): clean
format:check: All matched files use Prettier code style!
typecheck: clean
 Test Files  3 passed (3)
      Tests  150 passed (150)
test:api: playwright --project=api --pass-with-no-tests (0 tests)
  ✓ [chromium] scaffold  ✓ [firefox] scaffold  ✓ [webkit] scaffold — 3 passed
```

`--all` here includes the local branch `backup/t02a-final-review-junk`; the scan reported
nothing, from it or anywhere else.

`git status --short`: empty. The shell files are still `100755` in the index. `pr-body.md`
is updated: 25 tests, the new mutations, the Appendix A deviations, the owner decisions,
and the `test:all` line for the final head.
