# Task 8 report: commit and tag messages in the secret scan

Status: DONE. Commit 03f3c8e `feat(security): scan commit and tag messages in the history scan`
on task/T-13-ci-hardening. Files: scripts/secret-scan.sh, tests/unit/secret-guard.test.ts.

## What was done
- Added the three tests from the brief (verbatim) after the "resolving a merge conflict" case.
- scripts/secret-scan.sh `history)`: `exec gitleaks git ...` became a plain call with `|| status=1`,
  followed by a `gitleaks stdin` scan of `git log --all --format=%B` plus
  `git for-each-ref refs/tags --format=%(contents)` (temp file, removed by trap); `exit "$status"`.
  Header comment updated. `staged` mode unchanged.
- Fixtures use `leakLine` (built from the placeholder fixture via `materialise`); no literal fake
  token was added to any tracked file.

## TDD evidence
RED (tests only, script unchanged), `npx vitest run tests/unit/secret-guard.test.ts -t "message"`:
- 2 failed, 1 passed, 26 skipped.
- "finds a secret typed into a commit message ..." : `AssertionError: expected +0 to be 1` (line 257)
- "finds a secret typed into an annotated tag message ..." : `expected +0 to be 1` (line 266)
- "passes messages that hold no secret ..." passed.
Matched the brief's prediction exactly.

GREEN (script changed), `npx vitest run tests/unit/secret-guard.test.ts`:
`Test Files 1 passed (1)`, `Tests 29 passed (29)`.

## Real-history scan (`npm run secrets:scan`, this branch, before the commit)
    INF 329 commits scanned.
    INF scanned ~10695245 bytes (10.70 MB) in 349ms
    INF no leaks found
    INF scanned ~153352 bytes (153.35 KB) in 75.2ms
    INF no leaks found
The message scan (second block) is clean; no real commit message was flagged, no allowlist added.
Brief said 304 commits; this branch has 329 (real).

## Gates (each run separately, all clean)
typecheck: no output/exit 0. lint: clean. format:check: "All matched files use Prettier code style!".
`npm test`: 76 files, 951 tests passed (baseline 948 + 3 new). traceability: "all 18 Release 1
stories are named in a test title".

## Other checks
`git log --all --format=%B` on an empty repo exits 0 with no output, so `set -e` does not trip on it.

## Deviations
None. Counts differ from the brief only because of the branch baseline (29 in secret-guard matches).

## Concerns
- The pre-commit `staged` mode cannot see the message being written; a `commit-msg` hook would be
  needed (out of scope per brief; belongs in the process log).
- The real-history scan was run before the commit, so the new commit's own message was not part of it
  (it holds no secret; the next run covers it).

## Follow-up round
Commits: ebe0a15 `docs(security): the history scan now covers commit and tag messages`;
9e19e33 `test(security): pin the tag-message path, keep the script's exit codes, add a message allowlist control`.
03f3c8e was not amended.

Docs fixed (Important): README.md:97 (row now "Gitleaks on all commit diffs and messages — first in
`test:all`", column padding kept: 150 bytes like its neighbours); scripts/README.md:32 (history covers
every commit and annotated-tag message; staged hook cannot see the message being written; table
re-aligned with prettier); tests/fixtures/secret-scan/README.md:63-65 (paragraph rewritten: gitleaks git
reads diffs only, since T-13 the history scan feeds messages to gitleaks stdin, a commit-msg hook is
out of scope). `git grep` for "not commit or tag messages|never scanned|not messages" found no other live
doc; remaining hits are dated records (docs/04-process/prompts/2026-09-22-T-02a/*, plans/2026-09-22-T-02a.md),
left untouched as history. process-log.md was excluded from the grep and not edited.

Minor 1: first scan `|| status=$?`; message scan `|| { rc=$?; [ "$status" -ne 0 ] || status=$rc; }`.
Minor 2: tag test now asserts rule id in stdout and that FAKE_PASSWORD is not printed.
Minor 3: new control "passes a message that quotes the .env.example default ..." (DATABASE_URL line read
from .env.example at runtime, in a commit message and an annotated tag message): exit 0, passed first run.
Minor 5: stderr labels "secret-scan: commit diffs" / "secret-scan: commit and tag messages"; the clean
test now asserts the second label. No existing test asserted on the old stderr of the history scan.

Real output:
- `npx vitest run tests/unit/secret-guard.test.ts`: 1 file, 30 tests passed.
- `npm run secrets:scan`: "335 commits scanned ... no leaks found", then the message scan
  "scanned ~156600 bytes ... no leaks found" (clean, includes this branch's new commit messages).
- typecheck, lint, format:check clean; `npm test`: 77 files, 958 tests passed; traceability: all 18 stories.

Not done: I tried a mutation (drop --redact from the stdin call) to show the strengthened tag test failing
on purpose; the harness denied that run as weakening a security control, so it was restored at once
(git diff shows --redact present) and not pursued. The tag test's redaction assertion is therefore
unmutated evidence; the commit-message test has the same assertion and was RED->GREEN in round 1.
Not run either: a forced non-1 gitleaks failure to show `status=$?` propagating.
