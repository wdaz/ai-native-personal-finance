# UI-kit figures — the numbers of `ui-kit.md` §4

Task: T-15d (S1b, `docs/03-specs/ui-kit.md`) · Date: 2026-10-05 · Written by the agent (Claude Code)

`figures.ts` prints every seed-derived number, every worked example of the amount grammar and every contrast ratio that
`ui-kit.md` quotes; `output.txt` is the output of 2026-10-05. The intended command, from the repository root:

```
FORCE_COLOR=0 npx tsx docs/04-process/prompts/2026-10-04-T-15d/ui-kit-figures/figures.ts
```

**How `output.txt` was made.** The worktree this spec was drafted in has no `node_modules`, so `figures.ts` was not
run. `figures.py` is a line-for-line mirror that needs only Python 3; `output.txt` is its output:

```
python3 docs/04-process/prompts/2026-10-04-T-15d/ui-kit-figures/figures.py > docs/04-process/prompts/2026-10-04-T-15d/ui-kit-figures/output.txt
```

`figures.py` reads `prisma/data.json` (the seed), the `CATEGORIES` and `THEMES` arrays of `src/shared/enums.ts` and the
theme hex values of `docs/02-architecture/design-tokens.md` (the seed's own hex → theme map, `THEME_BY_HEX` in
`src/server/seed.ts`, is held to that table by `tests/unit/seed.test.ts`). Dollars become cents by rounding `× 100`,
which `src/domain/money.ts` `toCents` does for the seed. A reviewer with `node_modules` runs `figures.ts` and compares;
the two must print the same lines.

**What is the repository's code and what is not.** `figures.ts` reads the seed through `seedRows()`
(`src/server/seed.ts`), the enums from `src/shared/enums.ts` and formats with `formatMoney` (`src/shared/money.ts`). The
**amount grammar** (`parseAmount`) and the **pre-fill** format are this spec's reading of US-15 AC2 (`ui-kit.md` 2.5),
written in the script by hand; no repository code implements them yet. The **contrast ratios** follow WCAG 2.1's
relative-luminance formula; a colour with opacity is composited over white first. The colours are `design-tokens.md`'s.

The build task moves the amount examples into the unit test of the parser (`ui-kit.md` §7), so the tests read them from
the repository's own code, not from this record.
