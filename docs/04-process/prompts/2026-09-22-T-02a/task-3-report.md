# Task 3 report — the pre-commit hook and its installation

## What was implemented

1. `tests/unit/secret-guard.test.ts` — added, verbatim from the brief:
   - `hooksDir` / `installHooks` consts after `secretScan`.
   - `it("installs the hook on npm install and npm ci (prepare)", …)` inside
     `describe("package.json", …)`.
   - `describe("scripts/git-hooks/pre-commit", …)` (3 tests) and
     `describe("scripts/install-git-hooks.sh", …)` (2 tests) inside
     `describe("T-02a secret guard", …)`.
2. `scripts/git-hooks/pre-commit` (new, mode `100755`) — runs
   `secret-scan.sh staged`; on failure prints the "commit blocked" message to stderr and
   exits 1.
3. `scripts/install-git-hooks.sh` (new, mode `100755`) — sets
   `core.hooksPath scripts/git-hooks` when inside a git work tree; a no-op otherwise.
4. `package.json` — added `"prepare": "sh scripts/install-git-hooks.sh"` after `"start"`.

Both new shell files were copied verbatim from the brief's code blocks — no changes.

## TDD evidence

**RED** — `npx vitest run tests/unit/secret-guard.test.ts` (after Step 1, before Step 3/4):

```
Test Files  1 failed (1)
     Tests  5 failed | 14 passed (19)
```

Failures, matching the brief's Step 2 expectation exactly:
- `package.json > installs the hook … (prepare)`: `expected undefined to be 'sh scripts/install-git-hooks.sh'`.
- `pre-commit > blocks a commit that stages a secret`: `expected +0 not to be +0` (no hook, so the leaking commit succeeds).
- `pre-commit > is committed executable …`: only `100755 scripts/gitleaks.sh` and
  `100755 scripts/secret-scan.sh` staged — the two new files not yet present.
- `install-git-hooks.sh` × 2: both exit `127` (`sh` cannot open the missing file).
- `pre-commit > lets a clean commit through` passed already (the control — no hook lets
  every commit through).

**GREEN** — after Steps 3–4, same command:

```
Test Files  1 passed (1)
     Tests  19 passed (19)
```

## Appendix A diff

Extracted the ```ts block from `appendix-a.md` to
`.superpowers/sdd/2026-09-22-T-02a/workspace/appendix-a-extracted.ts` and ran
`diff` against `tests/unit/secret-guard.test.ts`: **no output — files are identical.**

## Step 6 — installing the hook here

```
npm run prepare && git config core.hooksPath
```
→ `scripts/git-hooks` (written to the repository's shared `.git/config`, applying to
every worktree, per D9 / controller ruling P5 — left in place, not unset).

## Mutation testing (Step 7)

| Mutation | Command | Test that went red | Restored |
|---|---|---|---|
| `git update-index --chmod=-x scripts/git-hooks/pre-commit` | ran full test file | "is committed executable, because git skips a non-executable hook with only a hint" (only that one; 18 passed, 1 failed) | `git update-index --chmod=+x scripts/git-hooks/pre-commit`; confirmed index mode back to `100755` |
| Deleted the `"prepare": "sh scripts/install-git-hooks.sh",` line from `package.json` | ran full test file | "installs the hook on npm install and npm ci (prepare)" (only that one; 18 passed, 1 failed) | Re-added the exact line; ran full suite again: 19/19 pass; `git diff package.json` shows only the intended one-line addition (no mutation remnant) |

## Verification before commit (Step 8)

```
npm run lint          → clean (0 warnings)
npm run format:check  → "All matched files use Prettier code style!"
npm run typecheck     → clean
npm test              → 3 files, 144 tests passed
```

## The first real hook run (the Step 8 commit itself)

With `core.hooksPath = scripts/git-hooks` now active in this worktree's shared
`.git/config`, the Step 8 `git commit` was the hook's first real invocation
(`gitleaks git --pre-commit --staged` via `secret-scan.sh staged`).

- Output: silent (no hook stderr/stdout appeared in the commit's terminal output).
- Exit status: `0` (commit succeeded; `git log` shows `c9e70bd` created normally).
- `--no-verify` was not used at any point.

## Files changed

- `tests/unit/secret-guard.test.ts` (modified — insertions per Appendix A)
- `scripts/git-hooks/pre-commit` (new, `100755`)
- `scripts/install-git-hooks.sh` (new, `100755`)
- `package.json` (modified — `prepare` script added)

Confirmed staged/committed modes:
```
100755 scripts/git-hooks/pre-commit
100755 scripts/gitleaks.sh
100755 scripts/install-git-hooks.sh
100755 scripts/secret-scan.sh
```

## Self-review

- Diff is minimal and matches the brief's file list exactly: no drive-by changes, no
  edits to `ci.yml`, `README.md`, `scripts/README.md`, or `docs/`.
- Hook and installer scripts are copied verbatim from the brief; no "improvements" made.
- Test output is pristine: no `console.*` noise, no skipped tests, no flakiness observed
  across three separate full runs (RED, GREEN, post-mutation-restore).
- YAGNI: nothing beyond what the brief specifies was added (no extra hooks, no extra
  npm scripts, no extra guard logic in the pre-commit script).
- `git diff HEAD~1 -- package.json` confirms the working tree has no leftover mutation
  artifacts; `git status` is clean after the commit.
- One scratch file was created outside the task's file list for the required Appendix-A
  diff check: `.superpowers/sdd/2026-09-22-T-02a/workspace/appendix-a-extracted.ts`. This
  is inside the task's own `.superpowers/sdd/2026-09-22-T-02a/` report directory (the one
  location the rules permit writing to beyond the file list) and was not staged or
  committed.

## Concerns

None. The brief's code, expected test counts/messages, and the Step 2 failure output all
matched reality exactly — no transcription errors found, no forced deviations.

## Fix round 1 (review finding: --no-verify not named in blocked-commit message)

**Finding fixed:** Important (plan D10; controller ruling T3-R1) — the blocked commit's
own printed message never named `git commit --no-verify` (only the header comment did),
and no test asserted on it.

**Change:** In `scripts/git-hooks/pre-commit`, added the two lines below, verbatim,
directly after the existing "value is a real credential..." echo and before `exit 1`:

```sh
  echo "Only for a false positive, or when gitleaks cannot run: git commit --no-verify skips" >&2
  echo "this hook. Never use it to commit a real secret." >&2
