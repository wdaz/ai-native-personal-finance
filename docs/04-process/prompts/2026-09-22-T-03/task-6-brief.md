### Task 6: Documents, the full gates and the process record

**Files:**
- Modify: `docs/03-specs/backlog.md` (v1.8), `docs/02-architecture/adr/0005-persistence-and-reset.md`
  (clarification line), `docs/04-process/process-log.md`
- Create: `docs/04-process/prompts/2026-09-22-T-03.md`, `docs/04-process/prompts/2026-09-22-T-03/`
  (the ledger, briefs, reports and reviews of the session, not diffs — build-workflow §7)

- [ ] **Step 1: `backlog.md` v1.8** (questions 1, 3; findings F2, F3; the T-03 hand-offs)

The status line's parenthesis starts with
`v1.8 — 2026-09-22: T-03 takes the §4.2 formatters and the ADR-0005 rule fix, T-04 narrowed, T-03 hand-offs written into T-05/T-08/T-09/T-10/T-13, owner decisions at the T-03 plan gate; `
before `v1.7 — …`. The changelog starts with:

```md
Changelog: v1.8 (2026-09-22, owner decisions at the T-03 plan gate) — T-03 also writes `src/shared/money.ts` and `src/shared/dates.ts` (the SPEC-overview §4.2 formatters), because `scripts/seed-figures.ts` prints §4.3 with them and T-03 runs first; T-04's scope narrows to the schemas, enums, copy and test ids. T-03 moves `toCents` and `shiftYears` from `src/server/seed.ts` into `src/domain` (ADR-0002 lets scripts import domain, not server), and narrows the ADR-0005 lint rule to the calls that read the wall clock (`new Date()` without arguments, `Date()`, `Date.now()`) so that `fixedClock` can build its date. Every hand-off the T-03 plan addresses to a later task sits in that task's row, as in v1.7: T-05 separates system time from the business `Clock` (F3); T-13 narrows the coverage globs (F2). v1.6 (2026-09-22, owner decisions at the T-02 plan gate) — …
```

(the existing text from "v1.6" on stays unchanged; the changelog has no v1.7 entry of its own).

The T-03 row's task cell gains, at the end:
`; **the SPEC-overview §4.2 formatters** `src/shared/money.ts` + `dates.ts` with their tests (from T-04); `toCents`/`shiftYears` move from `src/server/seed.ts` into `src/domain`; the ADR-0005 lint rule catches `Date()` and allows `new Date(<value>)`, with fixtures`
and its Spec / ADR cell becomes `SPEC-overview §4.2, §4.3, data-model; ADR-0005`.
The T-04 row's "`money.ts` + `dates.ts` (UTC) with tests" becomes
"(`money.ts` + `dates.ts` arrived in T-03)", and its Spec cell's "SPEC-overview §4.2" becomes
"SPEC-overview §6".

