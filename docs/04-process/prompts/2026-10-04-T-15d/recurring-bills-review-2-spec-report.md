# Report — recurring-bills review 2 (T-15d S3)

Home paths in this report are written as `~/…` (the repository's home-path rule); nothing else was changed from the reviewer's text.

As returned by the read-only Opus reviewer for commit 53b2d02c62304c835ca3ae999220ad29bc32d837.

**Review 2 of `recurring-bills.md` Draft v0.2 against the spec brief (commit 53b2d02, worktree `wf_ca2e2077-bdb-2`): two important findings and eight minor ones; checks A–F are listed after them**

All paths below are under `~/Own/ai-native-personal-finance/.claude/worktrees/wf_ca2e2077-bdb-2/`.

## Findings

**1. Important (C, E): what RB-Q4 (a) promises is not built into the DTO or the tool.**
- The spec says, in RB-Q4 (a): "its output always carries the summary with "upcoming = every unpaid bill"". In 2.11 it gives `upcoming: { count, amount }, // Total Upcoming: every bill not paid (includes due soon)`. The tool description in 2.12 reads "…with status (paid, dueSoon, upcoming) and the totals…".
- The problem: the output uses the key `summary.upcoming` for 4 bills, while the filter `status: "upcoming"` returns 2 rows. Nothing the agent receives says the two meanings differ, so (a) leaves the very ambiguity RB-Q4 is about. The description is 192 of 200 characters, so there is no room to explain it there (`output.txt:147`).
- Fix: rename the summary key (for example `unpaid` or `totalUpcoming`) in 2.11, 2.12 and the RB-Q4 (a) text, or drop the promise from RB-Q4 (a).

**2. Important (F): no source is given for the summary's counts and total.**
- The spec says, in 2.4: "builds the bills with `recurringBills(transactions, clock)` and the totals with `billsSummary`". The DTO in 2.11 has `total`, `paid`, `upcoming` and `dueSoon`, each as `{ count, amount }`.
- `src/domain/bills.ts:55-70`: `billsSummary` returns amounts only, `{ paid, upcoming, dueSoon }`, with no counts and no total. Overview's DTO uses it (`src/domain/overview.ts:63`).
- The problem: the build agent has to guess between changing `billsSummary`, which would change the approved Overview DTO and `get_overview_summary`, and adding something new. NFR-T1 wants this logic as tested domain functions.
- Fix: name a new pure domain function (for example `billsTotals`, with counts and the total) and say that `billsSummary` and Overview stay unchanged.

**3. Minor (F): the spec does not say where the list of statuses lives.**
- The spec says, in 2.11: "`status` uses the domain's spelling (`BillStatus`, `src/domain/bills.ts`), the same value the tool takes as input".
- `eslint.config.mjs:100-101` and `108-109`: `shared` may import only `shared`, and `webmcp` only `webmcp` and `shared`. So neither `RecurringBillsDtoSchema` nor the tool's `z.enum` can import `BillStatus`.
- The problem: without a stated home, the list risks being written twice (NFR-Q2).
- Fix: put `BILL_STATUSES` in `src/shared` in 2.1, and derive the domain type from it.

**4. Minor (D): the 2.14 intro claims no row changes what the design draws, and some rows do.**
- The spec says: "none changes what the design draws, except where §9 asks."
- Three rows do change what is drawn:
  - Search hover border grey-900 → grey-500. The handling file's "Design re-read (live)" table, "hover still grey-900", confirms the live design still draws grey-900.
  - The full stop is removed from "No bills match your search."
  - The 20 px Sort button becomes a 44 px tap target.
- These follow approved documents (the tokens, the copy appendix, `--tap-target-min`), but the sentence is false as written.
- Fix: reword it to "…except where §9 asks or an approved document (the tokens, the copy appendix) differs from the design". Or, under the D14 lesson, ask the hover colour as an RB- question.

**5. Minor (C, F): the separator before the hidden status word is not specified.**
- The spec says, in 2.9: "a screen reader reads "Monthly - 21st, Due soon"", while the hidden texts are just "Paid", "Due soon" and "Upcoming".
- The problem: as an adjacent `span`, the cell's text becomes "Monthly - 21stDue soon". Some screen readers run the two together, and the component and E2E assertions in §7 cannot be written exactly.
- Fix: specify the markup, for example a space before the visually hidden span, and state the cell's exact accessible text.

**6. Minor (F): the toolbar below 768 px contradicts itself.**
- The spec says, in 2.9: "the search field on the left (… the full row below 768 px) … Below 768 px the field never gets narrower than 160 px beside the icon button".
- The problem: "the full row" and "beside the icon button" disagree. It is also not said what happens if 160 px does not fit; `transactions.md` 2.9 says the button wraps.
- Fix: write "the rest of the row beside the 44 px Sort button", and state the wrap rule or show that it cannot happen at 320 px.

**7. Minor (A: L7, B): three acceptance criteria are not covered in §7.**
- US-38 AC1, "Tools are registered only after login; leaving a page unregisters its tools" (`user-stories.md:236`), has no assertion in the WebMCP row.
- US-34 AC2 (disabled controls) is not marked "not applicable".
- The spec states in 2.3 that "A refused call changes nothing", but no row tests it, whereas the `transactions.md` §7 WebMCP row asserts the page is unchanged.
- Fix:
  - Add "client navigation away from `/recurring-bills` → 0 tools" to the WebMCP row.
  - Add "US-34 AC2 — not applicable: no disabled control" to the H9 line.
  - Add "the page is unchanged after a refused call" to the WebMCP row.

**8. Minor (A: H14 completeness, F): the order of the build tasks and a conditional story change are left implicit.**
- RB-Q8 (c) says "US-30 AC1 … would change, an amendment you approve", but H14 (3) mirrors only RB-Q3 (a).
- §6 says "`src/ui/Menu.tsx`, `src/ui/TruncatedText.tsx` (both from the Transactions build)" and "`ResultsRegion` or the Transactions one if it is shared by then". So the build relies on the Transactions build without saying it must come first. That build also brings `--shadow-popover`, the "{label}: {current}" copy entry and the sort labels (H11).
- The "Tests that change when the placeholder goes" list leaves out `tests/e2e/webmcp.spec.ts` and the `webmcp-tools.md` §7 check, "polyfill · 0 on a placeholder page". Under H11 (4), that check may move to `/recurring-bills`.
- Fix:
  - Add H14 (4): if RB-Q8 is answered (c), US-30 AC1 is amended in the spec's pull request.
  - State that the Recurring Bills build follows the Transactions build.
  - Decide now whether `ResultsRegion` is shared.
  - Add the conditional placeholder-test line.

**9. Minor (E): RB-Q7 asks about less than 2.3 decides.**
- RB-Q7 says: "This spec applies the same split to this page's `q` and `sort` (2.3)".
- The problem: 2.3 also decides the `status` behaviour. The page ignores it; the API returns 400 for an unknown value. The owner is not asked about that.
- Fix: add one sentence on `status` to RB-Q7.

**10. Minor (D: figures, design-table consistency): some stated facts have no recorded source.**
- 4.6 says "No name is non-ASCII". `output.txt` does not print this, so it does not come from the figures script.
- 2.4 says "the design computes it the same way", 2.7 says "the design draws no pagination", and §9's decisions list says "the design does the same". None of these has a row in the "Design re-read (live)" table.
- Fix: print the ASCII check in `figures.ts`, and add the two design facts to the handling table, or cite where they were read.

## Checks found clean

**A. Checklist L1–L8 and the hand-offs.**
- L1, L2, L5 and L8 are met. 2.5, 2.8 and 2.13 cover keyboard and focus; 4.2 gives the command that reproduces the figures; §3 and §4 cover the states and boundaries.
- L3 does not apply: no ADR changes. The `data-model.md` line is the only place that names `GET /api/recurring-bills?q&sort`.
- L4 is met, with one nit: the header cites W5 (destructive tools), which does not apply to a read-only page.
- L6 is met except findings 1 and 9.
- L7 is met except finding 7.
- H3, H9 and H12 are resolved as claimed.

**B. Template and stories.**
- Every template section is present and the behaviour is numbered.
- Every acceptance criterion in the brief has a row at the level PRD M2 asks for, except finding 7.
- The claim that US-31 does not apply is sound: the page has no form and no required field.

**C. What the build will produce.**
These are correct:
- the URL contract and the lenient/strict split;
- the six sorts, the "A to Z for every sort" tie-break, and all of 4.3 against `output.txt`;
- the status rule and its boundaries in 4.4 against US-27 AC2 and `bills.ts`;
- the summary taken over all bills;
- the status not carried by colour alone (apart from finding 5);
- the table restyled below 768 px;
- no pagination;
- the tool's parity with the page under RB-Q3 (a) and RB-Q4 (a);
- the Next.js 16 points: `searchParams` as a Promise, `push`/`replace` with `scroll: false`, `useTransition`, no `error.tsx`, `no-store`.

**D. S2's lessons.**
- Nothing from the designer's changelog is adopted without an approved document behind it.
- No general instruction stands in for a question.
- The design source is not named by its address.
- 2.15 only lists strings, and the new ones go to the owner as a seen/heard table.

**E. The eight questions.** Each says what is decided, why it matters, the options and a recommendation, and explains its terms. RB-Q1's count is correct: seven texts, two seen (#1, #7) and five heard (#2–#6), matching the seven **new** entries in 2.15. The recommendations are reasonable.