```

In `tests/unit/secret-guard.test.ts`, inside `"blocks a commit that stages a secret"`,
added directly after `expect(result.stderr).toContain("commit blocked");`:

```ts
expect(result.stderr).toContain("git commit --no-verify");
```

**Covering test:** `tests/unit/secret-guard.test.ts` — `"blocks a commit that stages a secret"`.

**Mutation check (evidence the new assertion is load-bearing):**

1. Deleted the two new echo lines from `scripts/git-hooks/pre-commit` (kept file mode
   100755).
2. Ran `npx vitest run tests/unit/secret-guard.test.ts` — went RED as expected:
   ```
   FAIL tests/unit/secret-guard.test.ts > T-02a secret guard > scripts/git-hooks/pre-commit > blocks a commit that stages a secret
   AssertionError: expected 'Finding:     DATABASE_URL="postgresql…' to contain 'git commit --no-verify'
   ...
   Test Files  1 failed (1)
        Tests  1 failed | 18 passed (19)
   ```
3. Restored the two lines (`cp` from a pre-mutation backup + `chmod 755`), then
   `git diff scripts/git-hooks/pre-commit` showed exactly the intended two-line addition
   (no other change, no mode line in the diff).
4. Re-ran `npx vitest run tests/unit/secret-guard.test.ts` — GREEN:
   ```
   Test Files  1 passed (1)
        Tests  19 passed (19)
   ```

**Other required checks, all green before commit:**
- `npm run lint` — `eslint . --max-warnings 0` — no output, exit 0.
- `npm run format:check` — `prettier --check .` — "All matched files use Prettier code
  style!"
- `npm run typecheck` — `tsc --noEmit` — no output, exit 0.

**Commit and hook run:** Committed through the installed pre-commit hook (no
`--no-verify` used). Command and result:

```
git add scripts/git-hooks/pre-commit tests/unit/secret-guard.test.ts
git commit -F /tmp/t3-msg.txt; echo "exit=$?"
```
Output:
```
[task/T-02a-secret-guard 7d2357f] fix(secret-guard): print the --no-verify escape hatch in the blocked-commit message (T-02a review round 1)
 2 files changed, 3 insertions(+)
exit=0
```
The hook ran gitleaks against the two staged text files, found nothing, and let the
commit through — no hook stderr output, exit status 0.

Post-commit mode check (index, not just worktree):
```
$ git ls-files --stage scripts/git-hooks/pre-commit
100755 4e003cd76d60e7c2e808086dc764f64f8949fa22 0	scripts/git-hooks/pre-commit
```
Commit SHA: `7d2357fa036df339721cb938515edb3142cb0fc9`.

**Scope:** Only `scripts/git-hooks/pre-commit` and `tests/unit/secret-guard.test.ts`
were touched, exactly as the finding specified. Deferred Minors from Tasks 1-2 were left
untouched. This report file was appended to, not committed (per task rules, one fix
commit for the two code files).

**Concerns:** None.
