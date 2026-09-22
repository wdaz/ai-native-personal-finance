### Spec Compliance

- ❌ **Issues found.** One binding constraint is not met, and it is plan-mandated: the brief's own test code breaks it and the implementer copied that code verbatim.
  - global-constraints.md:66-69 applies build-workflow's "never typed" rule like this: tests use "hand-built values chosen not to coincide with seed figures". Plan D12 (plan line 200) says the same: "hand-built amounts never equal a seed amount".
  - Several hand-built amounts do equal §4.3 seed figures. The details are under Important.
  - Everything else matches the brief and the spec:
    - **Files:** all 10 brief files were created and `src/domain/README.md` was replaced. I checked each file against the brief's text: every file matches, with no extra and no missing hunks.
    - **`budgetSpent`** (`src/domain/budgets.ts:11-22`) matches data-model.md:19: Σ |amount| of the category's negative transactions in the current UTC month.
    - **`recurringBills`** (`src/domain/bills.ts:30-51`) matches data-model.md:21 and US-27 AC2 (user-stories.md:175):
      - one row per exact `name` among the recurring transactions;
      - `day` comes from the most recent one;
      - paid means "any recurring transaction in the month on or before today", checked through `isInMonthUpTo`;
      - otherwise Due Soon when day ≤ today + 5, otherwise Upcoming.
    - **`billsSummary`** (`bills.ts:60-68`): Upcoming covers every bill not paid, so it includes Due Soon. That matches US-28 AC1's arithmetic ($190.00 + $194.98 = $384.98).
    - **`overviewSummary`** (`src/domain/overview.ts:41-65`) matches §2.3, §2.5, §6 and US-05/07 AC1:
      - pot and budget totals cover all rows;
      - `items` are the first four by `seq`;
      - the latest five come ordered as US-11;
      - the balance passes through unchanged (US-04 AC3).
    - **`latestTransactions`** (`src/domain/transactions.ts:9-23`) uses US-11 AC1's tie-break: full timestamp, then name.
    - **§2.7 empty dataset:** zeros and empty lists (`tests/unit/domain/overview.test.ts:19-27`).
- ⚠️ **Cannot verify from diff:**
  - **The §7 seed test belongs to Task 5.** §7 requires a test that "`overviewSummary(seed, clock)` equals the generated figures of 4.3 (order included)", which is Task 5's work. The same goes for the seed values of US-05/07/08 AC1 and US-27 AC3.
    - `tests/unit/domain/overview.test.ts:6-7` points to `tests/unit/seed-figures.test.ts`. That file does not exist at HEAD: I ran a glob for `tests/unit/seed-figures*` and it returned nothing.
    - The controller should confirm that Task 5 creates exactly that path.
  - **D1's premise is weakened by the schema.** D1 says T-09 can hand repository rows "straight in", with no second mapping.
    - `prisma/schema.prisma` stores money as `BigInt`: lines 60-62, 76, 88 and 101-102. `seq` is `Int` (lines 86 and 98).
    - So T-09 must convert every row's money fields to `number` before calling `overviewSummary`. The types would catch a missed conversion at compile time, so nothing fails silently.
    - This is a plan-level point, not a defect in this task. It is the controller's call whether D1's wording needs amending.
  - **Coverage ≥ 90 %** is T-13's gate and is not measurable here.

### Strengths

- **Calendar-day comparison for "paid".** `bills.ts:43` uses `isInMonthUpTo`, which compares UTC dates (`calendar.ts:32-33`). A payment at 23:59:59Z on the 19th therefore counts as paid, and `tests/unit/domain/bills.test.ts:33-36` pins that. An instant comparison against `today()` (00:00Z) would fail this test.
- **Real boundary tests:**
  - `budgets.test.ts:29-32` checks Jul 31 23:59:59.999Z, Sep 1 00:00Z and the same month of 2025.
  - `bills.test.ts:43-50` checks the Due Soon edge at day 24 against day 25.
  - `bills.test.ts:52-55` pins D5, where an unpaid earlier day counts as Due Soon.
