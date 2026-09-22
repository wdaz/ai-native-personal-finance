### Finding Verdicts

- **M1 — `seedFigures()` rows not shaped like the database's rows; JSDoc overclaims** — ADDRESSED.
  - Backlog half (findings item 2): `docs/03-specs/backlog.md` T-09 row and T-10 row each gained the verbatim clause `; \`seedFigures()\` rows keep data.json's avatar path, hex theme and display category name — map them (\`avatarKey\`, \`themeFromHex\`, \`CATEGORY_BY_NAME\` in \`src/server/seed.ts\`) or compare money, names and order only`. Confirmed present in both rows in the diff. `avatarKey` (seed.ts:105), `themeFromHex` (seed.ts:68) and `CATEGORY_BY_NAME` (seed.ts:80) all exist as named. Per ruling R14, the T-04 row is untouched by this clause (diff shows only the fixture-repoint sentence removed from T-04, nothing added) — correct.
  - Code half (findings item 6): `scripts/seed-figures.ts` JSDoc (~lines 14-19 post-fix) now reads "checks that names, money, dates, categories (mapped) and recurring flags agree with `src/server/seed.ts`; the rows keep data.json's avatar path, hex theme and display category name, where the database stores the avatar key and the `Theme`/`Category` enums." This is comment-only (no function-body change in the diff) and matches what the test actually checks (verified against `tests/unit/seed-figures.test.ts:83-96`, which maps categories via `CATEGORY_BY_NAME.get(...)` before comparing).

- **M2 — Backlog T-09 row gives two conflicting `BigInt` instructions** — ADDRESSED. `docs/03-specs/backlog.md`, T-09 row: T-02's clause now reads "`BigInt` money becomes `Number` at the repository edge, before `overviewSummary`" (was "at the DTO edge"); T-03's clause is kept unchanged and extended with "; DTO dates via `toISOString()`; transactions and budgets must use the same category spelling — `budgetSpent` compares categories with `===`, and a mismatch shows only as $0 spent" — verbatim per the findings file. The two clauses now agree (both point to the repository edge, before `overviewSummary`); no residual contradiction.

- **M3 — v1.8 changelog overclaims** — ADDRESSED. `docs/03-specs/backlog.md` line 4: opening changed from "Every hand-off the T-03 plan addresses to a later task sits in that task's row, as in v1.7: …" to "The T-03 hand-offs for T-05, T-08, T-09, T-10 and T-13 sit in those rows, as in v1.7: …", exactly as specified. One short clause was appended at the end of the same sentence — "T-09's `BigInt` conversion moves to the repository edge." — within the findings file's "at most one short clause" allowance, and accurately describes the M2 fix. No other changelog text changed.

- **M4 — Backlog T-04 row asks for a fixture repoint already done** — ADDRESSED. `docs/03-specs/backlog.md` T-04 row (was line 13): the clause "repoint the boundary fixtures that import `src/shared/README.md` at the real shared modules" is fully removed, with its leading `;`, leaving a clean cell ending "…arrived in T-03) | NFR-Q2, …". Independently verified: `grep -rn "shared/README" tests/` in the current worktree returns no matches, confirming the premise the removal rests on.

- **M5 — Backlog T-13 says coverage errors print "on every run"** — ADDRESSED. `docs/03-specs/backlog.md` T-13 row: "prints parse errors on every run" → "prints parse errors on every coverage run", the only change in that cell.

- **M6 — Two seed-figures test titles claim more than they check** — ADDRESSED.
  - `tests/unit/seed-figures.test.ts:98`: title retitled from "has the same budgets and pots, with seq in the order the database assigns it" to "has the same budgets and pots, with seq 1…n in file order"; assertions below (lines 99-108) are byte-identical to before — no assertion change, as required.
  - `tests/unit/seed-figures.test.ts:111-118`: title extended to "…19 Aug 2026 — another day gives other bills"; the two original assertions are kept, and a new assertion was added: `expect(overviewSummary(seedOverviewInput(), fixedClock("2026-09-19")).bills).not.toEqual(figures.bills);`, with `fixedClock` imported from `@/src/domain/clock` and `overviewSummary` from `@/src/domain/overview` (both present at the top of the file). `BUSINESS_TODAY` (`src/domain/clock.ts:9`) is `"2026-08-19"`, confirming the report's RED run (temporarily setting the new assertion's date to `"2026-08-19"`) genuinely collided with `seedFigures()`'s own clock and produced the reported failure (`AssertionError: … to not deeply equal`, "Compared values have no visual difference") — this is real evidence the new assertion depends on the clock, not a tautology. Test count is unchanged (8 tests in the file, 341 total, one `expect` added inside an existing `it`).

### New Breakage in the Fix Diff

None. Specifics checked:
- The diff touches exactly the three named files (`docs/03-specs/backlog.md`, `scripts/seed-figures.ts`, `tests/unit/seed-figures.test.ts`); no production/domain code changed (`scripts/seed-figures.ts`'s only change is a comment block).
- Cross-checking against the full-context diff: every other line/row in `backlog.md` (Status line, T-01/T-02a/T-02/T-03/T-05/T-06/T-07/T-08/T-11/T-12/T-14/T-15/T-16 rows, Notes) appears as pure context — nothing outside the six named findings' lines changed.
- The two appended clauses on the T-09 row (M2's DTO-dates/category-spelling text, then M1's `seedFigures()` text) join cleanly with `;` separators and close the table cell correctly — no dangling fragment, no doubled punctuation.
- The new test imports `@/src/domain/clock` and `@/src/domain/overview` from a `tests/**` file: checked `eslint.config.mjs`'s `boundaries/elements` — `tests` is allowed to import `domain` (`anyOf: ["tests","app","domain","shared","server","webmcp","ui","scripts"]`), so this does not violate ADR-0002/the lint boundary rule, consistent with the report's claimed lint pass (exit 0).

### Out-of-Scope Observations

None. Nothing new surfaced outside the fix diff during this review; the ledger's existing deferred items (M7, and the final review's "Unverified observations" a–d) are unaffected by this fix wave.

### Verdict

**Fix round:** All findings addressed, no new Critical/Important breakage.
