# T-03 final review — the fix wave (M1–M6)

Source: `final-review.md` in this folder (section "Minor — fix before merge"). Controller rulings
R13–R15 (in `progress.md`) decide the details below; where this file and the review differ, this
file wins. Six items, two commits. Nothing else changes.

## Commit A — `docs/03-specs/backlog.md` (still v1.8: these correct the v1.8 edits before merge)

1. **M2 — one `BigInt` instruction in the T-09 row (line 18).** The row now says both "`BigInt`
   money becomes `Number` at the DTO edge" (T-02's clause) and "`BigInt` converted to `Number`
   first (`sumCents` refuses anything else)" (T-03's clause). Only the second works:
   `overviewSummary` runs between the repository and the DTO. Change T-02's clause so it says the
   conversion happens **at the repository edge, before `overviewSummary`**, keeping the rest of
   T-02's clause as it is; keep T-03's clause, and append to it (inside the same "**from T-03:**"
   text): `; DTO dates via `toISOString()`; transactions and budgets must use the same category
   spelling — `budgetSpent` compares categories with `===`, and a mismatch shows only as $0 spent`.
2. **M1 (backlog half) — `seedFigures()` row shape, in the T-09 and T-10 rows.** Append to each
   row's "**from T-03:**" text: `; `seedFigures()` rows keep data.json's avatar path, hex theme
   and display category name — map them (`avatarKey`, `themeFromHex`, `CATEGORY_BY_NAME` in
   `src/server/seed.ts`) or compare money, names and order only`. Do not add anything to the
   T-04 row for this (ruling R14).
3. **M4 — T-04 row (line 13).** Drop the clause "repoint the boundary fixtures that import
   `src/shared/README.md`" (with its joining punctuation): no fixture imports it
   (`grep -rn "shared/README" tests/` → nothing). Nothing else in the row changes.
4. **M5 — T-13 row (line 22).** "prints parse errors on every run" → "prints parse errors on
   every coverage run".
5. **M3 — changelog (line 4).** In the v1.8 entry, the sentence "Every hand-off the T-03 plan
   addresses to a later task sits in that task's row, as in v1.7: …" overclaims (the plan also
   has T-04, T-12 and Release 2 notes that are not in rows). Change its opening to "The T-03
   hand-offs for T-05, T-08, T-09, T-10 and T-13 sit in those rows, as in v1.7: …" and keep the
   rest of the sentence. If items 1–4 change what a row says in a way the changelog should name,
   add at most one short clause to the v1.8 entry (e.g. "T-09's `BigInt` conversion moves to the
   repository edge"); no other changelog change.

Commit subject: `docs(backlog): v1.8 corrections from the T-03 final review — one BigInt instruction for T-09, seedFigures() row shape, stale T-04 clause`

## Commit B — `scripts/seed-figures.ts` and `tests/unit/seed-figures.test.ts`

6. **M1 (code half) — the JSDoc of `seedOverviewInput` (`scripts/seed-figures.ts`, ~lines
   15–18).** It says "tests/unit/seed-figures.test.ts checks the two agree". Make it say what is
   true: the test checks names, money, dates, categories (mapped) and recurring flags agree with
   `src/server/seed.ts`; the rows keep data.json's avatar path, hex theme and display category
   name, where the database stores the avatar key and the `Theme`/`Category` enums. Comment only.
7. **M6 — two test titles in `tests/unit/seed-figures.test.ts`.**
   - The test titled "has the same budgets and pots, with seq in the order the database assigns
     it" builds its expected `seq` with the same `i + 1` formula as the script: retitle it to
     "has the same budgets and pots, with seq 1…n in file order". No assertion change.
   - The test titled "computes the Overview on the business day, 19 Aug 2026" asserts nothing that
     depends on the clock. Keep its two assertions and add one that does (ruling R15): the same
     input on another day gives other bills, e.g.
     `expect(overviewSummary(seedOverviewInput(), fixedClock("2026-09-19")).bills).not.toEqual(figures.bills);`
     (import `overviewSummary` from `@/src/domain/overview` and `fixedClock` from
     `@/src/domain/clock`). Keep the title, or make it "…19 Aug 2026 — another day gives other
     bills". Test count unchanged (341).

Commit subject: `test(scripts): seed-figures titles claim only what they check; the business-day test depends on the clock (T-03 final review)`

## Gates

`npx prettier --check docs/03-specs/backlog.md scripts/seed-figures.ts tests/unit/seed-figures.test.ts`
(if `--write` is needed, only your edited lines may change — check with `git diff`), then
`npm run lint && npm run typecheck && npm test` → Vitest 341/341 (18 files). Add a RED/GREEN
check for the new assertion: temporarily change `"2026-09-19"` to `"2026-08-19"`, run
`npx vitest run tests/unit/seed-figures.test.ts`, see it fail, restore, see 8/8 pass — report
both outputs. Do not commit the temporary change.
