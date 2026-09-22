# T-02a final fix wave — re-review, round 1

Range: 4a1276b..74edf6c (248ba41 code, 74edf6c process record). Source: the review
package diff `review-4a1276b..74edf6c.diff`, `task-final-brief.md`, `task-final-report.md`.
The suite was not re-run; the report's focused run (25/25), its mutant table, and the
`npm run test:all` output at 74edf6c were checked instead.

## Finding Verdicts

| # | Finding | Addressed | Evidence |
|---|---------|-----------|----------|
| 1 | R-C1 colour / diff-merges | Yes | `scripts/secret-scan.sh`: `GIT_CONFIG_COUNT=2`, `color.ui=never` and `color.diff=never` exported before the `case`, with the reason in a comment; history `--log-opts="--all --diff-merges=separate"`, and a comment explains why not `-m` (it follows `log.diffMerges`) and why not `--first-parent`. Tests: `it.each(["color.ui","color.diff"])` "blocks a staged secret when the developer sets %s=always"; "still finds it under a developer's log.diffMerges=dense-combined and color.ui=always". E4 (renamed, `conflictLeakRepo` helper) and E5 still pass. Mutants: nopin fails 3 tests, dashm fails 1, shipped-scan fails 4. |
| 2 | R-I1 password takes `@` | Yes | `.gitleaks.toml` regex is now `:([^/\s'"`]+)@([^@/:?\s'"`]+)`. Comments give the reason (percent-decoded re-scan), the `@localhost`-in-query residual, and the nested-path note on `(?:^|/)`. Test "never prints any part of a password, one with a percent-encoded @ included": status 1, and none of N0tReal, T3st or FAKE_PASSWORD appears. It fails on the shipped-toml mutant. Measurements in the report: violations 7/7 (line 4 also reported decoded), controls 0/10 (lines 1–3 local hosts each 0), committed fixtures 0/0, repository history no leaks (62 commits). |
| 3 | R-I2 non-work-tree | Yes | `secret-scan.sh history`: a `git rev-parse --is-inside-work-tree` guard before the shallow check, exit 2, "not inside a git work tree; nothing to scan". Test uses `GIT_CEILING_DIRECTORIES: dirname(dir)` (`dirname` is already imported, line 4). It fails on the noguard mutant. |
| 4 | R-I3 fail-closed test | Yes | Test "blocks the commit when gitleaks cannot run (fails closed, D10)": empty `GITLEAKS_CACHE_DIR`, `GITLEAKS_BASE_URL=file://<empty>`; asserts a non-zero status, `commit blocked`, and `rev-parse --verify -q HEAD` non-zero. Green on the fixed run; red on the failopen mutant. |
| 5 | R-I4 messages not scanned (docs) | Yes | The fixture README's "Not covered by the rule" gains a paragraph on commit and tag messages. The `scripts/README.md` secret-scan row says "not commit or tag messages". The `README.md` row reads "Gitleaks on all commit diffs, not messages — first in `test:all`", padded to the 65-character column, so the table stays aligned. No message pass was added. |
| 6 | R-M2 checksum wording | Yes | The `scripts/gitleaks.sh` header says "once, when it is downloaded; a cached binary is trusted …". The `scripts/README.md` row says "checks its SHA-256 once, at download; a cached binary is trusted". |
| 7 | R-M3 hook reach | Yes | The `README.md` paragraph says: "on `git commit`"; "Commits that `git rebase` or `git cherry-pick` write themselves skip the hook"; "the CI `secret scan` job reads every commit either way"; "network connection once per `npm ci`". |
| 8 | R-#7 audit annotation | Yes | `ci.yml` now reads `::warning title=npm audit::npm audit failed or found high or critical advisories; see this step's log`. It stays inside `if ! …; then … fi`, so it is still non-blocking. |
| 9 | M1/M4 process record | Yes | The process-log T-02a entry records: 25 tests, "each mutation listed in the PR description turned a test red", two fix rounds plus the final wave, the Opus review with three Sonnet skeptics, a "Final review" line, Appendix A deviations (with the new tests named), wrong-or-missed items 6 and 7 as worded in the brief, and the Next items (message pass, T-16 `--ignore-gitleaks-allow` and CODEOWNERS/ruleset, T-13 permissions). Copies of task-5-review.md, final-review.md, task-final-brief.md, task-final-report.md and progress.md were added. The detectable URIs in the copies are `{{PASSWORD}}`-placeholdered (final-review.md, two I1 `Finding:` lines; brief, the quoted example), and the folder README explains why. The folder README now covers the Task 2–5 Sonnet reviews, the new files and the four deliberate absences. pr-body.md names 25 tests, the new mutations, the Appendix A deviations and `test:all` at 74edf6c. The report records `npm run test:all` at 74edf6c: 62 commits with no leaks, lint/format/typecheck clean, 150/150, API 0, E2E 3/3. |

## New Breakage

- **Minor** — `scripts/secret-scan.sh` (the `export GIT_CONFIG_COUNT=2` block). This
  overwrites any `GIT_CONFIG_COUNT` / `GIT_CONFIG_KEY_0..1` / `GIT_CONFIG_VALUE_0..1` the
  caller already set. A caller's command-scope entries (for example a CI or container
  runner that passes `safe.directory` this way) would be dropped or replaced for the
  gitleaks git subprocess. No current caller does this (actions/checkout writes local
  config), so the effect today is nil. Fix: append after the existing count. Read
  `n=${GIT_CONFIG_COUNT:-0}`, set `GIT_CONFIG_KEY_$n` and `GIT_CONFIG_KEY_$((n+1))`, then
  export `GIT_CONFIG_COUNT=$((n+2))`. Not plan-mandated. The brief's prototype used the same
  fixed-count form.

## Out-of-Scope

- The copy of `task-final-brief.md` in `docs/04-process/prompts/2026-09-22-T-02a/` now says
  that `postgresql://app:{{PASSWORD}}@10.0.0.12` "is itself detectable". After placeholdering,
  that is literally untrue. The folder README explains the substitution, so this is
  cosmetic.
- The local branch `backup/t02a-final-review-junk` is included in `--all` for local history
  scans until the owner deletes it. It is already recorded as an owner item in progress.md.

## Verdict

All nine findings are addressed. Each fix has a covering test that is red on its mutant,
and the report shows the focused run (25/25) and `test:all` at 74edf6c. One new Minor
(the `GIT_CONFIG_COUNT` clobber) does not block. Ready to merge.
