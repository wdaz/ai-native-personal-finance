# Task 2 report — `scripts/secret-scan.sh` and `npm run secrets:scan`

## What was implemented

- `scripts/secret-scan.sh` (new, mode `100755`): a `sh` dispatcher with two subcommands.
  - `history` — refuses a shallow clone (`git rev-parse --is-shallow-repository` = `true`,
    exit 2, message names `fetch-depth: 0`), otherwise runs
    `gitleaks.sh git --config .gitleaks.toml --log-opts="--all -m" --redact --no-banner
    --verbose .` (D6, D7, D13).
  - `staged` — runs `gitleaks.sh git --pre-commit --staged --config .gitleaks.toml
    --log-level warn --redact --no-banner --verbose .` (consumed by Task 3's hook; not
    exercised by a test in this task).
  - Content copied verbatim from the brief's Step 3 code block; no changes made.
- `package.json`: added `"secrets:scan": "scripts/secret-scan.sh history"` after
  `test:e2e:ui`, and changed `test:all` to start with `npm run secrets:scan && ` (D12).
- `tests/unit/secret-guard.test.ts`: the five insertions from Step 1(a)–(e), verified
  against Appendix A — the file now equals Appendix A minus the Task 3 parts
  (`hooksDir`/`installHooks` constants, the second `package.json` test, and the
  `pre-commit`/`install-git-hooks.sh` describe blocks), which are correctly absent.

No files outside this task's list were touched. No Task 3–5 artefacts (hook, installer,
`prepare` script, CI, README) were created, per the controller notes.

## TDD evidence

**RED** — `npx vitest run tests/unit/secret-guard.test.ts` before Step 3/4:

```
Test Files  1 failed (1)
     Tests  6 failed | 7 passed (13)
```

The 6 failures were exactly as the brief's Step 2 predicted: the five history-scan tests
failed with `expected null to be 1|0|2` (script did not exist yet, so `spawnSync` returns
`status: null`), and "runs the history scan first in test:all" failed with
`expected undefined to be 'scripts/secret-scan.sh history'` (script not yet added to
`package.json`).

**GREEN** — after Step 3 (`scripts/secret-scan.sh` written, `chmod +x`) and Step 4
(`package.json` scripts added):

```
Test Files  1 passed (1)
     Tests  13 passed (13)
```

## Step 6 — scanning this repository

Sandbox note: `npm run secrets:scan` ran directly with no sandbox refusal (the controller's
warned fallback — writing the command to a file and running it with `sh <file>` — was not
needed).

```
> npm run secrets:scan
1:13PM INF 54 commits scanned.
1:13PM INF scanned ~2083797 bytes (2.08 MB) in 119ms
1:13PM INF no leaks found
EXIT=0
rev-list: 54
```

`54 commits scanned` equals `git rev-list --all --count` = `54`. No gap, so the
delete-only-commit check (E6) was not needed.

## Mutation table (Step 7)

Each mutation was applied alone to `scripts/secret-scan.sh`, the focused test file was run,
the result recorded, then the file was restored from a `/tmp` backup taken before any
mutation and verified byte-identical (`diff` against the backup, not `git diff` — the file
was still untracked at that point in the session, so `git diff` would have been vacuously
empty regardless of content; `diff` against the saved original is the real check).

| Mutation | Test that went red | Result |
|---|---|---|
| `--log-opts="--all -m"` → `--log-opts="--all"` | "finds a secret typed only while resolving a merge conflict (-m)" | 1 failed / 12 passed — confirmed |
| `--log-opts="--all -m"` → `--log-opts="--first-parent -m"` | "finds a secret added and removed inside a merged branch (no --first-parent)" | 1 failed / 12 passed — confirmed |
| shallow check `= "true" ]` → `= "never" ]` | "refuses a shallow clone instead of passing on one commit" | 1 failed / 12 passed — confirmed |
| remove `--redact` from the `history` line | "finds a secret that was committed and later deleted, and never prints it" | 1 failed / 12 passed — confirmed |

After each mutation was undone: `diff scripts/secret-scan.sh /tmp/secret-scan.sh.orig` →
identical, and a final run confirmed 13/13 pass before committing.

## Step 8 — lint, format, types, full test suite

```
npm run lint            → clean (eslint . --max-warnings 0)
npm run format:check    → "All matched files use Prettier code style!"
npm run typecheck       → clean (tsc --noEmit)
npm test                → 3 files, 138 tests, all passed
```

`git ls-files --stage scripts/secret-scan.sh` → `100755 <sha> 0 scripts/secret-scan.sh`
(executable bit committed correctly).

## Files changed

- `scripts/secret-scan.sh` (new, `100755`)
- `package.json` (`secrets:scan` added, `test:all` extended)
- `tests/unit/secret-guard.test.ts` (five insertions, matches Appendix A's Task-2 subset)

Commit: `5777779` — `feat(secret-guard): full-history scan with merge commits (T-02a)`,
message copied verbatim from the brief, with both required trailers appended
(`Co-Authored-By: Claude Opus 5 (1M context)` from the brief, plus
`Co-Authored-By: Claude Sonnet 5` and `Claude-Session:` per the workflow's attribution
rule — same pattern Task 1 used, ruled acceptable by the controller notes).

`git status --porcelain` after the commit: clean.

## Self-review

- Diff is minimal and matches the brief's code blocks verbatim (checked by direct
  comparison); no drive-by changes, no Task 3–5 scope.
- Test file matches Appendix A exactly for the Task-2 portion; the Task-3-only pieces
  (`hooksDir`, `installHooks`, second `package.json` test, `pre-commit` and
  `install-git-hooks.sh` describe blocks) are correctly absent.
- Full local verification (`lint`, `format:check`, `typecheck`, `test`) is pristine — no
  warnings, no skipped tests.
- `parseReport`'s known Minor (bare JSON `SyntaxError` on a gitleaks fatal error) was left
  untouched, as instructed — it is not exercised by anything added in this task.

## Concerns

- The mandated commit message (Step 8) says "43 of 49 commits here", a figure from when
  the brief was written; this repository now has 54 commits (`git rev-list --all --count`
  as of Step 6). The instruction was to use the message verbatim, so it was committed
  as given rather than silently edited — flagging the staleness here rather than treating
  it as a deviation.
- Carrying over the deferred `parseReport` Minor already on record (gitleaks also exits 1
  on a fatal error, so a failure surfaces as a bare JSON `SyntaxError` instead of a named
  error) — untouched per the controller's instruction, left for the final review.
- No other deviations from the brief. `staged` is implemented (needed verbatim per Step 3's
  code) but is not exercised by any test in this task, which matches the brief: Task 3 owns
  the hook and its tests.
