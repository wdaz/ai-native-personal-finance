Spec: ✅ — all five files (`src/domain/bills.ts`, `src/shared/dates.ts`, `tests/unit/shared/dates.test.ts`, `tests/unit/domain/transactions.test.ts`, `tests/unit/shared/money.test.ts`) match the brief's four Copilot fixes exactly, nothing more touched. Diff stat (14 insertions, 5 deletions) matches the report and sums correctly per-file. Reviewed: `copilot-fix-brief.md`, `copilot-fix-report.md`, the full diff `94daedb..cc2882b`, plus current contents of `src/domain/bills.ts`, `src/shared/dates.ts`, `tests/unit/shared/money.test.ts`, and confirmed the `transactions.test.ts` title change with a Grep.

## Strengths

- `recurringBills` (`src/domain/bills.ts:38-40`): the per-vendor arrays are created fresh in the loop and never escape as `list` — each returned `RecurringBill` still carries `latest` (the caller's own transaction object), so `transactions` (typed `readonly T[]`) is never mutated. `if (list)` is safe because an empty array is never stored (a name only enters the map together with its first transaction). Map insertion order plus in-order `push` preserves both vendor order and within-vendor order exactly as before.
- `formatDate` (`src/shared/dates.ts:47-49`): the ternary quotes only string inputs via `JSON.stringify`; a `Date` still goes through `String(value)`, so an invalid `Date` still reads `Date Invalid Date is not a valid ISO-8601 date` — sensible, and exactly as the brief specified.
- Test count genuinely holds at 341: `dates.test.ts` keeps its 5 `it.each` rows (message assertion changed, not row count); `money.test.ts` goes from 10 rows to 9 rows plus one standalone `it` (net zero). RED was real for all 5 rows in the dates test — the old, unquoted message never contained quotes, so `""` and the two rows the report didn't show in its tail (`"19 August, maybe"`, `"2026-02-30T00:00:00Z"`) fail the same way as the three shown.
- The retitled sort test, `tests/unit/domain/transactions.test.ts:27`, claims only "orders names A to Z as a reader would, not by code unit" — accurate for a two-name, mixed-case assertion, and avoids the prior over-claim about case-insensitivity that Copilot flagged.
- Commit subject matches the brief's literal text; scoped `git add` of exactly the five files, clean working tree after.

## Issues

**Critical:** None.

**Important:** None.

**Minor:**

1. `tests/unit/shared/dates.test.ts:71-73` — the brief-prescribed `toThrow(`Date ${JSON.stringify(text)} is not a valid ISO-8601 date`)` is a substring/containment check (Vitest's `toThrow(string)` semantics), not an equality check — confirmed by the implementer's own RED-phase failure message, which says "expected … to throw error **including** …". So this "asserts the full quoted message" in content but would still pass with extra text appended before/after. This is exactly what the brief dictated, so it is not a deviation by the implementer — flagging as a candidate follow-up (e.g., an anchored regex or an `Error`-instance equality form) rather than something to fix in this commit.
2. `tests/unit/shared/dates.test.ts:77` ("refuses an invalid Date") still asserts only the substring `"is not a valid ISO-8601 date"`, so the `Date`-branch of the new ternary at `src/shared/dates.ts:48` is unpinned by any test. `JSON.stringify(new Date(NaN))` returns `"null"` (via `.toJSON()`), so a future change that collapsed the ternary to always call `JSON.stringify` would silently produce `Date null is not a valid ISO-8601 date` and the suite would stay green. The brief explicitly said "no other test changes in that file," so no action was required in cc2882b — noting it as a real but out-of-scope gap, consistent with "still reads sensibly for an invalid Date" being verified by reasoning here, not by a test.

Out of scope, not listed as an issue: two process-record docs (`docs/04-process/prompts/2026-09-22-T-03/progress.md:148` and `.../task-4-review.md:38`) still describe the old unquoted-message minor as "deferred" — worth a one-line update in a future `docs(process)` commit, not this one.

## Quality: Approved

The four Copilot fixes are implemented exactly as specified, in exactly the five files the brief's own wording requires, preserve `recurringBills`'s ordering/no-mutation contract, and keep the dates-test and money-test counts net-zero as predicted (341/341); the two Minor points are brief-sanctioned test-strictness/coverage gaps, not defects introduced by this commit.
