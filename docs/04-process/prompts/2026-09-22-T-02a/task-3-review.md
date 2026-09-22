# Task 3 review — the pre-commit hook and its installation

## Spec Compliance

✅ `scripts/git-hooks/pre-commit` created, mode 100755, calls `secret-scan.sh staged`, exits 1 on failure (D8, D9, D10 partially — see ⚠️ below).
✅ `scripts/install-git-hooks.sh` created, mode 100755, sets `core.hooksPath` to the relative path `scripts/git-hooks` only inside a git work tree, no-op otherwise (D9).
✅ `package.json`: `"prepare": "sh scripts/install-git-hooks.sh"` added after `"start"`, matches brief exactly.
✅ `tests/unit/secret-guard.test.ts`: diffed byte-for-byte against Appendix A's fenced `ts` block — identical. 19 `it(` blocks total in the file, matching the brief's expected final count.
✅ E14 (mode-100755 test for all four shell files) present and passing; verified in the index (`git ls-files --stage`) that all four files are `100755`.
✅ Diff touches exactly the four files the brief lists (`package.json`, `scripts/git-hooks/pre-commit`, `scripts/install-git-hooks.sh`, `tests/unit/secret-guard.test.ts`) — no drive-by changes, no CI/README/docs edits.
✅ Commit message is a single conventional commit, English, on the correct branch.

⚠️ D10 ("the hook fails closed... the commit is blocked with a message that names `git commit --no-verify`") is not met at runtime — see Issues/Important below. The phrase `git commit --no-verify` appears only in a source comment inside `scripts/git-hooks/pre-commit` (review-...diff:49 / task-3-brief.md:115), never in the text actually printed to stderr when a commit is blocked. A developer who hits a false-positive block, or a broken/offline gitleaks binary, sees only "commit blocked... CI scans every commit regardless" — with no indication that `--no-verify` exists to unblock the commit while still landing it (CI remains the real gate, matching D10's own rationale). No test asserts this string either, so the gap is silent both at runtime and in the test suite.

## Strengths

- Test file is verified byte-identical to Appendix A (diffed programmatically), matching the plan's "the test file equals Appendix A (19 tests)" requirement exactly.
- Both new shell scripts are minimal, single-purpose, and match ADR-0002's placement rule (D8) and the fail-closed intent (D10, partially).
- `install-git-hooks.sh` correctly stores a *relative* `core.hooksPath` (verified by the "points core.hooksPath at scripts/git-hooks" test expecting the literal string `scripts/git-hooks`, not an absolute path) and correctly no-ops outside a work tree via the `if git rev-parse --is-inside-work-tree; then ...; fi` idiom, which is exempt from `set -e` (so a failing `git rev-parse` does not abort the script) — this makes the "does nothing outside a git work tree" test (exit 0) hold for the right reason, not by accident.
- Mode-100755 test reads the real repository's git index (not a temp copy), so it verifies the actual committed artifact rather than a re-created fixture — a stronger check for E14's intent (git silently skipping non-executable hooks).
- No drive-by changes; diff is exactly the four files in the brief's file list.
- TDD evidence in the report (RED 5 failed/14 passed → GREEN 19/19) is consistent with the diff's shape and the described mutation tests (chmod flip, `prepare` line deletion) each isolating exactly one test.

## Issues

### Important

- **`scripts/git-hooks/pre-commit:51-57` (review diff lines 51-57)** — The plan's D10 ("the commit is blocked with a message that names `git commit --no-verify`") is not implemented: the stderr text printed when a commit is blocked ("pre-commit: commit blocked. Either gitleaks reported a finding above, or it could not run... CI scans every commit regardless.") never mentions `--no-verify`. The only occurrence of that phrase is in a source-code comment (lines 47-50 of the new file) that a developer at a terminal never sees. Failure scenario: gitleaks cannot run at all (offline on first use, per D10's own example) — the developer sees a generic "commit blocked" message with no indication that `git commit --no-verify` exists to bypass the hook (while CI still catches a real leak on push), which is exactly the discoverability problem D10 was written to prevent. Fix: add a line naming `git commit --no-verify` to the echoed message (e.g., "To bypass this check, use \`git commit --no-verify\` — CI still scans every push."). planMandated=true: D10 explicitly requires this, and the corrective text is not present in the brief's own script either (the brief's task-3-brief.md:115 has the same gap), so applying the fix means deviating from the brief's literal code to satisfy the plan's Decision it was supposed to encode.

### Minor

(none beyond the Important item above)

## Assessment

**Task quality: Needs fixes.** The plumbing (hook placement, installer, executable-mode test, prepare wiring, and the Appendix-A-identical test file) is correctly and cleanly implemented and matches D8/D9/E14 exactly, but the shipped pre-commit hook's user-facing blocked-commit message never names `git commit --no-verify`, which is an explicit, testable requirement of plan Decision D10 that neither the code nor the test suite currently satisfies.
