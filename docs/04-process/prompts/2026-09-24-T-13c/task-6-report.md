# Task 6 report — the layer READMEs and the records (TD-7–TD-11), and the full verification run

Status: DONE_WITH_CONCERNS (the concerns are disclosures about wording in the committed records, none blocks).

Commits on `task/T-13c-tech-debt` (not pushed, no PR):

- `fe1f910` `docs(readme): list T-13c's tests, fixtures and shared functions`
- `c70681c` `docs(specs): record TD-7–TD-11 fixes — tech-debt v1.12, backlog v1.27, SPEC-reset v1.6, process log`
- a third, small commit `docs(specs): add Task 6's report to the T-13c prompts folder` carries this file
  (the report is copied last, after the records commit, as the brief allows).

Rebase: not needed. `git fetch origin` showed `origin/main` still at `910ad2d` (the branch base), so
nothing was rebased and nothing conflicted.

## What I wrote, per file

Step 1 (commit `fe1f910`, three files, +28 lines; `npx prettier --check` on the three: all formatted):

- `tests/unit/README.md` — a T-13c paragraph: `css-grid.test.ts` (TD-9, `lint:css`, fixtures in
  `fixtures/css-grid/`), `shared/env.test.ts` (URL tables of the three TD-10 functions, including the
  values `new URL` and node-postgres read differently: scheme, whitespace, malformed percent escape),
  `server/env.test.ts`, `test-support.test.ts`, `next-config.test.ts`, `database-guard.test.ts`,
  `fonts.test.ts`, the TD-7 pair in `webmcp/adapter.test.ts`, and the placeholder-password rule. The
  brief's paragraph, re-wrapped (its diff had one short line), plus the fail-closed clause.
- `tests/fixtures/README.md` — the brief's paragraph: `css-grid/`, `fonts.ts` (`fontProblems`), the two
  `boundaries/` fixtures. Re-wrapped only.
- `src/shared/README.md` — the brief's paragraph plus the requested sentence that `isLocalDatabaseUrl`
  fails closed (another scheme, whitespace or a malformed percent escape, which node-postgres would
  re-encode, is refused, as is `host`/`hostaddr`).

Steps 2–6 (commit `c70681c`, 17 files):

- `docs/03-specs/tech-debt.md` v1.12 — Status line; TD-7–TD-11 table rows now **Fix in review** (TD-6's
  wording); a **Fix in review** bullet under each entry with its commit ids. TD-10's states the fix round
  (scheme, whitespace, malformed percent escape; the `http://localhost\@evil.example.com/db` plus trailing
  space case; four rows; the re-reviewer's 1.4 M-URL fuzz, labelled the reviewer's run). TD-11's uses the
  measured 46/6/6 and 49/41/28 pixel counts and the Firefox double listing. Known-and-not-fixed minors are
  in each bullet.
- `docs/03-specs/backlog.md` v1.27 — Status line, Changelog (the owner's answers Q1–Q7 in their words, the
  four row edits), the four rows (T-13c: plan path and "in review"; T-13d item 4: `stylelint` (dev); T-14:
  the first-seed/`VERCEL` hand-off; T-16: Public Sans notice), and the Notes' open-entries line.
- `docs/03-specs/reset-and-test-support.md` v1.6 — Status line, Changelog, §2.5, §2.7's first line, in the
  brief's wording. `git diff -U0` showed nothing else changed. The Changelog also says the guard is
  stricter than the two sentences (fails closed).
