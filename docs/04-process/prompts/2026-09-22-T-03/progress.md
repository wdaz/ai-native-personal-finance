# SDD ledger — plan: docs/04-process/plans/2026-09-22-T-03.md

Branch `task/T-03-domain`, worktree `.claude/worktrees/T-03-domain`. Plan v0.2 at `9039dd0`.
Spec reachable: `docs/03-specs/overview.md` v1.0, `docs/03-specs/backlog.md` v1.7,
`docs/02-architecture/data-model.md` v1.1, ADR-0002, ADR-0005 (the plan's "Spec" line).

## Setup (2026-09-22, controller)

- Go-ahead: after plan v0.2 the owner invoked `/superpowers:subagent-driven-development`, then
  wrote "continue".
- `node_modules` in this worktree was empty (only `.cache/gitleaks`). Controller ran `npm ci`:
  596 packages, `found 0 vulnerabilities`; `prepare` ran `install-git-hooks.sh`.
  `core.hooksPath` (shared `.git/config`) before: `scripts/git-hooks`, after: `scripts/git-hooks`
  — unchanged, already relative. `npm audit --audit-level=high`: 0 vulnerabilities.
- Baseline `npx vitest run`: 8 files, **229/229** (= plan E1).
- Postgres container `ai-native-personal-finance-postgres-1` up (healthy). `.env.local` created
  by `cp .env.example .env.local` (README's step; `.gitignore:12` `.env.*` ignores it).
  `npm run test:api` before Task 2: **17 passed** (7.0 s) — E15's API half now measured on the
  unchanged seed, so a Task-6 difference is attributable to T-03.
- Reviewers: `feature-dev:code-reviewer` (Read/Grep/Glob only, no Bash/Write) — governance v1.1.

## Pre-flight scan

Cross-task rows (one per pair sharing a file or an interface):

| Tasks | Producer → consumer | Finding |
|-------|---------------------|---------|
| 1 → 2 | `fixedClock`, `BUSINESS_TODAY` → `tests/unit/domain/calendar.test.ts` | consistent |
| 1 → 3 | `Clock` type → `budgets.ts`, `bills.ts`, `overview.ts`; `fixedClock` → their tests | consistent |
| 1 → 5 | `BUSINESS_TODAY`, `fixedClock` → `scripts/seed-figures.ts` | consistent |
| 1 ↔ 3 | `src/domain/README.md`: T1 drops it from `importTargets` (→ `clock.ts`), T3 rewrites it | consistent — T1 no longer depends on the README |
| 1 ↔ 6 | the narrowed rule (T1 Step 7) ↔ ADR-0005 clarification text (T6 Step 2): both name `new Date()` without args, `Date()`, `Date.now()` | consistent |
| 2 → 3 | `isInMonthOf(date, today)`, `isInMonthUpTo(date, today)`, `sumCents(amounts)` | signatures match |
| 2 → 5 | `SEED_YEAR_SHIFT`, `shiftYears`, `toCents` from `src/domain`; test still imports `seedRows`, `CATEGORY_BY_NAME` from `src/server/seed` (T2 removes only the three moved exports) | consistent |
| 2 ↔ 6 | T2 changes `src/server/seed.ts` imports ↔ T6 Step 3 runs `test:api`/`test:e2e` over it | E15 is a *prediction*; T6 verifies |
| 3 → 5 | `overviewSummary<T,B,P>`: P carries `name`, B carries `category`/`maximum`, T carries `avatar` → `workedExample` reads `pots.items[].name`, `budgets.items[].{category,maximum,spent}` | consistent (generic pass-through, D1) |
| 3 ↔ 5 | `tests/fixtures/domain.ts` (T3) ↔ `tests/fixtures/README.md` text naming it (T5) | consistent, T3 runs first |
| 4 → 5 | `formatMoney`, `formatSignedMoney`, `formatDate(Date)` | consistent |
| 5 ↔ 6 | T5 edits `overview.md` (v1.1); T6 edits `backlog.md`, ADR-0005 — different files; T6 Step 3 expects 340 = T5's total | consistent |

Per-task rows (does the task's own text agree with itself):

| Task | Tests specified vs code / files created vs `git add` | Finding |
|------|------------------------------------------------------|---------|
| 1 | clock 4 + 7 (each) = 11, boundaries +4 → 244; new violation messages are substrings of the new rule messages (`toContain`, boundaries.test.ts:190); `git add … tests/fixtures/boundaries` covers the fixtures and README | consistent |
| 2 | calendar 6 + 4 = 10, money 9 → 263; `git add` lists all six files | consistent; `src/server/seed.ts` header ("ADR-0005 keeps `new Date()` out of src/server … dates stay ISO-8601 text") not in the plan's edit list — see ruling R4 |
| 3 | transactions 5 + 3, budgets 5, bills 7 + 2, overview 6 = 28 → 291; `git add src/domain` covers README | consistent |
| 4 | money 10 + 3 + 4 = 17, dates 24 → 332; `git add src/shared` covers README | consistent |
| 5 | 8 → 340; Step 4 expects 1 failed before the spec edit; two commits (code, then spec) | consistent |
| 6 | Steps 4–5 (process record with reviews, push, PR) come before the final whole-branch review in the plan's order | see ruling R2 |

Rubric-vs-plan check: the calendar-date round trip (`Date.UTC` → `toISOString().slice(0, 10)`
compared with the input) appears twice by plan text — `fixedClock` in `src/domain/clock.ts` and
`parseIso` in `src/shared/dates.ts` — see ruling R3. No test in the plan asserts nothing.

## Rulings

- Ruling R1: the owner's `/superpowers:subagent-driven-development` invocation after plan v0.2,
  followed by "continue", is the separate go-ahead the plan waits for — it names the execution
  skill the plan's header requires — cost if wrong: the owner stops the run; nothing is merged or
  published before the owner's review (the branch push and a draft PR only).
- Ruling R2: Task 6 runs as Steps 1–3 (backlog v1.8, ADR-0005 clarification, full gates, commit)
  before the final whole-branch review; Steps 4–5 (prompt record, process-log entry, copying
  ledger/briefs/reports/reviews, push, PR) run after it — the record copies the final review, as
  T-02's `prompts/2026-09-22-T-02/final-review.md` does — cost if wrong: none beyond ordering.
  Order at the end: final review clean → copy ledger, global-constraints, briefs, reports and
  reviews (NOT the `review-*.diff` packages) into `docs/04-process/prompts/2026-09-22-T-03/` →
  commit → push → **draft** PR → only then `rm -rf` this workspace (it is git-ignored; the copy
  is the only durable record).
- Ruling R3: the two calendar-date round trips stay separate, as the plan writes them — ADR-0002
  forbids `src/shared` → `src/domain`, and the reverse would add a non-formatter export to
  `src/shared` that §4.2 does not ask for; each is three lines with its own error contract —
  cost if wrong: a later task extracts one `parseCalendarDate` into `src/shared`.
- Ruling R4: `src/server/seed.ts`'s header comment stays as it is — the owner's answer 2 limits
  the T-02 change to the imports ("dəyişdirilmədən … köçsün"), and the sentence remains literally
  true under the narrowed rule (argument-less `new Date()` is still forbidden; the dates do stay
  text); ADR-0005's new clarification says the text dates are no longer lint-enforced — cost if
  wrong: one comment line edited in a follow-up.
- Ruling R5: every commit ends with the session's attribution trailer (the plan's commit commands
  show only the subject) — cost if wrong: none. The two lines, verbatim (session reminder,
  superseding the earlier "Claude Opus 5" text):
  `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_01BQp5Lv2Sruz5RCgSMYmHWa`
- Ruling R6: the three "Failed to parse … README.md" coverage errors (Task 5 Step 9) are F2,
  which the owner routed to T-13 ("bu PR-ın əhatəsini genişləndirmə") — a reviewer finding on
  them is ledgered against this ruling, not fixed — cost if wrong: none; T-13 owns it.

## Models

Implementers: Sonnet (complete code in the plan; multi-step gates). Task reviewers:
`feature-dev:code-reviewer` on Sonnet (Tasks 1, 2, 4, 6), Opus (Tasks 3, 5 — business rules,
the spec mirror). Final whole-branch review: Opus.

## Progress
Task 1: dispatched (implementer Sonnet, agent a88fcb4c23a87aade; BASE 9039dd0)
Task 1: implementer DONE_WITH_CONCERNS — e2da2d3; Vitest 244/244; every *measured* Expected matched (5 failed|34 → 3 failed|47 → 50/50; eslint 21:34, 24:25)
- Ruling R7: implementer commits carry the implementer's own attribution trailer (e2da2d3: "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>" + the Claude-Session line) — it names the model that wrote the commit; R5's "Opus 5.5" lines apply to commits the controller makes; implementer-rules.md updated — cost if wrong: trailers name mixed models, cosmetic, no history rewrite.
- Note: plan Task 1 Step 9's replacement range began one clause late ("therefore has to exist." would repeat); implementer anchored one clause earlier; final text = the plan's block once. Plan text defect, handled.
Task 1: review dispatched (package review-9039dd0..e2da2d3.diff)
Task 1: review — Spec ✅, quality Approved, 0 Critical / 0 Important (feature-dev:code-reviewer, Sonnet)
- ⚠️ coverage ≥ 90 % not measured in Task 1 — resolved: Task 5 Step 9 runs `npm run test:coverage` (plan E9: 100 %); T-13 adds the gate.
- ⚠️ ADR-0005/DoD wording stricter than the narrowed rule — resolved: Task 6 Step 2 adds the ADR-0005 clarification; Task 3 Step 5 rewrites src/domain/README.md; DoD names `new Date()` (the argument-less form, owner answer 1) — no DoD change.
Task 1: minor (deferred): task-1-report.md test-count breakdown wrong/self-contradictory (says 5 `it`/12 tests, 5 boundary cases, "−1 net"; true: 11 clock + 4 boundary = 15) — the report is copied into the process record
Task 1: minor (deferred): task-1-report.md Step 10 outputs paraphrased ("(no output — 0 problems)") rather than copied
Task 1: minor (deferred): no src/server twin of the domain-parses-date-allowed control (same rule block covers both globs; plan-specified scope)
Task 1: minor (deferred): clock.ts `!year || !month || !day` — three-way check equivalent to `!year` (plan-verbatim)
Task 1: minor (deferred): narrowed selectors do not catch `globalThis.Date()` / aliased forms (implementer self-report; plan selector text)
Task 1: complete (commits 9039dd0..e2da2d3, review clean)
Task 2: dispatched (BASE e2da2d3)
Task 2: implementer DONE_WITH_CONCERNS — c5e7d45; Vitest 263/263 (11 files); lint/format/typecheck exit 0
- Ruling R8: `toCents`'s doc comment keeps its T-02 text "(ADR-0005, NFR-D2)" although the plan's Task 2 Step 3 block drops it — the owner's answer 2 says move "dəyişdirilmədən" (unchanged), which outranks the plan's transcription; the implementer diffed the moved block byte-for-byte against the deleted one (exit 0) — cost if wrong: one comment line.
Task 2: review dispatched (package review-e2da2d3..c5e7d45.diff)
Task 2: review — Spec ✅; 1 Important (plan-mandated), quality "Approved with the Important to track" (feature-dev:code-reviewer, Sonnet); saved task-2-review.md (task-1-review.md saved too)
- Ruling R9: fix `sumCents` — check the running total after every addition, not once at the end; add the regression test `sumCents([Number.MAX_SAFE_INTEGER, 2, -2])` throws "beyond the exact range". Controller reproduced it: partial sums 9007199254740991 → 9007199254740992 (unsafe) → 9007199254740990 (safe, returned; true total …991). Plan D7 promises refusal "instead of summing to a wrong figure"; the plan's code breaks that promise, so the spec intent (D7, data-model "integer cents") outranks the plan's transcription. — cost if wrong: one more test; a sum whose partial exceeds 2^53 now throws even if exact. Knock-on: money tests 9 → 10; running totals become 264 / 292 / 333 / 341 (plan: 263 / 291 / 332 / 340); DoD "111 new tests" → 112 — carried into later dispatches and Task 6.
- ⚠️ coverage: resolved as in Task 1 (Task 5 Step 9).
Task 2: minor (deferred): plan Task 2 Step 3 prints `toCents`'s comment without "(ADR-0005, NFR-D2)" (plan text drift; code follows R8)
Task 2: minor (deferred): moved messages keep seed wording in general domain modules ("Seed date … ", "Seed amount …", "Dollars as data.json writes them") — owner answer 2 "unchanged"
Task 2: fix round 1 dispatched (resume implementer; FIX_BASE c5e7d45)
Task 2: fix round 1 implementer DONE — 568e972; RED 1 failed | 9 passed → GREEN money 10/10; Vitest 264/264; re-review dispatched (review-c5e7d45..568e972.diff)
Task 2: fix round 1/5 (1 addressed, 0 open — sumCents partial-sum overflow; commits c5e7d45..568e972); saved task-2-rereview-1.md
Task 2: complete (commits e2da2d3..568e972, review clean)
Task 3: dispatched (BASE 568e972; target Vitest 292/292 per R9)
Task 3: implementer DONE — ea103d1; Vitest 292/292 (15 files; +28); gates exit 0; review dispatched (Opus; review-568e972..ea103d1.diff)
Task 3: review — Spec ❌ (1 Important, plan-mandated), quality "Needs fixes" (feature-dev:code-reviewer, Opus); saved task-3-review.md
- Controller check: `.superpowers/sdd/2026-09-22-T-03/seed-amounts.mjs` (not committed) builds the 54 absolute seed amounts in cents (data.json balance, transactions, budget maxima, pot targets/totals + every `$` figure of §4.3). Task 3 test values colliding: 1000 1500 5000 10000 12000 3000 500. Task 2's money.test.ts: 2000 collides. Task 4's planned money test values: no collisions.
- Ruling R10: fix the values, not D12 — the plan promises (Global Constraints on build-workflow; D12) that hand-built amounts never equal a seed amount, the promise is cheap to keep, and weakening it would need the owner. Applies plan-wide: the Task 3 fix round also replaces `-2_000` in tests/unit/domain/money.test.ts (Task 2's file; `sumCents` sum adjusted). Criterion: every amount literal and every asserted cents result in the touched test files and tests/fixtures/domain.ts passes `seed-amounts.mjs` "no collisions" — cost if wrong: test values churn, no behaviour change.
- Ruling R11: the test titles citing seed-data ACs over hand-built data (overview.test.ts "US-05 AC1", "US-07 AC1", "US-08 AC1" — reviewer Minor #1) are fixed in the same round: they are the other half of the same defect (a hand-built test mistakable for a seed figure); titles name the rule, e.g. "US-05 AC1's rule" — cost if wrong: wording only.
Task 3: minor (deferred): bills "most recent" pick under-tested — input oldest→newest, "take last-listed" survives (bills.test.ts:24-25)
Task 3: minor (deferred): "paid by any transaction" vs "paid by latest" not distinguished (bills.test.ts:33-36); mutation `isInMonthUpTo(latest.date, today)` survives
Task 3: minor (deferred): bills.ts:38 builds each vendor list by copying (O(k²)) — plan code
Task 3: minor (deferred): types.ts:4-5 says a repository row "is accepted as it is"; Prisma money is BigInt, so only after conversion (D1 wording too)
Task 3: minor (deferred): transactions.test.ts:27 title "ignoring case" — Collator("en") default sensitivity "variant" does not ignore case
- ⚠️ tests/unit/seed-figures.test.ts referenced by overview.test.ts:6-7 — created by Task 5 at exactly that path (plan Task 5 Files). ⚠️ D1 "straight in" vs BigInt — same as the types.ts minor; T-09 hand-off already says "BigInt columns converted to Number first". ⚠️ coverage — Task 5 Step 9.
Task 3: fix round 1 dispatched (resume implementer; FIX_BASE ea103d1)
Task 3: fix round 1 implementer DONE_WITH_CONCERNS — d34ebea (values + three titles; 292/292). Concern 1: seed-amounts.mjs missed §4.3's bare "40.00"-style amounts — controller fixed the regex (56 amounts); controller re-checked every number in the six files: no collisions (only `999` from `.999Z`, a time fraction). Concern 2: bills.test.ts describe cites US-28 AC1 (a seed-figure AC) — accepted under R11; follow-up commit requested in the same round.
Task 3: fix round 1 follow-up — b727929 (bills describe title, R11); 292/292; re-review dispatched (Sonnet; review-ea103d1..b727929.diff)
Task 3: fix round 1/5 (2 addressed, 0 open — seed-colliding hand-built amounts (R10, incl. Task 2's money.test.ts); seed-AC titles (R11); commits ea103d1..b727929); saved task-3-rereview-1.md
Task 3: minor (deferred): overview.test.ts:19 empty-dataset title cites US-05 AC2/US-06 AC3/US-07 AC2/US-08 AC3 — empty-state rules, no figures; consistent with R11
Task 3: complete (commits 568e972..b727929, review clean)
Task 4: planned test values re-checked with the fixed seed-amounts.mjs — no collisions
Task 4: dispatched (BASE b727929; target Vitest 333/333 per R9)
Task 4: implementer DONE — a6456b4; Vitest 333/333 (17 files; +41); gates exit 0; review dispatched (Sonnet; review-b727929..a6456b4.diff)
Task 4: review — Spec ✅, quality Approved, 0 Critical / 0 Important (feature-dev:code-reviewer, Sonnet); saved task-4-review.md
- ⚠️ §4.2 still shows the Intl example — resolved: Task 5 Step 5 amends §4.2 (overview v1.1).
Task 4: minor (deferred): task-4-report.md trims outputs to "relevant lines" and omits a Node NO_COLOR/FORCE_COLOR warning (the subagent shell's environment, not the repository)
Task 4: minor (deferred): money.test.ts `[0,…]` and `[-0,…]` rows render the same title ("writes 0 cents as $0.00") — plan-verbatim
Task 4: minor (deferred): formatSignedMoney not tested for its throw path or -0
Task 4: minor (deferred): formatDate("") message reads "Date  is not a valid ISO-8601 date" (empty operand)
Task 4: complete (commits b727929..a6456b4, review clean)
Task 5: dispatched (BASE a6456b4; target Vitest 341/341 per R9)
Task 5: implementer DONE_WITH_CONCERNS — e3eca6a (code), 9c5e8c5 (overview v1.1); Vitest 341/341 (18 files); Step 4 checkpoint: 1 failed | 7 passed, only "Budgets spent / limit", only `$`/backticks; coverage 100 % (text table prints no per-file rows at 100 %, as E9 recorded; 3 F2 parse errors)
- Ruling R12: keep the plan's two-commit order (code, then spec) although e3eca6a alone has one red test (the §4.3 check against the unamended spec) — owner answer 6 wants the spec change visible on its own; the branch is reviewed and merged as one PR and CI runs its head; reordering needs a history rewrite of commits a subagent made — cost if wrong: `git bisect` meets one red commit (`git bisect skip`).
Task 5: review dispatched (Opus; review-a6456b4..9c5e8c5.diff)
Task 5: review — Spec ✅, quality Approved, 0 Critical / 0 Important, 8 Minor (feature-dev:code-reviewer, Opus); saved task-5-review.md
- ⚠️ owner answer 6 (backlog v1.8, ADR-0005 line) — Task 6 Steps 1–2.
Task 5: minor (deferred): seedFigures() keeps data.json's avatar path, hex theme and display category, while src/server/seed.ts stores avatar key / Theme enum / Category enum; the agreement test skips avatar/theme; seed-figures.ts:17 "checks the two agree" overclaims — matters for T-09/T-10 consumers of seedFigures()
Task 5: minor (deferred): seq assertion is tautological (i + 1 vs index + 1); title claims "the order the database assigns" (plan-verbatim)
Task 5: minor (deferred): "computes the Overview on the business day" test is clock-independent (plan-verbatim)
Task 5: minor (deferred): seed-figures.ts row mapping parallels src/server/seed.ts (ADR-0002-forced; guarded by agreement test except avatar/theme)
Task 5: minor (deferred): violation fixtures hand-copy all §4.3 rows — a legitimate §4.3 change must edit them in lockstep
Task 5: minor (deferred): differingRows walks only the first table's rows (row-count mismatch under-reported)
Task 5: minor (deferred): coverage run's 3 "Failed to parse … README.md" errors — F2, ruling R6 (T-13)
Task 5: minor (deferred): overview v1.1's §4.2 example `2026-09-01T00:00:00Z → 1 Sep 2026` not pinned verbatim by a test
Task 5: complete (commits a6456b4..9c5e8c5, review clean)
Task 6 (Steps 1–3 per R2): dispatched (BASE 9c5e8c5; Sonnet; target Vitest 341, API 17, E2E 3 prediction)
Task 6: implementer DONE — d26e52b (backlog v1.8), 412cb4c (ADR-0005 clarification); test:all exit 0: secret scan no leaks (109 commits), lint/format/typecheck clean, Vitest 341/341, API 17/17, E2E 3/3 (E15 prediction verified); npm audit 0; review dispatched (Sonnet; review-9c5e8c5..412cb4c.diff)
Task 6: review — Spec ✅, quality Approved, 0 Critical / 0 Important (feature-dev:code-reviewer, Sonnet); saved task-6-review.md
- ⚠️ trailers — controller checked `git log 9039dd0..HEAD`: all 11 commits carry "Co-Authored-By: Claude Sonnet 5" (R7). ⚠️ coverage 100 % — Task 5 Step 9's run.
Task 6: minor (deferred): backlog T-13 hand-off says coverage parse errors print "on every run" — only on `--coverage` runs (plan-verbatim)
Task 6: minor (deferred): task-6-report.md quotes only Vitest's 2-line summary for Step 3
Task 6: Steps 1–3 complete (commits 9c5e8c5..412cb4c, review clean); Steps 4–5 after the final review (R2)
Final review: package review-9039dd0..412cb4c.diff (base 9039dd0 = plan v0.2; the plan commits before it were the owner's plan-gate review); dispatched (Opus)
Final review: With fixes — 0 Critical / 0 Important; 6 Minor "fix before merge" (M1–M6), M7 can wait; deferred-minor triage done; no ruling overturned (feature-dev:code-reviewer, Opus); saved final-review.md
- Final review corrects two premises: R4 — "dəyişdirilmədən" covered the moved functions, not seed.ts's header; the header stays because it is still literally true. R12 — owner answer 6 asks for the three document changes to be listed separately in the PR description, not for a commit order; the red commit stays because rewriting history costs more than one `git bisect skip` at e3eca6a.
- Ruling R13: fix M1–M6 in one fix wave (two commits: backlog; scripts/test), per final-fix-findings.md; M7 (eslint.config.mjs:16 header summary) waits — incomplete, not false — cost if wrong: one comment line later.
- Ruling R14: M2 amends T-02's own T-09 clause ("at the DTO edge" → "at the repository edge, before `overviewSummary`") inside v1.8 — the two clauses contradict and only one can work; M1's structural fix (database-shaped rows from seedOverviewInput) is NOT added to T-04's row (the owner narrowed T-04) — noted in the process log's "Next" instead — cost if wrong: the owner re-words one clause / adds a T-04 note.
- Ruling R15: M6's clock-independent test gets a clock-dependent assertion (another day → other bills) rather than a retitle only — NFR-D1 is the point of the test's title — cost if wrong: one assertion.
- Ruling R2 (amended): the copy into docs/04-process/prompts/2026-09-22-T-03/ also includes seed-amounts.mjs (R10's criterion depends on it).
- Steps 4–5 obligations from the final review: prompt record quotes the skill invocation and "continue" verbatim (R1); PR and process log state Vitest 229 → 341, 112 new tests (R9); PR lists deviations — the reused T-01 `Date.now()` fixtures (owner answer 1 asked for a new one; disclosed before the go-ahead), R8, R9, R10, R12; name US-11 AC1, US-27 AC2, US-28 AC1 with US-04…08; three document changes listed separately; report defects annotated, not edited; US-27 AC2 month-end gap in the process log's "Next".
Final fix wave: dispatched (FIX_BASE 412cb4c; Sonnet; final-fix-findings.md)
Final fix wave: DONE — 2677be0 (backlog corrections), aa41185 (seed-figures JSDoc, titles, clock-dependent assertion); Vitest 341/341; RED 1 failed | 7 passed → GREEN 8/8; re-review dispatched (Sonnet; review-412cb4c..aa41185.diff)
Final fix wave: re-review — M1–M6 all ADDRESSED, no new breakage (Sonnet); saved final-rereview.md
Final: controller at head aa41185 — lint exit 0, format:check exit 0, typecheck exit 0, Vitest 18 files 341/341.
Steps 4–5 (controller, R2): prompt record docs/04-process/prompts/2026-09-22-T-03.md (owner's messages verbatim, times from the session transcript); process-log entry; this folder copied to docs/04-process/prompts/2026-09-22-T-03/ (without review-*.diff and the skill's prompt templates); commit, push, draft PR; then the workspace is deleted.
