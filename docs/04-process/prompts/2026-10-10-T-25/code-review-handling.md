# Review handling

1. Fixed: `RESET_TABLES` truncates `Pot` before `Balance`, the moves' lock order, so the two wait for each
   other instead of deadlocking (`src/server/reset.ts`).
2. Fixed: `getPots` reads both in one `REPEATABLE READ` transaction, one snapshot.
3. Fixed: `creditBalance` throws unless exactly one balance row took the money, so the transaction rolls back.
4. Fixed: the UTF-16 check runs only when `.max(30)` did not already fail, so a name gives one `too_long`.
5. Kept: the seed's and the spec's names are ASCII-cased, and the `citext` unique index still refuses anything
   the JavaScript check lets through (`guardedWrite` maps P2002 to `taken`).
6. Kept for the schemas (the budgets' pattern, one schema per route); fixed for the figures, which import
   `AMOUNT_MAX_CENTS`.
