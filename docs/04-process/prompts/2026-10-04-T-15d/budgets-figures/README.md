# Budgets figures — the seed numbers of `budgets.md` §4

Task: T-15d (S4, `docs/03-specs/budgets.md`) · Date: 2026-10-05 · Written by the agent (Claude Code)

`figures.ts` prints every seed-derived number that `budgets.md` §4 (and the tool descriptions' lengths in 2.13) quotes;
`output.txt` is its output on 2026-10-05. Reproduce it from the repository root (after `npm ci --ignore-scripts` and
`npx prisma generate`, since it imports `src/server/overview.ts`, which reads the generated Prisma enums):

```
FORCE_COLOR=0 npx tsx docs/04-process/prompts/2026-10-04-T-15d/budgets-figures/figures.ts
```

`figures.ts` passes `npm run typecheck` (the repository's `tsconfig.json` includes every `**/*.ts`, strict, with
`noUncheckedIndexedAccess`); `docs/**` is outside `eslint`'s scope.

**What is the repository's code and what is not.**

- **Repository code:** the seed rows (`seedRows()`, `src/server/seed.ts`: `prisma/data.json`, dates +2 years, cents), the
  seed variants (`applyVariant`, `src/server/variants.ts`), the Prisma-key → display-name maps (`CATEGORY_LABEL`,
  `THEME_LABEL`, `src/server/overview.ts`), **Spent** (`budgetSpent`, `src/domain/budgets.ts`), the **latest three**
  (`latestTransactions`, `src/domain/transactions.ts`, on the category's rows), the **totals** (checked against
  `overviewSummary`, `src/domain/overview.ts` — the script prints whether they agree), the **donut's segments**
  (`donutSegments`, `src/ui/overview/donut-geometry.ts`) and the formatting (`formatMoney`, `formatSignedMoney`,
  `formatDate`).
- **This script's reading of the spec** (no repository code implements these yet): **Remaining** = `max(0, maximum −
  spent)` and the bar's **fill** = `min(100, spent ÷ maximum × 100)` with two decimals (`budgets.md` 4.1); the
  category filter in front of `latestTransactions` (the build's `latestSpending`); the "See All" address
  (`URLSearchParams`, as `transactions.md` 2.2 writes it); the worked writes of 4.6 (the new totals are sums the script
  computes); the tool descriptions, whose lengths it counts.

The build task moves these figures into `scripts/seed-figures.ts` (`release-2-handoffs.md` H15 (2)), so the tests read
them from the repository's own code, not from this record.
