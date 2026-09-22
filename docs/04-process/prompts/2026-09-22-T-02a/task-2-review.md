# Task 2 review — `scripts/secret-scan.sh` and `npm run secrets:scan`

## Spec Compliance: ✅

All three files the brief lists have their hunk in the diff, and each matches the brief's
code blocks verbatim:

- `scripts/secret-scan.sh` (new, mode `100755` per the diff's `new file mode 100755`
  header): the `history`/`staged` dispatcher, byte-for-byte the brief's Step 3 code,
  including the shallow-clone guard (D7) naming `fetch-depth: 0`, `--log-opts="--all -m"`
  (D6), and `--redact` on both subcommands (D13).
- `package.json`: `"secrets:scan": "scripts/secret-scan.sh history"` inserted after
  `test:e2e:ui`, and `test:all` now starts with `npm run secrets:scan &&` (D12). Valid
  JSON, correct insertion point.
- `tests/unit/secret-guard.test.ts`: all five insertions from Step 1(a)–(e) present —
  `secretScan` constant, `FAKE_PASSWORD`, the `git()` helper, `newRepo()`/`commitFile()`,
  and the two new `describe` blocks. Diffed these against Appendix A's corresponding
  sections line-by-line: identical, and the Task-3-only pieces (`hooksDir`, `installHooks`,
  the "installs the hook" test, the `pre-commit`/`install-git-hooks.sh` describes) are
  correctly absent — this task does not reach ahead into Task 3's scope.

No drive-by changes: the diff touches exactly the three files the brief names, nothing
else.

⚠️ Not directly verifiable from the diff (no test run performed, per instructions):
whether the five new tests and the `package.json` test actually pass, and whether the
mutation-testing table (Step 7) was genuinely exercised as claimed. These rest on the
implementer's report only. → `cannotVerify`.

⚠️ `scripts/secret-scan.sh:32-35` (`staged` case): shipped in this diff, but zero test
coverage in Task 2 — correct per the brief, since the Interfaces section assigns its
tests to Task 3's hook ("used by Task 3's hook"). Whether `gitleaks git --pre-commit
--staged --config <cfg> … .` is a valid invocation and actually returns 0/clean, 1/finding
is unexercised here; Task 3's first hook test is what proves it. → `cannotVerify`.

⚠️ Commit message staleness: the mandated commit text (brief Step 8, used verbatim) says
"43 of 49 commits here"; this repository now has 54 commits (implementer's Step 6 output).
The implementer correctly used the owner-approved message as given rather than silently
editing it, which is the right call — but the inaccuracy is now permanent in history with
no `file:line` to attach a finding to. Recorded here for visibility, not as a defect.

## Strengths

- `scripts/secret-scan.sh` resolves both its own location and `.gitleaks.toml`'s from
  `$0`, not from the caller's `cwd` (`here=... ; config="$(dirname "$here")/.gitleaks.toml"`),
  which is exactly what the Task-3 interface requires ("whatever the working directory").
- The shallow-clone guard is scoped to `history` only, matching the brief's exit-code
  table (`staged` lists only 0/1, `history` lists 0/1/2) — the implementation does not
  over-apply the guard to `staged`.
- Tests exercise real git behaviour (actual merges, actual conflicted merges, actual
  shallow clones) rather than mocking `spawnSync`, so a regression in the shell script
  would genuinely fail them.
- The D13 redaction test (`tests/unit/secret-guard.test.ts:207-216`,
  `expect(result.stdout + result.stderr).not.toContain(FAKE_PASSWORD)`) is not vacuous:
  the diff alone can't confirm the violations fixture's first line uses the `{{PASSWORD}}`
  placeholder rather than `{{PASSWORD_URL_ENCODED}}` (if it were the latter, the assertion
  would pass with or without `--redact`, and D13's guarantee would be untested). What
  closes that gap is the implementer's Step 7 mutation row — removing `--redact` from the
  `history` line turned exactly this test red — which is the actual proof the assertion is
  checking what it claims to.

## Issues

None found at Critical or Important severity.

**Minor**

- `scripts/secret-scan.sh:9` (`git rev-parse --is-shallow-repository` inside `[ ... =
  "true" ]`): if this git subcommand itself fails (e.g. invoked outside any git work
  tree), the substitution yields an empty string, the `[ ]` test is simply false, and
  execution falls through to the `exec gitleaks.sh git …` line, which would then fail
  with gitleaks' own (less specific) error rather than this script's. Not exercised by
  any brief-mandated test and not a realistic path for the documented callers (CI
  checkout, `npm run secrets:scan`, a repo clone). `planMandated: true` — this is the
  brief's Step 3 code verbatim; the fix (an explicit git-repo check) is not something the
  implementer was free to add unprompted.

## Assessment

**Task quality: Approved.** The diff implements exactly what Task 2's brief specifies —
`scripts/secret-scan.sh history`/`staged`, the `npm run secrets:scan` wiring into
`test:all`, and the five test insertions — with no scope creep into Task 3–5 territory and
no drive-by changes. The two Minor notes above are inherent to the brief's own prescribed
code/tests, not implementer-introduced defects.
