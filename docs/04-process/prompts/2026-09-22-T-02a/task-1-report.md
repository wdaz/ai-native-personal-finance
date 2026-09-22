# Task 1 report: Pinned gitleaks and the `postgres_connection_string` rule

Commit: `17d4543` — `feat(secret-guard): pinned gitleaks and the postgres_connection_string rule (T-02a)`

## T-01 baseline (before creating any file)

`npm test` on the clean, freshly-`npm ci`'d worktree: **2 test files, 125 tests passed.**
This is the T-01 baseline Task 4 will check against (`T-01 unit tests + 19` = 125 + 7 + 12 = 144).

## What was implemented

- `scripts/gitleaks.sh` — downloads and SHA-256-verifies gitleaks 8.30.1 into
  `node_modules/.cache/gitleaks/8.30.1/`, then `exec`s it with the given arguments.
  `GITLEAKS_CACHE_DIR` / `GITLEAKS_BASE_URL` overrides as specified. Exit 2 on unsupported
  platform or checksum mismatch. Committed as mode `100755`.
- `.gitleaks.toml` — `[extend] useDefault = true`, plus the `postgres_connection_string`
  rule with two `[[rules.allowlists]]` (local hosts; documentation/fixture placeholders)
  and a global `[[allowlists]]` for `.next/` and `docs/00-discovery/inputs/`.
- `tests/fixtures/secret-scan/postgres-violations.txt.fixture` (7 lines) and
  `postgres-controls.txt.fixture` (10 lines), plus `README.md` explaining the `{{…}}`
  placeholder scheme — all copied verbatim from the brief.
- `tests/unit/secret-guard.test.ts` — the Task 1 stage of the shared file (helpers
  `repoRoot`, `testEnv`, `run`, `FAKE_CREDENTIALS`, `materialise`, `violations`,
  `controls`, `leakLine`, `scratch`, `writeInto`), copied verbatim, 7 tests.

All code/config/fixture/test content was transcribed verbatim from the brief; no
"improvements" were made.

## Tests and results

Focused file: `npx vitest run tests/unit/secret-guard.test.ts` — **7/7 pass** (final state).
Full suite: `npm test` — **3 test files, 132 tests passed** (125 baseline + 7 new).

## TDD evidence

**RED (Step 4)** — before any implementation file existed:
```
npx vitest run tests/unit/secret-guard.test.ts
```
```
FAIL tests/unit/secret-guard.test.ts [ tests/unit/secret-guard.test.ts ]
Error: scripts/gitleaks.sh failed:
undefined
 ❯ tests/unit/secret-guard.test.ts:90:34
Test Files  1 failed (1)
     Tests  7 skipped (7)
```
Matches the brief's expectation exactly: `beforeAll` throws because the script does not
exist; Vitest reports the file failed and all 7 tests skipped.

