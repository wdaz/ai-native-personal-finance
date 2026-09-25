# Task 7 (follow-up to T-13c, the owner's choice "B"): `npm run db:reset` refuses another machine's database BEFORE it applies any migration

Repository: `ai-native-personal-finance`; worktree = your working directory
`/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/t-13c-tech-debt`, branch `task/T-13c-tech-debt` (PR #39, open, unmerged; HEAD `0f0931d`). Date today: 2026-09-25.

## Why (the owner's decision — do not re-litigate)

`package.json`: `"db:reset": "prisma migrate deploy && prisma db seed"`. TD-10's guard (`localDatabaseRefusal` in `src/shared/env.ts`, called from `prisma/seed.ts`) refuses a `DATABASE_URL` that does not name this machine, but only in the SEED step. `prisma migrate deploy`, the first step, applies every pending migration of the current checkout to whatever database `DATABASE_URL` names — an unmerged feature-branch migration could reach Neon before the seed refuses and the developer thinks nothing happened. The final whole-branch review raised it (its "Minor 2"); the owner was asked (options A leave, B check in `prisma.config.ts`, C separate guard script, D drop `migrate deploy` from `db:reset`) and answered **B**: refuse in `prisma.config.ts`, keyed on `npm_lifecycle_event === "db:reset"`. T-14 runs `npx prisma migrate deploy` against Neon DIRECTLY (no `db:reset` lifecycle event), so that path stays allowed; CI runs `npx prisma migrate deploy` directly too (`.github/workflows/ci.yml` lines 102 and 168) and never `db:reset`.

## The change (code)

`prisma.config.ts` currently (read it first):

```ts
import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Prisma 7 reads no .env file of its own. ... a variable already in the environment, such as CI's, wins.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({ schema: ..., migrations: { path: ..., seed: "tsx prisma/seed.ts" }, datasource: { url: process.env.DATABASE_URL } });
```

Add, AFTER the `.env.local` load (so the check sees the `DATABASE_URL` the command will use) and BEFORE `defineConfig`:

```ts
import { localDatabaseRefusal } from "./src/shared/env";   // playwright.config.ts imports it the same way

// TD-10 (the owner's choice, 2026-09-25): `npm run db:reset` is `prisma migrate deploy && prisma db seed`. ...
if (process.env.npm_lifecycle_event === "db:reset") {
  const refusal = localDatabaseRefusal(process.env);
  if (refusal !== null) { console.error(refusal); process.exit(1); }   // or throw — see below
}
```

with an English comment that says: the seed refuses another machine's database itself (`prisma/seed.ts`), but `migrate deploy` would already have applied every pending migration to it; so refuse here, when Prisma loads this config for `db:reset`'s first step; keyed on the npm script name, NOT on the Prisma command, because T-14 runs `npx prisma migrate deploy` on the deployed database directly. Decide `console.error` + `process.exit(1)` versus `throw new Error(refusal)` by RUNNING it: pick the one that prints the refusal message (which starts `Refusing to run: DATABASE_URL does not name this machine`) cleanly, exits non-zero, and lets Prisma print nothing else (no datasource line, no host). Report which you chose and why. If Prisma's config loader cannot import `./src/shared/env` (a relative TypeScript import), report BLOCKED with the exact error — do not inline a copy of the check.

## Tests (red first) — `tests/unit/database-guard.test.ts` (read it: it already has the child-process pattern, `childEnv()`, `OTHER_MACHINE`, `LOCAL_NOBODY_LISTENING`, `REFUSED`, `run`)

Add a `describe` "npm run db:reset refuses another machine's database before it applies a migration (TD-10, the owner's B)" with three tests (each timeout 90_000; the URLs follow the secret-scan placeholder rule — password `password`, or the `${SECRET}` variable form the file already uses; a `.invalid` host never resolves):
 1. `npm run db:reset` with `DATABASE_URL = OTHER_MACHINE` (`spawnSync("npm", ["run","db:reset"], …)` with the same `childEnv()` plus that URL): exit status non-zero; stderr (or stdout) matches `REFUSED`; neither stream contains the secret; **neither stream contains `db.example.invalid`** (Prisma prints a `Datasource … at "host"` line before `migrate deploy` — its absence proves nothing ran).
 2. Control — `LOCAL_NOBODY_LISTENING` (`localhost:1`): the same command is NOT refused (no `Refusing to run` in either stream), exits non-zero, and the output mentions `localhost` (Prisma reached the point of connecting): the guard is keyed on the URL, not on the script alone.
 3. Control for T-14 — `npx prisma migrate deploy` with `OTHER_MACHINE` and an environment WITHOUT `npm_lifecycle_event` set to `db:reset` (delete `npm_lifecycle_event` from the child env explicitly): NOT refused (no `Refusing to run`), and the output names `db.example.invalid` (it tried to connect, and failed): a direct `migrate deploy` stays allowed.
Run `npx vitest run tests/unit/database-guard.test.ts` BEFORE touching `prisma.config.ts`: expect test 1 red (Prisma connects: output has the host or a `Can't reach database server` error and no refusal) and tests 2 and 3 green (controls pass by construction). Report the exact counts and the failing output. Then add the guard and run again: all green. Then a mutation check: change `"db:reset"` in the guard to `"db:resett"` and confirm test 1 goes red, restore it.
Also run, and report: `npm run db:reset` against the LOCAL database (the URL in `.env.local`): it must still succeed (`reset reason=manual rows=… at=…`). Do not run it against anything else.

## Text and docs (same commit as the code where the file is code-adjacent; the records in commit 2)

COMMIT 1 — subject `feat(env): refuse db:reset against another machine's database before it applies migrations (TD-10)` — files: `prisma.config.ts`, `tests/unit/database-guard.test.ts`, and these text updates so they stay true:
 - `prisma/seed.ts` docblock (lines ~7-15): it says `migrate deploy`, the first half of `db:reset`, is not guarded. New truth: `db:reset` is refused by `prisma.config.ts` before `migrate deploy` starts; a direct `npx prisma migrate deploy` is not guarded (T-14 runs it against Neon); the seed's own check stays as the second line and for `npx prisma db seed`.
 - `prisma/README.md` (lines ~8-15): the sentence about `db:reset` running `prisma migrate deploy` first and that step not being guarded.
 - `README.md` (the paragraph at lines ~63-71 that says "Both `db:reset` (its seed step, not the migrations) and every Playwright run refuse …"; and the scripts-table row for `db:reset`): `db:reset` now refuses before it applies any migration; keep the sentence that a deployed database is seeded through `POST /api/admin/reset` and never through `db:reset`.
 - `.env.example` (lines ~6-9): "The seed step of `npm run db:reset` … `prisma migrate deploy`, db:reset's other half, does not." → `npm run db:reset` (before it applies any migration) and every Playwright run …; a direct `prisma migrate deploy` does not refuse.
 - `tests/unit/README.md` (the T-13c paragraph): `database-guard.test.ts` starts child processes — the seed, `npm run db:reset` and `playwright test --list`.
 - `src/shared/env.ts`: grep it for "migrate deploy"; if a comment there now says something untrue, fix it (comment only).
Before committing: `npx tsc --noEmit`, `npm run lint`, `npx prettier --check .`, the full `npx vitest run` (expect 81 files; the test count grows by 3 from 1043 → 1046), `sh scripts/secret-scan.sh staged`.

COMMIT 2 — subject `docs: record the owner's B on db:reset — tech-debt, backlog, SPEC-reset v1.6, process log, prompts` — files:
 - `docs/03-specs/reset-and-test-support.md`: §2.5's `npm run db:reset` sentence (currently "its seed step refuses a `DATABASE_URL` whose host is not …") becomes: `npm run db:reset` does the same for a local database only: it refuses a `DATABASE_URL` whose host is not `localhost`, `127.0.0.1` or `[::1]` (TD-10) before it applies any migration; `npx prisma migrate deploy` itself is not guarded (T-14 runs it against the deployed database). Keep the version at v1.6 (this PR is unmerged; one PR, one bump) and extend the Status/Changelog v1.6 text: the seed step's refusal is now also enforced at db:reset's first step, by the owner's choice "B" of 2026-09-25, made after PR #39 was opened; the changelog's clause "after `prisma migrate deploy`, which is not guarded" must say what is true now (the direct command is not guarded). Change nothing else in the spec.
 - `docs/03-specs/tech-debt.md`, TD-10: every sentence that says `prisma migrate deploy`/`db:reset` runs migrations before the seed refuses ("not guarded") must state the final truth (db:reset refuses first; direct `prisma migrate deploy` unguarded by design) and mention the owner's B and the tests.
 - `docs/03-specs/backlog.md`: v1.27's changelog (T-14 clause about `db:reset` and about `vercel env pull`) and the T-14 row: the sentences "the seed step of `npm run db:reset` refuses … — after `prisma migrate deploy`, which is not guarded" and "… `npm run db:reset` still runs `prisma migrate deploy` against Neon before its seed refuses" are no longer true — update them (with `vercel env pull` writing `.env.local`, `db:reset`, `test:api` and `test:e2e` all refuse now; the check item about what `vercel env pull` writes stays). Keep the labels "unmeasured".
 - `docs/04-process/process-log.md` (append-only: edit only lines THIS PR added; `git diff origin/main -- docs/04-process/process-log.md` must show added lines only; wrap at 100 columns): in the execution entry (a) the "Open for the owner, not decided here" item about guarding `db:reset` before `migrate deploy` becomes a RESOLVED item: the owner answered "B" on 2026-09-25, after the pull request was opened and after the whole-branch review; implemented in the two commits of this task (name them by subject, not id); (b) every other place that says the seed step alone refuses / `migrate deploy` is unguarded in `db:reset` gets the final truth or a "(at the time; changed by the owner's B, see …)" note — do NOT rewrite the historical account of what the reviews found; (c) the "Produced" field lists the follow-up; (d) "Owner changes and reasoning": the B answer (the owner's words: "B"); (e) a new item in "What the agent got wrong or missed" is NOT needed unless something was; (f) the "Numbers" field: unit total is now 81 files / 1046 tests, the run counts you measured (API 100 — run `npm run test:api` once at the end and report; E2E is not re-run: this task touches no app code); (g) the "Verified"/"Not verified" lists: say exactly what ran on which commit, and that the follow-up was reviewed by an Opus 5.5 subagent — only if that review has happened when you finish; otherwise write that it is pending (the controller will correct the line). Do NOT invent review results.
 - `docs/04-process/prompts/2026-09-24-T-13c/`: copy this brief as `task-7-brief.md` and your report as `task-7-report.md` (copy the report LAST, `cmp`), add their row to the folder's README table (the follow-up: the owner's B), and keep the README's statements about absences true.
 Docs under `docs/` are not Prettier-checked; keep their line-wrapping habit. Run `npx vitest run tests/unit/scaffold.test.ts` and `npm run traceability` and the staged secret scan before committing.

## Rules

- English for code, comments, docs, commits. Never fabricate: numbers are those you measured. Do not touch `middleware.ts` or the CSP path. Do NOT edit the plan file (it is on another branch).
- `git add` explicit paths only; two NEW commits (no amend); NO push; NO `--no-verify` (the pre-commit hook runs gitleaks; the child-process tests' URLs follow the placeholder rule: password `password` or a `${SECRET}` variable).
- Commit messages: subject, blank line, a short body, then exactly these two trailer lines, in message files you write with the Write tool at `/Users/ruslan/.claude/jobs/cbb8a1ac/tmp/commit-msg-7a.txt` and `commit-msg-7b.txt`, committed with `git commit -F <file>`:
  Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_016K8d5a2xFgzdsy4ejTt1AN
- Shell quirks in this harness: one simple Bash command per call, literal paths; no compound commands, no `$VAR` in command position, no `sh -c '…git…'`; `printf` with `%` fails — use the Write tool or a python3 heredoc for text. If a tool refuses a path or a git command because of worktree isolation, call EnterWorktree with the worktree path above (never ExitWorktree). Before committing check `git branch --show-current` prints `task/T-13c-tech-debt`. `next-env.d.ts` may show as modified after a build/test run — `git checkout -- next-env.d.ts`, never commit it.
- You own the database and the ports: nothing else is running.
- You do not dispatch subagents.

## Report

Write your full report to `/Users/ruslan/.claude/jobs/cbb8a1ac/tmp/task-7-report.md`: what you changed per file; TDD evidence (RED command and output with why that failure is the expected one; GREEN); the mutation check; which of `console.error`+`process.exit(1)` or `throw` you chose and the output of each you saw; the local `npm run db:reset` result; the API run; the full-suite totals; every text place you updated; anything you could not verify; concerns. Then reply with ONLY (under 12 lines): Status (DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT), the two commits (short SHA + subject), one-line test summary, concerns, the report path.
