### Spec Compliance

- ✅ Spec compliant. Every file the brief lists has its hunk, and the content matches the brief verbatim:
  - `scripts/seed-figures.ts:1-103`
  - `tests/unit/seed-figures.test.ts:1-114`
  - the three fixtures
  - `package.json:29`
  - `docs/03-specs/overview.md:3,4,34,36,43`
  - `README.md:88`
  - `scripts/README.md:9-14`
  - `tests/fixtures/README.md:5-8`
- ✅ The overview.md amendment stays inside the owner's plan-gate answers 4 and 5:
  - the Intl sample is gone and the fixed Jan…Dec table replaces it, with UTC kept (`overview.md:34`);
  - the per-budget amounts are now `$15.00` (`overview.md:43`);
  - status and changelog are at v1.1 (`overview.md:3-4`).
  - Nothing else in the file changed.
- ✅ §4.3 and §7 ("equals … order included") are enforced by `tests/unit/seed-figures.test.ts:45-47`. That test compares the spec's cells with `workedExample(overviewSummary(seed, fixedClock(BUSINESS_TODAY)))`, row order included.
- ⚠️ Owner answer 6 (backlog v1.8 and the ADR-0005 clarification line) is not in this diff. The controller should confirm both land elsewhere in this PR.
- ⚠️ Commit `e3eca6a` alone leaves `seed-figures.test.ts:45` red until `9c5e8c5`. This is already ruled on; noted only for bisect awareness.

Checks run (named risk → what I checked):
- **ADR-0002 scripts boundary.** `seed-figures.ts:1-7` imports only `src/domain`, `src/shared` and `@/prisma/data.json`. The ADR's "only" concerns code layers, and backlog T-03 requires reading `data.json`. Lint passed per the report. Not a finding.
- **`import.meta.main` needs Node ≥ 24.2** (`seed-figures.ts:101`). `package.json:7` has `>=26`, `.nvmrc` has `26`, and `.github/workflows/ci.yml:23,66,106` use `node-version-file: .nvmrc`. Safe in CI.
- **`seq = index + 1` must match the database.** `src/server/reset.ts:42-51` runs `TRUNCATE … RESTART IDENTITY` and then `createMany` in file order, and `prisma/schema.prisma:86,98` has `@default(autoincrement())`. The claim holds.
- **Changelog citation "SPEC-app-shell §2.6 '12 Sep 2026'".** Verified at `docs/03-specs/app-shell.md:16`.
- **Stale `Intl` mandates left in other specs.** Grepping `docs/`, the only remaining mention is in `docs/03-specs/reviews/2026-09-20-adversarial-review.md:25`, which is historical. `src/shared/dates.ts:4` mentions Intl only in a comment explaining why it is not used.
- **v1.1 Dates row vs the code** (the §4.3 test cannot catch this, since every seed date is in August). No leading zero is pinned at `tests/unit/shared/dates.test.ts:28` ("2 Jul 2026"), and "Sep" at `:40` and `:50`.
- **`tests/fixtures/README.md:6` names `domain.ts`.** `tests/fixtures/domain.ts` exists.
- **README row alignment.** `README.md:88` has pipes in the same columns as the `db:reset` row.

### Strengths

- The parser compares trimmed cells, not bytes (`seed-figures.test.ts:21-38`). Table alignment or Prettier reflow of the spec therefore cannot cause false failures. Backticks, `$` and order inside a cell are still significant, which is exactly what the pre-amendment red run proved.
- The violation fixtures make a strong claim. `seed-figures.test.ts:51` and `:56-58` assert that exactly one named row differs, not just that something differs. This also proves every other row of a spec-shaped table parses identically to the generator.
- The no-worked-example fixture plus the throw (`seed-figures.test.ts:32,61-65`) closes the silent empty-equals-empty pass.
- The subprocess test (`seed-figures.test.ts:67-74`) goes through `npm run --silent seed:figures`, so a wrong script name or path in `package.json:29` fails the suite. Its second assertion round-trips the printed output through the same parser.
- The ADR-0002-forced re-derivation of rows is guarded by a cross-check against T-02's `seedRows()` (`seed-figures.test.ts:77-106`), not left to trust.
- The implementer's report is honest about the per-file coverage table it could not produce, and about the 341-vs-340 count.

### Issues

#### Critical (Must Fix)
None.

#### Important (Should Fix)
None.

#### Minor (Nice to Have)

