**Reviewing:** T-03 Task 3 fix round 1 (ea103d1..b727929), against the two findings under verification (Important #1, Minor #1/R11), using the fix diff, the fix report entries, `tests/fixtures/domain.ts`, `tests/unit/domain/{bills,budgets,money,overview}.test.ts` (current state), `prisma/data.json`, `docs/03-specs/overview.md` §4.3, and `seed-amounts.mjs`.

### Finding Verdicts

1. **Hand-built amounts coincide with §4.3 seed figures (Important, plan-mandated D12/R10)** — ADDRESSED.
   - Every flagged literal was replaced with a non-round value that does not appear in `prisma/data.json` or SPEC-overview §4.3: `tests/fixtures/domain.ts:15` (`-1_000`→`-1_037`, JSDoc updated to "$10.37"), `bills.test.ts:7,25,29,65,67,71` (`-1_000`/`-10_000`/`-12_000`/`-3_000`→`-1_037`/`-10_037`/`-12_419`/`-3_219`, with `billsSummary` recomputed to `{paid:12_419, upcoming:3_996, dueSoon:777}`), `budgets.test.ts:11,14,19,20,22` (`-1_500`/`4_000`→`-1_537`/`4_219`, recomputed to `1_787` and `1_537`), `overview.test.ts:9,36,38,45–48,52,55–56,83,90` (balance `100_000`→`100_037`; pot `500`→`537` with total recomputed to `1_537`; all four non-Bills budget maxima `5_000`/`1_000`/`2_000`/`3_000`→`5_037`/`1_019`/`2_231`/`3_143` with `limit` recomputed to `71_430` and Education txn `-500`→`-563` with `spent` recomputed to `13_063`; Power `-12_000`→`-12_071` with bills recomputed to `{paid:12_071, upcoming:777, dueSoon:777}`), and `money.test.ts:7` (Task 2's `-2_000`→`-2_119`, sum recomputed `12_345 − 2_119 + 7 = 10_233`).
   - I independently recomputed every changed expected value by hand from its inputs — all match. I also cross-checked the new literals against `prisma/data.json`'s balance/transaction/budget/pot amounts and every `NNN.NN` figure in §4.3 (with or without `$`, e.g. "Personal Care 40.00"): none collide. The implementer's own tool run (`seed-amounts.mjs`, now scanning bare figures too) independently confirms "no collisions" over the full final literal set.
   - Values correctly left unchanged (`-250`, `-900`/`-800`/`-700`/`-600`, `-300`/`300`, `-9_000`, `-777`, `50_000`, `20_000`, `60_000`, `-12_500`) were verified not to collide either.
   - Test intent, boundary dates, `seq`, days, statuses and test count (292/292 before and after) are unchanged — only money literals moved.

2. **Test titles cite seed-data ACs over hand-built data (Minor #1, folded in by R11: overview.test.ts "US-05 AC1"/"US-07 AC1"/"US-08 AC1", bills.test.ts "US-28 AC1")** — ADDRESSED.
   - `overview.test.ts:35` → `"...(US-05 AC1's rule)"`, `overview.test.ts:42` → `"...(US-07 AC1's rule)"`, `overview.test.ts:79` → `"...(US-08 AC1's rule)"`, `bills.test.ts:61` → `describe("billsSummary (SPEC-overview §2.6, US-28 AC1's rule)", ...)`. All four now name the rule, not the seed-figure AC.

### New Breakage in the Fix Diff

None. No production file (`src/domain/*.ts`) was touched — confirmed by the diff's file list (`tests/fixtures/domain.ts`, `tests/unit/domain/{bills,budgets,money,overview}.test.ts` only). No test added or removed. No boundary date, `seq`, day, or status assertion changed — only money literals and the four titles.

### Out-of-Scope Observations

- Original review Minor #2 ("most recent" pick under-tested, `bills.test.ts:21-30`), #3 ("paid by any transaction" vs "paid by latest", `bills.test.ts:33-36`), #4 (quadratic list build, `src/domain/bills.ts`), #5 (types.ts comment overstates BigInt handling), and #6 (misleading "ignoring case" title, `transactions.test.ts:27`) were not in this fix round's scope (R10/R11 named only Important #1 and the four AC-citing titles) and remain open, unmodified by this diff. Non-blocking; ledger for the final review.
- `overview.test.ts:19`'s empty-dataset test still cites four ACs ("US-05 AC2, US-06 AC3, US-07 AC2, US-08 AC3") alongside genuinely spec'd empty-state behavior (not hand-built numeric claims) — the implementer's report notes this was deliberately left out of R11's scope since it doesn't assert a specific dollar figure. Consistent with R11 as described; not a defect.

### Verdict

**Fix round:** All findings addressed, no new Critical/Important breakage.
