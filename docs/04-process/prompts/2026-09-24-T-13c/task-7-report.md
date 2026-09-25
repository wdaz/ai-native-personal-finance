# Task 7 report — `npm run db:reset` refuses another machine's database before it applies a migration

Worktree `/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/t-13c-tech-debt`, branch
`task/T-13c-tech-debt`, cut from `0f0931d`. Date of the run: 2026-09-25. macOS, Node 26.7.0,
npm 11.19.0, the local Postgres of `compose.yaml` (healthy, `127.0.0.1:5432`), nothing else
running. Status: DONE_WITH_CONCERNS (the concerns are at the end; none blocks).

Two new commits, no amend, nothing pushed:

- Commit 1, `731a8f4`: `feat(env): refuse db:reset against another machine's database before it
  applies migrations (TD-10)`.
- Commit 2, subject `docs: record the owner's B on db:reset — tech-debt, backlog, SPEC-reset v1.6,
  process log, prompts`. Its id is not in this report: this report is copied into it.

## 1. What changed, per file

Commit 1 (`731a8f4`, 8 files, +103 −18):

- `prisma.config.ts` — imports `localDatabaseRefusal` from `./src/shared/env` (the way
  `playwright.config.ts` does) and, after the `.env.local` load and before `defineConfig`, when
  `process.env.npm_lifecycle_event === "db:reset"` prints the refusal with `console.error` and
  calls `process.exit(1)`. An English comment says why (the seed refuses too, `prisma/seed.ts`, but
  `migrate deploy` would already have applied every pending migration; refuse when Prisma loads
  this config for `db:reset`'s first step; keyed on the npm script's name, not on the Prisma
  command, because T-14 and CI run `npx prisma migrate deploy` directly) and why it exits rather
  than throws.
- `tests/unit/database-guard.test.ts` — one new `describe`, "npm run db:reset refuses another
  machine's database before it applies a migration (TD-10, the owner's B)", three tests (each
  90 000 ms), plus two small helpers (`output()` joins stdout and stderr; `dbReset()` starts
  `npm run db:reset` with `childEnv()` and the given `DATABASE_URL`).
- Text kept true: `prisma/seed.ts` (docblock), `prisma/README.md`, `README.md` (the paragraph and
  the `db:reset` row of the scripts table), `.env.example`, `tests/unit/README.md`,
  `src/shared/env.ts` (docblock of `localDatabaseRefusal`, comment only: the sentence "refused
  after `prisma migrate deploy` has already run, which this guard does not cover" is replaced by a
  list of the callers and the `db:reset` and direct-`migrate deploy` facts).

Commit 2 (docs, no code):

- `docs/03-specs/reset-and-test-support.md` — §2.5's `npm run db:reset` sentence; the Status
  parenthesis and the Changelog text of v1.6 (the version stays v1.6). Nothing else.
- `docs/03-specs/tech-debt.md` — TD-10: the "Fix in review" sentence, and a new "Owner's choice B"
  bullet (options, what changed, why it exits, the tests, what is still not guarded); the v1.12
  Status parenthesis gains one clause.
- `docs/03-specs/backlog.md` — v1.27's changelog sentence on `db:reset`; the T-14 row (two
  clauses: the seed/`migrate deploy` one and the `vercel env pull` one; the "unmeasured" labels
  are kept); the T-13d row's item 3 ("nothing refuses" became "nothing refuses outside
  `npm run db:reset`"); the v1.27 Status parenthesis gains one clause.
- `docs/04-process/process-log.md` — see section 8.
- `docs/04-process/prompts/2026-09-24-T-13c/` — `task-7-brief.md` (a copy of the brief),
  `task-7-report.md` (this file, copied last), and the README's table row, intro clause and closing
  paragraph.

## 2. TDD evidence

RED, before `prisma.config.ts` was touched (tree: `0f0931d` plus the new tests):

```
npx vitest run tests/unit/database-guard.test.ts
 ❯ tests/unit/database-guard.test.ts (7 tests | 1 failed)
   × npm run db:reset refuses another machine's database before it applies a migration ...
     > stops with the reason before Prisma names the host, so no migration was applied
AssertionError: expected '\n> ai-native-personal-finance@0.1.0 …' to match /Refusing to run: DATABASE_URL does no…/
 Received: "> ai-native-personal-finance@0.1.0 db:reset
> prisma migrate deploy && prisma db seed
Datasource "db": PostgreSQL database "personal_finance", schema "public" at "db.example.invalid:5432"
Loaded Prisma config from prisma.config.ts.
Prisma schema loaded from prisma/schema.prisma.
Error: P1001: Can't reach database server at `db.example.invalid:5432`
Please make sure your database server is running at `db.example.invalid:5432`."
 Tests  1 failed | 6 passed (7)
```

