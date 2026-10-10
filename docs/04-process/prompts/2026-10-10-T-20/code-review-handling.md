# T-20 review findings and what was done

| Finding | Done |
|---|---|
| 1 Tied timestamps of one vendor | `getRecurringBills` selects `id` and orders the rows by it before `recurringBills`, so the first of a tie is the same on every request; the domain is unchanged |
| 2 `sortCell`'s comment | corrected: Latest's cell only |
| 3 Messages only from constants | a unit test holds the three strict messages to 2.3's words |
| 4 Inherited keys | the test passes an object whose `sort` and `status` are inherited and expects the defaults |
| 7 `byName` shadowing | the comparator is `compareNames` |
| 8 Ordinal by string stripping | `ordinalDay` in `src/shared/dates.ts`, used by `formatDueDay`, the figures and their test |
| 9 Seed input built twice | `seedBills` takes the transactions; `billFigures` builds them once. `category` stays read: §5 says so and `recurringBills` takes `TransactionInput` |
| 5 Parser blocks repeated | not done: the shared part is the address rules of 2.2 (now one module); the per-field blocks differ in fields and order, and a generic field reader would couple two specs for a few lines each |
| 6 Search rule, collator, totals repeated | not done: `billsSummary` feeds the Approved Overview, which the task leaves unchanged (2.1); the search rule is one line, written by each spec separately (`transactions.md` 2.4, `recurring-bills.md` 2.4), and a shared helper would tie the two pages' rules together |
