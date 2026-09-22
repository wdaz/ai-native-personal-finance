# Task 3 fix round 1 — re-review

Fix base: c9e70bddcb1db08dc04533c2bb927a5060ca2dd4
Fix head: 7d2357fa036df339721cb938515edb3142cb0fc9

## Finding Verdicts

### 1. Important (plan D10; controller ruling T3-R1) — blocked-commit message doesn't name `git commit --no-verify`

**addressed = true**

Evidence:
- `scripts/git-hooks/pre-commit` (diff lines 27-28) now adds, verbatim as specified,
  directly after the "value is a real credential..." echo and before `exit 1`:
  ```
  echo "Only for a false positive, or when gitleaks cannot run: git commit --no-verify skips" >&2
  echo "this hook. Never use it to commit a real secret." >&2
  ```
  This matches the required text exactly, character for character.
- `tests/unit/secret-guard.test.ts` (diff line 46), inside `"blocks a commit that stages
  a secret"`, directly after `expect(result.stderr).toContain("commit blocked");`, adds:
  ```
  expect(result.stderr).toContain("git commit --no-verify");
  ```
  This matches the required insertion exactly, in the correct location.
- Mutation check reported (task-3-report.md, "Fix round 1" section): the implementer
  deleted the two new echo lines, re-ran `npx vitest run tests/unit/secret-guard.test.ts`,
  and got a RED result specifically on `"blocks a commit that stages a secret"` with the
  expected assertion-failure message (`expected '...' to contain 'git commit --no-verify'`),
  1 failed / 18 passed. The lines were then restored and `git diff` confirmed only the
  intended two-line addition remained; a re-run showed 19/19 passing. This is the exact
  mutation check the finding's fix instructions specified (part 3).
- Covering test named: `tests/unit/secret-guard.test.ts` — `"blocks a commit that stages
  a secret"` (`describe("scripts/git-hooks/pre-commit", ...)`). Report shows its RED/GREEN
  output directly (quoted above), satisfying "confirm the fix report names the covering
  tests and shows their output."
- Scope: diff touches only `scripts/git-hooks/pre-commit` (+2 lines) and
  `tests/unit/secret-guard.test.ts` (+1 line), matching the finding's prescribed scope
  exactly — no unrelated changes.

The specific defect (message printed by the hook never mentioning `--no-verify`, and no
test asserting on it) no longer exists: the hook now prints it, and the test now asserts
it, exactly at the specified location, with verbatim text.

## New Breakage

None found in the fix diff. The diff is a strict 3-line addition (2 in the shell script,
1 in the test); it does not touch any other logic, control flow, exit codes, or existing
assertions. No plausible regression surface.

## Out-of-Scope

None to report. The diff and findings are fully covered above; no additional issues were
observed within the fix diff itself. (Any pre-existing Minors deferred from earlier task
rounds are outside this fix diff and were not re-examined here, per instructions to scope
strictly to the findings and the fix diff.)

## Verdict

**PASS.** The single Important finding is fully addressed: the required verbatim text was
added to the hook script and asserted by the test at the exact specified location, and the
implementer's report documents a correct mutation check (red on removal, green on
restoration, clean `git diff`) plus the other required green checks (lint, format,
typecheck) before the fix commit. No new breakage introduced.