That is the expected failure: without the guard, Prisma names the host and tries to connect
(`migrate deploy` ran as far as the connection), and there is no refusal. The six that passed are
the four existing tests and the two new controls (a local URL is not refused; a direct
`npx prisma migrate deploy` is not refused), which pass by construction.

GREEN, after the guard: `Tests 7 passed (7)`. Also `npm test -- tests/unit/database-guard.test.ts`
(so the parent process holds `npm_lifecycle_event=test`): 7 passed.

Mutation: `"db:reset"` changed to `"db:resett"` in `prisma.config.ts` (sed with a backup) — the same
test went red with the same received output as in RED (`1 failed | 6 passed`); the file was
restored from the backup, and `git diff prisma.config.ts` shows only the intended change.

## 3. `console.error` + `process.exit(1)` versus `throw` — chosen: `console.error` + `process.exit(1)`

Both were run with `DATABASE_URL` set to a `.invalid` host (password `password`) and
`npm run db:reset`.

`console.error` + `process.exit(1)` (exit 1, chosen):

```
> ai-native-personal-finance@0.1.0 db:reset
> prisma migrate deploy && prisma db seed

Refusing to run: DATABASE_URL does not name this machine (localhost, 127.0.0.1 or [::1]) or is not a plain postgres:// or postgresql:// URL (no whitespace, no host= or hostaddr= query, no malformed % escape), and this step resets or seeds that database. Point DATABASE_URL at the local database from compose.yaml (README, Run locally) — TD-10
```

`throw new Error(refusal)` (exit 1, dropped):

```
Failed to load config file "/Users/ruslan/Own/.../t-13c-tech-debt" as a TypeScript/JavaScript module. Error: Error: Refusing to run: DATABASE_URL does not name this machine ...
```

Why: the throw is wrapped by Prisma in "Failed to load config file <absolute path> as a
TypeScript/JavaScript module", which reads like a broken config and carries a home-directory path.
The exit prints the message alone, exits non-zero, and Prisma prints nothing else (no `Datasource`
line, no host). Prisma's config loader imports `./src/shared/env` without trouble, so the BLOCKED
case did not arise and nothing was inlined.

A direct `npx prisma migrate deploy --config prisma.config.ts` with the same URL: not refused;
`Datasource "db" … at "db.example.invalid:5432"`, then `P1001: Can't reach database server`.

## 4. The local `npm run db:reset` (the URL in `.env.local`, nothing else)

```
Datasource "db": PostgreSQL database "personal_finance", schema "public" at "localhost:5432"
2 migrations found in prisma/migrations
No pending migrations to apply.
Loaded Prisma config from prisma.config.ts.
Running seed command `tsx prisma/seed.ts` ...
reset reason=manual rows=59 at=2026-09-25T06:41:58.343Z
🌱  The seed command has been executed.
```

## 5. Other runs

- `npx tsc --noEmit`: the first run reported `tests/unit/database-guard.test.ts(95,16): error
  TS2339: Property 'npm_lifecycle_event' does not exist on type '{ DATABASE_URL: string; NODE_ENV:
  ... }'` — my error, the inferred type of the spread object; fixed with `const env:
  NodeJS.ProcessEnv`; then clean.
- `npm run lint`, `npx prettier --check .`: clean.
- `npx vitest run` (full): `Test Files 81 passed (81)`, `Tests 1046 passed (1046)` — 1043 + 3.
- `sh scripts/secret-scan.sh staged` before commit 1: silent.
- `npm run test:api`: `100 passed (13.9s)`, on `731a8f4` with only uncommitted edits under `docs/` on
  top. E2E was not run: no application code changed.
- `npx vitest run tests/unit/scaffold.test.ts`: 114 passed. `npm run traceability`: "all 18 Release 1
  stories are named in a test title". The process-log diff against `origin/main` has 0 removed
  lines (added lines only).

## 6. Every text place updated