- **Overview tests exercise the rules, not the input order.**
  - Pots and budgets arrive with shuffled `seq` (`overview.test.ts:35-63`).
  - A budget outside the first four (Education, `seq` 5) has spending, so "totals over all budgets" is really exercised (`overview.test.ts:46`, `:52`, `:55-56`).
- **Sums and input handling.**
  - Every sum goes through `sumCents`.
  - `latestTransactions` copies before sorting. `transactions.test.ts:51-58` checks both that the caller's rows come back (the `id` passes through) and that the input order is left alone.
- **`Intl.Collator("en")` choice is proven.** The tie-break uses it (`transactions.ts:3`), and `transactions.test.ts:27-34` shows why: code-unit order would put "Banana" before "apple".
- **Test counts are consistent with the report:** transactions 8 (6 `it` plus a 3-case `it.each`), budgets 5, bills 9 and overview 6, making 28 new tests.

### Issues

#### Critical (Must Fix)

None.

#### Important (Should Fix)

1. **Hand-built amounts coincide with §4.3 seed figures** (plan-mandated: the brief's verbatim code).
   - **What's wrong.** Even reading only §4.3's own table (overview.md:40-46), these hand-built values equal seed figures:
     - **$10.00, the New Laptop pot:** the factory default `amount: -1_000` (`tests/fixtures/domain.ts:15`). The factory's JSDoc at lines 3-4 even calls it "a bill of $10.00".
     - **$15.00, Entertainment spent:** `-1_500` (`tests/unit/domain/budgets.test.ts:11`, `:19`).
     - **$40.00, Personal Care spent:** `4_000` (`budgets.test.ts:20`).
     - **$50.00, Entertainment maximum:** `budget(1, "Dining Out", 5_000)` (`overview.test.ts:45`).
     - **$100.00, Personal Care maximum:** `-10_000`, asserted as `amount: 10_000` (`bills.test.ts:25`, `:29`).
     - **$120.00, Sun Park:** `-12_000`, asserted as `paid: 12_000`. This appears in `overview.test.ts:84` and `:90`, under a title citing the seed-data AC "US-08 AC1", and in `bills.test.ts:65` and `:71`.
   - **Supporting evidence from `prisma/data.json`:**
     - `-3_000` (`bills.test.ts:67`) and `3_000` (`overview.test.ts:48`) equal the seed's `-30.00` (data.json:149, :381).
     - `500` and `-500` (`overview.test.ts:36`, `:52`) equal `-5.00` (data.json:77).
     - `-1_000` also equals `-10.00` (data.json:85, :133, :309).
   - **Why it matters.** The global constraint and D12 exist so that "no test can be mistaken for a typed seed figure". `overview.test.ts:79-90` asserts $120.00 under a seed AC id, which is exactly that ambiguity.
   - **Nuance for the owner.** Strictly, build-workflow's verbatim sentence ("Any seed-derived figure … never typed") is not broken: these are invented inputs, not figures derived from the seed. What is broken is the plan's own binding gloss (global-constraints.md:66-69) and D12's stated guarantee.
   - **How to fix.** Either change the values or reword D12. Changing values is cheap: pick odd cent values that cannot occur in the seed (for example `-1_037`, `-1_513`, `12_345`) and update the expected sums. Rewording means narrowing global-constraints.md:68-69 and D12 to "asserted figures" and recording that in the plan. The owner decides.

#### Minor (Nice to Have)

1. **Test titles cite seed-data ACs they do not verify.**
   - `tests/unit/domain/overview.test.ts:35` cites "US-05 AC1" ($920.00 with seed data), `:42` cites "US-07 AC1" ($338 of $975) and `:79` cites "US-08 AC1" ($190 / $194.98 / $59.98). All three use hand-built data.
   - AGENTS.md's traceability rule wants each test to reference what it verifies. Here the titles over-claim, and this compounds Important #1.
   - Fix: cite the rule instead (for example "US-05 AC1's rule: all pots totalled, first four by seq"), or drop the AC id.
2. **The "most recent" pick is under-tested** (`tests/unit/domain/bills.test.ts:24-25`).
   - The input is ordered oldest to newest, so an implementation that takes the last-listed transaction would also pass.
   - The seed is newest-first and likely has constant amounts per vendor, so Task 5's seed test may not catch it either.
   - Fix: add a third, older entry after the newest one (for example Jul 2, Aug 3, Jun 2).
3. **"Paid by any transaction" is not distinguished from "paid by the latest"** (`bills.test.ts:33-36`).
   - Every paid case has a single transaction. A mutation to `isInMonthUpTo(latest.date, today)` would survive, although US-27 AC2 says "has a recurring transaction".
   - The seed can never reach the case because it has no dates after the 19th.
   - Fix: add a vendor with Aug 5 plus a later Aug 25 and expect "paid".
4. **Quadratic list building** (`src/domain/bills.ts:38`).
   - `byName.set(name, [...(byName.get(name) ?? []), transaction])` copies the vendor's whole list on every push. Harmless at seed size, but it is O(k²) per vendor.
   - Fix: `const list = byName.get(name); if (list) list.push(transaction); else byName.set(name, [transaction]);`.
5. **The type comment overstates what the domain accepts** (`src/domain/types.ts:4-5`).
   - It says "a repository row … is accepted as it is". Against `prisma/schema.prisma` (lines 60-62, 76, 88, 101-102), money arrives as `bigint`, so a raw row is not accepted. `src/domain/money.ts:20-22` already says the conversion happens at the repository edge.
   - Fix: reword to "a repository row, its money converted to number cents, with more fields …".
6. **Misleading test title** (`tests/unit/domain/transactions.test.ts:27`).
   - It says "ignoring case", but `Intl.Collator("en")` uses the default sensitivity `"variant"`. Case is a tertiary difference, not ignored: "apple" and "Apple" still compare unequal.
   - The assertion itself only checks primary letter order, so the title should say something like "A to Z as a reader would, not by code unit".

**Out-of-diff checks, each against a named risk:**
- **Consumed contracts:** read `src/domain/calendar.ts:28-33` (UTC year/month/day comparison), `src/domain/money.ts:26-38` (safe-integer amounts and running total) and `src/domain/clock.ts:17-25` (`today()` at 00:00 UTC). The new code uses them correctly.
- **Is the new fixture linted?** Grepped `eslint.config.mjs` for `fixtures` and found no ignore, so `tests/fixtures/domain.ts` is linted. `tests/fixtures/database.ts` sets the precedent for the folder.
- **Forward reference:** globbed `tests/unit/seed-figures*` and found nothing.
- **Seed collisions:** grepped `prisma/data.json` amounts and the budget and pot values (lines 3-5, 37-389, 404-451).
- **D1 and BigInt:** grepped `prisma/schema.prisma` for the money and `seq` types.
- **Spec text:** read `docs/03-specs/overview.md` in full, `docs/02-architecture/data-model.md:19,21`, and user-stories.md:35-63, 79-81 and 172-188.
- **Tests not run:** there is no shell here. The focused run I would use is `npx vitest run tests/unit/domain`.
- **Report output:** the implementer's reported output shows no warnings, and its 264 → 292 test count is consistent with the 28 tests added.

### Assessment

**Task quality:** Needs fixes

**Reasoning:** The arithmetic is correct and well tested against every spec line I could check (budgetSpent, recurringBills and its summary, overviewSummary, the US-11 ordering). But the brief's verbatim tests break the plan's binding "hand-built values not coinciding with seed figures" constraint in at least six places. One of them asserts the §4.3 $120.00 under a seed-data AC id. The owner has to decide whether to change the values or amend D12 before this gate passes.
