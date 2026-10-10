# Review handling

1. Fixed: the update is `updateMany` with a count check, so a row deleted meanwhile is `not_found` (404),
   as `deleteBudget` already did.
2. Fixed: the comment says the read is on the write's own transaction, just before the commit, and that a
   threshold reset answers 409 instead. The result equals `budgets.md` 2.10's "after the commit".
3. Kept: `budgets.md` 4.1 names `compareLatest` (timestamp, then name), the order Overview uses; a third key
   would be a spec change for both pages. The seed has no such tie (4.4).
4. Kept: the conversion is the Overview pattern, and the API suite parses the real database's answer
   strictly against an independent oracle, which fails on any unconverted `BigInt`.
5. Fixed: the process-log entry is in this pull request.
