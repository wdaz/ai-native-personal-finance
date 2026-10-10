# Transactions figures — the seed numbers of `transactions.md` §4

Task: T-15d (S2, `docs/03-specs/transactions.md`) · Date: 2026-10-04 · Written by the agent (Claude Code)

`figures.ts` prints every seed-derived number that `transactions.md` 4.2–4.7 quotes; `output.txt` is its output
on 2026-10-04. Reproduce it from the repository root:

```
FORCE_COLOR=0 npx tsx docs/04-process/prompts/2026-10-04-T-15d/transactions-figures/figures.ts
```

**What is the repository's code and what is not.** The script reads the seed through `seedRows()`
(`src/server/seed.ts`: `prisma/data.json` with the dates shifted +2 years) and formats with `formatDate`
(`src/shared/dates.ts`) and `formatSignedMoney` (`src/shared/money.ts`). The **Latest** order is the repository's
`compareLatest` (`src/domain/transactions.ts`). The other five orders (Oldest, A to Z, Z to A, Highest, Lowest),
the search (case-insensitive substring of the name) and the category labels are written in the script by hand,
as `transactions.md` 2.4 defines them; no repository code implements them yet. The script has no `id` key: the
database generates the ids on insert (`@default(uuid())`, `prisma/schema.prisma`), and the seed never reaches that
key (`transactions.md` 4.4).

The build task moves these figures into `scripts/seed-figures.ts` (`release-2-handoffs.md` H11), so the tests read
them from the repository's own code, not from this record.
