# Report — recurring-bills review 1 (T-15d S3)

As returned by the read-only Opus reviewer for commit 53b2d02c62304c835ca3ae999220ad29bc32d837.

**Fact check of `docs/03-specs/recurring-bills.md` Draft v0.2** (worktree `wf_ca2e2077-bdb-2`, commit `53b2d02`)

No blockers. One important finding and seven minor ones. Every seed figure matches `output.txt`.

**1. important: `billsSummary` gives no counts and no Total Bills (2.4, 2.11, 4.2)**
- Spec text: "builds the bills with `recurringBills(transactions, clock)` and the totals with `billsSummary`". 4.2 adds: "**The bills, statuses and totals are repository code**".
- Source: `src/domain/bills.ts:55,62-70`. `billsSummary` returns only `{ paid, upcoming, dueSoon }` in cents. It has no count and no Total Bills.
- In `figures.ts:41-48` the four counts and `total = s.paid + s.upcoming` are written by hand.
- The DTO in 2.11 needs `{ count, amount }` four times. That is new code, and the spec does not name it.
- Fix: say where the counts and the total are computed (extend `billsSummary`, or `toRecurringBillsDto`) and add it to §7. Change 4.2's wording to "the bills, statuses and the three cent sums are repository code; the counts and the Total Bills sum are the script's".

**2. minor: some 4.4 boundaries are already tested (§7, Unit — domain row)**
- Spec text: "plus the boundaries of 4.4 not yet covered (day 24 and 25, day 31, a recurring income)".
- Source: `tests/unit/domain/bills.test.ts:43-49` already tests day 24 → dueSoon and day 25 → upcoming. Lines 33-41 and 51-54 also cover 23:59:59Z, 20 Aug and 10 Jul.
- Fix: "not yet covered (day 31, a recurring income)".

**3. minor: the shell's tab order is not the same at every width (2.13)**
- Spec text: "After the shell's own order — the skip link …, the five navigation items, the footer controls — Tab visits: the search field".
- Source: `tests/e2e/app-shell-keyboard.spec.ts:93-109`. At 375 px the order is skip link → reset banner "Dismiss notice" → header "Log out" → the five bottom-bar items. The banner's stop is missing from the spec, and the nav does not come first on a phone.
- `transactions.md` 2.11 has the same wording.
- Fix: name the reset banner's stop and say the shell order depends on the width (`app-shell.md`). Do not state one fixed sequence.

**4. minor: "Contrast pairs" cannot be checked (2.6)**
- Spec text: "`--color-red`, 4.73:1 on white, output.txt and the style guide's 'Contrast pairs'".
- Source: no "Contrast pairs" in `design-tokens.md`. The handling file's live re-read records only the style guide's Accessibility, Tooltip and Shadow sections.
- 4.73 itself is correct (`output.txt:150`, and I recomputed it).
- Fix: cite the section that was actually read, or add it to the "Design re-read (live)" table.

**5. minor: design values the spec states that are not in the "Design re-read (live)" table**
- 2.6: "which sit 11 px apart" and "20 px between the heading and the rows".
- 2.9: the list card's "padding 32 px (24 px 20 px below 768 px), a 24 px gap"; the row avatar at 32 px; below 768 px, "the avatar (32 px) and the name, 16 px apart".
- 2.13: "two columns, 24 px apart" and "(24 px gap, …)".
- The table (handling file lines 48-69) has no row for any of these, so they cannot be checked against the re-read.
- Fix: add rows to the table, or mark these values as not re-read.

**6. minor: one section number is wrong in a 2.14 row**
- Spec text: "a 44 px tap target named 'Sort by: {current}' | `--tap-target-min`; `transactions.md` 2.8".
- Source: the 44 px icon trigger is `transactions.md:103` (section 2.9). Section 2.8 (line 92) has only the name pattern.
- Fix: cite "`transactions.md` 2.8, 2.9".

**7. minor: NFR header rows**
- The header keeps "W3–W7". W5 (`non-functional-requirements.md:30`) is about destructive `delete_*` tools and does not apply to a read-only page.
- v0.1.1 dropped NFR-A8 because "the body never uses" it. But 2.13 and 4.6 check "no horizontal scroll" at 320 px, which is A8's second clause (`non-functional-requirements.md:47`).
- Fix: write "W3, W4, W6, W7" and put A8 back, or say why it is left out.

**8. minor: RB-Q5 leaves out its strongest source**
- Spec text: "US-39 AC3 lists the tools that must carry it … and does not name `list_recurring_bills`".
- Source: R-24 (`docs/01-requirements/reviews/2026-09-13-adversarial-review.md:38`) reads "Missing `untrustedContentHint` on list tools … Add. Fix · applied". It covers list tools in general. 2.12 already cites R-24.
- Fix: cite R-24 in RB-Q5 as support for option (a).

**Claim groups found fully correct**
- **Group 1:** every file, symbol and line number holds. This includes `recurringBills`, `billsSummary`, `DUE_SOON_DAYS`, `BillStatus` and the missed-day comment; `fixedClock` and `BUSINESS_TODAY`; `Intl.Collator('en')`; `getOverview`; the six variants with few-transactions keeping 3; `billsNoResults` and `retry`; `PAGE_NAMES.recurringBills`; the three hand-written labels in `BillsCard.tsx`; `toErrorIssues` throwing; `http.ts` setting no Cache-Control; the eslint layer rules; `defineTool`, 200, `apiGet`, `X-Via` and `PAGE_TOOLS`; the placeholder page; the 8 avatar files; and every cited test line.
- **Group 2:** every token value, the Component states, the focus indicator, presets 1/3/4/5 and the Phosphor icons.
- **Group 3, apart from finding 7:** all the US ACs, the copy appendix row, R-01/07/09/10/23/24, OQ-4, and the `data-model.md` lines (`sortBills`, `?q&sort`, name at most 60).
- **Group 4, apart from finding 6:** `transactions.md`, `write-path.md`, `overview.md`, `webmcp-tools.md` and `reset-and-test-support.md` say what the spec says. The H3, H9, H12 and H14 rows match what the spec defers.
- **Group 5, apart from the wording in finding 1:** every figure, row and order in 2.6, §3 and 4.2–4.6 matches `output.txt`. That covers Aqua before Spark in Highest and Lowest, the names without an "a", 0 bills for few-transactions, 4.73 and 4.95, and 192 characters (I recounted it). `figures.ts` imports exactly the repository functions its README names.