Code-adjacent (commit 1): `prisma/seed.ts` docblock; `prisma/README.md` (the `seed.ts` bullet);
`README.md` (the paragraph "Both `db:reset` (before it applies any migration) and every Playwright
run refuse …" with the direct-`migrate deploy` sentence and the seed-through-`POST /api/admin/reset`
sentence kept; the scripts row); `.env.example` (comment above `DATABASE_URL`);
`tests/unit/README.md` (the `database-guard.test.ts` sentence, now also the two controls);
`src/shared/env.ts` (docblock of `localDatabaseRefusal`). A grep of the repository outside `docs/`
for "not guarded", "migrate deploy" and "db:reset" found no other untrue sentence (`scripts/`,
`tests/api/README.md`, `src/server/*.ts` and `ci.yml` only name the commands).

Records (commit 2), the brief's list: SPEC §2.5 and its v1.6 Status/Changelog; `tech-debt.md`
TD-10; `backlog.md` v1.27 changelog and the T-14 row; the process-log entry ("Participants",
"Trigger", "Produced" — the follow-up as a bullet, and the two "at the time" notes on `b041b16` and
the docs commit; "Numbers"; "What was found during execution" — the `db:reset` bullet and the
`.env.example` review-minor note; "Verified"; "Not verified"; "Owner changes and reasoning";
"Open for the owner" — the item is now "Resolved"; "Next"); the prompts folder.

Beyond the brief's list, each small and meant to keep a sentence true (say so if you disagree):
`backlog.md` T-13d item 3 ("nothing refuses" → "nothing refuses outside `npm run db:reset`", since
`prisma.config.ts` now refuses in that one case); `backlog.md` and `tech-debt.md` Status
parentheses (one clause each); the prompts README's intro (the copies of Task 7 were made after the
PR was opened). No historical account of what a review found was rewritten: only "(at the time; …)"
notes.

## 7. Could not verify / concerns

- The guard was measured with `DATABASE_URL` set in the environment, not with `.env.local` pointing
  at another host (same code path: `.env.local` loads first, a variable already set wins), and only
  on npm 11.19.0, macOS. That npm sets `npm_lifecycle_event=db:reset` for the script was observed,
  not looked up.
- No CI run and no push. No E2E, no coverage run, no history-wide secret scan after the follow-up.
- Review of the follow-up: not done by me; the process log says it is pending (the controller
  corrects the line).
- Concern 1: `localDatabaseRefusal`'s message says "and this step resets or seeds that database".
  It now also fires at `migrate deploy`, which neither resets nor seeds (for `db:reset` as a whole
  it does reset). The brief limits `env.ts` to comment-only changes, so I did not change the message
  or its tests; a later wording pass could say "this command".
- Concern 2: the new `env.ts` docblock lists "Callers:" and names `prisma.config.ts`,
  `prisma/seed.ts` and `playwright.config.ts`; `testEnvRefusal`, in the same file, also calls
  `localDatabaseRefusal` (reached through `next.config.ts` and `isTestEnv`) and is not listed.
  Commit 1 cannot be amended; it is an incompleteness, not an untruth.
- Concern 3: the guard is keyed on the npm script's name, so `npx prisma migrate deploy && npx
  prisma db seed` typed by hand is unguarded at its first step. That is the owner's choice B, by
  design (T-14 needs the direct command), and the seed's own check still refuses the second step.
- Concern 4: test 3 deletes `npm_lifecycle_event` from the child's environment as belt and braces
  (`npx` sets the variable itself, to a value other than `db:reset`). What makes the test mean
  something is that a guard keyed on the Prisma command instead of the script name would turn it
  red.
- Concern 5: test 1's proof that no migration was applied is indirect — the absence of the host
  name in the output. Prisma prints its `Datasource … at "<host>"` line before it applies
  anything, so that is a sound proxy, but the test never sees a migration table.

## 8. The process-log entry (what was added; it is append-only)

Only lines of this PR's own entries were edited (`git diff origin/main` shows 0 removed lines).
Added: the second trigger (the owner's "B"); the follow-up in "Produced" (two commits named by
subject); "Numbers" (1046 tests in 81 files, on `731a8f4`; API 100; E2E not re-run); the found-
during-execution bullet on exit versus throw; the run list under "Verified" and a bullet under "Not
verified" that says the Opus 5.5 review is pending; "Owner changes and reasoning" (the owner's
word: "B"; I recorded no reason, since none was given to me); the open item turned into a
"Resolved" item that keeps the question as it stood; "Next" (the two commits are not pushed).
