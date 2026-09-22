# scripts

Repo tooling run through `npm run`: generators and checks, not application code
(ADR-0002, clarification of 2026-09-20).

- **Imports allowed:** `src/shared`, `src/domain`.
- **Imports forbidden:** `app/`, `src/server`, `src/webmcp`, `src/ui`.

`seed-figures.ts` (T-03) prints the worked example of SPEC-overview §4.3 from
`data.json`; the spec table must equal its output
(`docs/04-process/build-workflow.md`: "Any seed-derived figure in code or tests comes
from `scripts/seed-figures.ts`, never typed").

## Secret guard (T-02a, NFR-S5)

POSIX shell, no imports. `tests/unit/secret-guard.test.ts` proves each part fails on
purpose.

| File                   | Role                                                                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `gitleaks.sh`          | Runs the pinned gitleaks release; downloads it on first use into `node_modules/.cache/gitleaks/<version>/<platform>/` and checks its SHA-256 once, at download; a cached binary is trusted |
| `secret-scan.sh`       | The two scans with their flags: `history` (the changes in every commit, merges included, not commit or tag messages — CI and `npm run secrets:scan`) and `staged` (the pre-commit hook)    |
| `git-hooks/pre-commit` | Blocks a commit whose staged changes contain a secret; `git commit --no-verify` skips it, CI does not                                                                                      |
| `install-git-hooks.sh` | Sets `core.hooksPath` to `scripts/git-hooks`; run by `npm install` and `npm ci` through `prepare`                                                                                          |

### Known limitation: worktrees and an absolute `core.hooksPath`

`install-git-hooks.sh` writes the relative path `scripts/git-hooks`, which git resolves
inside each worktree to that worktree's own copy. On 2026-09-22 the shared `.git/config`
held the main checkout's absolute path instead — written by something outside this
repository; where it came from was not established. While the path is absolute, a commit
in any worktree (`.claude/worktrees/…`) runs the main checkout's hook, `secret-scan.sh`,
`.gitleaks.toml` and gitleaks cache, not the branch's own. A branch that changes one of
those files is therefore not checked by its own version until it is merged, and a broken
cache in the main checkout blocks commits in every worktree (setting `GITLEAKS_CACHE_DIR`
for the commit points the hook at another cache). `npm install` or `npm ci` in any checkout
writes the relative path back. The CI `secret scan` job reads every commit either way.
