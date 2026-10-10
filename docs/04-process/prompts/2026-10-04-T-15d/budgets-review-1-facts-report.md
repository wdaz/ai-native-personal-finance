# Report — budgets review 1, every factual claim against the repository and the design (T-15d, S4)

The reviewer's final report as returned (brief: `budgets-review-1-facts-brief.md`; a read-only Opus reviewer dispatched by the controller under plan D7; reviewed `budgets.md` v0.1, `1db13be`). How each finding was handled: `budgets-review-handling.md`.

    **Budgets spec v0.1 (commit 1db13be): fact-check findings**

    Groups 1–5 were checked against the repository, and the figures were re-run. I did not check group 6 (the design): neither a design tool nor a project was named.

    1. **Important — the E2E row leaves out checks that `ui-kit.md` §7 assigns to this page.**
       - Quote (budgets.md:239): "trace, at E2E level, the criteria `ui-kit.md` §7 gives `budgets.md` (… US-31–US-34 and US-40 AC2–AC3 for this page)". The E2E row is budgets.md:247.
       - Source: `ui-kit.md`:212 lists what "each page spec's Tests table names, for its page", and the table at `ui-kit.md`:220 gives US-34 AC2 to both page specs.
       - Missing from budgets.md:247:
         - US-34 AC2: no hover on an "Already used" option or on a pending submit, "Yes, Confirm Deletion" or "No, Go Back".
         - "No, Go Back" `min-height` 44 px and its bounding box at least 44 px tall.
         - A used option's swatch at `opacity` 0.25.
         - The Delete item and the confirm button stay full red and gain an underline on hover.
         - The select fields by pointer in every engine, WebKit included: focus stays on the trigger, and after a server `taken` a click choice keeps "Already used" until the next blur.
         - The "…" menu opened by a click puts focus on its first item.
         - At 320 px with a modal open: the layer has `overflow-y: auto`, the panel `visible`, and the Theme options are reachable by scrolling.
         - At 1440 px: the header button is visible and the indicator and "Log out" are not.
         - On a 404: focus goes to `<main>` and the notice is announced.
       - Fix: add these to the E2E row, or narrow the claim at line 239.

    2. **Minor — the list of tests that change misses one use of `/budgets`.**
       - Quote (budgets.md:251): "its other uses of `/budgets` (lines 57, 71, 87, 204, 229…)".
       - Source: `tests/e2e/app-shell.spec.ts`:177–178 also clicks to `/budgets` (US-35, `toHaveURL(…/budgets)`). The loop at lines 98–115 (US-33 AC2, no sideways scroll) also runs on `/budgets` through `PAGES`.
       - Fix: add line 178, and note that the real page must pass the 98–115 loop.

    3. **Minor — wrong source attribution in the copy table.**
       - Quote (budgets.md:157): "Budget options: {category} · Edit Budget · Delete Budget | `ui-kit.md` 2.12 (approved, UK-Q1)".
       - Source: in `ui-kit.md`:131–132, only "Budget options: {name}" is approved under UK-Q1; "Edit Budget" and "Delete Budget" are sourced as "the design".
       - Fix: split the source.

    4. **Minor — the plan to move the figures conflicts with the `scripts/` import rule.**
       - Quote (budgets.md:184): "**Spent, the totals, the latest three, the donut's segments and the variants are the repository's code** (… `donutSegments`, `applyVariant`, `seedRows`) … The build task moves them into `scripts/seed-figures.ts` (H15 (2))".
       - Source: ADR-0002's clarification (`0002-repository-layout.md`:4, :25) and `eslint.config.mjs`:136–139 limit `scripts/` to importing `domain` and `shared`. `applyVariant`, `seedRows` and `CATEGORY_LABEL`/`THEME_LABEL` live in `src/server`, and `donutSegments` in `src/ui`.
       - Fix: say that `scripts/seed-figures.ts` recomputes these from `domain`/`shared` only (or that the variant logic moves to `domain`), and drop the donut segments from the move.

    5. **Minor — an unstated exception to `write-path.md`.**
       - Quote (budgets.md:70): "`{}` changes nothing and answers 200 with the budget".
       - Source: `write-path.md`:194 (4.4) says "`{}` is `required` on each missing field", with no exception for PATCH.
       - Fix: state that this narrows `write-path.md` 4.4 for a PATCH, where every field is optional.

    6. **Minor — a claim the cited section does not state.**
       - Quote (budgets.md:60): "Overview reads the database on each request (`overview.md` 2.1)".
       - Source: `overview.md`:11 says only that the page calls `getOverview` directly. Rendering on every request follows from ADR-0006 (a nonce per request, dynamic rendering), not from 2.1.
       - Fix: cite ADR-0006 as well.

    7. **Minor — a hand-off this branch cannot resolve yet.**
       - Quote: "H17 (PR #96)" (budgets.md:21); H15 (4) in `release-2-handoffs.md`:32.
       - Source: H17 exists only on `origin/docs/content-width-layout`. It is not on this branch or on `origin/develop`, which is at bb0a68d.
       - Fix: merge PR #96 before this pull request, or say that H17 lands with #96.

    8. **Not verified — group 6 (the design).**
       - No design tool or project was named, and `DesignSync` is restricted to the user-started `/design-sync` workflow, so I did not read the designer's project.
       - Every design fact is therefore unchecked. That includes the 952/428/24/500 px layout and the changelog §14/§16c quotes, the rgba(105,104,104,0.15) divider and the 4 px radius, and the 0.4 s animation. It also includes the donut differences (whole dollars, 12 px ring at 0.75, beige-100 empty ring) and the `CATS[0]` fallback.
       - Also unchecked: the grey-900 income amounts in Latest Spending, "No transactions in this category yet.", the form descriptions, "e.g. 2000", the 12 px caret, the 1100 px desktop switch, "22 transactions", and the rows of 2.16's table.

    **Claim groups found fully correct**

    - **Group 1 (files, symbols, line numbers).** Correct except finding 2. `budgetSpent` is the only export of the budgets domain file. The overview domain totals cover all budgets. `compareLatest` and `latestTransactions` are as described. The donut is 240 px with a 24 px ring and an 8 px inner ring at a 25 % tint, with a grey-100 empty ring and the "Spent … of … limit" name. `ThemeBar`'s height is `block-size: var(--spacing-200)`. `themeVar` and `CardLink` ("›" as text, bold) match. The six variants are right, and few-transactions keeps three. `PageHeader` has no `primaryAction`, and the budgets page is a placeholder. The `COPY` keys, the `CATEGORIES`/`THEMES` order, `PAGE_TOOLS`, and lines 12, 25 and 22 of the three test files all match.
    - **Group 2 (tokens and data model).** Fully correct. No 4 px radius token and no translucent colour token exist.
    - **Group 3 (requirements, rules, NFRs, ADRs).** Fully correct: US-14–20 and the cross-cutting stories, the Conventions line on two decimals, the copy appendix rows, R-08/11/16/18/23/24/26, the NFR rows (P2 = CLS ≤ 0.1, W3 ≤ 200 characters) and ADR-0001/0002/0004/0006.
    - **Group 4 (other specs).** Correct except findings 1, 5, 6 and 7. The `app-shell.md` §2.9 content-width formula (window − 300/88 − 80, or − 32 on phones) supports 1332/1120 and 1331/1119 px, 1060/1272/900/1112/644/856 px, and at most 943 px on tablet. 320 − 32 − 40 gives 248 px.
    - **Group 5 (seed figures).** Fully correct.
      - Every number and row in §4, and the four description lengths (175, 179, 182 and 159, with strings identical to the ones counted), match `output.txt`.
      - Re-running `figures.ts` reproduces `output.txt` byte for byte.
      - It type-checks: `tsc --noEmit` passes on the whole project with strict and `noUncheckedIndexedAccess`, and the one index access, `segments[i]`, is guarded.
      - Five spot-checks against `prisma/data.json` agree: the budgets and their themes, Dining Out August spent = 133, Spark Electric Solutions and Pixel Playground/James Thompson with their dates and amounts, the Emma Richardson and Liam Hughes incomes, and the three newest transactions behind few-transactions.
      - "No income in the seed budgets' lists" is supported: `output.txt` reports 0.

    On the relayed request "92 merge et": PR #92 already shows as merged on this branch (b25387c). This review was read-only, so I did not merge anything.
