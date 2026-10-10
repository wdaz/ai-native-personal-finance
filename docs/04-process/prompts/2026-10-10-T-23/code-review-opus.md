# Code review — brief and report

**Brief** (a new Opus subagent, read-only): review `git diff origin/develop...HEAD` for correctness bugs with
the `/code-review` skill at "high"; the task is T-23, `budgets.md` 2.10, 2.11, §4, §7 and `write-path.md`
2.2–2.10, 7.2, 7.3; focus on the write runs, the routes, `budgetFillPercent`, the moved `applyVariant`, the
schemas, and whether the tests could pass vacuously; verify each finding; report file, severity, scenario, fix.

**Report** (summary): no blocking finding; one important, four nits.

1. Important — `updateBudget` read the row, then called `update`: a `DELETE` committing in between makes
   Prisma throw P2025, which `guardedWrite` answers 500 instead of `write-path.md` 2.8's 404.
2. Nit — the comment on the write's answer called the in-transaction read "the committed state".
3. Nit — `latestSpending` has no final `id` tie-break, so two rows of one category with the same timestamp
   and name could swap between requests (Overview's latest list has the same gap).
4. Nit — §7's "BigInt → Number" happens in `readSummary`, which only the API suite exercises.
5. Nit — no process-log entry yet.

Checked and found correct: the `taken` checks (own row excluded, both fields reported, a pot's theme not
counted, P2002 mapped), the 404s and the non-UUID 400, the strict DTO, `budgetFillPercent`'s rounding, the
moved `applyVariant`'s behaviour, the schemas, and that no test passes without asserting.
