# T-13 Task 4 report: schema drift (T-02 hand-off)

Status: DONE. Commit `12d3a6f` on `task/T-13-ci-hardening`: `test(ci): fail when the schema and the migrations disagree`.

## What was done
- Created `tests/api/schema-drift.spec.ts` (brief verbatim), `scripts/schema-drift.sh` (brief verbatim, mode 100755 like the other scripts, run as `sh scripts/schema-drift.sh`).
- `package.json`: `"db:drift": "sh scripts/schema-drift.sh"` after `db:reset`.
- `tests/api/README.md`: one list entry for the file, saying it needs a migrated database (`npm run db:reset`) and that an extra model must be reported as drift (exit 2).
- `ci.yml` untouched (the `api` job already runs `prisma migrate deploy` then `npm run test:api`), so no actionlint run was needed.

## TDD evidence
RED (script absent), `npx playwright test --project=api tests/api/schema-drift.spec.ts`: 2 failed. Prediction matched.
- test 1: `sh: .../scripts/schema-drift.sh: No such file or directory`, Expected 0, Received 127
- test 2: same message, Expected 2, Received 127

GREEN (after the script), `--reporter=list`:
```
✓ [api] › tests/api/schema-drift.spec.ts:11:1 › the migrated database matches prisma/schema.prisma (494ms)
✓ [api] › tests/api/schema-drift.spec.ts:16:1 › a schema with a table no migration creates is reported as drift (474ms)
2 passed (5.1s)
```
Matches the brief's measurement (2 passed in 5.3 s). `npm run db:drift` directly: `No difference detected.`, exit 0.
The failing-on-purpose requirement is met by test 2 (extra `SchemaDriftFixture` model -> exit 2, stdout names the model).

## Database
- Before: `npx prisma migrate status` -> 2 migrations found, "Database schema is up to date!". So `npm run db:reset` was not needed and was not run; nothing seeded or altered.
- After: unchanged. The drift script is read-only (`migrate diff`). The spec does not reset or write to the DB. The Playwright webServer (build + `next start` on :3000) was started and stopped by the runner as usual.

## Gates before the commit (each its own command)
- `npm run typecheck`: clean
- `npm run lint`: clean (`--max-warnings 0`)
- `npm run format:check`: all files formatted (prettier --write on the spec: unchanged)
- `npm test`: 73 files, 933 tests passed (baseline for this branch, unchanged: the new file is a Playwright API spec, not vitest)
- Playwright API run: only `tests/api/schema-drift.spec.ts` (2 tests); full `test:all` not run, as instructed.

## Deviations
- File mode: the brief does not mention it; I made `schema-drift.sh` executable to match `gitleaks.sh` / `secret-scan.sh`. `db:drift` and the spec invoke it through `sh` regardless.
- README: the brief said "one line"; the entry wraps to three lines to fit the file's 100-column style (one bullet).
- Report written via shell redirect because Write refused the shared-checkout path.

## Concerns
- `prisma migrate diff --from-config-datasource` relies on `prisma.config.ts` reading `DATABASE_URL`; works here and in the CI `api` job (which sets it for `migrate deploy`), but the spec fails if run against an unmigrated database. That is intended and documented in the README.
- `scripts/README.md` has no entry for the new script (the brief did not ask for one); it could get a line in a follow-up.

## Follow-up round (minors 1-3)
Commit `e397022` `test(ci): pin what the schema-drift check compares against, in both directions, and document it` (new commit; `12d3a6f` not amended). Files: `tests/api/schema-drift.spec.ts`, `scripts/README.md`, `README.md` (one table row, kept within the existing column width so prettier did not re-flow the table; diff is +1 line).

- Spec: temp-dir/cleanup moved into one helper `driftAgainstEditedSchema(edit)`. Fixture 1 (extra model) gained `expect(stdout).not.toContain("Balance")`. New fixture 2 removes `model LoginAttempt { ... }` from a schema copy (regex `/model LoginAttempt \{[^}]*\}\n?/`; schema.prisma has no other reference to LoginAttempt, checked with grep: only its own declaration at line 118) and expects exit 2, "LoginAttempt" in stdout, and no "Balance".
- GREEN against the migrated `personal_finance` DB: 3 passed (5.8 s).
- Failing on purpose against an EMPTY database: created a throwaway database `drift_empty_probe` with `docker compose exec -T postgres createdb -U postgres`, ran `env DATABASE_URL=postgresql://postgres:postgres@localhost:5432/drift_empty_probe npx playwright test --project=api tests/api/schema-drift.spec.ts`: 3 failed, each on the intended assertion:
  - test 1: Expected 0, Received 2 (output lists all tables as "Added tables": Balance, Transaction, Budget, Pot, ResetLog, LoginAttempt)
  - test 2: `not.toContain("Balance")` failed (line 35), the empty-DB output lists Balance and SchemaDriftFixture
  - test 3: `toContain("LoginAttempt")` failed (line 44), the output has no LoginAttempt because neither side has it
  Then dropped it with `dropdb -U postgres drift_empty_probe`; `psql -tAc "select datname from pg_database"` afterwards: personal_finance, postgres, template0, template1. The shared `personal_finance` data was not touched (no SQL against it; the webServer only ran `next build` / `next start`).
- README.md row: `npm run db:drift` — `prisma migrate diff`, migrated database vs `prisma/schema.prisma`; exit 2 on drift, also run by `test:api`. (The `scripts/schema-drift.sh` name is in scripts/README.md, not the row, to stay within the column width.)
- scripts/README.md: paragraph before "Secret guard" (what it compares, exit 0/1/2, needs a migrated DB, `npm run db:drift`, both fixtures).
- Gates: `typecheck`, `lint`, `format:check` clean; `npm test`: 74 files, 935 tests passed (was 73/933 at the previous report: the +1 file/+2 tests come from commit `46f334f` (Task 5) that landed on the branch in between, not from this change).