Each of these rows' task cells gains, at the end (after any "**from T-02:**" text):
- T-05: `; **from T-03:** keep **system time** (the session's sliding re-issue, the rate limit's window) apart from the **business `Clock`** (`src/domain/clock.ts`, fixed at 2026-08-19) — the plan names both, and injects system time into `src/server`, where the ADR-0005 rule forbids `new Date()`, `Date()` and `Date.now()`, rather than reading it there`
- T-08: `; **from T-03:** the banner writes `formatDate(lastResetAt)` — three-letter months`
- T-09: `; **from T-03:** hand repository rows to `overviewSummary` — `BigInt` converted to `Number` first (`sumCents` refuses anything else), `seq` selected, `id`/`theme`/`avatar` passed through, `fixedClock(BUSINESS_TODAY)` as the clock`
- T-10: `; **from T-03:** seed figures in E2E come from `seedFigures()` in `scripts/seed-figures.ts`, text through the `src/shared` formatters`
- T-13: `; **from T-03:** narrow `vitest.config.ts`'s `coverage.include` to `**/*.ts` — it matches the layers' `README.md` files and prints parse errors on every run; `src/domain` measured 100 % at T-03`

- [ ] **Step 2: ADR-0005 clarification** (question 1) — after the existing "Clarification
  2026-09-22 (owner, T-02 plan gate)" bullet:

```md
- Clarification 2026-09-22 (owner, T-03 plan gate): parsing a date is allowed; reading the
  clock is not. The lint rule forbids the calls that read the wall clock — `new Date()`
  without arguments, `Date()` and `Date.now()` — and allows `new Date(<value>)`, which builds
  a fixed date: `fixedClock("2026-08-19")` in `src/domain/clock.ts` is written that way, and
  its `today()` answers 00:00 UTC of that day, a new `Date` on every call. T-02's seed keeps
  its dates as text; that was a side effect of the earlier, wider rule, not a requirement —
  `shiftYears` is unchanged, so the behaviour stays, but the rule no longer enforces it.
```

- [ ] **Step 3: The full gates**

Run: `npm run test:all`
Expected: secret scan, lint, format, typecheck green; Vitest **340/340** (*measured*, E16); API
**17/17** and E2E **3/3** (*prediction*, E15 — needs the Postgres container and `.env.local`).
Run: `npm audit --audit-level=high`
Expected (*prediction*): 0 vulnerabilities (no dependency changes).
If API or E2E differ from the prediction, stop and report: Task 2 changed the seed's imports.

- [ ] **Step 4: The process record** — the session prompt
  (`docs/04-process/prompts/2026-09-22-T-03.md`: the owner's messages verbatim, starting with
  "T-03 planını hazırla", then the plan-gate reply — pasted text, so the agent asked and the owner
  chose "Bəli — yalnız plan v0.2" — and the go-ahead), the subagent ledger, briefs, reports and
  reviews copied to `docs/04-process/prompts/2026-09-22-T-03/`, and the process-log entry below,
  filled with what actually happened.

- [ ] **Step 5: Commit, push, open the PR**

```bash
git add docs/03-specs/backlog.md docs/02-architecture/adr/0005-persistence-and-reset.md docs/04-process/process-log.md docs/04-process/prompts/2026-09-22-T-03.md docs/04-process/prompts/2026-09-22-T-03
GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit -m "docs(process): T-03 — backlog v1.8, ADR-0005 clarification, process record"
git push -u origin task/T-03-domain
```

Open the PR against `main` with the Definition of Done below as its description, ticked, and a
section "Document changes" that lists the three separately (owner answer 6):

1. `docs/03-specs/overview.md` v1.1 — §4.2 dates from a fixed three-letter month table, no
   `Intl`; §4.3 per-budget amounts in the money format, and the sentence naming its check.
2. `docs/03-specs/backlog.md` v1.8 — T-03 takes the §4.2 formatters and the lint-rule fix;
   T-04 narrowed; the T-03 hand-offs in the T-05, T-08, T-09, T-10 and T-13 rows.
3. `docs/02-architecture/adr/0005-persistence-and-reset.md` — the clarification "parsing a date
   is allowed; reading the clock is not".

The owner merges.

---

## Process-log entry (draft for Task 6)

```md
## 2026-09-22 — Phase 5: T-03 domain logic and generated seed figures

- **Phase:** 5 (Build the slice), Release 1
- **Participants:** Owner / Agent (Claude Code, Opus 5; subagents per the plan)
- **Trigger:** backlog T-03, after T-02 merged (PR #6) and the T-02 follow-ups (PR #7)
- **Prompt(s):** `prompts/2026-09-22-T-03.md`; plan `plans/2026-09-22-T-03.md`
- **Produced:** `src/domain` (`clock`, `calendar`, `money`, `types`, `transactions`, `budgets`,
  `bills`, `overview`), `src/shared/money.ts` and `dates.ts`, `scripts/seed-figures.ts`
  (`npm run seed:figures`), the §4.3 check with three violation fixtures, the ADR-0005 rule
  narrowed to clock reads with four fixtures, overview v1.1, backlog v1.8, an ADR-0005
  clarification; Vitest 229 → 340, `src/domain` + `src/shared` coverage 100 %.
- **What the agent got right:** <filled at the end of the session>
- **What the agent got wrong or missed:** <filled by the owner>
- **Owner changes and reasoning:** at the plan gate the owner took every recommendation, with
  conditions: T-02's text dates were a side effect of the wide lint rule, not a goal, and
  ADR-0005 says so in one line ("parsing is allowed, reading the clock is not"); boundary tests
  for the formatters (0, negative, 1 cent, December, September); the PR lists its three document
  changes separately; F2 stays in T-13; T-05's plan separates system time from the business
  Clock. <the rest filled by the owner>
- **Disagreements:** <if any>
- **Lessons for the process:** "generated, never typed" held — the generator reproduced every
  value of §4.3 on the first run and found one style slip; a lint rule that is too wide makes
  the code it protects unwritable, and one that is too narrow (`Date()`) passes in silence —
  both edges now have fixtures.
- **Next:** owner review and merge; T-04 (schemas, enums, copy, test ids). Hand-offs in the plan:
  T-05 (a wall-clock source for sessions and the rate limit), T-09 (row mapping), T-13 (coverage
  globs).
```

---

## Definition of Done — how each line is met

| DoD line | How |
|----------|-----|
| PR names task, spec sections, stories; nothing outside the task | PR title and body: T-03, SPEC-overview §4.2–4.3/§6/§7, data-model, US-04…08; the only T-02 file touched is `src/server/seed.ts` (imports, question 2) and its test's imports |
| No Accepted ADR contradicted; decisions recorded | ADR-0005 clarification (question 1); ADR-0002 respected (scripts import domain/shared only) |
| Spec amended in the same PR if wrong | overview v1.1 (questions 4, 5), backlog v1.8 (questions 1, 3) |
| TS strict, lint, format, boundaries | Every task's last step; E8 |
| Domain pure and clock-injected; no `new Date()` | `budgetSpent`, `recurringBills`, `overviewSummary` take a `Clock`; the lint rule (Task 1) with its fixtures |
| Money integer cents; formatted only at the edge | `src/domain` computes in cents (`sumCents`); text only in `src/shared` and the script |
| Shared Zod schemas; copy from `copy.ts` | Not touched by T-03 (T-04) |
| Client/server boundary; WebMCP only in `src/webmcp` | Not touched |
| New rule/guard/mirror ships with a failing fixture | `domain-calls-date`, `server-calls-date`, `domain-parses-date-allowed`; `gift-forty`, `latest-by-day`, `no-worked-example` |
| Unit tests for every new domain/shared function; coverage ≥ 90 % | 111 new tests (E16); 100 % (E9) |
| API / E2E / axe / keyboard / screenshots / WebMCP | No route, page or tool changes (n/a) |
| `npm run test:all` green locally and in CI | Task 6 Step 3; CI on the PR |
| Process-log entry; prompts saved | Task 6 Step 4 |
| Owner reviewed and merged | The owner |
