# Report — pots review 2, the spec against the stories, the approved specs and the hand-offs (T-15d, S5)

The reviewer's final report as returned (who: a read-only review subagent dispatched by the controller, Claude Code — Opus by governance v1.3; what: brief
`pots-review-2-spec-brief.md`, the spec review of plan D7; reviewed `pots.md` v0.1, commit `88a2dd2`). How each
finding was handled: `pots-review-handling.md`.

    Verdict: not ready for the owner. I found 7 important findings and 7 minor ones, listed below.

    **Important**

    1. **The grid follows the window, which contradicts the Approved `app-shell.md` v1.5 §2.9.** Pull request #96, merged on `origin/develop` as 28ad970, made v1.5 Approved.
       - Quote: "So this page keeps the window breakpoint `--bp-tablet` (a media query) and needs no container query" (pots.md:29).
       - §2.9 says: "A page that has a two-column layout switches to two columns by the width of `<main>`'s content box … and never by the window width … Pages read it with a container query on `<main>` … not with a viewport media query."
       - I re-read the designer's changelog live. §14 and §16c do name no Pots threshold, and the Pots grid uses `L.potsCols`, so the spec's design facts are right. But under governance.md:62–63, a design that contradicts an Approved document goes to the owner. The spec decided it instead.
       - Content width does not rise steadily with the window: 735 px at a 767 px window, 688 px at 768 px (pots 4.7). So no container threshold can reproduce the design's switch exactly.
       - Fix: add PO-Q7, with options (container query plus a threshold, or an `app-shell.md` amendment that exempts Pots) and a recommendation.

    2. **§2.14 decides design departures without a §9 question** (governance v1.10, governance.md:62–65; plan D14: "a spec that changes what the design draws asks the owner").
       - Quote: "None is decided here against the design: where the design has nothing, §9 asks" (pots.md:108).
       - Rows decided in the spec with no question:
         - row 1: two decimals instead of the design's `toFixed(pct >= 10 ? 1 : 2)` (pots.md:112);
         - row 2: "Target of $2,000.00" instead of `fmtShort` (113);
         - row 8: the money buttons stack (119);
         - row 9: the duplicate-name check (120);
         - the error state with no header button (61).
       - Rows 1 and 2 are design-versus-Approved-document conflicts (US-21 AC1, the stories' "two decimals" convention), which governance says the agent tells the owner about.
       - Fix: one §9 question that lists these rows with a recommendation, and correct the sentence at line 108.

    3. **The error state removes the header button, which contradicts `ui-kit.md` and PO-Q3's own premise.**
       - Quote: "With no data the header has **no** '+ Add New Pot'" (pots.md:61; also §3 row "Error … no add button", 151).
       - `ui-kit.md:165` (§3) says: "Header button | — | always on Budgets and Pots".
       - PO-Q3 says: "The page header's '+ Add New Pot' button is always on the page" (pots.md:249).
       - Fix: ask the owner (finding 2), word PO-Q3 as "always, except the error state", and note that `ui-kit.md` §3 needs the same exception (`budgets.md` 2.12 has the same conflict).

    4. **§7 is missing criteria that `ui-kit.md` §7 assigns to `pots.md`.**
       - `ui-kit.md:221` assigns "US-40 … AC3 (the tool's confirmed delete carries `X-Via: webmcp`, and the page changes as after a person's delete)" to `pots.md`.
       - The WebMCP row lists only "`add_pot`, `edit_pot`, `add_money_to_pot`, `withdraw_from_pot` … on record with `X-Via` and `method`". For `delete_pot` it asserts only "`{ deleted: true }` with the refund on the page" (pots.md:216).
       - `ui-kit.md:212` also says "each page spec's Tests table names, for its page" several checks that `pots.md` §7 does not name:
         - a 404 on an **edit** (pots only has a delete 404);
         - the Theme field by pointer in WebKit, including a click choice after a server `taken`;
         - "No, Go Back" ≥ 44 px;
         - a used option's swatch at opacity 0.25;
         - Delete item and confirm underlined on hover;
         - the header at 320 px and at 1440 px.
       - Fix: add these to the E2E and WebMCP rows.

    5. **A server 400 never re-reads the page's data**, so the next blur check runs on stale data.
       - `pots.md` refreshes only "On a success" (pots.md:53). `ui-kit.md` 2.6 (line 86) says that after a server `taken` "the option list is refreshed from the page's data". Without a re-read, the page's data still shows the taken theme as free, so at the next blur the client check clears "Already used" while the server would still refuse it.
       - The same happens for "a balance changed in another tab comes back as a server `exceeds_balance`" (pots.md:46). The client's stale balance and total then clear a message that is still true.
       - Fix: on a 400 carrying `taken`, `exceeds_balance` or `exceeds_total`, call `router.refresh()` too (state it in 2.5, 2.6 and 2.8).

    6. **The US-39 AC2 parity claim is incomplete.**
       - `PotsDto` carries `total: … // Σ every pot's total (Overview's "Total Saved")` (pots.md:76), and `list_pots` returns `PotsDto` (99). The page does not show that total (§8: "A summary card or Total Saved on this page" is out of scope).
       - Yet 2.13 says the tool returns what the page shows "plus the ids and the balance the page holds for its checks" (106). It omits `total`, and US-39 AC2 says "exactly the data the UI shows".
       - Fix: remove `total` from `PotsDto`, since the page does not use it. Otherwise, name it in the parity sentence and say why the extras (it and the balance) meet "exactly". Update `list_pots`'s description and the 4.8 count to match.

    7. **The new bus contract belongs in `ui-kit.md`, the sibling spec already differs, and the contract is not needed.**
       - Quote: "`src/webmcp/bus.ts`, `ui-kit.md` 2.3's file; a new, second contract: `notifyWrite` … `budgets.md` needs the same" (pots.md:55; H16 (4)).
       - `bus.ts` is defined by `ui-kit.md` 2.3 and §6, so adding a contract from a page spec redefines a cited spec.
       - `budgets.md` v0.1 (origin/task/T-15d-spec-budgets 1db13be, 2.13) instead has `add_budget` and `edit_budget` "call `router.refresh()` from `BudgetsTools` (a client component)", with no bus.
       - `PotsTools` is also a client component, so the bus is unnecessary.
       - Fix: use the same `router.refresh()` from `PotsTools`, or move the contract into a `ui-kit.md` amendment that both specs cite. Correct H16 (4) and the 2.8 claim either way.

    **Minor**

    8. **Typing can't be observed through `Field` as `ui-kit.md` specifies it.** The counter ("it updates as the person types", pots.md:33) and the preview ("updates as the person types", 44) need a per-keystroke handler. `Field` (`src/ui/Field.tsx`) has only `onBlur`, and `ui-kit.md` §6 lists four new props, none of them an input handler. Fix: add an `onInput` prop as a `ui-kit.md` mirror change, and list it in H16.

    9. **The H6 and H8 Done cells mix ☐ and ☑.**
       - H6 (release-2-handoffs.md:24) reads "☐ (… the money rule: `pots.md` …) ☑ the money rule …". Every part of H6 is now resolved (`write-path.md` 2.8, the §9 Q3 replacement, pots 2.6, 2.7, 2.12), so the whole cell should be ☑.
       - H8 (line 26) is similar; its US-37 AC3 part is resolved by `write-path.md` 2.9.
       - The ticks themselves are justified. The edits stay within the H16 row and the Done cells (H1, H3, H6, H8, H9, H12, H13); the Status line is untouched.

    10. **Wrong line attribution in the tests note.** "its US-35 tests that open `/pots` (lines 147–244)" (pots.md:218): line 244 is in the US-34 phone hover test (`app-shell.spec.ts:240`). Fix: "the US-35 tests (lines 147, 170, 185) and the US-34 phone test (244)".

    11. **US-05 is cited wrongly in the header.** "US-05 AC3 (… 'See Details' and 'Add a pot' open `/pots`)" (pots.md:4): "Add a pot" is US-05 AC2's empty-state link, and the E2E tests only "See Details" (215). Fix: drop "Add a pot", or trace it.

    12. **US-36 AC1 is only partly traced.** It covers "any create/edit/delete or pot money movement", but the E2E has only "a move survives a reload and shows in a second tab" (pots.md:215). Fix: add a create or delete that survives a reload, or narrow the claim.

    13. **PO-Q4 (a) puts two messages under one field.** "under it a new text, 'All themes already have a pot' … pressing 'Add Pot' shows 'Can't be empty' under Theme" (pots.md:257). It does not say whether both show, their order, or which one `aria-describedby` points to. Fix: state it.

    14. **The read of `budgets.md` must be redone.** §9 says `budgets.md` was "not yet on `origin`" (pots.md:228); it is now (1db13be). Before ready, D13's read-before-asking must be redone. The D12 cross-spec review should check:
        - the tool refresh mechanism (finding 7);
        - local application then refresh (pots 2.8) versus `startTransition(router.refresh)` only (budgets 2.8);
        - the error-state header (finding 3);
        - BU-Q2 against PO-Q3;
        - the content-width threshold (budgets 952 px) against pots' window breakpoint (finding 1);
        - that the error and empty strings in BU-Q1/BU-Q2 and PO-Q1/PO-Q3 follow one pattern.

    **Checklist A:** L1 met. L2 met (script and command in §4). L3 and L4 not applicable (no ADR change, no Goal). L5 met (the `git branch -r` claim is dated). L6 partly met: the questions are answerable as written, but some are missing (findings 1–3). L7 not met (findings 4, 11, 12). L8 met. H16 is incomplete without the `ui-kit.md` mirrors in findings 7 and 8.

    **Fully correct:**
    - **Arithmetic.**
      - The `potPercent` integer formula and its numerator bound (≈1.1 × 10¹¹).
      - The three float ties: I re-ran them, and `toFixed` gives 0.01, 0.03 and 0.04 against half-up 0.02, 0.04 and 0.05.
      - Every percentage, preview segment and balance in 4.2–4.5, the widths in 4.7 (given the content widths), and the 4.8 description counts.
    - **API.** Routes, the order of checks (404 before business rules), the 16th pot being `taken`, the conditional-update money rule and the delete refund all agree with `write-path.md` 2.2–2.11. The tool annotations agree with `write-path.md` 2.11 (1) and US-39 AC3.
    - **Validation timing.** UK-Q9 (a) and TD-24 are respected: messages on blur once touched and on submit; the counter and preview are not checks.
    - **Delete flow.** It agrees with `ui-kit.md` 2.3, including focus to `<main>` after a 204 or a 404.
    - **Design claims.** The claim about the designer's changelog §14/§16c is correct (verified against the live source).
    - **Template.** Every section of the feature-spec template is present.
    - **Hand-offs file.** The edits stay within its own row and the Done cells it fills.
    - **Forbidden content.** The diff contains no `/Users/` path, design URL or project id.
