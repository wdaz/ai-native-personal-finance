# Report — transactions review 1, every factual claim against the repository (T-15d, S2)

The reviewer's final report as returned (brief: `transactions-review-1-facts-brief.md`; reviewed `transactions.md` v0.1, `60aab24`). How each finding was handled: `transactions-review-handling.md`.

    I fact-checked `docs/03-specs/transactions.md` v0.1 (commit 60aab24) against the repository using only read, grep and glob. I found 10 claims that are false or imprecise and none that block the spec. All of group 5 (the seed figures) and almost all of group 2 (tokens) are correct.

    ## Findings

    **1. Important (group 3). The spec credits US-11 with a name direction it does not give.**
    - Spec 2.4, Oldest row: "US-11 gives the name direction for Latest only; Oldest keeps it". The Latest row says "then name A to Z".
    - Source: `docs/01-requirements/user-stories.md:81` says only "Latest/Oldest by full timestamp then name", with no direction for either sort. `overview.md` 4.3 (line 46) also says only "timestamp desc, then name".
    - The A to Z direction comes from the Release 1 code: `src/domain/transactions.ts:12`, `names.compare(a.name, b.name)`, ascending.
    - Fix: write "US-11 gives no name direction; Latest's A to Z is `compareLatest`'s (Release 1), and this spec chooses the same for Oldest". Mark that choice as a decision.

    **2. Important (group 3). The menu inventory leaves out Recurring Bills.**
    - Spec 2.8: "US-32 AC1 names five menus on three pages: sort, category, theme, category in the budget form, the pot menu". Spec §8: "its other four uses are `budgets.md`'s and `pots.md`'s".
    - Source: `user-stories.md:201` reads "menus (sort, filter, theme, category, pot "…" menu)". NFR-A4 says "sort/filter/theme/category/pot options".
    - The story says "filter", not "category". "Sort" also covers the Recurring Bills sort (US-30, `user-stories.md:186-188`), which is a fourth page. Neither text says "three pages".
    - Fix: quote AC1's own words, add the Recurring Bills sort as a use of `Menu`, and say `recurring-bills.md` cites 2.8 too.

    **3. Minor (group 3). Wrong NFR cited for the search field's label.**
    - Spec 2.15: "No label on the search field | a hidden label | NFR-A1, NFR-A5".
    - Source: `non-functional-requirements.md:44`. A5 is "Form errors linked via `aria-describedby` … first invalid field focused". It is about errors, not labels, and spec 2.12 says the field has no error state.
    - Fix: cite NFR-A1 only (WCAG 1.3.1 / 3.3.2 / 4.1.2).

    **4. Minor (group 3). Wrong WCAG criterion and NFR row for the unnamed buttons.**
    - Spec 2.15: "Mobile Previous and Next have no name | … | WCAG 2.5.3, NFR-A2".
    - WCAG 2.5.3 (Label in Name) only applies to controls that have a visible text label; these mobile buttons are icon-only. A missing name fails WCAG 4.1.2 (and axe `button-name`), which sits under NFR-A1.
    - NFR-A2 (`non-functional-requirements.md:41`) covers keyboard and focus, not names.
    - Fix: cite "WCAG 4.1.2, NFR-A1". 2.5.3 is used correctly in 2.7.

    **5. Minor (group 3). NFR-D1 is cited but nothing in the spec uses it.**
    - Spec header: "Constrained by: … D1, D2".
    - Source: `non-functional-requirements.md:82`. D1 is the fixed business clock, and this page never reads the clock. The 2026 dates the page shows come from D3 (`:84`, the +2 years seed shift).
    - Fix: replace D1 with D3, or say why D1 applies.

    **6. Minor (group 1). Two lines of the app-shell test are wrongly listed as changing.**
    - Spec §7: "`tests/e2e/app-shell.spec.ts` (… expects `COPY.comingInRelease2`, lines 11, 36–50, 321–325)".
    - Lines 11 and 36–50 are correct. Lines 321–325 only check the "Transactions" `<h1>` and the banner's absence (`app-shell.spec.ts:321-326`). They do not read `comingInRelease2`, and they still pass once the real page has its "Transactions" header.
    - Fix: drop 321–325, or note that those lines stay valid.

    **7. Minor (group 1). The `/transactions` route list is in a fixture, not the spec file.**
    - Spec §7: "`tests/e2e/axe-routes.spec.ts` lists `/transactions` already".
    - The list is `tests/fixtures/a11y-routes.ts:21`; `axe-routes.spec.ts` loops over `A11Y_ROUTES`.
    - Fix: name the fixture file.

    **8. Minor (group 2). The "only source for UI values" quote comes from another file.**
    - Spec §9 Q2: "`design-tokens.md` is "the only source for UI values"".
    - The quoted words are in `docs/02-architecture/README.md:15`, not in `design-tokens.md`. The claim that no shadow token exists is correct: there is no "shadow" in `design-tokens.md` or `src/ui/tokens.css`.
    - Fix: cite `docs/02-architecture/README.md`.

    **9. Minor (groups 1 and 5). Two wording slips.**
    - Spec 2.16 lists `PAGE_NAMES (exists)` among the copy sources. It does exist, but in `src/ui/nav.ts:13`, not in `src/shared/copy.ts`. Say where it lives.
    - Spec 2.5: "one space would match 48 of the 49 names". `output.txt:255` and `:268` give 48 matching rows (ByteWise is the only row without a space). The seed has 30 distinct names. Fix: "48 of the 49 rows".

    **10. Minor (outside the five groups, but it affects the owner's Q1). Q1 miscounts the new strings.**
    - §9 Q1 says "Six are new … and three are for screen readers", then lists seven strings: Search transactions, Previous page, Next page, Page {n}, the status line, Pagination, and Couldn't load your transactions.
    - Six of the seven are for screen readers only; just "Couldn't load your transactions" is visible.
    - 2.16 also marks "{label}: {current}" as **new**, which Q1 leaves out, so 2.16 marks eight strings new.
    - Fix: make the counts and the list agree with 2.16.

    ## Unverifiable from the repository
    The prototype and style guide live outside the repository (`~/Own/design-exports`), so I could not check the values taken from them:
    - the placeholder "Search transaction" and the labels "Sort by" and "Category"
    - the panel widths (114 and 177 px), the 360 px maximum height and the shadow `0 4px 24px rgba(0,0,0,0.25)`
    - the column tracks, the 1100 px switch in the prototype's script, and the 20 px icons
    - the page-button hover colours (beige-500 with white text), which the tokens' "Component states" section does not list
    - the prototype's search hover border of grey-900

    The spec does say these come from the prototype.

    ## Groups found fully correct, apart from the items above
    - **Group 1 (code and tests):**
      - **Code:** `compareLatest` and `latestTransactions` (with `Intl.Collator("en")`), `formatSignedMoney`, `formatDate`, the COPY keys (`transactionsNoResults`, `transactionsEmpty`, `retry`, `comingInRelease2`), and the `CATEGORIES` order. `CATEGORY_LABEL` exists, in `src/server/overview.ts:51`.
      - **`schemas.ts` 136–149** is the mapper that throws.
      - **`next-path.ts`** keeps the query string.
      - **`src/webmcp`:** `defineTool` validates first and leaves `issues` out on a throw; the 200-character description limit; `toolSuccess` spreads its object; `apiGet` has no query builder; `X-Via: webmcp`; `PAGE_TOOLS`; the indicator text "Agent tools: polyfill · N". The proposed description is 183 characters.
      - **Pages and route:** the login page awaits `searchParams`; the Transactions page is a placeholder; the Overview pattern and `GET /api/overview` match.
      - **`src/ui/README.md`:** it promises a Menu and no Menu file exists; it explains the bare `<img>`.
      - **Tests:** `webmcp.spec.ts` 171–179, the read-only check at `registry.test.ts:32`, the query string kept at `login.spec.ts:188-193`, plus `copy.test.ts` and `seed-figures.ts`.
      - **Data:** 30 avatars; `Transaction` has no `seq`.
    - **Group 2 (tokens):** `--radius-100` 8px, `--radius-150` 12px, `--tap-target-min` 44px, `--color-green`, `--duration-hover` 150ms, `--bp-desktop` 1024, `--bp-tablet` 768, the Component states (beige-500, grey-500, grey-900), the 2 px / 2 px focus indicator, presets 4 and 5, and the name limit of 60 in `data-model.md:10`.
    - **Group 3 (requirements), except findings 1–5:** US-09, 10, 12, 13, 19, 33, 34, 36, 38 and 39 say what the spec says; so do the appendix row (`user-stories.md:281`), R-01, R-07, R-09, R-23, R-24, R-27 and OQ-4, ADR-0001 (`0001-stack.md:108`) and ADR-0003 (`0003-testing-strategy.md:17`).
    - **Group 4 (other specs and documents):** all correct.
      - **`write-path.md`:** 2.1, 2.2 steps 2 and 10, 2.7 (`invalid_value` never throws), 2.12 and 7.2 ("every `GET` route leaves the stored rows unchanged").
      - **`overview.md`:** 2.1, 2.8 and 4.2.
      - **`webmcp-tools.md`:** 2.3, the columns of §3 and §4.
      - **`release-2-handoffs.md`:** H3, H9 and H11.
      - **Design README:** the "not a specification" quote and its location outside the repository.
    - **Group 5 (seed figures):** every number and row in 4.2–4.7 matches `output.txt`. The derived claims also hold when worked out from its full Latest list:
      - **The eight two-row days:** six of them have the time order opposite to the name order (19 Aug, 17 Aug, 11 Aug, 6 Aug, 29 Jul and 2 Jul do; 2 Aug and 26 Jul do not).
      - **Names without an `a`:** only EcoFuel Energy and ByteWise, one row each, which gives 47.
      - **The three -$100.00 rows:** they appear in the same order in both Highest and Lowest.
      - **No final-key ties:** none on name and timestamp, or on amount and timestamp (line 246).
