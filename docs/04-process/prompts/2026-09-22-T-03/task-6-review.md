### Spec Compliance

✅ Spec compliant. Both documents match the brief's specified text verbatim, in the specified locations, with no unrelated lines touched, and every "from T-03" hand-off and the ADR-0005 clarification accurately describe code that exists on this branch.

**Step 1 — `backlog.md` v1.8:** Single diff hunk (`@@ -1,30 +1,30 @@`), 9 lines removed / 9 added, matching `git diff --stat`'s "18 +++++++---------" exactly. Verified line-for-line against the brief:
- Status line prefix (`docs/03-specs/backlog.md`, diff line 52→53) matches brief verbatim.
- Changelog v1.8 entry (diff line 53) matches brief verbatim, v1.6-on text untouched.
- T-03 row (diff line 64): task-cell addition and `SPEC-overview §4.2, §4.3, data-model; ADR-0005` cell both verbatim.
- T-04 row (diff line 65): `(`money.ts` + `dates.ts` arrived in T-03)` and `SPEC-overview §6` both verbatim.
- T-05/T-08/T-09/T-10/T-13 rows (diff lines 66, 72–74, 78): each `; **from T-03:** …` clause appended after the existing `**from T-02:**` text where one exists (T-05, T-08, T-09, T-13) or at the row's end where none exists (T-10) — matches brief instruction and text verbatim.
- T-06/T-07/T-11/T-12/T-14/T-15/T-16/Notes: all appear only as unmarked context — confirmed untouched.

**Step 2 — ADR-0005 clarification:** `docs/02-architecture/adr/0005-persistence-and-reset.md:26-32`, a 7-line bullet inserted after the T-02 clarification and before "Driven by:" — text matches the brief verbatim, no other line in the file changed.

**Hand-off/code cross-checks (named risk, one focused check per claim):**
- `eslint.config.mjs:184-208` — ADR-0005 rule narrowed to exactly `new Date()` (0-arg), `Date()`, `Date.now()`; `new Date(<value>)` unrestricted. Matches both the ADR clarification and the T-03 row's "catches `Date()` and allows `new Date(<value>)`" text.
- `src/domain/clock.ts:17-25` — `fixedClock(isoDate)` returns `{ today: () => new Date(ms) }`, a new `Date` each call at 00:00 UTC. Matches the ADR clarification's description exactly.
- `src/domain/money.ts` and `src/domain/calendar.ts:17-25` (`toCents`, `shiftYears`) plus `src/server/seed.ts:2-4,124` (now imports both from `src/domain` instead of defining them) — matches the backlog's "`toCents`/`shiftYears` move from `src/server/seed.ts` into `src/domain`" claim. `shiftYears` still returns a string and `seed.ts` still stores `date: shiftYears(...)` as text — matches the ADR clarification's "T-02's seed keeps its dates as text … `shiftYears` is unchanged."
- `src/shared/dates.ts:9-22` — hand-rolled three-letter `MONTHS` table, no `Intl` — matches the T-08 hand-off's "three-letter months." `src/shared/money.ts` exists with `formatMoney`/`formatSignedMoney`; both have tests at `tests/unit/shared/{money,dates}.test.ts`.
- `scripts/seed-figures.ts:52` exports `seedFigures` via `overviewSummary(seedOverviewInput(), fixedClock(BUSINESS_TODAY))`, using `src/shared` formatters — matches the T-10 hand-off.
- `src/domain/overview.ts:41-65` — `overviewSummary` is generic over caller-supplied `T/B/P` (ids/theme/avatar pass through), sorts by `seq`, uses `sumCents` — matches the T-09 hand-off's description.
- ADR-0005 "with fixtures" claim: `tests/fixtures/boundaries/{domain,server}-calls-date.ts.fixture` and `domain-parses-date-allowed.ts.fixture` exist and are wired into `tests/unit/boundaries.test.ts:143-154,182-187` with matching rule IDs/messages — the narrowed-rule fixtures are real and asserted, not just described.
- `vitest.config.ts:19` — `coverage.include` is still `["src/domain/**", "src/shared/**", "src/webmcp/**"]` (not yet narrowed to `**/*.ts`), and `src/domain/README.md`, `src/shared/README.md`, `src/webmcp/README.md` still exist — confirms the T-13 hand-off's stated premise is currently true, and correctly left for T-13 rather than fixed here (out of this task's scope).