**Intermediate (Step 6)** — after `scripts/gitleaks.sh` existed but `.gitleaks.toml` did not:
```
npx vitest run tests/unit/secret-guard.test.ts
```
```
Tests  5 failed | 2 passed (7)
```
The two `scripts/gitleaks.sh` tests ("runs the pinned gitleaks release", "refuses a
download whose SHA-256 is not the pinned one...") passed. The five `.gitleaks.toml` tests
failed with `SyntaxError: Unexpected end of JSON input` — gitleaks cannot open the missing
config, writes no report, `JSON.parse("")` throws. Matches the brief exactly. First run
also printed `gitleaks.sh: downloading gitleaks 8.30.1 (darwin_arm64)` to stderr, per the
GITLEAKS_CACHE_DIR default.

**GREEN (Step 8)** — after `.gitleaks.toml` was written:
```
npx vitest run tests/unit/secret-guard.test.ts
```
```
Test Files  1 passed (1)
     Tests  7 passed (7)
```

## Mutation table (Step 9 — DoD v1.1)

Each mutation applied alone, run, confirmed red, then restored from a saved copy
(`/tmp/gitleaks.toml.orig`, `/tmp/gitleaks.sh.orig`) and verified with `diff` to be
byte-identical to the pre-mutation file before moving to the next mutation.

| Mutation | Test(s) that went red | Notes |
|---|---|---|
| `.gitleaks.toml`: `useDefault = true` → `useDefault = false` | "still applies gitleaks' default rules ([extend] useDefault)" | Exactly as predicted. |
| `.gitleaks.toml`: `@(?:localhost\|127\.0\.0\.1)$` → `@NEVER$` | "reports nothing on the controls fixture" **and** "reports nothing on the fixtures as committed, which is why they can live in the tree" | Brief's table names only the first; the second also failed because `postgres-controls.txt.fixture` line 1 (`postgresql://postgres:postgres@localhost:5432/personal_finance`, the `.env.example` default) has no `{{…}}` placeholder — it is a real, literal `localhost` credential held down only by the local-host allowlist. Killing that allowlist un-suppresses it even in the as-committed fixture. This is a brief imprecision (a second, correctly-derivable consequence), not a defect. |
| `.gitleaks.toml`: global `paths = [...]` → `paths = ['''^NEVER/''']` | "ignores .next/ and docs/00-discovery/inputs/, and nothing else" | Exactly as predicted. |
| `scripts/gitleaks.sh`: `if [ "$actual" != "$SHA256" ]; then` → `if false; then` | "refuses a download whose SHA-256 is not the pinned one, and keeps nothing" | Exactly as predicted. |

After undoing all four mutations: `npx vitest run tests/unit/secret-guard.test.ts` → **PASS, 7 tests.** `git diff` against the committed `.gitleaks.toml` / `scripts/gitleaks.sh` showed no remnants before the final commit.

## Step 10 verification

```
npm run lint          # clean
npm run format:check  # 1 warning: tests/fixtures/secret-scan/README.md (see below)
npm run typecheck     # clean
npm test              # 132 passed
```

`format:check` flagged `README.md` for markdown table column padding (cosmetic only —
verified below). Fixed with `npx prettier --write tests/fixtures/secret-scan/README.md`;
`format:check` then passed. **Content verification:** I diffed the brief's ```markdown
block against the committed file with whitespace collapsed (`tr -s ' \n' ' '` on both
sides) — the word streams are identical (only trailing-newline artifacts from `tr`
differ). The prettier run only normalized table padding; no word was added, dropped or
changed.

`git ls-files --stage` (all six files):
```
100644 .gitleaks.toml
100755 scripts/gitleaks.sh
100644 tests/fixtures/secret-scan/README.md
100644 tests/fixtures/secret-scan/postgres-controls.txt.fixture
100644 tests/fixtures/secret-scan/postgres-violations.txt.fixture
100644 tests/unit/secret-guard.test.ts
```
Only the shell script is executable; the rest are plain files, as expected.

### Staged-content scan (deviation — see concerns)

The brief's exact Step 10 command,
`scripts/gitleaks.sh git --pre-commit --staged --config .gitleaks.toml --no-banner .`,
was refused by this session's shell sandbox every time it was tried (as the wrapper
script, as the raw cached binary, with absolute paths, from the worktree root): the guard
detects a binary invoked with `git` as an operand and cannot prove — since gitleaks
itself shells out to `git` internally for `git`-mode scanning — that the resulting git
operations stay inside this worktree. This is a sandbox-level restriction stated in this
session's tool description, not something to route around (e.g. by copying/renaming the
binary), so I did not attempt that.

Substitute actually run: `scripts/gitleaks.sh dir --config .gitleaks.toml --no-banner .`
→ `no leaks found` (scanned ~829 KB, the whole working tree). This is an equivalent check
for this task: all six files were newly added and untouched after `git add`, so the
staged content and the working-tree content are identical, and `dir` mode scanned a
superset (the whole tree, not just the staged diff) clean. No Task 1 guarantee is left
unverified by this substitution — the `--pre-commit --staged` git-hook invocation path
belongs to Task 2 (the pre-commit hook), not to anything in Task 1's file list.

## Self-review

- Diff is exactly the six files in the brief's file list; nothing extra staged or created
  (no `secret-scan.sh`, hook, `package.json` or CI changes, per the controller notes).
- No leftover mutation remnants: each mutated file was restored from a pre-mutation copy
  and diffed clean before the next mutation and before commit.
- Test output is pristine: 7/7 focused, 132/132 full suite, no console noise beyond the
  one expected first-run gitleaks download line (stderr, not part of assertions).
- Fixed one real (if cosmetic) transcription artifact: markdown table column padding in
  `README.md`, caught by `format:check` and verified content-identical to the brief
  before and after the `prettier --write` fix.

## Commit message note

The controller's instructions specified the trailer
`Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`, matching the brief's
own commit message. This session is running as Sonnet 5 (per this session's own
system context), not Opus 5. I used the controller's literal instruction as given —
the controller is the reviewer of record — but flag the model-name mismatch here rather
than silently resolving it either way; the commit also carries a second
`Co-Authored-By: Claude Sonnet 5` line plus the `Claude-Session` line per this session's
own attribution instructions, so both are on record.

## Concerns

1. **Step 10's exact staged-scan command could not be run** in this sandboxed session
   (see "Staged-content scan" above). A `dir`-mode scan of the whole working tree was run
   instead and reported clean. The controller may want to run the literal
   `git --pre-commit --staged` invocation itself outside this sandbox to double-check.
2. **Commit trailer names "Claude Opus 5"** per the controller's literal instruction,
   while this session is Sonnet 5 — see "Commit message note" above.
3. The mutation table's second row surfaced one test beyond what the brief's table names
   (see table note) — expected behavior, not a defect, but worth the controller's
   attention since it means the local-host allowlist protects two tests, not one.

No other deviations from the brief.

## Fix round 1 — finding 1 (Step 10 staged-content scan)

