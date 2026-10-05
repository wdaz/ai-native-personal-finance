# Report — budgets review 2, the spec against the checklist, the stories and the questions (T-15d, S4)

The reviewer's final report as returned (brief: `budgets-review-2-spec-brief.md`; a read-only Opus reviewer dispatched by the controller under plan D7; reviewed `budgets.md` v0.1, `1db13be`). How each finding was handled: `budgets-review-handling.md`.

    Review of budgets.md v0.1 at commit 1db13be. I edited and posted nothing. There are 7 important and 9 minor findings.

    **Important**

    1. **PATCH accepts a partial body, which contradicts write-path.md and the spec's own §4.7.**
       - Quotes: "the same three fields, **each optional**; an absent field keeps its value … `{}` changes nothing and answers 200 with the budget" (`docs/03-specs/budgets.md:70`). The same rule appears in the `edit_budget` description, "any of its category, maximum … and theme" (`:112`), and in the API test, "`{}` is 200 and unchanged" (`:246`).
       - Conflict: `write-path.md:194` (4.4) says "`{}` is `required` on each missing field". Its table at `:99` puts "absent, `null`" together as `required`. budgets.md 4.7 (`:213`) says "a body's [boundaries] are `write-path.md` 4.4's", so the spec contradicts itself.
       - pots.md (PR #91 branch) makes `PATCH` take all three fields and lists partial edits as out of scope. It also answers `{ pot: PotDto }`, while budgets answers a bare `BudgetItemDto`.
       - Fix: make `BudgetUpdateSchema` require all three fields, as the form sends them, and update the `edit_budget` description, its character count and the API row. If partial edits are wanted, raise a §9 question for an amendment of write-path.md instead.

    2. **How `add_budget` and `edit_budget` refresh the page is not something the code can do as written.**
       - Quote: "after a 2xx, `add_budget` and `edit_budget` call `router.refresh()` from `BudgetsTools` (a client component)" (`:116`).
       - Problem: tools are static module-level definitions. `PAGE_TOOLS` in `src/webmcp/tools/registry.ts:9` and `OverviewTools.tsx` only renders `<WebMcpTools tools={PAGE_TOOLS.overview} />`. A tool's `execute` cannot reach a hook, and nothing says how it would.
       - Side effects as written:
         - a tool's refresh does not set 2.9's `aria-busy`;
         - `delete_budget` on a just-added id answers `not_found` until the refresh lands (ui-kit 2.3 item 3).
       - Fix: name the mechanism. For example, a bus event (`notifyChanged("budget")`) that `BudgetsView` subscribes to and refreshes with its own `startTransition`. That keeps one refresh path and one `aria-busy`.

    3. **Items that ui-kit.md §7 requires budgets.md to E2E-test are missing.**
       - Quote: "the rows below … trace, at E2E level, the criteria `ui-kit.md` §7 gives `budgets.md`" (`:239`).
       - The E2E row (`:247`) lacks these items from `ui-kit.md:212`:
         - select fields by pointer in WebKit (focus stays on the trigger; a server `taken` followed by a click keeps "Already used");
         - the "…" menu opened by a click with focus on its first item;
         - "No, Go Back" at least 44 px tall;
         - a used option's swatch at opacity 0.25;
         - the Delete item and the confirm button staying full red and underlined on hover;
         - **no hover on an "Already used" option or on a pending button (US-34 AC2)**;
         - at 320 px with a modal open, the layer `overflow-y: auto`, the panel `visible`, and the Theme options reachable by scrolling;
         - at 1440 px, the header button visible and the indicator and "Log out" hidden.
       - Fix: add each to the E2E row and add US-34 AC2 to the H9 line.

    4. **"Without reload" is never asserted, so these tests would pass on a page that reloads.**
       - Quote: "**US-16 AC1/AC2:** edit Dining Out to $150.00 → Remaining $17.00, the same place in the list" (`:247`). The same applies to US-15 AC3.
       - US-16 AC2 says "without reload" (`user-stories.md:112`).
       - Fix: set a window marker before the write and assert it survives, as `tests/e2e/webmcp.spec.ts:169-181` does.

    5. **The keyboard walkthrough order is wrong below 1024 px and leaves out the reset banner.**
       - Quote: "After the shell's own order — the skip link, the five navigation items, the footer controls (below 1024 px, the header's compact indicator and "Log out" come right after the add button) — Tab visits: "+ Add New Budget"…" (`:121`).
       - Below 1024 px: `BottomNav` renders after `<main>` (`src/ui/Shell.tsx:35-45`), so the five navigation items come after the page, not before it.
       - At every width: the reset banner's "Dismiss notice" is the first stop in the page, before "+ Add New Budget" (`tests/e2e/app-shell-keyboard.spec.ts:46-50`).
       - Fix: give the desktop order and the below-1024 order separately, and include the banner's dismiss button.

    6. **Two layouts at 320 px are decided by the spec without going to the owner.**
       - Quotes: "the row wraps it under the category, right-aligned" (`:30`) and "An amount wraps rather than overflow (`overflow-wrap: anywhere`)" (`:37`). The second breaks a figure like "$999,999,999.99" mid-digits.
       - Neither is in 2.16 or §9. Governance v1.10 step 1 says a design question the design does not answer goes to §9 and the agent "does not decide it" (this is the S2 lesson about wrapping).
       - Fix: add a §9 question with options (wrap under; smaller preset; wrap only at separators), or cite the designer's changelog section if the design draws it.

    7. **The error state (2.12) is never tested, although a test row claims to trace it.**
       - Quote: the Component row "Traces to 2.3–2.9, 2.12" (`:245`), but it names no `BudgetsError` and asserts nothing about "Couldn't load your budgets" or Retry (`router.refresh`). The API row checks only `no-store` on a 500.
       - Fix: add a component test of `BudgetsError` (the text and Retry calling `router.refresh()`) and a page-level test where `getBudgets` throws: header shown, no add button, the error logged with its request id.

    **Minor**

    8. **2.16 leaves out several additions** (`:126-139`). Governance v1.10 says to list each, with its source:
       - the "See All" tap target of at least 44 px (`:41`; source app-shell §4, as ui-kit 2.11 lists for "…");
       - `aria-busy` on the cards' column;
       - the card `<section>` and the summary `<ul>` labelled by their headings;
       - no `<ul>` when there are no budgets;
       - no add button in the error state.

    9. **The owner questions use unexplained terms** (L6).
       - BU-Q2 (a) (`:277`): "`--text-preset-4` grey-500", and BU-Q2 (`:275`) "`COPY.budgetsEmpty`".
       - BU-Q3 (b) (`:284`): "reduced-motion setting".
       - BU-Q3 (b) also says "`overview.md` is amended in this pull request". That conflicts with H12's route (Overview's changes go with "hotfix 2") and says nothing about the Release 1 code change. Fix: explain the terms and point option (b) at the hotfix-2 route.

    10. **Focus after an edit relies on an unstated assumption.** It returns to the card's "…" button (`:54`, `:60`), which only works if the button survives the refresh after a category change. Fix: state that cards are keyed by budget `id`.

    11. **§3 has no Loading row** (`:167-180`), although the template has one. Fix: add "Loading — none, server-rendered; Refreshing covers writes".

    12. **L5 is not met** (`:5`). "merged by PR #92" and "own pull request (PR #96)" are claims about GitHub's state with no date or command. Fix: add the date and the `gh pr view` command. Also note that 2.2 depends on #96 merging first.

    13. **The layout tests check only one side of the expanded threshold** (`:247`). They test 1331 px (one column) but not 1332 px (two columns). recurring-bills 2.13 tests both sides. Fix: add 1332 px.

    14. **The list of tests that change when the placeholder goes is incomplete** (`:251`). It cites `app-shell.spec.ts` `/budgets` uses "lines 57, 71, 87, 204, 229" but leaves out line 178, and leaves out `tests/e2e/app-shell-keyboard.spec.ts:26`, which loads `/budgets`.

    15. **The US-19 AC2 test does not name its expected state** (`:247`). "→ Transactions' empty state (AC2)" is vague. `transactions.md:208` shows that `?category=X` with no rows is its "No results" state ("No transactions match your search"). Fix: name the expected state and text, citing transactions.md §9 Q4.

    16. **The WebMCP row does not name `readOnlyHint` on `list_budgets`** (US-39 AC3, `:248`). The existing iterating test `tests/unit/webmcp/registry.test.ts:32-37` covers it. Fix: say so.

    **Claim groups fully correct**

    - **Checklist (A):**
      - L1 and L2 are met (the reproduce command is at `:184`); L3 and L4 do not apply (no ADR change, no Goal section).
      - L8 is met for empty, boundaries, record-gone and refreshing. The only gaps are no Loading row in §3 (finding 11) and no test for the error state (finding 7).
      - L5 is not met (finding 12) and L6 is partly met (finding 9).
      - L7 is not met because of findings 3, 4 and 7.
    - **Hand-offs (A):** the Done cells of H1, H3, H6, H9, H12 and H13 are accurate and stay unticked. The new H15 row is correct and complete, and numbered consistently with H14 (PR #91), H16 (pots) and H17 (PR #96). The edits in `release-2-handoffs.md` are limited to the H15 row (`:32`) and those Done cells; the Status line is untouched.
    - **Template (B):** every template section is present and the behaviour is numbered so tests can cite it.
    - **Reuse (C):** ui-kit.md and write-path.md are cited, not restated, for:
      - the modal and `ModalSlot`;
      - the delete dialog, the bus and the `delete_budget` results;
      - `ActionMenu`, `AmountField` and `formatAmountInput`;
      - `SelectField` with "Already used" and "No free option";
      - `FormFooter`, `PageHeader`'s `primaryAction`, `Notice` and `ThemeSwatch`;
      - the routes, validation codes, `taken`, unique constraints, threshold, rate limit, `X-Via`, logging and annotations.

      The one exception is PATCH (finding 1).
    - **UK-Q9 (a) and TD-24 are respected:** no message clears on typing, and the E2E row says "still shown while typing".
    - **Layout (C):** the 952 px container query and window table (1332/1120, 1440/1280/1024, at most 943 px) match app-shell §2.9 on the PR #96 branch and the recurring-bills 2.13 pattern. The summary is sticky only in two columns, and the 320 px fit (248 px inner width) is correct.
    - **Accessibility (C):** the inline SVG bar with a percentage `width` attribute (ADR-0006), the decorative bar, "See All" as a link with a distinct name, and the `TruncatedText` citation are all sound.
    - **Next.js (C):** the Server Component feeding a client container through props, `router.refresh()` inside `startTransition` with `aria-busy`, and `BudgetsError` and the layout with `BudgetsTools` follow the Overview and Transactions code.
    - **Questions (D):** BU-Q1 and BU-Q4 can be answered as written. BU-Q2 and BU-Q3 can too, apart from the terms in finding 9. The §14/§16c layout is rightly not asked.
    - **Hygiene:** no `/Users/` path, design URL or project id appears in any changed file.
