# Report — transactions review 2, the spec against the checklist, the stories and the questions (T-15d, S2)

The reviewer's final report as returned (brief: `transactions-review-2-spec-brief.md`; reviewed `transactions.md` v0.1, `60aab24`). How each finding was handled: `transactions-review-handling.md`.

    I reviewed `docs/03-specs/transactions.md` v0.1 at commit 60aab24 for design and completeness, read-only. I checked it against `release-2-handoffs.md`, `templates/feature-spec.md`, `user-stories.md`, `write-path.md`, `webmcp-tools.md`, `governance.md` and the code it relies on: `defineTool.ts`, `api-client.ts`, `schemas.ts`, `eslint.config.mjs`, the `src/ui` README, `variants.ts`, the registry test, and Next 16.3.8's `node_modules/next/dist/docs` page on `error.tsx`.

    **Clean:** none of A–E is fully clean. Within them, these are sound: H3 and H9; L1, L2 and the not-applicable L3–L5; the URL table and the sort keys of 2.4 (the readings are stated, and "then `id`" is a sound final key); 2.13's DTO; and Q2.

    ## A. Hand-offs and the checklist

    **L1–L8:**
    - **L1 met.** Keyboard, focus, names and validation are written outside the prototype: 2.5, 2.7, 2.8, 2.11, 2.12, and the 2.15 table.
    - **L2 met.** 4.2 names the script and the exact `npx tsx …/figures.ts` command; the three files exist.
    - **L3 not applicable.** No ADR is changed.
    - **L4 not applicable.** The spec has no Goal citing NFR rows.
    - **L5 not applicable.** No GitHub or tech-debt claim.
    - **L6 not met.** See finding 6.
    - **L7 not met.** See finding 7.
    - **L8 met except finding 3.** §3 lists all nine states, 2.10 covers loading, empty and error, 4.7 covers the boundaries.

    **H3 and H9 are resolved as claimed.** 2.14 says it is a read tool, with no `consequentialHint` and no dialog. §7 has the "H9, for this page" line.

    **H11 is incomplete.** See finding 8.

    ## Findings

    **1. Important — the layering does not pass lint.** The spec says: "**Domain** (`src/domain/transactions.ts`) … `paginate` and `pageItems` (2.7); a constant `TRANSACTIONS_PAGE_SIZE = 10`."
    - `TransactionsPagination` lives in `src/ui/transactions/` and calls `pageItems`. But `eslint.config.mjs` (lines 111–113) and `src/ui/README.md` allow `ui` to import only `ui` and `shared`.
    - `TransactionsDtoSchema` is in `src/shared` and needs `pageSize: 10` and "at most 10". `shared` may import only `shared`.
    - So the implementer must change the spec silently.
    - **Fix:** put `pageItems` and `TRANSACTIONS_PAGE_SIZE` in `src/shared`. Alternatively, compute the page items in `page.tsx` and pass them as props.

    **2. Important — one listbox `Menu` cannot serve all five menus.** The spec says: "2.8 The menu, once (US-32 AC1 names five menus … the pot menu; … `budgets.md` and `pots.md` cite this section)" with "`role="listbox"` … the current option has `aria-selected`".
    - The pot "…" menu holds actions (Edit, Delete). It has no current option, so it needs the menu-button pattern (`role="menu"`, `menuitem`), which NFR-A4 allows ("listbox or menu semantics").
    - The budget form's Category and Theme need disabled options marked "Already used" (US-15 AC1), plus form labelling and error wiring (US-31). This primitive has neither.
    - **Fix:** scope 2.8 to single-select menus (sort, category filter, and the form's category and theme). Add `aria-disabled` options that the arrow keys skip. Leave the pot action menu to `pots.md` as a menu button. Change the "five menus" claim to match.

    **3. Important — Retry in `error.tsx` will not re-fetch.** The spec says: "`app/(app)/transactions/error.tsx`, which renders the same card with `reset()` as Retry."
    - In Next 16.3 (the installed version is 16.3.8; see its docs, `error.md` §retry), `reset()` "re-render[s] … without re-fetching". `retry()` is the prop that re-fetches; it became stable in 16.3.0. As written, Retry shows the same failure again.
    - "A navigation that fails in the browser reaches `error.tsx`" is also doubtful. A failed RSC fetch falls back to a hard navigation, and `getTransactions` throws are already caught in `page.tsx`.
    - The boundary sits inside the segment, so the card it renders has no page header, unlike the server-path card.
    - **Fix:** use `retry()`. Say that `error.tsx` catches only unexpected render errors, and say whether it renders the header.

    **4. Important — the search debounce and the menu and page pushes race.** The spec says: "`router.replace` writes the URL with the new `q` and **without** `page`" and "Choosing a category or a sort and changing the page use `router.push`".
    - The spec never says which query a control builds its URL from.
    - Example: type `co`, then pick a category within 250 ms, or while the replace is still pending. The push is built from `useSearchParams` (no `q`) and supersedes the replace. The URL and the rows lose `co` while the field still shows it.
    - The reverse case: a page click and then a late debounce fire. The replace drops the page the user chose.
    - "never rewrites the text while the field has focus" contradicts "reset from the URL … (Back or Forward …)" when Back is pressed with focus in the field (Cmd+[ or Alt+Left).
    - "this field's own navigation" is ambiguous when several of its replaces are in flight: compare against the last one, or against all of them?
    - **Fix:**
      - `TransactionsNav` holds one *intended query*, updated synchronously by every control, and every URL is built from it.
      - Choosing a menu option or changing the page flushes a pending debounce first.
      - Back and Forward (`popstate`) always reset the field, even when it has focus.
      - The field compares against the last value it wrote.

    **5. Important — truncating the name contradicts two requirements.** The spec says "the name … on one line, truncated with an ellipsis (the full name stays in the text)", and 4.7 uses truncation for the 320 px check.
    - US-09 AC3 says "collapses … without losing information".
    - NFR-A8 says "Text resizes to 200 % without loss".
    - The prototype does truncate, but 2.15 lists other departures with a story as their source, and the spec already lets a category wrap for the same reason.
    - **Fix:** let the name wrap (to two lines, or freely) below 768 px and at large text sizes. Or make it a §9 question: the design against US-09 AC3.

    **6. Important (L6, D) — Q1 is miscounted and uses unexplained terms.** Q1 says: "Six are new … and three are for screen readers".
    - Q1 itself lists **seven**: "Search transactions", "Previous page", "Next page", "Page {n}", the status line, "Pagination", "Couldn't load your transactions".
    - 2.16 marks an **eighth** as new: "{label}: {current}". The singular "1 transaction" is a further variant.
    - **Six** of them are for screen readers, not three. Only the error card's text is visible.
    - Option (a) reads "Approve the six".
    - "landmark", "`COPY`" and "H11" are used without explanation.

    Missing owner questions:
    - Finding 5 (design against US-09 AC3).
    - The no-results line says "…match your **search**". It also shows for a category filter with no search, which is exactly US-19 AC2's case.
    - "No transactions yet" is approved in the appendix for the context "Overview transactions". Reusing it on this page is a new context.

    Q2 is answerable and its recommendation is the right one.
    **Fix:** recount, list all eight, explain the terms inside the question, and add the questions above.

    **7. Important (L7) — some acceptance criteria have no test row.**
    - **US-09 AC2, "announced":** nothing in §7 asserts the 2.10 status line.
    - **US-10 AC1, "pagination resets to page 1":** no E2E goes from page 3, types, and expects page 1 with no `page` in the URL. 2.6's reset on choosing a category is not tested either.
    - **US-19 AC2, receiving side:** not tested. The existing `few-transactions` variant (3 rows: Dining Out, General, General) gives `?category=Bills&page=1` with no rows. That would test the US-13 state, and it settles which state wins when `empty-all` meets an active filter.
    - **The One page state:** no E2E asserts Prev and Next both disabled. Dining Out has 8 rows and would do.
    - **US-34 AC2:** nothing asserts that a disabled button has no hover.
    - **The E2E "busy state":** §7 forbids time-based waits but does not say how the pending state is held long enough to see. Hold the RSC request with `page.route`.

    **8. Important (H11) — a mirrored change is missing.** The Approved `webmcp-tools.md` §7 E2E row says "click sidebar 'Transactions' → `[data-webmcp]` absent and … `length === 0`" and "polyfill · 0 on a placeholder page". §7 here changes `webmcp.spec.ts`, but the spec text would then contradict the test. S6, as planned, edits only §4.
    **Fix:** add the §7 text to S6's scope, or to H11 as a (4).

    **9. Minor — the mobile page-number window is ambiguous.** The spec says: "a window of three consecutive pages containing the current one, clamped". For page 2 of 5, `1 2 3` and `2 3 4` both contain page 2.
    **Fix:** say "centred on the current page, then clamped" and give the example for page 2.

    **10. Minor — focus after a page change has two candidates.** "focus goes to the current page's number button": both DOM lists have one.
    **Fix:** say it goes to the button in the visible list.

    **11. Minor — the integer parse is not defined.** The spec says: "`page` | not an integer or below 1 → 1".
    - `2abc`, `02`, `+2`, ` 2`, `2.0` and `1e1` parse differently with `Number`, `parseInt` and a regex.
    - Strict reading of empty `sort=`, `page=` and `q=` is also not stated. 2.2 says an empty `category=` means All, but 2.3's strict column says only "unknown → 400".
    - **Fix:** `page` must match `/^[1-9]\d*$/`, otherwise 1. Every empty value reads as absent, in both modes.

    **12. Minor — the trigger's accessible name differs by width.** "Sort by: Latest" (`aria-labelledby` the label and the value): `aria-labelledby` joins the two texts with a space and no colon, giving "Sort by Latest". The `aria-label` used below 768 px gives "Sort by: Latest". A role-name locator would need two names.
    **Fix:** use `aria-label` from the COPY pattern at every width.

    **13. Minor — the status line is silent after a sort change.** "after every change it holds '{total} transactions, page {n} of {m}'": after a sort change the text is the same, so a live region announces nothing.
    **Fix:** clear the region and set it again, or include the sort in the text.

    **14. Minor — Enter in the search field is not specified.** If the container is a `<form role="search">`, Enter does a native submit, because a form with a single text input submits implicitly.
    **Fix:** use a non-form `div`, or prevent the submit. Say that Enter flushes the debounce.

    **15. Minor — smaller gaps in the menu, toolbar, empty state and scroll:**
    - **Tab:** no Shift+Tab rule, and Tab out of the listbox needs the focus moved explicitly, or it lands on `<body>` when the listbox unmounts.
    - **Same option:** choosing the option that is already current pushes a duplicate history entry.
    - **Pending trigger:** what the trigger shows while the push is pending (old or new value) is not stated.
    - **Scrolling:** the highlighted option is not scrolled into view in the 360 px panel.
    - **CSP:** panel positioning must be pure CSS. ADR-0006's CSP blocks `style` attributes, which floating-UI libraries write.
    - **Toolbar:** 2.9 says both "the full row on mobile" and buttons that "wrap … when the row cannot hold a 160 px search field".
    - **No-results line:** its place in the DOM (a `colspan` cell in `<tbody>`, or outside the table) is not stated.
    - **Page scroll:** no `{ scroll: false }` choice for replace and push. Next's default may scroll the page.

    **16. Minor — the API sets `no-store` on its errors itself.** 2.13 says the route sets `no-store` on its 200. The 400 and 500 helpers (`validationErrorResponse`, `errorResponse`) set none, so the route must set it on those too. Say so.

    **17. Minor — a tool `page` of 0 gets a misleading issue code.** Zod reports it as `too_small` with minimum 1, which `toErrorIssues` maps to `required`.
    **Fix:** note it, or give the tool input a custom message.

    **18. Minor (B) — template and test details.**
    - The template's WebMCP table has a "Safety rule" column. 2.14 has none; state it, for example: untrusted names returned as text, never HTML (NFR-S7).
    - The registry unit test asserts `untrustedContentHint` only for `get_overview_summary`. §7 should add `list_transactions`.

    B otherwise: every template section is present and §3 covers empty, loading, error and boundary states. The only §7 gaps are those in finding 7.