**Step 3 — the full gates:** `npm run test:all` = `secrets:scan && lint && format:check && typecheck && test && test:api && test:e2e` (`package.json:26`); `test` = `vitest run` with no `--coverage` (`package.json:19,21`), so this run does not hit the README.md coverage-instrumentation problem T-13's row describes — consistent, not contradictory. Reported results (secret scan clean, lint/format/typecheck silent-pass, Vitest 341/341 across 18 files, API 17/17, E2E 3/3, audit 0 vulnerabilities) are internally consistent and match the task's own note that 341 (not the brief's 340) is the correct total per a recorded controller ruling.

⚠️ Cannot verify from diff:
- Commit trailers (`Co-Authored-By`, `Claude-Session`) claimed in the report are not visible in the diff package (which lists only commit subjects) — accept on the report's word or check `git log -1 --format=%B` per commit if independent confirmation is wanted.
- "`src/domain` measured 100 % at T-03" (T-13 row, and referenced in the report) traces to earlier T-03-branch commits' coverage runs, not to this diff or to Step 3's gate run (which excludes `--coverage`) — not verifiable from this diff alone.
- Full per-file Vitest reporter output for Step 3: the report shows only the 2-line final summary ("Test Files 18 passed (18)" / "Tests 341 passed (341)"); no evidence either way of transient warnings during individual file runs beyond that summary.

### Strengths

- Every one of the 9 changed lines in `backlog.md` and the 1 inserted bullet in the ADR reproduces the brief's specified text exactly, including markdown bold/backtick pairing, with no incidental edits elsewhere in either file (confirmed via the single-hunk diff structure).
- Every "from T-03" hand-off was checked against the actual code it describes (clock, money, calendar, dates, seed-figures, overview, boundary fixtures) and all matched — this is not just prose-consistent, it is code-accurate.
- The ADR-0005 clarification precisely matches the shipped lint rule's three selectors and `fixedClock`'s implementation, including the subtle "new `Date` on every call" detail.
- Governance's "never modify an Approved/Accepted document" constraint is respected in spirit: both edits use this repo's established versioning convention (a new changelog/status entry for backlog.md, a new "Clarification" bullet for the ADR) rather than silently rewriting existing approved text, matching the owner's plan-gate authorization.
- Scope discipline: nothing outside backlog.md and the ADR was touched; Steps 4–5 were correctly left undone per the stated controller ruling.

### Issues

#### Critical (Must Fix)
None.

#### Important (Should Fix)
None.

#### Minor (Nice to Have)
- `docs/03-specs/backlog.md`, T-13 row (diff line 78, brief `task-6-brief.md:33`): "narrow `vitest.config.ts`'s `coverage.include` to `**/*.ts` — it matches the layers' `README.md` files and **prints parse errors on every run**" is imprecise — `npm run test:all`'s `vitest run` (this task's own Step 3 gate) does not pass `--coverage`, so it does not hit this problem; only an explicit `npm run test:coverage` (or a future CI coverage-gate job) would. This wording is verbatim from the brief (plan-mandated), so it isn't the implementer's error, but as written it slightly overstates how often the problem currently manifests. Not blocking — T-13 owns the fix and will need `coverage.include` narrowed either way.
- Task 6 report, Step 3 Vitest section: only the 2-line final summary is quoted, not a per-file breakdown. Given the instruction that "test output should be pristine," a slightly fuller excerpt (or an explicit note that nothing else was printed) would remove any doubt about transient warnings during individual file runs.

### Assessment

**Task quality:** Approved

**Reasoning:** Both documents reproduce the brief's mandated text exactly, in exactly the specified locations, with nothing else touched, and every hand-off/clarification claim was cross-checked against the real code it describes and held up; Step 3's gate results are internally consistent with the repository's own scripts. Only two Minor, non-blocking wording/evidence-completeness notes remain, one of which is plan-mandated wording rather than an implementer error.
