# SDD ledger — plan: docs/04-process/plans/2026-09-23-T-04.md

## Pre-flight conflict scan (2026-09-23)

The plan's every code block (FILE/VAR/DIFF) was generated from a scratch prototype that was
itself built and gated task-by-task (Prettier, ESLint, tsc, Vitest) before being spliced into
the plan (plan § "Evidence", E10). The plan was then replayed task-by-task, in order, on a
second clean copy of `main` — each task's test file red, then its code green, then the full
suite (E15: 348 → 364 → 395 → 412 → 420 → 427, every file byte-equal to the prototype's). This
scan is therefore a second pass over interfaces the replay already exercised, not a first look.

| Pair | A produces | B consumes | Found |
|------|-----------|-----------|-------|
| Task 1 → Task 4 | `CATEGORIES`, `THEMES` (readonly tuples) in `src/shared/enums.ts` | `CategorySchema = z.enum(CATEGORIES)`, `ThemeSchema = z.enum(THEMES)` | Matches (E15 task 4 green) |
| Task 1 → Task 4 | `RESET_REASONS` | not consumed by any T-04 task (T-08 writes `ResetReasonSchema`) | Consistent with plan's Out-of-scope line; no conflict |
| Task 2 → Task 3 | `COPY.required`, `.emailInvalid`, `.passwordTooShort`, `.nameTooLong`, `.passwordTooLong` in `src/shared/copy.ts` | `schemas.ts` (Task 3) imports `COPY` and uses exactly these five keys | Matches (E15 task 3 green; auth-schemas.test.ts 25/25) |
| Task 2 → Task 3 | `retryAfterMinutes` exported beside `COPY` (not inside it, D18) | not consumed by `schemas.ts` — only by T-05 later and by Task 2's own test | Consistent; no Task 3 code references it |
| Task 3 → Task 4 | `schemas.ts` after Task 3: imports `{ z }` + `{ COPY }`, header doc, `// Auth`, `// Errors` sections | Task 4 Step 3(a) replaces the two import lines with the fuller Task-4 import block, inserts `// Enums` before `// Auth`, appends `// Overview` + `// Meta` after `// Errors` | The VAR splice points (`schemas.imports.t4.ts`, `schemas.enums.t4.ts`, `schemas.append.t4.ts`) were cut from the same file the plan's Task 3 VAR (`schemas.t3.ts`) was cut from, so the seams are exact by construction — confirmed again in E15 ("schemas.ts equals prototype: True") |
| Task 3 → Task 3 (internal) | Step 4 writes `schemas.ts` exporting `ErrorEnvelopeSchema`/`ErrorEnvelope` | Step 6 rewrites `http.ts`'s `ApiErrorCode` as `ErrorEnvelope["error"]` | Matches; Step 6 runs after Step 4 in the task's own order |
| Task 4 → external | `OVERVIEW_CARD_ITEMS = 4`, `OVERVIEW_TRANSACTIONS = 5` in `src/domain/overview.ts` (T-03, already merged to `main`) | `overview-dto.test.ts` imports both, asserts `OVERVIEW_LIST_MAX` equals them | Confirmed present at `main` HEAD (read directly, this session) |
| Task 5 → Task 3 | `LoginSchema`, `SignupSchema` | `tool-schema.test.ts` imports both, test-only | Matches; Task 5 runs after Task 3 in plan order |
| Task 5 → "Before execution" item 2 | ADR-0004 / SPEC-webmcp-tools name `z.toJSONSchema` (F1 PR, separate) | Task 5's code (`tool-schema.ts`) calls `z.toJSONSchema` directly — no import from the docs | No code dependency; only a documentation-consistency dependency. Ruling below. |
| Task 6 → Task 1–5 | none (test-ids and the lint rule are self-contained) | — | No interface shared; independent |
| Task 7 → Tasks 1–6 | backlog v1.9 hand-off text names every prior task's exports | prose only, no code interface | N/A |

**Self-consistency, each task's own text:** every task's "Interfaces: Produces" line matches the
exact export names its own FILE/VAR blocks define (checked against the plan text while building
this ledger); every task's Step "Run" command matches a script that exists in `package.json`
(`lint`, `format:check`, `typecheck`, `test` — confirmed present, `main` HEAD).

**Ruling — Task 5 vs. F1's docs PR:** the plan's "Before execution" item 2 asks for F1's ADR-0004/
SPEC-webmcp-tools PR to merge before Task 5 runs, for documentation consistency only (Task 5's
code has no dependency on the doc text — it calls `z.toJSONSchema` directly, per D17). The F1 PR
is dispatched to a separate subagent in parallel with this execution (owner instruction,
2026-09-23: "F1 ayrı sub agent etsin"), and only the human owner can merge it (governance: agents
never merge). Proceeding with Tasks 1–4 now does not touch Task 5's dependency at all. If Task 5
is reached before the F1 PR has merged, code review proceeds on Task 5's merits regardless — the
mismatch (ADR still says `zod-to-json-schema` while the code already uses `z.toJSONSchema`) is
the exact inconsistency F1 exists to close, and closing it does not require the code to wait. —
Cost if wrong: none — F1 and Task 5 fix the same words from two directions; whichever lands
second is a no-op on top of the first.

Scan: no other conflicts found. Proceeding to Task 1.

## F1 (separate, parallel subagent — not a plan task)

- Dispatched to a fresh subagent in its own worktree (owner instruction: "F1 ayrı sub agent
  etsin"), branch `worktree-agent-a86c7e98b28fa2e37` from `origin/main`.
- Report: ADR-0004 gets a "Clarification 2026-09-23 (T-04 plan gate, finding F1)" line (status
  stays Accepted); `docs/03-specs/webmcp-tools.md` → v1.0.2; both name `z.toJSONSchema`, not
  `zod-to-json-schema`. Commit `165a425`. Draft PR: https://github.com/wdaz/ai-native-personal-finance/pull/9
- Controller verified independently (`gh pr diff 9`): diff matches the brief exactly, nothing
  else touched, both edits correct. `gh pr view 9` → `mergeable: MERGEABLE`, `isDraft: true`.
- Waits for the owner to merge (agents never merge). Task 5 of this plan does not block on the
  merge landing first — see the pre-flight ruling above (D17: the code calls `z.toJSONSchema`
  directly, no doc import).

## Task 1

- BASE (before implementer dispatch): `cf84f4b46f7d9fda651e23c00c0734d4762a9f47`
- Controller ran `npm install zod@^4.6.5 --no-fund` per the Global Constraint (controller, not a
  subagent). Verified: `package.json` +1 line under `dependencies`, `package-lock.json` 4 lines
  (matches plan E2 exactly); `npm audit` → 0 vulnerabilities; `core.hooksPath` unchanged
  (`scripts/git-hooks`, absolute path, the known T-02 limitation — unaffected by this install).
- Implementer dispatched (haiku, general-purpose, no isolation — already in the task worktree):
  Steps 1, 2, 4, 5, 6, 7 of the brief (Step 3 done by controller above).
- **F1 merged** 2026-09-23T05:48:01Z, merge commit `1a0a2e6` (owner). Ruling above (Task 5 does
  not block on it) stands, but the doc/code mismatch it existed to close is now fully closed.
- Review: Spec ✅ (enum lists, order and spelling verified against data-model.md independently;
  two fixtures exercise distinct violations, both asserted; `zod` added only under
  `dependencies`). Strengths noted. Critical: none. Important: none. Minor: implementer's report
  said "331 tests passed" against the plan's expected 348, with 2 test files silently dropped
  from the summary.
- Controller resolved the Minor myself (governance: I hold context the reviewer lacks): this
  worktree's `node_modules` was a fresh install from Task 1's `npm install zod` (the worktree had
  never had `npm ci`/`postinstall` run before), and `src/server/generated/prisma` (git-ignored,
  `postinstall: prisma generate`) had not been generated — 2 test files (importing the Prisma
  client) failed to collect. Ran `npx prisma generate` (controller, environment setup, not an
  application-code fix); re-ran the full gate set: `npm test` → **348/348** (19 files, exact
  match to plan E15), `npm run lint` / `typecheck` / `format:check` → all clean. `git status`
  clean (the generated client is git-ignored, nothing to commit). Not a defect in Task 1's diff.
- Task 1: complete (commits cf84f4b..b9328e8, review clean after the environment fix above)

## Task 2

- BASE b9328e8, HEAD 505d4e4 (two commits: 7ecfd6d docs, 505d4e4 code).
- Implementer: 364/364 (20 files), matches plan exactly. No repeat of the Prisma-client gap
  (node_modules/generated client persist across the worktree's `npm install` calls).
- Review: Spec ✅ — reviewer independently checked the owner's verbatim answer text (not just the
  plan's paraphrase) against the appendix rows; retryAfterMinutes, resetBanner parameterisation,
  mirror test order/coverage, fixture byte-equality (regenerated and diffed itself), commit
  scoping — all confirmed. Critical: none. Important: none.
- Minor (deferred): (1) the fixture-generator script that makes `reworded.md.fixture` is
  gitignored scratch, not committed — a future appendix change needs the script re-derived to
  regenerate it (recorded here as the durable pointer this session's ledger asked for, since the
  script's exact content is already in `task-2-brief.md`'s Step 3 for whoever picks this up).
  (2) `"holds nothing the appendix lacks"` trusts the hand-written `keys` arrays rather than a
  fixture of its own. Neither is load-bearing for later tasks; not fixed.
- Task 2: complete (commits b9328e8..505d4e4, review clean)

## Task 3

- BASE 505d4e4, HEAD 2b95b95 (two commits: fca80a8 docs — auth.md only, 3+/3-; 2b95b95 code —
  http.ts + schemas.ts + two test files).
- Implementer: 395/395 (22 files), matches plan exactly.
- Review: Spec ✅ — reviewer independently checked zod's `stop()`/`abort` mechanism against the
  installed package's own type defs (not just trusted the brief), verified check ordering gives
  one issue per field, `errorResponse`'s body byte-identical before/after, no Task-4 scope creep,
  SPEC-auth v1.0.1's F2 wording exact. Two ⚠️ (commit scoping, hook wrapper) — controller
  verified both directly: `git show --stat` on each commit confirms correct scoping (doc-only,
  then code-only); both commits exist in `git log`, which a failing pre-commit hook would have
  blocked, so the hook ran and passed. Critical: none. Important: none.
- Minor (deferred): `stop()` sets Zod 4's deprecated `message` key on check params instead of
  `error` (functionally identical today, confirmed against `node_modules/zod`'s own type defs;
  worth swapping next time this file is touched, before a future major drops the alias). Not
  load-bearing for later tasks.
- Task 3: complete (commits 505d4e4..2b95b95, review clean)

## Task 4

- BASE 2b95b95, HEAD 27a51de (one commit, scoped to schemas.ts + two new test files).
- Implementer: 412/412 (24 files), matches plan exactly.
- Review: Spec ✅ — reviewer independently ran z.int()/z.iso.datetime() in a node REPL rather
  than trusting the test claims, confirmed OVERVIEW_LIST_MAX asserted against T-03's live
  domain constants (not a hardcoded duplicate), confirmed enum schemas source from Task 1's
  enums.ts (document spellings, not Prisma's), confirmed Task 3's auth/error sections untouched
  byte-for-byte. Zero findings at any severity. Task quality: Approved.
- Task 4: complete (commits 2b95b95..27a51de, review clean)

## Task 5

- BASE 27a51de, HEAD b693be3 (one commit).
- Implementer: 420/420 (25 files), matches plan exactly.
- Review: Spec ❌ ("Needs fixes"). Reviewer independently ran `z.toJSONSchema` against a
  `.nullable()` field and a bare `z.uuid()` field rather than trusting the report.
  - Important: `unboundedStrings` checks `node.type === "string"`; Zod 4 writes `type:
    ["string","null"]` for a `.nullable()` string (array, not bare string), so the maxLength
    check never runs on such a field — a silent gap in the exact guarantee this function exists
    to provide. Not exercised by any current shared schema (none use `.nullable()`/unions today),
    but untested and unguarded.
  - Minor / plan-mandated: a bare `z.uuid()` field throws today, contradicting the plan's own
    decision D17 ("`z.uuid()` exempt from `maxLength`"). Ruling: real defect — the plan's D17
    text and the plan's own embedded code disagreed (my pre-flight scan missed this
    self-consistency check for Task 5's D17 vs. its code block). Fixing it to match D17 costs
    nothing (T-04 defines no actual tool inputSchema with a uuid field; T-11, out of scope, is
    the first consumer) and keeps the guard's behaviour matching its documented decision. — Cost
    if wrong: none identified; if a future tool truly needs a bounded uuid before Release 2 adds
    `.max(36)`, the format/pattern already bounds it structurally (a UUID string's shape is fixed
    length), so exempting it introduces no real unboundedness.
- Fix round 1/5: resumed the original implementer (same agent, live) with both findings, exact
  reproduction commands, and the fix instructions (amend the existing commit, not a new one).
  Dispatched; awaiting the fix report and a scoped re-review.
- Fix round 1/5: re-review — both findings ADDRESSED (nullable/union type-array check at
  tool-schema.ts:23-24; uuid exemption at :30). New breakage: none Critical/Important. Tests:
  10/10 file, 422/422 suite, re-run independently by the re-reviewer, matches report.
- Minor (deferred): (1) redundant `format` type cast at tool-schema.ts:30 — `JsonSchema` already
  declares `format?: string`, harmless. (2) Out-of-scope observation, not part of this task's
  findings: `unboundedStrings` does not descend into `anyOf`/`oneOf`/`allOf`, so a `.nullable()`
  **object** (Zod 4 compiles this to `{ anyOf: [...] }`, unlike a nullable string's `type` array)
  would hide an unbounded string nested inside it. No current shared schema is nullable-object
  shaped; worth a note for T-11 (out of scope here) before it relies on this helper for such a
  shape. Neither blocks this task.
- Task 5: complete (commits 27a51de..058f3de, fix round 1/5: 2 addressed, 0 open)

## Task 6

- BASE 058f3de, HEAD 60ca072 (one commit).
- Implementer: 429/429 (26 files) — differs from the controller's own dispatched prediction of
  427. Controller traced this before dispatching review (not a defect): 422 (post-Task-5-fix
  baseline, which the plan's original sequence predates) + 7 new tests this task actually adds
  (boundaries.test.ts: 2 violation + 2 allowed fixtures + 1 new `importTargets` entry, each
  `it.each`-generated = 5; test-ids.test.ts's own 2) = 429. The controller's dispatch message
  said "+5 new" when the design is "+7 new" — an arithmetic slip in the dispatch, not in the plan
  or the implementer's work. Reviewer instructed not to flag the 427-vs-429 mismatch itself.
- Review: Spec ✅ — reviewer independently ran `eslint --print-config` on three files to confirm
  the new rule doesn't clobber or get clobbered by the pre-existing ADR-0005 `no-restricted-syntax`
  block, grepped for false positives repo-wide, reran lint/test itself. Critical: none.
  Important: none.
- Minor (deferred): (1) `test-ids.test.ts`'s uniqueness/kebab-case checks trivially pass on the
  current empty registry — by design (no Release 1 spec names an id yet); the guard itself was
  mutation-tested during plan authoring (plan E11: a duplicate-id mutation and a camelCase-id
  mutation were both killed against this exact test in the prototype), so it is proven correct,
  just not by a live fixture file (there's nothing yet to encode as one). Will exercise for real
  once the first id lands. (2) The implementer's report paraphrased some command output instead
  of pasting it verbatim (governance: "Reported output is copied from the run, never from the
  brief") — the reviewer independently reran and confirmed matching results, closing the gap the
  paraphrase might otherwise have hidden; noted as a process reminder, not re-dispatched since the
  underlying claim is verified. (3) Flat-config rule blocks for the same rule name don't merge
  across overlapping globs — informational, no overlap exists today.
- Task 6: complete (commits 058f3de..60ca072, review clean)

## Task 7

- Controller executed this task directly rather than dispatching a fresh implementer: its
  deliverables (the prompt record, the session-folder copy, the process-log entry) need this
  session's own conversation and ledger, which a fresh subagent would not have; the README and
  backlog edits are mechanical and were applied directly from the brief's exact diffs.
- Wrote `docs/04-process/prompts/2026-09-23-T-04.md` (the owner's messages verbatim, the plan
  gate, the go-ahead, F1's parallel dispatch).
- Wrote `task-N-review.md` for every task (verbatim copies of the reviewer messages received in
  this conversation, since reviewers returned reports as messages, not files) and a README.md for
  the session folder, then copied the whole workspace (minus `review-*.diff` and `plan-path`,
  per build-workflow §7: briefs and reports, not diffs) into
  `docs/04-process/prompts/2026-09-23-T-04/`.
- Applied Step 1's three README diffs. Found one plan gap while doing so: the plan's own diff for
  `src/shared/README.md` did not mention `tool-schema.ts` (Task 5, added late in v0.2) — added it
  (`toolInputJsonSchema`, for T-11's `defineTool`) so the README describes what the folder
  actually holds. Ruling: a documentation completeness fix, not a scope or behaviour change —
  cost if wrong: a one-line README correction, trivially reverted.
- Applied Step 2's backlog v1.9: status line, changelog, the T-04 row, and all ten hand-off rows
  (T-05, T-06, T-07, T-08, T-09, T-10, T-11, T-12, T-13, T-15) verbatim from the brief.
- Committed (`6b7fa55`): READMEs + backlog v1.9.
- Step 3, the full gates: copied `.env.local` from the sibling `T-03-domain` worktree (this
  worktree had none; same repo, same local dev secrets already on this machine, not sent
  anywhere) and confirmed the T-02 Postgres container was healthy. `npm run test:all` — **exit
  0**: secret scan (129 commits, no leaks), lint, format:check, typecheck, unit **429/429** (26
  files, matching E10), API **17/17**, E2E **3/3** (chromium, firefox, webkit) — matching the
  plan's prediction E16 exactly. `npm audit` → 0 vulnerabilities.
- Committed (`9ac2df8`): prompt record, session-folder copy, process-log entry.
- Task 7: complete (commits 60ca072..9ac2df8, controller-executed, full gates green:
  test:all exit 0, 429/429 unit, 17/17 API, 3/3 E2E, npm audit 0)

## All plan tasks complete — proceeding to the final whole-branch review.

## Final whole-branch review (opus)

Dispatched on `90440a1..9ac2df8` (12 commits). Verdict: **With fixes**.

- **Correction to the Task 5 ruling above.** The final reviewer re-read D17's table row in the
  plan (line 231) against its own column header (`| # | Decision | Why | Alternative rejected
  |`) and found that "`z.uuid()` exempt from `maxLength`" sits in the **fourth column**
  ("Alternative rejected"), not the second ("Decision") — the plan rejected the exemption; its
  actual Decision column names none. The Task 5 review (and this controller's ruling at line
  141-149 above) read the quoted sentence in isolation and got it backwards, corroborated by
  nothing but itself. Three independent sources in the repository agree with the final
  reviewer's reading: SPEC-webmcp-tools §2.4 ("any string property lacks `maxLength`", no uuid
  carve-out), ADR-0004 ("every string input has `maxLength`"), and this branch's own T-15
  hand-off row in `backlog.md` v1.9 ("ids with `.max(36)` for `toolInputJsonSchema`" — i.e. the
  plan's own intent was that a uuid field needs its own explicit bound, not a structural
  exemption). Ruling withdrawn; the earlier "Cost if wrong: none identified" line above was
  itself wrong — the cost was exactly this: an owner-approved decision (D17), a spec line
  (§2.4) and an ADR contradicted, caught only because a fresh, more careful review re-read the
  table instead of trusting a prior review's paraphrase of it.
- Real, unrelated finding, confirmed correct and not reverted: the nullable/union type-array fix
  from the same fix round (`unboundedStrings`'s `type === "string" || type.includes("string")`
  check) stands — the final reviewer verified it independently and found no fault with it.
- Widened, not new: the "`unboundedStrings` doesn't descend into `anyOf`/`oneOf`" gap this
  ledger already recorded after Task 5's re-review (as a nullable-object case only) is in fact
  five distinct unguarded JSON Schema shapes — `anyOf`/`oneOf`/`allOf` (nullable/union objects),
  `z.record`/`.catchall` (no fixed `properties`), `z.tuple` (`prefixItems`, not `items`), and
  `.meta({ id })` (a `$ref` into `$defs`, never inlined). The reviewer suggested failing closed
  (throw on any keyword the walker doesn't recognise) rather than growing the allow-list one
  shape at a time. Recorded for T-11 (out of scope here); not fixed in this branch.
- Other findings, adjudicated: SPEC-auth §6's 400 body still lacks the `message` §2.10 requires
  (F2's answer named only 401/429) — routed to the owner, not fixed here, since no owner text
  exists to fix it to. `ERROR_CODES` typed by hand in the test rather than read from the schema
  — parked, Minor, no downstream task depends on it. The test-id rule not covering
  `src/webmcp/**/*.tsx` — parked; no spec or owner answer named that glob in scope for T-04
  (`src/webmcp` has no `.tsx` files yet; T-11 adds them). This branch predates PR #9's merge
  into `main` (F1's ADR-0004/webmcp-tools wording) — merging `main` in before the PR, separately
  from the code fix below.

**Fix wave (one dispatch, per the skill's "no second fix wave" rule):** revert the `z.uuid()`
exemption in `src/shared/tool-schema.ts` and its header comment; flip the "accepts z.uuid()" test
to expect the throw; add a test that `z.uuid().max(36)` passes. Dispatched to a fresh Sonnet
implementer (not a resume of Task 5's implementer — this is the final-review fix wave, a
separate loop). Documentation corrected by the controller directly (this entry; `process-log.md`;
the prompt record and its session-folder README) rather than by the fix subagent, since telling
the true story needs this session's own context.

Fix wave dispatched (commit `211188c`, 430/430, lint/typecheck/prettier clean). Scoped re-review
(`final-rereview.md`): **Addressed, no new Critical/Important breakage**. Merged `main` (with
PR #9) into `task/T-04-shared` next, then final documentation sync and commit.

## Final review: complete

- Findings: 1 Important (D17 misreading — fixed and re-reviewed clean), 5 Minor/routed (widened
  T-11 note, SPEC-auth §6 400 message routed to owner, `main` merge, `src/webmcp` rule scope
  parked, `ERROR_CODES` hand-typed parked).
- `npm run test:all` to be re-run once more after the `main` merge, before pushing.
