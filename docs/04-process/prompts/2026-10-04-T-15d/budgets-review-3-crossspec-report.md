# Report — budgets review 3, the cross-spec review of `budgets.md` and `pots.md` (T-15d, S4 and S5)

The reviewer's final report as returned (a read-only Opus reviewer dispatched by the controller under plan D12, the
cross-spec review: `budgets.md` and `pots.md` against `ui-kit.md` and each other; reviewed `budgets.md` v0.2 at
`a122984` on `origin/task/T-15d-spec-budgets` and `pots.md` v0.2 at `6927a5a` on `origin/task/T-15d-spec-pots`). The
same report is handled on each branch for its own spec; this branch applies the `budgets.md` findings, the hand-off
findings that touch H15 and the shared questions. How each finding was handled: `budgets-review-handling.md`, review 3.

    No blocking contradiction in the theme rules or the shared strings, but the two specs disagree on six things that need fixing or one owner answer before S5 goes ready. I did not merge PR #92: `gh pr list` shows it already MERGED, and this task was read-only, so I edited, committed and pushed nothing.

    The worst is how an agent's write reaches the page. Each spec says it uses the other's mechanism, but they describe two different ones, and no hand-off row carries the change to the bus file.

    Branch heads match the task (budgets `a122984`, pots `6927a5a`). Both branches were cut before #91 and #96, so their hand-off rows will conflict with `develop` (plan D11).

    ## docs/03-specs/budgets.md (origin/task/T-15d-spec-budgets)

    **B1. important — the agent-write refresh contradicts pots.md and the bus contract.**
    - Quote, budgets.md:116: "`add_budget` and `edit_budget` call `notifyWrite("budget")` on the in-page bus … the second bus contract `pots.md` 2.8 states for Pots (PR #97) … The two specs state one contract; … (H16 (4))".
    - pots.md:61 says the opposite: "No bus contract is added: `src/webmcp/bus.ts` stays as `ui-kit.md` 2.3 defines it". Hand-off H16 (4) (pots branch, release-2-handoffs.md:32) says the same.
    - `ui-kit.md` 2.3 (lines 48–56) defines only `requestDelete` and `onDeleteRequest`. H15 (budgets branch, release-2-handoffs.md:32) does not carry `notifyWrite`/`onWrite` either.
    - Fix: choose one mechanism for both pages. The bus version needs `ui-kit.md` 2.3 and §6 amended (or the addition stated in both page specs) plus an item in H13/H15/H16. The `router.refresh()`-from-the-tools-wrapper version needs a sentence on how a module-level `execute` reaches the router (B1 points out it cannot call a hook). Then make 2.13, pots 2.8, H15 and H16 say the same thing.

    **B2. important — the header button is dropped in the error state without asking.**
    - Quote, budgets.md:103: "under the page header (with no primary action, since the page has no data …)"; also budgets.md:46 and the departures table at :140.
    - `ui-kit.md`:165 (merged) says "Header button | — | always on Budgets and Pots".
    - Pots asks the owner about exactly this (PO-Q9, pots.md:67 and :300–303) and plans a shared one-line amendment of ui-kit §3.
    - Fix: cite PO-Q9 (or add a BU-Q) and make the behaviour depend on its answer. List the ui-kit §3 amendment in H15 as well.

    **B3. important — a window breakpoint inside the page goes against `app-shell.md` §2.9.**
    - Quote, budgets.md:23: "the donut and the title-and-list sit side by side in a row … from a 768 px window (`--bp-tablet`; the design keys this on its mobile mode)".
    - `app-shell.md`:34 (v1.5, Approved) says a page "switches … never by the window width".
    - Pots raised the identical conflict with the owner (PO-Q7, pots.md:29–34): no content width reproduces the design's 767/768 px switch (content 735 px vs 688 px).
    - Fix: either say why a card's internal layout is outside §2.9, or put it to the owner together with PO-Q7.

    **B4. important — animation defaults differ from pots.md.**
    - budgets.md:36 and :265 (§8): no bar animation "unless §9 BU-Q3 decides otherwise".
    - pots.md:73 states the opposite as settled behaviour: "The bars' width changes animate (the design's) unless `prefers-reduced-motion`".
    - Both designs use the same 0.4 s bar animation.
    - Fix: one default for both pages, decided by one answer (see the list at the end).

    **B5. important — the token rule is stated against pots.md.**
    - Quote, budgets.md:295–296: "without a token the build would write a raw value, which the token rule forbids".
    - pots.md:277 (PO-Q6 (a)) recommends "the 2 px gap written as the design's number with a comment, as Overview's 4 px theme bar is". There is real precedent: `src/ui/overview/ThemeBar.module.css`:9 has `inline-size: 4px`.
    - Fix: one policy, asked once (see the list), and correct whichever claim loses.

    **B6. minor — the tool description suffix breaks the convention.**
    - budgets.md:110–113 end with "Budgets page." Pots (pots.md:105–110) and `webmcp-tools.md`:64–65 use "Available on the … page." (S-32).
    - The full suffix adds 17 characters, which takes `edit_budget` from 191 to 208, over the 200 limit.
    - Fix: use the full suffix and shorten `edit_budget`, for example by dropping "Returns the budget as the page shows it."

    **B7. minor — the create answer and schema names differ from pots.md.**
    - Answer shape: budgets.md:69 returns a bare `BudgetItemDto` (201); pots.md:90 returns `{ pot: PotDto }`.
    - Schema names: budgets uses `BudgetCreateSchema`/`BudgetUpdateSchema` (:233); pots uses `CreatePotSchema`/`EditPotSchema` (pots.md:90–94, :207). `src/shared/schemas.ts` names noun-first (`LoginSchema`, `OverviewDtoSchema`).
    - Fix: one wrapping convention and noun-first names in both specs.

    **B8. minor — `delete_budget`'s results are incomplete.**
    - budgets.md:118 says only "`conflict`, `unauthenticated` or failure code". It leaves out `not_found` after a confirm (404) and the post-unmount codes `rate_limited`, `forbidden`, `validation`, `server_error`.
    - Those come from `ui-kit.md`:52–61, item 4; pots.md:108 lists them in full.
    - Fix: list the same set as pots.

    **B9. minor — the empty-state copy key is not named.**
    - budgets.md:171 ("The empty state's words | §9 BU-Q2") and BU-Q2 (:283) cite "No budgets yet" without its key. `COPY.budgetsEmpty` exists; pots.md:148 names `COPY.potsEmpty`.

    **B10. minor — the walkthrough and the notice's place are incomplete.**
    - budgets.md:121–123 leave out the 404 notice's "Dismiss notice" stop (`ui-kit.md` 2.9). Pots includes it (pots.md:71).
    - Budgets does not say where the notice sits relative to the two columns. Pots states it (pots.md:68).

    **B11. minor — the forbidden-tool test is missing (both specs).**
    - `write-path.md` 7.6 (:230) asks for "a tool refused with 403 returns `forbidden`". Neither budgets.md:256 nor pots.md:223 has it.

    ## docs/03-specs/pots.md (origin/task/T-15d-spec-pots)

    **P1. important — same contradiction as B1, plus stale references.**
    - pots.md:61 cites "`budgets.md` v0.1 2.13 … `1db13be`" as using `router.refresh()`. Budgets v0.2 changed that to the bus.
    - pots.md:237 (the D13 read of budgets) still says the two specs agree, citing v0.1.
    - PO-Q4 (:266) and PO-Q9 (:300) also cite budgets v0.1.
    - Fix: re-read `a122984`, align with B1's resolution, and update the citations.

    **P2. important — the bar width mechanism is not specified under ADR-0006.**
    - Quote, pots.md:23: "a fill in the theme colour (a `data-theme` selector as `ThemeBar`, never an inline `style`, ADR-0006), `potFill` wide". A `data-theme` selector sets the colour, not a variable width.
    - The preview's two segments (:46–48) have the same gap.
    - Budgets solves it with an inline SVG `rect` (budgets.md:36). `ui-kit.md`:33 allows `element.style` only for values computed in the browser.
    - Fix: state the mechanism (the SVG rect, as Budgets does), and say how the animation in :73 works with it.

    **P3. important — Rule 7.5's E2E rows are missing.**
    - `write-path.md`:229 (7.5) asks each page spec for E2E of a 429 (with `WriteAttempt` rows pre-filled) and of a threshold reset leading to the login page.
    - pots.md:222 has only the 404. Budgets has both at budgets.md:255.

    **P4. important — the animation default (B4 from this side).**
    - pots.md:73 states animation as fact, while PO-Q6 (b) (:278) offers "the bars do not animate".
    - Fix: make :73 conditional on the answer, as Budgets does.

    **P5. minor — the hand-offs Status line is edited, which plan D10 forbids.**
    - release-2-handoffs.md:3 on the pots branch adds "amended by the Pots spec's PR #97 …".
    - Plan D10 (plan :81–83): "Each spec pull request edits only its own new row and the Done cells it fills". The webmcp-tools spec (#90, v1.0.8) dropped the same kind of edit for this reason.

    **P6. minor — the walkthrough order is wrong below 1024 px.**
    - pots.md:71: "After the shell's own order (the skip link, the five navigation items, the footer controls)". Below 1024 px the bottom bar comes after `<main>` (budgets.md:123 has the right order).
    - It implies the compact indicator is a stop; budgets says it is a `role="status"` with no stop.
    - It leaves out the reset banner's "Dismiss notice".

    **P7. minor — partial edits are not covered.**
    - The `PATCH` API tests (pots.md:221) have no case for `{}` or a missing field giving `required`. `write-path.md` 4.4 requires it, and budgets tests it at budgets.md:254.
    - `edit_pot`'s description (:107) does not tell an agent that all three fields are required; `edit_budget`'s does.

    **P8. minor — the after-write model differs from Budgets.**
    - Pots applies the answer and then refreshes, with no `aria-busy` (pots.md:58, :65).
    - Budgets refreshes inside `startTransition` with `aria-busy` on the cards' column, listed as a departure at budgets.md:60 and :143.
    - Fix: one pattern for both pages.

    ## release-2-handoffs.md, H15 and H16

    **H-a. important — H15 and H16 contradict each other on `bus.ts`.**
    - H16 (4) says the bus file is unchanged; budgets.md:116 needs `notifyWrite`/`onWrite`; H15 does not list either.
    - H15 also does not list the ui-kit §3 amendment that H16 (4) says is "shared with `budgets.md`".

    **H-b. minor — the shared form strings overlap between H15 (1) and H16 (1).**
    - "Save Changes", "Theme" and "e.g. 2000" appear in both copy lists (budgets.md:165–168, pots.md:142–143).
    - Fix: say which build task adds them and that the second one reuses them, so the appendix gets no duplicate rows.

    **H-c. minor — H16 omits the H17 dependency.**
    - Under PO-Q7 (a) or (c) the pot grid's container query needs H17's `container-type` on `<main>`. H15 (4) says this for Budgets; H16 does not.

    **H-d. minor — the Done cells need reconciling at merge.**
    - Pots ticks H6 ☑ (pots-branch handoffs:24), while budgets adds a note to the same row and keeps ☐ (budgets-branch handoffs:24).
    - Whichever branch merges second should keep ☑ with both notes. Once both are merged, H1 and H9 can be ticked, and H3 too once #90 lands.

    ## Checked and consistent
    - **Theme uniqueness (item 6):** stated the same way in both. A theme is unique among budgets, unique among pots, and may be shared across the two (budgets.md:50 and :73, pots.md:38 and :187, `write-path.md` 4.1). Both specs test it at the API level.
    - **Annotations (item 4):** match `write-path.md` 2.11 (1). Every mutating tool has `consequentialHint`; `untrustedContentHint` is on the list tools and on every add, edit and money-move tool, and not on the delete tools. All ten names match `webmcp-tools.md` §4. Every description is at or under 200 characters (175/179/191/159 and 171/152/120/181/139/140).
    - **Write rules (item 3):** both cite `write-path.md` 2.2–2.12 for the 404 "no longer exists" notice, the cross-site 403 and the threshold 409 with the same codes.
    - **Shared strings (item 2):** "Delete ‘{name}’?", the "Couldn't load your …" pattern, "Already used" and the four amount messages are identical.
    - **Budgets layout (item 8):** the content widths are right. 952 px of content comes at a 1332 px window with the sidebar expanded and 1120 px collapsed. At 1024 px the content is 644 or 856 px, and every tablet and phone width gets at most 943 px.
    - **Pots widths (item 8):** pots.md 4.7's widths check out (310/262/123 px at 1024 px with the sidebar expanded; 116 px buttons at 320 px).

    ## The same question asked twice
    1. **BU-Q2 and PO-Q3:** the empty state. Both recommend a white card with the approved "No … yet" text and the header button as the only action. The third option differs: BU-Q2 (c) is "the designer draws one", PO-Q3 (c) is "nothing in place of the grid". Ask once.
    2. **PO-Q9 and budgets.md 2.12 (not asked):** whether the header add button stays in the error state. One answer, then one ui-kit §3 amendment.
    3. **BU-Q3 and PO-Q6 (1)–(2) / (b):** whether the progress bars animate. The design gives 0.4 s on both pages, so one answer and one `--duration-progress` token. The preview's 300 ms follows from it.
    4. **BU-Q4 and PO-Q6 (3)–(4):** how to handle a design value with no token. Budgets says a new token every time; Pots says round to an existing token, or use the raw number with a comment. One policy.
    5. **BU-Q1 #2 and PO-Q1 #2–3:** names that include the record ("See All {category} transactions", "Add Money to {name}", "Withdraw from {name}"). This is the same principle as UK-Q1, and the owner can approve the pattern once.
    6. **BU-Q1 #1 and PO-Q1 #1:** the "Couldn't load your budgets / pots" error texts, the same pattern.
    7. **PO-Q7 and budgets.md 2.2's summary row (not asked):** whether a layout the design ties to the window's mobile mode (768 px) follows the window or the content width (B3).
    8. **PO-Q8 #2 and budgets.md:28 / :133 (treated as decided):** the design's whole-dollar money becoming two decimals. Budgets says the stories' convention already decides it; Pots asks. One ruling for both.
    9. **BU-Q5 and PO-Q8 #3:** what a row does at 320 px when it has no room. Budgets leaves it to the designer and says choosing was not the agent's place; Pots chose stacking itself and asks to keep it. One policy.
