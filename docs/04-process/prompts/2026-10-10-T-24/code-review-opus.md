# Code review — brief and report

**Brief** (a new Opus subagent, read-only): review `git diff origin/develop...HEAD` for correctness bugs with the
`/code-review` skill at "high"; the task is T-24, `budgets.md` (v0.8.2) 2.2–2.9, 2.12–2.17, §7; focus on
`BudgetsView`'s write flow, focus and delete bus, `BudgetForm`'s timing and answers, the fit table and `Donut`'s
opt-in, the tools and `BudgetsTools`, the CSS, and whether the tests could pass vacuously; verify each finding;
report file, severity, scenario, fix.

**Report** (summary): no blocking finding; three important, four nits.

1. Important — `withRefresh` returns before `router.refresh()` lands, so `add_budget` then an immediate
   `delete_budget` of the new id answers `not_found` (the bus looks the id up in the page's current records).
2. Important (spec reading) — the write tools call `apiSend` directly, so the page's slot does not count them and
   `delete_budget` is not `busy` while an agent's write is in flight.
3. Important — `.first()`, `.last()` and `.nth()` locators in `budgets.spec.ts`, against §7's "no `.first()`".
4. Nit — the donut's segments were keyed by index; with the new transition, a deletion before a segment showed
   its colour on the wrong arc for 400 ms.
5. Nit — the fit table assumes 16 px per rem.
6. Nit — `BudgetForm`: an unused `formRef`; the amount parsed twice; the unplaced-issue message.
7. Nit — a duplicate CSS comment; commit subjects not in the conventional form of `AGENTS.md`.

Checked and found correct: the slot's claim and release, the form keys and card keys, `trackWrite`, the refresh in
a transition with `aria-busy`, focus return, the bus (`busy` before the lookup, `not_found`, the synchronous
claim), the form's timing, first free values, edit's own values, double submit, the answers; the fit table's
digit and comma counts; Overview's markup without the opt-in; the tools' schemas, headers and memoised list; no
time-based waits.