- `docs/04-process/process-log.md` — one entry appended, "2026-09-25 — Phase 5: T-13c tech debt
  TD-7–TD-11 — execution", template fields. It holds: participants/reviewers as they were, the produced
  commits, the measured numbers, what was decided, what the agent got right, six numbered deviations
  (the Task 4 parsing gap and its fix round; five wrong plan numbers; the README scope sentence; the review
  model against governance v1.3; the plan on `docs/T-13c-plan`; the go-ahead's shape), the deferred minors,
  "Verified", "Not verified", the owner's answers, the Q4 disagreement, ten lessons, "Next".
- `docs/04-process/prompts/2026-09-24-T-13c.md` and the folder `docs/04-process/prompts/2026-09-24-T-13c/`
  (both named with the plan date, per the controller's clarification) — a README in T-13's style (table
  of files; deliberate absences: no review files, no ledger, no dispatch messages, no `review-*.diff`, no
  screenshots) and copies of `task-1-brief.md` … `task-6-brief.md` and `task-1-report.md` …
  `task-5-report.md`, unredacted. This report is the last file, copied after the records commit.

## Measured numbers (this session)

- Unit: 81 files / 1043 tests, on `fe1f910` and again on HEAD `c70681c` (baseline 77 / 958; plan said 1 035;
  the +8 is Task 4's fix round). Statements 99.53 % (426/428).
- TD-11 pixels: login 46 / 6 / 6, overview 49 / 41 / 28 at 1440 / 768 / 375 px (from Task 5's report; not
  re-measured here). Firefox: four font requests (two URLs twice); Chromium and WebKit two; `FOREIGN []`.
- Task 4 Step 9 red: 2 failed | 2 passed (plan: 3 | 1). Task 5 Step 6 red: 4 (plan: 1). From the reports.

## Full run, one step per command (macOS, Node 26.7.0, npm 11.19.0, on `fe1f910` + the then-uncommitted docs)

| Step | Result |
| --- | --- |
| `npm run secrets:scan` | 399 commits scanned, no leaks (diffs); no leaks (commit and tag messages). Re-run after the records commit: 400 commits, no leaks |
| `npm run lint` | exit 0 (ESLint `--max-warnings 0`, then `lint:css`), no output |
| `npm run format:check` | "All matched files use Prettier code style!" (again on HEAD) |
| `npm run typecheck` | exit 0, no output |
| `npm run test:coverage` | 81 files, 1043 tests passed; statements 99.53 % (again on HEAD) |
| `npm run traceability` | "all 18 Release 1 stories are named in a test title" (again on HEAD) |
| `npm run test:api` | 100 passed (12.4 s) |
| `npm run test:e2e` | 327 passed, 24 skipped, 0 failed (351 runs, three engines); one background call, exit 0, 2.3 min, so it was not split per project |
| `npm audit --audit-level=high` | found 0 vulnerabilities |

Everything was green; nothing failed and nothing was fixed. After the records commit, the unit suite,
`format:check` and `traceability` were re-run on HEAD `c70681c` (all green), because the first run of
those three preceded the process-log entry and the prompts folder. API and E2E were not re-run: the
records commit changes only files under `docs/`.

Comparison with `main`: I did not run `main`. The API and E2E counts equal the ones the T-13 execution
entry in `docs/04-process/process-log.md` records (API 100; E2E 327 passed, 24 skipped, 351 runs), and
the unit baseline before this task (77 / 958, the controller's run) equals T-13's. Three `test(api)`
commits merged since T-13 (`0bbe186`, `193e7b2`, `0fc202d`); the API count is unchanged at 100.

## Secret scan on the copies

`sh scripts/secret-scan.sh staged` was silent (exit 0) on the copied briefs and reports and on the
records, so no value was replaced with `${SECRET}` and no allowlist was touched. The folder README says so.

## Not verified

- CI (nothing pushed); Firefox and WebKit on Linux.
- "Nothing else on ports 3000 and 3113" (written in the log's "Verified") is the controller's statement;
  the only evidence is that `test:api` built and started its own server on 3000 without a clash.
- The hook output of my two commits was not shown (only the commit summary lines); the staged scan was
  run by hand before each.
- The whole-branch review's verdict.

## Concerns

1. The log's "Verified" paragraph says the run was "on `fe1f910` plus the uncommitted record files of this
   task". Part of those files did not exist yet when unit, lint, format and traceability first ran. The
   three cheap ones were re-run on the final HEAD (green), but the paragraph was not edited a third time.
2. The log's "Task 6, `fe1f910` and the commit that follows it" becomes two commits after this report is
   committed (`c70681c` and the report commit).
3. The brief said the owner fills "what the agent got wrong" and "owner changes". I followed the T-13
   precedent and the controller's instruction to record the deviations honestly, so "What the agent got
   wrong or missed" holds six agent-drafted items and the deferred minors, marked "(the owner adds their
   own findings after review)". "Owner changes and reasoning" holds the owner's already-given answers,
   with `_(owner to fill after review)_` for changes made in review. The controller may want to reconcile
   this with the brief's wording.
4. The entry heading follows T-13's form ("Phase 5: … — execution"), not the brief's "Build (T-13c): tech
   debt TD-7–TD-11".
5. The backlog's T-13c row now also says "decided at its plan gate: TD-8 is the comment, with no
   failing-first test, and TD-9 is a Stylelint rule", which goes slightly beyond the brief's
   "plan: …, in review", so that the row does not contradict its own plan ("one failing-first test each").
6. `backlog.md`'s Changelog quotes the owner's Azerbaijani answers verbatim (as the plan does); no English
   gloss was added there beyond the meanings in the same sentence.
