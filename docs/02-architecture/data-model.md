# Data model

Status: **Approved** (v1.1 — 2026-09-22: `seq` and 64-bit money, owner decisions at the T-02 plan gate; v1.0, owner approval 2026-09-13) · Author(s): Agent · Date: 2026-09-13 · Traces to: user stories US-04…US-30, US-36/37; ADR-0005
Changelog: v1.1 (2026-09-22, owner, T-02 plan gate) — `Budget` and `Pot` gain `seq`, their creation order, because rows created in one transaction share `createdAt` (US-05/07/15/22); money columns are 64-bit, because NFR-S3's 99,999,999,999 cents does not fit a 32-bit integer (R-17).
Money is integer cents, stored 64-bit (NFR-S3 allows 99,999,999,999). Dates are UTC timestamps; business time is fixed (ADR-0005). Every entity has a UUID `id`, `createdAt`, `updatedAt`, `seeded` (boolean).

| Entity | Fields | Rules | Stories |
|--------|--------|-------|---------|
| `Balance` (singleton) | `current`, `income`, `expenses` (cents) | seeded from `data.json`; only pot money moves and pot deletion change `current`; `income`/`expenses` never change | US-04 |
| `Transaction` | `name` (≤ 60), `avatar` (asset key), `category` (enum, 10), `date` (timestamp), `amount` (cents, signed), `recurring` (bool) | read-only in this product; seeded (+2 years) | US-06, US-09–13, US-18 |
| `Budget` | `seq` (creation order, assigned by the database — rows created in one transaction share `createdAt`), `category` (enum, **unique**), `maximum` (cents > 0), `theme` (enum, 15, **unique among budgets**) | spent/remaining are computed, not stored | US-07, US-14–20 |
| `Pot` | `seq` (creation order, assigned by the database — rows created in one transaction share `createdAt`), `name` (≤ 30, **unique, case-insensitive**), `target` (cents > 0), `total` (cents ≥ 0), `theme` (enum, **unique among pots**) | `total` may exceed `target`; deposit ≤ `Balance.current`; withdrawal ≤ `total` | US-05, US-21–26 |
| `ResetLog` | `at`, `reason` (`scheduled` \| `threshold` \| `manual` \| `test`) | latest exposed via `/api/meta` | US-37 |
| `LoginAttempt` | `ip`, `at`, `success` | cleared on reset; rate limit source | US-01, NFR-S4 |

Enums: `Category` = Entertainment, Bills, Groceries, Dining Out, Transportation, Personal Care, Education, Lifestyle, Shopping, General. `Theme` = Green, Yellow, Cyan, Navy, Red, Purple, Turquoise, Brown, Magenta, Blue, Navy Grey, Army Green, Gold, Orange, Pink.

Derived values (pure functions in `src/domain/`, all take `Clock`):
- `budgetSpent(category, transactions, clock)` = Σ |amount| of negative transactions in the current month.
- `latestSpending(category, transactions, 3)` = three most recent, any sign.
- `recurringBills(transactions, clock)` → one row per `name` among `recurring = true`, day = day-of-month of the most recent one, status per US-27 AC2; summary totals per US-28.
- `sortTransactions`, `filterTransactions`, `paginate(pageSize = 10)`, `sortBills` with the tie-breaks of US-11/US-30.
- `potPercent(total, target)` = round half up to two decimals.

API surface (route handlers, all JSON, all behind the session except where noted):
`GET /api/meta` (public: last reset, webmcp mode hint) · `POST /api/auth/login|logout|signup` · `GET /api/overview` · `GET /api/transactions?q&category&sort&page` · `GET|POST /api/budgets`, `PATCH|DELETE /api/budgets/:id` · `GET|POST /api/pots`, `PATCH|DELETE /api/pots/:id`, `POST /api/pots/:id/deposit|withdraw` · `GET /api/recurring-bills?q&sort` · `POST /api/admin/reset` (secret) · `POST /api/test/reset|seed` (test env only). Request/response schemas live in `src/shared/schemas.ts` and are reused by forms and tools.
