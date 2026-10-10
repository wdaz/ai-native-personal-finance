# Code review — brief and report

**Brief** (a new Opus subagent, read-only): review `git diff origin/develop...HEAD` for correctness bugs with
the `/code-review` skill at "high"; the task is T-25, `pots.md` 2.1–2.12, §4, §7 and `write-path.md` 2.7, 2.8,
7.2, 7.3; focus on the conditional updates and their lock order, the deletion's refund, the `taken` checks,
`potPercent`'s rounding, `moneyPreview`'s clamps, the schemas, and whether the tests could pass vacuously;
verify each finding; report file, severity, scenario, fix.

**Report** (summary): one important, five nits.

1. Important — the pot moves lock `Pot` and then `Balance`, but `resetToSeed` truncated `Balance` before
   `Pot`: a move and a reset at the same time can each hold the lock the other waits for, and Postgres ends one
   with a deadlock (a 500).
2. Nit — `getPots` reads the balance and the pots as two statements outside a transaction, so a move
   committing between them shows a sum that is not conserved.
3. Nit — the refund of a deletion and the credit of a withdrawal ignore `balance.updateMany`'s count; with no
   balance row the money would leave the pot and arrive nowhere.
4. Nit — a name of 31 code units and at most 30 code points gave one `too_long`, but a longer one gave two.
5. Nit — the duplicate check compares with JavaScript's `toLowerCase`, the index with `citext`'s rules.
6. Nit — `PotUpdateSchema` repeats `PotCreateSchema`; `seed-figures.ts` repeats the largest amount literally.

Checked and found correct: the 404 before any business rule, `exceeds_balance` and `exceeds_total` with the
rollback, the refund from `RETURNING`, the strict DTOs, `potPercent`'s half-up rounding, the moved-money clamps,
and that no API test passes without asserting.
