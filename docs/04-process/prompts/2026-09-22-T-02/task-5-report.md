# Task 5 report — CI job, run instructions, document amendments, process record

Branch `task/T-02-persistence-reset`, worked from
`/Users/ruslan/Own/ai-native-personal-finance/.claude/worktrees/T-02-persistence-reset`.
Postgres container `ai-native-personal-finance-postgres-1` was up and healthy throughout;
never stopped. No application code was changed.

## Step 1 — CI job (`.github/workflows/ci.yml`)

Inserted the `api` job ("API tests (Postgres)") verbatim from the brief, directly before the
`secret-scan` job (after the `verify` job's last step, `npm test`). Postgres 18.6-alpine
service, `DATABASE_URL` pointed at `localhost:5432` (the secret-scan-exempt host), steps:
checkout (`persist-credentials: false`), setup-node (`.nvmrc`, npm cache), `npm ci`,
`npx prisma migrate deploy`, `npm run test:api`.

`npx prettier --check .github/workflows/ci.yml`:

```
Checking formatting...
All matched files use Prettier code style!
```

## Step 2 — Run instructions

**README.md**, "Run locally" section:
- Replaced the sentence "Requires Node 26 (see `.nvmrc`) and, from T-02 onwards, a local
  Postgres." with "Requires Node 26 (see `.nvmrc`) and Docker: Postgres runs in a container
  (`compose.yaml`)."
- Replaced the code block with the brief's seven-line version (`npm ci`, `playwright
  install`, `cp .env.example .env.local`, `docker compose up -d --wait`, `npm run db:reset`,
  `npm run dev`, `npm run test:all`) and the paragraph about `npm run db:reset` and the
  API/E2E tests sharing the database.
- Command table: replaced the `npm run test:api` row's description and added a `npm run
  db:reset` row directly after it, per the brief's text. Re-aligned every column in the table
  by hand (computed the longest cell per column and padded all rows/the header/the separator
  to match — the new `test:api` description is the longest cell, so the whole table widened).

`npx prettier --check README.md`: `README.md` is in `.prettierignore` (confirmed by
inspection and by `--log-level debug`, which shows `ignorePath` includes `.prettierignore`
and 0 files are actually checked); the command still exits 0 with "All matched files use
Prettier code style!" — there is no distinct "ignored" message text, so `npm run
format:check` (which covers the whole tree) already subsumes this check.

**.env.example**: replaced the two comment lines above `DATABASE_URL` with the brief's text
("Neon pooled connection string in production; locally the Postgres of compose.yaml
(docker compose up -d --wait).").

## Step 3 — Document amendments

**docs/03-specs/reset-and-test-support.md**
- Line 3 (Status): → v1.1, with the v1.0 parenthetical kept.
- New line 4 (Changelog): the brief's v1.1 sentence, verbatim.
- §2.1 (line 11): inserted "29 February → 28 February when the target year has none," after
  "`seeded = true`,".
- §2.7 (lines 19–22): `empty-all` → `empty-all` (no pots, budgets or transactions; balance
  unchanged); "400 unknown variant" → "400 unknown or missing variant"; added the `GET
  /api/test/log` T-12 note directly under that bullet.
- §5 (line 31): appended the BigInt→Number/NFR-S3 sentence.
- §7 (lines 39–40): moved the checksum-test clause from the API row to the Unit row; API
  row's `(via /api/overview)` → `(in the database; via /api/overview from T-09)`.

**docs/02-architecture/data-model.md**
- Line 3 (Status): → v1.1 (`seq` and 64-bit money), v1.0 parenthetical kept, rest unchanged.
- New line 4 (Changelog): the brief's v1.1 sentence, verbatim.
- Line 5: "Money is integer cents." → "Money is integer cents, stored 64-bit (NFR-S3 allows
  99,999,999,999)."
- `Budget` and `Pot` rows (lines 11–12): prepended the `seq` field description to the Fields
  column of both.

**docs/02-architecture/adr/0005-persistence-and-reset.md**
- New line after the Status line: the brief's Clarification paragraph, verbatim (money
  columns 64-bit `BigInt`, `resetToSeed`/`src/server/reset.ts`, `prisma/seed.ts`). The
  Decision section's own text ("Money columns are `Int`") is deliberately left unedited — an
  Accepted ADR's Decision is not silently rewritten; the Clarification records what changed
  and why, which is what the ADR mechanism is for.

**docs/03-specs/webmcp-tools.md**
- Line 3 (Status): → v1.0.1 ("§2.8 cross-reference corrected"), v1.0 parenthetical kept.
- Line 4 (Changelog): inserted the v1.0.1 sentence at the front, before the existing v0.2
  entry.
- §2.8 (line 32): "(SPEC-reset-and-test-support §3)" → "(SPEC-reset-and-test-support §2.7)".

**docs/03-specs/backlog.md**
- Line 3 (Status): inserted the v1.6 clause at the front of the parenthetical, before v1.5;
  the rest of the parenthetical (v1.5…v1.0) unchanged.
- Line 4 (Changelog): inserted the v1.6 sentence at the front, before the existing v1.4 entry
  (the changelog has no separate v1.5 entry — pre-existing, not touched, out of scope).
- T-02 row: `/api/test/reset|seed|log` → `/api/test/reset|seed`; appended the CI API job
  clause.
- T-05 row: "**CI API job** (Postgres service)" → "its API tests join the CI API job (T-02)".
- T-12 row: appended "(moved from T-02)" after "`/api/test/log`".
- T-13 row: appended the `overrides`-removal clause before the closing cell boundary.

## Step 4 — Process record

**docs/04-process/prompts/2026-09-22-T-02.md**: appended one paragraph at the end of "§
Owner's replies at the plan gate" recording the 17:47 +04 go-ahead verbatim ("başla. main
branch update olunub") with its translation, that PRs #4 and #5 were merged into `main` by
that point, and that execution was subagent-driven (plan
`docs/04-process/plans/2026-09-22-T-02.md`).

**docs/04-process/process-log.md**: appended the "2026-09-22 — Phase 5: T-02 persistence,
seed and test support" entry at the end of the file, in the template's shape. Filled as
facts: Phase, Participants, Trigger, Prompt(s), Produced (Prisma schema/client, migration,
compose.yaml, `src/server/*`, `prisma/seed.ts`/`db:reset`, the test-support route, 69 unit +
16 API tests, six fixtures repointed + one added — verified below — plus this task's CI job
and the five document amendments, each named with its new version), Disagreements (the
npm-overrides choice, AGENTS.md §5), Next. "What the agent got right/wrong" and "Lessons for
the process" are `_(controller, from the execution ledger)_`; "Owner changes and reasoning"
is `_(owner)_`, exactly as R6 specifies — no angle-bracket placeholders remain.

**Verifying "69 unit tests" before writing it as fact.** The brief's own template carried
this number, and the task instructions warned that the brief's *Step 5* counts were stale
(226→229), so I did not take "69" on faith. Measured directly at HEAD (Task 5 touched no
test files, so HEAD's `tests/unit/{reset,seed,test-support,variants,boundaries}.test.ts`
equal their state at `49dbec9`): `npx vitest run` on those five files together →
**103 passed**. `boundaries.test.ts` alone → **35 passed**; task-1-report.md's mutation
check recorded 34 passed before the one Prisma-generated-client fixture case was added, so
boundaries contributes a +1 delta. 103 − 35 (boundaries' own total) = 68 from the four new
files, +1 from boundaries = **69** — matches the brief and the per-task full-suite deltas in
the task reports (161 → 212 → 214 → 229 across T1–T4, backed out to a pre-T-02 baseline of
160). The number is correct; no correction needed.

## Step 5 — Final gates

`GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" npm run test:all`, full output in
`/tmp/test-all-output.log` (outside the repo), exit 0. Summary:

| Stage | Result |
|---|---|
| `secrets:scan` (`scripts/secret-scan.sh history`) | 81 commits scanned, ~3.26 MB, **no leaks found** |
| `lint` | clean, exit 0 |
| `format:check` | "All matched files use Prettier code style!" |
| `typecheck` | clean, exit 0 |
| `test` (Vitest) | **Test Files 8 passed (8) / Tests 229 passed (229)** |
| `test:api` (Playwright, 1 worker) | **16 passed** (4.9s) — reset 4, schema 3, test-support 9 |
| `test:e2e` (Chromium, Firefox, WebKit) | **3 passed** (4.9s) — `tests/e2e/scaffold.spec.ts` on all three engines |

`npm audit --audit-level=high` (separate, not part of `test:all`): **found 0 vulnerabilities**.

## The four commits

1. `24084b9` — `ci: API tests against Postgres in CI (T-02)` — `.github/workflows/ci.yml`
   (37 insertions).
2. `ac4b84f` — `docs: run instructions for the local database (T-02)` — `README.md`,
   `.env.example` (25 insertions, 16 deletions).
3. `209982a` — `docs(specs): T-02 amendments — reset spec v1.1, data model v1.1, ADR-0005
   clarification, backlog v1.6, webmcp-tools v1.0.1` — the five documents of Step 3
   (27 insertions, 19 deletions).
4. `7718a1e` — `docs(process): T-02 process-log entry and go-ahead` —
   `docs/04-process/process-log.md`, `docs/04-process/prompts/2026-09-22-T-02.md`
   (37 insertions).

Totals reconcile exactly against the pre-commit `git diff --stat` (126 insertions, 35
deletions, 10 files): 37+25+27+37 = 126; 0+16+19+0 = 35. Each commit ends with the required
`Co-Authored-By`/`Claude-Session` trailers — `git log -4 --format='%B' | grep -c
Claude-Session` → 4. Not pushed; no PR opened; CI not watched (R9). Never used
`--no-verify`; every commit used the `GITLEAKS_CACHE_DIR` prefix and the pre-commit hook ran
normally on all four.

## Self-review findings and concerns

1. **Recoverable mistake during verification (fixed, no residue).** While double-checking
   the "69 unit tests" figure after the fourth commit, I ran `git checkout 0eec801 -- .`
   intending only to diff a file, which instead overwrote the entire working tree (and
   staged it) back to the pre-Task-1 state — all ten Task-5 files plus many Task 1–4 files
   reappeared as "modified" against a already-committed HEAD. I caught this immediately from
   the resulting `git status`, confirmed the working tree had been clean at `HEAD`
   (`7718a1e`) immediately beforehand, and ran `git reset --hard HEAD` to restore it exactly.
   Verified after: `git status` clean, `git log` shows the same four commits, spot-checked
   file contents (`backlog.md`, `data-model.md`, `prisma/`) and reconfirmed `git diff --stat
   HEAD` was empty. No commit was touched, nothing was lost, but this was a self-inflicted
   near-miss the controller should know about — I should have used `git show <ref>:<path>`
   (as I did for every other check) instead of `git checkout <ref> -- .` from the start.

2. **Open item: the brief's `Create:` deliverable was not produced —
   flagging rather than resolving.** The brief's Files section (line 9) lists `Create:
   docs/04-process/prompts/2026-09-22-T-02/ (subagent briefs and reports, if executed
   subagent-driven — build-workflow §7)`. Execution *was* subagent-driven (the prompts file
   now says so, per R11), and T-01 set the precedent — `docs/04-process/prompts/
   2026-09-20-T-01/` holds that task's copied briefs/reports (visible today:
   `README.md`, `task-4-brief.md` … `task-9-brief.md`, `handoff.md`, `progress.md`, etc.).
   The equivalent T-02 directory does not exist anywhere in this branch's history — not
   created by Tasks 1–4, and R10's four commits (CI / README+env / five specs / process-log
   + prompts file) don't name it either, so the single `git add … docs` the brief's own
   unified commit would have used never had a chance to sweep it in. I did not create it
   myself: doing so would mean either an uninstructed fifth commit or amending commit 3 or 4,
   and R10 specifies exactly four commits with named contents. This is a real gap between
   the brief and the four-commit ruling — left for the controller to decide (copy
   `.superpowers/sdd/2026-09-22-T-02/{task-*-brief,task-*-report}.md` into that directory
   under one of the existing commits or a fifth one, or explicitly waive it for this task).

3. **Cosmetic: commit 4's body is ASCII-transliterated.** The heredoc I used for commit 4's
   message rendered "başla" as "basla" and "§5" as "S5" in the commit body (an encoding slip
   in how I typed the heredoc, not a substantive error). The actual document of record —
   `docs/04-process/prompts/2026-09-22-T-02.md` — has both correctly ("başla. main branch
   update olunub", "AGENTS.md §5" is in the process-log entry, not the prompts file, and is
   also correct there). I left the commit message as-is rather than amending, since GENERAL
   git policy here is new commits over amends and this doesn't affect any tracked file's
   content — flagging it in case the controller prefers a clean amend before this branch is
   reviewed.

4. **No other deviations found.** Every edit was checked character-by-character against the
   brief's literal text (see Steps 1–4 above); the backlog Changelog's missing v1.5 entry and
   ADR-0005's Decision/Clarification tension are both pre-existing/by-design and were
   deliberately left alone, per the brief and per how the ADR mechanism is supposed to work
   (Accepted ADRs get clarifications, not silent rewrites).
