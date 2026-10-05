# Recurring Bills figures — the seed numbers of `recurring-bills.md` §4

Task: T-15d (S3, `docs/03-specs/recurring-bills.md`) · Date: 2026-10-05 · Written by the agent (Claude Code)

`figures.ts` prints every seed-derived number that `recurring-bills.md` §4 quotes; `output.txt` is its output on
2026-10-05. Reproduce it from the repository root (after `npm ci`):

```
FORCE_COLOR=0 npx tsx docs/04-process/prompts/2026-10-04-T-15d/recurring-bills-figures/figures.ts
```

**What is the repository's code and what is not.** The script reads the seed through `seedRows()`
(`src/server/seed.ts`: `prisma/data.json` with the dates shifted +2 years) and the seed variants through
`applyVariant` (`src/server/variants.ts`). The bills, their day, amount and status, and the summary come from the
repository's `recurringBills` and `billsSummary` (`src/domain/bills.ts`) on the fixed clock (`fixedClock(BUSINESS_TODAY)`,
`src/domain/clock.ts`); money and dates are formatted with `formatMoney` (`src/shared/money.ts`) and `formatDate`
(`src/shared/dates.ts`). Written in the script by hand, as `recurring-bills.md` defines them (no repository code
implements them yet): the six sorts and their name tie-break (2.4), the search (2.4), the status filter (2.12), the
ordinal of "Monthly - 2nd" (2.9), the summary's "count (amount)" text and its counts and Total Bills sum (`billsSummary` gives only the three cent sums), the non-ASCII check of the names, and the contrast ratios (WCAG 2.1 relative
luminance).

The build task moves these figures into `scripts/seed-figures.ts` (`release-2-handoffs.md` H14), so the tests read
them from the repository's own code, not from this record.
