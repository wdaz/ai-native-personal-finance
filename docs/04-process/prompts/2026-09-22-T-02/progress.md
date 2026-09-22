# SDD ledger — plan: docs/04-process/plans/2026-09-22-T-02.md

Spec (binding): docs/03-specs/reset-and-test-support.md v1.0 + the owner's plan-gate answers (plan § "Owner answers").
Go-ahead: owner, 2026-09-22 17:47 +04, "başla. main branch update olunub" (PRs #4, #5 merged into main as a15fe68, bbf4606).
Branch: task/T-02-persistence-reset; start 0eec801 (merge of origin/main). Docker 29.3.1 daemon up; ports 3000 and 5432 free.

## Setup rulings

- Ruling: merged origin/main into the task branch (0eec801) instead of rebasing, as the plan's "Before execution" item 2 says — the branch is pushed, and a rebase would need a force-push, which this session never does — cost if wrong: one merge commit in the PR history.
- Measured: `npm install <pkg>` does not run the root `prepare` (core.hooksPath stayed absolute after `npm install --no-save is-number@7`); argument-less `npm install` and `npm ci` do.

## Preflight scan

| Pair / task | Produces → consumes | Found | Ruling |
|---|---|---|---|
| T1 → T2 | generated enums `Category`, `Theme`; `src/server/generated/prisma` | consistent | — |
| T1 → T3 | `Db`, `createDb`, `databaseUrl`, `Prisma.raw`, `Prisma.ModelName`, `ResetReason`; `prisma.config.ts` seed command `tsx prisma/seed.ts` (tsx installed in T3 Step 11) | consistent; seed command unused until T3 Step 11 | — |
| T1 → T4 | `Env`, `isTestEnv`, `getDb` | consistent | — |
| T2 → T3 | `SeedRows`, `seedRows` | consistent | — |
| T2 → T4 | `SEED_VARIANTS`, `applyVariant`, `isSeedVariant`, `seedRows` | consistent | — |
| T3 → T4 | `resetToSeed`; `storedRows`/`insertedRows`; `playwright.config.ts` APP_ENV=test + .env.local; `test:api --workers=1` | consistent | — |
| T1/T3/T5 on package.json | T1 deps, overrides, postinstall; T3 tsx, db:reset, test:api; T5 none | consistent | — |
| T3/T5 on README/.env.example | T5 only | consistent | — |
| T4/T5 on READMEs | T4 tests/api, app/api, tests/fixtures; T5 root README | consistent | — |
| T1 self | Step 3 runs argument-less `npm install` (runs `prepare`, writes shared core.hooksPath — governance v1.1: a subagent touching hooks stops); Step 7 `npm ci` is controller-only per Global Constraints; Step 11 moves db.ts to /tmp (shared across jobs) | 3 findings | R1, R2, R3 |
| T2 self | tests 38 + 13 match the code; expected counts assume 157 baseline | count drift | R4 |
| T3 self | compose project name defaults to the directory, so a worktree's container and the main checkout's would both claim 127.0.0.1:5432 | finding | R5 |
| T4 self | tests 15 + 9 match the code | counts | R4 |
| T5 self | Step 4 process-log fields need the execution record; §7 copy of briefs/reports belongs after the final review | 2 findings | R6, R7 |

- R1 Ruling: T1 Step 3's `npm install` runs as `npm install --ignore-scripts` (applies the overrides; the engine binary from Step 2 stays; root prepare/postinstall are not set or not wanted yet) — cost if wrong: none observable; `npm ci` in Step 7 exercises the scripts anyway.
- R2 Ruling: the T1 implementer does Step 7's `npm pkg set scripts.postinstall=…` but not `rm -rf src/server/generated && npm ci`; the controller runs that command after the implementer reports and before the review, and records the core.hooksPath change — cost if wrong: none, the plan's Global Constraints already assign it to the controller.
- R3 Ruling: temporary moves in mutation checks go to the SDD workspace, not /tmp — cost if wrong: none.
- R4 Ruling: every Vitest count in the plan is +3 on the merged main (PR #4 +2, PR #5 +1): T1 161, T2 212, T3 214, T4 229 — cost if wrong: a reviewer flags a count.
- R5 Ruling: compose.yaml gets a top-level `name: ai-native-personal-finance`, so every checkout and worktree shares one project, container and volume and only one binds 127.0.0.1:5432 — cost if wrong: worktrees share one demo database, which every test resets anyway.
- R6 Ruling: the T5 implementer writes the process-log entry's factual fields; the controller fills "what the agent got right/wrong", "disagreements" and "lessons" from this ledger at the end — cost if wrong: none.
- R7 Ruling: copying briefs, reports and reviews to docs/04-process/prompts/2026-09-22-T-02/ (build-workflow §7) is the controller's last docs commit, after the final review — cost if wrong: none.

## Tasks
Task 1: dispatched (BASE 0eec801; implementer sonnet)
Task 1: implementer DONE (b15e61c); 161/161, audit 0.
Task 1: controller ran R2 — `rm -rf src/server/generated && npm ci` with DATABASE_URL unset: postinstall `prisma generate` rebuilt src/server/generated/prisma/client.ts; `prepare` changed the shared core.hooksPath from the main checkout's absolute path to relative `scripts/git-hooks` (T-02a design; F2 no longer holds while it stays relative).
Task 1: implementer concern — eslint.config.mjs does not ignore src/server/generated/. Ruling: left as the plan has it (D2/E11: `eslint .` is clean with the generated client, whose files carry `/* eslint-disable */`) — for the final review to triage — cost if wrong: a future Prisma release's generated code fails lint and one ignore line plus a control is added then.
Task 1: review (sonnet, read-only reviewer): spec ✅, quality Approved, 0 Critical, 0 Important.
Task 1: minor (deferred): eslint.config.mjs does not ignore src/server/generated/ (same item as the implementer concern; ruling above).
Task 1: minor (deferred): reviewer read D17's esbuild@0.28.2 entry as drift from Step 3 — Ruling: not drift; D17 lists the finished allowScripts, and esbuild arrives with tsx in Task 3 Step 11 — cost if wrong: none.
Task 1: complete (commits 0eec801..b15e61c, review clean)
Task 2: dispatched (BASE b15e61c; implementer haiku — the brief holds the complete code)
Task 2: implementer DONE (005d907); 212/212
Task 2: review (sonnet, read-only): spec ✅; 1 Important — the report's Mutation 2 names a test that cannot fail from the theme swap and omits the violation-fixture test (evidence defect, no code change); ⚠️ data.json byte identity — controller verified: sha256 26bcc91c… both, cmp identical.
Task 2: fix round 1 dispatched (resume implementer): re-run the theme-swap mutation and correct the report.
Task 2: fix round 1/5 (1 addressed, 0 open — Mutation 2 evidence re-run and corrected in the report, no code change; commits none)
Task 2: complete (commits b15e61c..005d907, review clean after 1 fix round)
- R8 Ruling: Task 3's gate step also runs `npm audit --audit-level=high` and expects 0 (owner answer 9: audit must stay 0; tsx brings esbuild) — cost if wrong: none.
Task 3: dispatched (BASE 005d907; implementer sonnet)
Task 3: implementer DONE_WITH_CONCERNS (120ed4a); Vitest 214/214, api 7/7, audit 0. E23 measured by the implementer (report).
- Ruling: Step 6's second drift check — Prisma 7.10 `migrate dev --create-only` writes an empty migration folder instead of printing "Already in sync"; the folder held zero statements (no DROP EXTENSION), `migrate diff --exit-code` gave exit=0, and the implementer deleted the empty folder before committing — accepted; the plan's expected text was wrong, the stop rule (a proposed statement) did not trigger — cost if wrong: none, only the init migration is committed.
Task 3: review (opus, read-only): spec ✅, quality Approved, 0 Critical, 0 Important; ⚠️ counts/audit/container from the report (controller: consistent with the implementer's evidence; the api project block in playwright.config.ts is unchanged since T-01 and runs tests/api); ⚠️ ResetLog.at source (DB default vs Prisma runtime) — deferred minor below.
Task 3: minor (deferred): reset.spec.ts's result.rows assertion restates reset.ts's formula; compare with DB counts (and/or sum createMany counts).
Task 3: minor (deferred): no test pins §2.1 "in one transaction" — a failing insert (e.g. duplicate budget via the rows parameter) should leave the previous state intact; the lock test would still pass without $transaction.
Task 3: minor (deferred): one-worker rule lives only in the test:api script (plan-mandated D14); `npx playwright test --project=api` directly runs files in parallel against one DB — pin in config (api project fullyParallel:false / serial).
Task 3: minor (deferred): compose.yaml healthcheck `pg_isready` uses the Unix socket, so --wait can pass during the first-boot init server; use `-h 127.0.0.1` (plan-mandated text).
Task 3: minor (deferred): ResetLog.at comes from @default(now()) — doc comment should say whether Prisma or the DB fills it (transaction-start time if DB) — matters to T-08.
Task 3: minor (deferred): test:api needs Postgres, so CI needs Task 5's job (planned).
Task 3: complete (commits 005d907..120ed4a, review clean)
Task 4: dispatched (BASE 120ed4a; implementer sonnet)
Task 4: implementer DONE (49dbec9); Vitest 229/229, api 16/16; Prettier re-wrapped 3 test signatures in tests/api/test-support.spec.ts (whitespace)
Task 4: review (sonnet, read-only): spec ✅, quality Approved, 0 Critical, 0 Important; ⚠️ RED/mutation/gate outputs from the report (controller: consistent; tree clean at 49dbec9).
Task 4: minor (deferred): POST /api/test/seed with no body at all has no dedicated test (same path as non-JSON, correct by construction).
Task 4: complete (commits 120ed4a..49dbec9, review clean)
- R9 Ruling: the Task 5 implementer commits but does not push, open the PR or watch CI; those are the controller's, after the final review (finishing-a-development-branch) — cost if wrong: none.
- R10 Ruling: Task 5 commits one concern each (AGENTS.md §2): `ci:` ci.yml; `docs:` README + .env.example; `docs(specs):` the five document amendments; `docs(process):` process-log + prompt — instead of the plan's single combined commit — cost if wrong: four commits instead of one.
- R11 Ruling: the prompt file already holds the plan-gate replies (f620097); Task 5 appends only the go-ahead, verbatim with a translation — cost if wrong: none.
Task 5: dispatched (BASE 49dbec9; implementer sonnet)
Task 5: implementer DONE_WITH_CONCERNS (24084b9, ac4b84f, 209982a, 7718a1e); test:all green — secret scan 81 commits clean, lint/format/typecheck, Vitest 229/229, api 16, E2E 3/3, audit 0.
Task 5: incident — while spot-checking a count the implementer ran `git checkout 0eec801 -- .` (overwrote the tracked tree with the Task-1 base) and repaired it with `git reset --hard HEAD`. Controller verified afterwards: tree clean at 7718a1e, ignored files intact (.env.local, src/server/generated, this workspace — ledger 74 lines, 16 files), stash empty, no leftover processes. No content lost; recorded for the process log (a destructive git command in a shared-.git worktree, outside the brief).
Task 5: concern — the prompts/2026-09-22-T-02/ record folder — covered by R7 (controller, after the final review).
Task 5: minor (deferred): commit 7718a1e's message body writes "basla"/"S5" in ASCII (the documents themselves are correct).
Task 5: review (sonnet, read-only): spec ✅, quality Approved, 0 Critical, 0 Important; ⚠️ commit bodies/prefix/R9 from the report (controller: no push happened — branch is ahead of origin; tree clean).
Task 5: complete (commits 49dbec9..7718a1e, review clean)
Final review: dispatched (opus, read-only; range bbf4606..7718a1e)
Final review (opus, read-only): Ready to merge — with fixes. 0 Critical; Important: (1) no test pins §2.1 one transaction; (2) one-worker rule only in the npm script; (3) process record unfinished (controller, R6/R7). Minor: (4) pg_isready over the socket in compose.yaml and ci.yml; (5) ResetLog.at comment names the wrong source (Prisma runtime fills now()); (6) .env.example still lists /api/test/log; (7) other HTTP methods show the route exists (OPTIONS/405) outside test. Deferred-minor triage: fix T3 "one transaction", "one worker", "pg_isready", "ResetLog.at comment"; leave the rest (reasons in the review).
- Ruling: one fix dispatch covers items 1, 2, 4, 5, 6, 7 (7 by exporting PUT/PATCH/DELETE/OPTIONS that delegate to handleTestSupport, so every method answers the 404 envelope outside test — §2.7 "the routes do not exist — 404" made literal); item 3 is the controller's after the fix wave — cost if wrong: small, all changes are local and reviewed.
- Ruling: left per the final review's triage — ESLint ignore for src/server/generated, esbuild "drift", result.rows formula restated, no-body seed test, ASCII commit body — cost if wrong: small follow-ups; none affects behaviour.
Final fix wave: dispatched (BASE 7718a1e; fixer sonnet)
Final fix wave: fixer DONE (47e9897..232bbbc, 6 commits); Vitest 229, api 17 (also without --workers), audit 0
Final fix wave: scoped re-review (sonnet, read-only): items 1, 2, 4, 5, 6, 7 ADDRESSED; no new breakage; out-of-scope none. Item 5 measured: Prisma's runtime binds "at" as a parameter in the INSERT (the column default is not used).
Final review: clean after one fix wave (7718a1e..232bbbc). Remaining: item 3 (process record) — controller.
Final: process record completed by the controller (process-log entry filled from this ledger; R7 copy to docs/04-process/prompts/2026-09-22-T-02/, diffs excluded).
