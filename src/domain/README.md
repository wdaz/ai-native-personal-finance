# src/domain

Pure functions: money, budgets, pots, bills, sorting, paging, clock (ADR-0002).

- **Imports allowed:** `src/shared` only.
- **Imports forbidden:** `app/`, `src/server`, `src/webmcp`, `src/ui` — enforced by
  `eslint-plugin-boundaries`.
- **No `new Date()`** — take a `Clock` explicitly (ADR-0005). Enforced by
  `no-restricted-syntax`.
- Coverage ≥ 90 % statements from T-13 (ADR-0003).

Filled by T-03 (`Clock`, money helpers, `budgetSpent`, `latestTransactions`,
`recurringBills`, `overviewSummary`).
