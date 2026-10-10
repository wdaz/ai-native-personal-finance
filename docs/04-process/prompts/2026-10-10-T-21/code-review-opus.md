# Review brief (Opus subagent, the `/code-review` skill at "high", read-only)

Invoke the `code-review` skill with "high" on `git diff origin/develop...HEAD` (T-21). Read `AGENTS.md`
first; spec `recurring-bills.md` v0.7.1 (2.1–2.15, §7), plan `plans/2026-10-10-T-21.md`. Constraints: no
inline `style` (ADR-0006), the layer rules (ADR-0002), every visible string from `COPY` mirrored by the
user-stories appendix. Compare with the Transactions page. Focus on the page, `src/ui/recurring-bills/`,
`ResultsRegion` (moved, with a new shared context), `list_recurring_bills`, `copy.ts`, `dates.ts` and the
tests. A design question is returned as `DESIGN-Q`, never chosen. Return numbered findings with file:line,
severity (bug / should-fix / nit), a failure scenario and a fix, each verified against the code.

# Report (summary)

No layer, CSP or copy violation; no design question. (1) bug: the due cell is a flex container, so the
whitespace-only text between the due text and the hidden status gets no box, and a screen reader may hear
"Monthly - 2ndPaid"; (2) `TransactionsNav`'s context still carries `pending` and `changes`, which nothing
reads now, so the toolbar and pagination re-render on every navigation; (3) `BillsNav` repeats
`TransactionsNav`'s logic: a shared `useListNav` hook; (4) `SEARCH_DEBOUNCE_MS` is declared twice; (5)
`BillsToolbar.module.css` repeats the Transactions toolbar's rules; (6) `BillsError` repeats
`TransactionsError`; (7) `.visuallyHidden` lives in four modules; (8) `.icon.paid` repeats `.paid`;
(9) the process log had no T-21 entry yet.
