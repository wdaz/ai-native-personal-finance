# src/domain

Pure functions: money, budgets, pots, bills, sorting, paging, clock (ADR-0002).

- **Imports allowed:** `src/shared` only.
- **Imports forbidden:** `app/`, `src/server`, `src/webmcp`, `src/ui` — enforced by
  `eslint-plugin-boundaries`.
- **No wall clock** — take a `Clock` explicitly (ADR-0005). `new Date()` without arguments,
  `Date()` and `Date.now()` are lint errors; `new Date(<value>)` builds a fixed date.
- Coverage ≥ 90 % statements from T-13 (ADR-0003).

| Module            | Holds (T-03)                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `clock.ts`        | `Clock`, `BUSINESS_TODAY`, `fixedClock`                                                   |
| `calendar.ts`     | `shiftYears`, `SEED_YEAR_SHIFT`; the current month in UTC                                 |
| `money.ts`        | `toCents`, `sumCents` — integer cents                                                     |
| `types.ts`        | The rows the functions read: money in cents, dates as `Date`, extra fields passed through |
| `transactions.ts` | `compareLatest` (US-11 Latest), `latestTransactions`                                      |
| `budgets.ts`      | `budgetSpent`                                                                             |
| `bills.ts`        | `recurringBills`, `billsSummary`                                                          |
| `overview.ts`     | `overviewSummary` — every figure SPEC-overview shows                                      |