1. **The seed-agreement check skips `avatar` and `theme`, so the doc comment overclaims.**
   - `scripts/seed-figures.ts:17` says "tests/unit/seed-figures.test.ts checks the two agree". But `seed-figures.test.ts:81-94` and `:96-102` never compare `avatar` or `theme`, and the two sources do not agree on them:
     - the script keeps data.json's raw avatar path (`seed-figures.ts:29`), hex theme (`:39`, `:47`) and display category name (`:30`, `:37`);
     - `src/server/seed.ts:122,123,129,131,137` stores the avatar key, the `Theme` enum and the `Category` enum.
   - `src/domain/overview.ts:23` passes avatars and themes through into `seedFigures()`.
   - Why it matters: the brief names T-09 and T-10 as consumers of `seedFigures()`. A test that compares the DTO against it directly will mismatch on `avatar`, `theme` and `category`.
   - Fix, either or both:
     - Extend the agreement test to map through `avatarKey` and `themeFromHex` from `src/server/seed.ts`, which tests may import, and compare those fields too.
     - Reword `seed-figures.ts:17-18` to say `seedFigures()` keeps data.json's avatar path, hex theme and category name.

2. **The seq assertion is tautological. Plan-mandated.**
   - `seed-figures.test.ts:103-106` builds its expected values with the same formula as the implementation (`i + 1` vs `index + 1` at `seed-figures.ts:34,41`). It never consults how the database assigns `seq`, yet the test title (`:96`) claims "in the order the database assigns it".
   - The claim is true (`src/server/reset.ts:42-51`), so no behaviour is wrong; the test just does not prove it.
   - Fix: reword the title to "seq 1…n in file order". Leave the database side to T-09's API test.

3. **The "business day" test does not depend on the clock. Plan-mandated.**
   - `seed-figures.test.ts:109-113` is titled "computes the Overview on the business day, 19 Aug 2026". It asserts only `transactions` length 5 and pot seqs `[1,2,3,4]`, which hold for any clock.
   - NFR-D1 is actually pinned by `:45-47`, because the Bills and Budgets-spent rows depend on the current month.
   - Fix: either assert a month-dependent value, e.g. that `seedFigures()` differs from `overviewSummary(seedOverviewInput(), fixedClock("2026-09-19"))` in `bills` or `budgets.spent`, or retitle the test to what it checks.

4. **Structural duplication of the seed-row mapping.**
   - `seed-figures.ts:20-49` parallels `src/server/seed.ts:113-140`. Only the balance block is verbatim (`seed-figures.ts:22-26` vs `seed.ts:115-119`); the other blocks differ by design (Date vs ISO text, raw vs enum).
   - ADR-0002 forces the split, and the agreement test guards drift for every field except those in item 1, so this is not the blocking verbatim-logic case.
   - Fix (optional, later): move the pure dollars→cents / +2-years conversion into `src/domain`, so both callers share it.

5. **The fixtures are hand-copied from §4.3, so every legitimate amendment must edit them in lockstep.**
   - `tests/fixtures/seed-figures/gift-forty.md.fixture:6-14` and `latest-by-day.md.fixture:6-15` repeat all seven §4.3 rows.
   - Any future legitimate §4.3 change (a format or seed change) must edit both fixtures in lockstep. Otherwise `seed-figures.test.ts:51` and `:56` fail, and their row lists will not point at the real cause.
   - Fix (optional): derive each violation in the test by applying a single substitution to the spec's own parsed table (e.g. Gift `$110.00`→`$40.00`). The fixture files would then stay as documentation only.

6. **`differingRows` only walks the first table's rows** (`seed-figures.test.ts:41-42`). Rows present only in the second argument are never reported. This is harmless for today's fixtures, which have the same row count, but a row-count mismatch would be under-reported.
   - Fix: also compare lengths, or iterate over `Math.max(a.length, b.length)`.

7. **Noise in the reported coverage run: three "Failed to parse … README.md" errors** (report, `test:coverage` section). They are pre-existing (F2, deferred to T-13) and not introduced by this task; listed here so the final review collects them.

8. **The v1.1 spec example `2026-09-01T00:00:00Z` → `1 Sep 2026` (`overview.md:34`) is not pinned verbatim by any test.** Its properties are pinned separately (`tests/unit/shared/dates.test.ts:28,50`).
   - Fix (optional): add the example as a `dates.test.ts` case, so the spec's own example is executable.

### Assessment

**Task quality:** Approved

**Reasoning:** The script, test, fixtures, package script, spec v1.1 and three README edits match the brief verbatim and stay within the owner's plan-gate answers. The §4.3 table is enforced cell-for-cell, in order, with fixtures proving that a wrong value, a wrong order and a missing table are each caught. The remaining items are test titles that claim more than their assertions check, and one incomplete agreement check (`avatar` and `theme`) that later consumers of `seedFigures()` should know about.
