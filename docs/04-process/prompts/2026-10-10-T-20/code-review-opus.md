# Review brief (Opus subagent, the `/code-review` skill at "high", read-only)

Invoke the `code-review` skill with "high" on `git diff origin/develop...HEAD` (T-20), spec
`recurring-bills.md` v0.7.1 (2.2–2.4, 2.11, 4.2–4.5, §6 "Server and API", §7's Unit and API rows), plan
`plans/2026-10-10-T-20.md`. Look for correctness bugs (sort keys and ties, every row of 2.3, the joined
message, the summary over all bills, the clock), contract mismatches (DTO, statuses, `no-store`,
messages), layer violations (ADR-0002), tests that pass vacuously or type seed figures, and §7 rows T-20
should test but does not. Read-only; post nothing to GitHub. Return numbered findings with file:line,
severity, scenario and fix; say plainly if nothing is blocking.

# Report (summary)

Nothing blocking; typecheck, lint and the unit tests pass. (1) low: a vendor's two recurring rows with
the same timestamp would let the database's unstable row order pick the bill's amount and avatar;
(2) `sortCell`'s comment names Oldest, the code only Latest; (3) the strict messages are built from the
constants, never compared with 2.3's words; (4) the "inherited keys" test passes no inherited key;
(5) the two parsers still repeat their issue collector and `q`/`sort` blocks; (6) `filterBills` repeats
`filterTransactions`' search rule, a second collator, and `billsTotals` repeats `billsSummary`'s
conditions; (7) the module's `byName` comparator shadows `recurringBills`' local map; (8) the ordinal is
taken by stripping "Monthly - " from `formatDueDay`; (9) `billFigures` builds the seed input twice, and
`category` is read but unused (allowed by §5).