**Finding:** Step 10's `scripts/gitleaks.sh git --pre-commit --staged --config .gitleaks.toml
--no-banner .` was never actually run; a `dir` scan of the whole working tree was run
instead. For six newly added files that is equivalent, and the as-committed fixture test
already covers the fixtures.

**Baseline re-check (no file created yet, per controller note):** `npm test` on this
worktree (node_modules already present, so no `npm ci` was needed) → **3 test files, 132
tests passed.** This is *not* a new T-01 baseline — the report above already records the
correct pre-Task-1 baseline as 125 (`125 + 7 + 12 = 144` for Task 4). 132 = 125 + the 7
tests Task 1 itself added; Task 1's files were already in the tree when this fix round
started, so 132 is simply confirmation of the existing post-Task-1 total, recorded here so
the number isn't mistaken for a fresh baseline.

**What I tried:** the exact Step 10 command, in four shapes — the wrapper
(`scripts/gitleaks.sh git --pre-commit --staged --config .gitleaks.toml --no-banner .`),
the raw cached binary (`node_modules/.cache/gitleaks/8.30.1/gitleaks git …`), the same with
every path made absolute, and the same with the trailing `.` operand dropped. All four were
refused, byte-identically, by this session's own worktree guard:

> This session is isolated in the worktree …, but this command runs gitleaks[.sh] with a
> git command among its operands: what runs it, and from which directory or root, cannot be
> read here … Refusing to run it.

This is the same restriction the original report already named (not a new discovery); the
four variations confirm it is a static guard on the `<launcher> git …` shape, not something
another rephrasing gets past. Per the controller notes and this session's own tool
description, this is not something to route around — so I did not keep retrying and instead
built a stricter substitute for the missing check.

**What I ran instead (the fix):** for each of the six files in the Task 1 diff, I extracted
the exact staged content with a plain `git show HEAD:<path>` (tree is clean, so
`HEAD == index == worktree`) into `/tmp/staged-scan/<basename>`, then scanned that directory
with `scripts/gitleaks.sh dir --config .gitleaks.toml --no-banner --report-format json
--report-path - /tmp/staged-scan` — no `git` operand, so the guard does not apply.

Command and output:
```
scripts/gitleaks.sh dir --config .gitleaks.toml --no-banner --report-format json --report-path - /tmp/staged-scan
1:08PM INF scanned ~14367 bytes (14.37 KB) in 6.37ms
1:08PM INF no leaks found
[]
EXIT: 0
```

Before scanning, I verified the six extracted blobs are byte-identical to the working-tree
files with `diff` on each pair (all six: `.gitleaks.toml`, `scripts/gitleaks.sh`,
`tests/fixtures/secret-scan/README.md`, `postgres-controls.txt.fixture`,
`postgres-violations.txt.fixture`, `tests/unit/secret-guard.test.ts`) — all identical, so
the bytes scanned are exactly the staged bytes, not an approximation.

**Why this is at least as strict as the missing command, not just "equivalent":**
- Flattening the six blobs to basenames in `/tmp/staged-scan` means the `.gitleaks.toml`
  global `paths` allowlist for `.next/` and `docs/00-discovery/inputs/` cannot match any of
  them (there is no such path component left). None of the six files lives under those
  paths in the real tree either, so this can only make the surrogate scan *more* likely to
  report a finding than a path-aware staged scan, never less — it is not a check that could
  pass by accident.
- The content scanned is proven byte-identical to both the git-staged content and the
  current working tree (six-way `diff`, above), so this is a scan of the actual staged
  bytes, not a superset of the tree (the previous round's `dir .` scanned ~829 KB — the
  whole working tree — which is what the finding flagged as not being the same thing as a
  staged-only scan).

**Covering test:** `tests/unit/secret-guard.test.ts` — "reports nothing on the fixtures as
committed, which is why they can live in the tree" already asserts the fixtures'
as-committed content is clean via `gitleaks stdin`; the blob-scan above extends the same
claim to the other four Task 1 files (`.gitleaks.toml`, `scripts/gitleaks.sh`, `README.md`,
`secret-guard.test.ts`) that the test file does not scan itself.

Re-ran the file to confirm no regression:
```
npx vitest run tests/unit/secret-guard.test.ts
```
```
Test Files  1 passed (1)
     Tests  7 passed (7)
```

**No code change, no commit.** This finding was a verification gap, not a defect in any
committed file — all six files were already correct (the blob scan reports `no leaks
found`). Nothing tracked changed, so no commit was made (an empty or unrelated commit would
misrepresent this round). `git status -sb` remained `## task/T-02a-secret-guard...
origin/task/T-02a-secret-guard [ahead 1]` (clean) throughout.

**Residual concern:** the literal `gitleaks git --pre-commit --staged` invocation remains
unrunnable inside this session's worktree guard. If the controller wants that exact spec
line exercised, it needs to run it from outside this sandboxed session (e.g. the real
pre-commit hook once Task 2 adds it, or a manual run outside this harness). That does not
change the outcome for these six files: they are verified clean by the stricter
byte-identical surrogate above.
