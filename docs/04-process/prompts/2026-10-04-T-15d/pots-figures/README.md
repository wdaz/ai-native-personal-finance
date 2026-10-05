# Pots figures — the numbers of `pots.md` §4

Task: T-15d (S5, `docs/03-specs/pots.md`) · Date: 2026-10-05 · Written by the agent (Claude Code)

`figures.ts` prints every number `pots.md` quotes: the seed's pots with their percentages and bars, the money moves
and their previews, the balance after each, the zero-balance and all-themes-used cases, the Pot Name counter, the card
widths (with the two-column widths of `pots.md` §9 PO-Q7 (a)), the largest numerator of the percentage, the tool
descriptions' lengths and the contrast ratios. `output.txt` is its output of 2026-10-05 (re-run for `pots.md` v0.2),
made from the repository root with:

```
FORCE_COLOR=0 npx tsx docs/04-process/prompts/2026-10-04-T-15d/pots-figures/figures.ts
```

`figures.ts` passes `npm run typecheck` (the repository's `tsconfig.json` includes every `.ts` file, `strict` and
`noUncheckedIndexedAccess` on); ESLint ignores `docs/**`.

**What is the repository's code and what is not.** The script reads the seed through `seedRows()`
(`src/server/seed.ts`: `prisma/data.json`, dollars to cents, theme hex to the `Theme` enum), the themes from
`THEMES` (`src/shared/enums.ts`) and formats money with `formatMoney` (`src/shared/money.ts`). Everything else is
this spec's reading, written in the script by hand, because no repository code implements it yet:

- the **percentage** — `total / target × 100`, two decimals, round half up (US-21 AC1, R-08), computed in integers as
  basis points (`(2 · total · 10,000 + target) div (2 · target)`), and the **bar** capped at 100 % (`pots.md` 2.3);
- the **preview** of the money modals — the amount clamped to the balance (add) or the pot's total (withdraw), as
  `Finance App.dc.html` clamps it, the base and moving segments, the new percentage (`pots.md` 2.6);
- the two **money rules** (`exceeds_balance`, `exceeds_total`, `write-path.md` 2.7); the amount grammar itself is
  `ui-kit.md` 2.5's, whose figures record holds its examples;
- the **name** rules — trimmed, case-insensitive, the record's own name allowed, the counter `30 − length` with "1
  character left" in the singular (`pots.md` 2.5);
- the **card widths** — the shell's content width (`app-shell.md` §2.9, Approved v1.5 by PR #96: window − sidebar − 80 px,
  or window − 32 px below 768 px) and the design's paddings and gaps (`pots.md` 2.4, 4.7); whether a label fits its button is not measured
  here (it needs the font): the E2E asserts it (`pots.md` 4.7, §7);
- the **design's own texts** for the departure rows — `pct.toFixed(pct >= 10 ? 1 : 2)` and `fmtShort` — copied from
  the designer's Claude Design project (`Finance App.dc.html`, `renderVals()`);
- the **contrast ratios**, WCAG 2.1's relative-luminance formula on `design-tokens.md`'s colours.

The zero balance and the fifteen used themes are reached through the API, not by a seed variant
(`reset-and-test-support.md` §2.7 has none for either; `pots.md` 4.5): the script shows the deposit and the ten creates
a test makes.

The build task moves these figures into `scripts/seed-figures.ts` and the percentage into `src/domain/pots.ts`
(`release-2-handoffs.md` H16), so the tests read them from the repository's own code, not from this record.
