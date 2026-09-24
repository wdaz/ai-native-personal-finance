# scripts

Repo tooling run through `npm run`: generators and checks, not application code
(ADR-0002, clarification of 2026-09-20).

- **Imports allowed:** `src/shared`, `src/domain`.
- **Imports forbidden:** `app/`, `src/server`, `src/webmcp`, `src/ui`.

`seed-figures.ts` (T-03) computes the seed's Overview with the domain's own functions and
prints SPEC-overview §4.3 (`npm run seed:figures`). `tests/unit/seed-figures.test.ts` fails
when the spec's table differs from that output, and a later test that needs a seed figure
imports it from here (`seedFigures()`) rather than typing it
(`docs/04-process/build-workflow.md`: "Any seed-derived figure in code or tests comes from
`scripts/seed-figures.ts`, never typed").

`schema-drift.sh` (T-13, T-02 hand-off) runs `prisma migrate diff` between the migrated
Postgres named by `DATABASE_URL` and `prisma/schema.prisma` (or the schema file given as its
argument), so a schema edit without a migration, or a migration without a schema edit, fails.
Exit 0 = no difference, 2 = drift (Prisma's own `--exit-code`), 1 = Prisma could not run. It
needs a migrated database (`npm run db:reset` first); run it with `npm run db:drift`.
`tests/api/schema-drift.spec.ts` runs it against the real schema and proves it reports drift
in both directions, with a schema that has an extra model and one that lacks a migrated table.

## Secret guard (T-02a, NFR-S5)

POSIX shell, no imports. `tests/unit/secret-guard.test.ts` proves each part fails on
purpose.

| File                   | Role                                                                                                                                                                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gitleaks.sh`          | Runs the pinned gitleaks release; downloads it on first use into `node_modules/.cache/gitleaks/<version>/<platform>/` and checks its SHA-256 once, at download; a cached binary is trusted                                                          |
| `secret-scan.sh`       | The two scans with their flags: `history` (the changes in every commit, merges included, and every commit and annotated-tag message — CI and `npm run secrets:scan`) and `staged` (the pre-commit hook, which cannot see the message being written) |
| `git-hooks/pre-commit` | Blocks a commit whose staged changes contain a secret; `git commit --no-verify` skips it, CI does not                                                                                                                                               |
| `install-git-hooks.sh` | Sets `core.hooksPath` to `scripts/git-hooks`; run by `npm install` and `npm ci` through `prepare`                                                                                                                                                   |

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
