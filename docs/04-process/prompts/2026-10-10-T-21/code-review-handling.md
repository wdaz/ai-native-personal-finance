# T-21 review findings and what was done

| Finding | Done |
|---|---|
| 1 Whitespace in the flex due cell | checked, does not reproduce: Chromium's own accessibility tree (CDP `Accessibility.getFullAXTree`) names the cell "Monthly - 2nd Paid" with the current markup and with every alternative, because each flex item is its own text run; the E2E test's text check stays |
| 2 `pending` and `changes` left in `TransactionsNav`'s context | removed from the type, the value and its dependencies; `ResultsNavContext` carries them |
| 4 The debounce declared twice | one `SEARCH_DEBOUNCE_MS` in `src/ui/useDebouncedValue.ts`; both navigation providers re-export it for their tests |
| 8 `.icon.paid` | removed: `.paid` already colours the icon |
| 9 The process log | the T-21 entry is in this pull request |
| 3 `BillsNav` repeats `TransactionsNav` | not done: the plan's D1 builds `BillsNav` as `TransactionsNav` with two parameters, and a shared hook would rewrite the Approved Transactions page's navigation in a task that only adds a page; worth doing when a third list page arrives (Pots and Budgets have none) |
| 5, 6, 7 Toolbar CSS, error card, `.visuallyHidden` repeated | not done, for the same reason: each is a page's own module as on Transactions (§6 lists the page's components), and a shared module would change Transactions' files without a behaviour change |
