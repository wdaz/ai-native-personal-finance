# Report — ui-kit review 2 (T-15d S1b)

Home paths in this report are written as `~/…` (the repository's home-path rule); nothing else was changed from the reviewer's text.

As returned by the read-only Opus reviewer for commit 1cf0c9d685cfc4ef8709d529420794b2931bb6f8.

**Review 2 of ui-kit.md v0.3 (spec design and completeness, read-only).** Branch task/T-15d-spec-ui-kit at 1cf0c9d. The spec is at `~/Own/ai-native-personal-finance/.claude/worktrees/wf_ca2e2077-bdb-1/docs/03-specs/ui-kit.md`, and every `ui-kit.md:N` reference below is a line in that file. The brief named v0.1; I reviewed v0.3, which is what is there now.

### Findings

**1. Important. Focus ends on `<body>` after a delete or a 404, because focus is restored before the card is removed (C, 2.2/2.3/2.7).**
- Spec, ui-kit.md:46: "**204** — the dialog closes, the record leaves the page … and focus goes where 2.2 says (after a person's delete the "…" button that opened it is gone, so `<main>`); **404** — the dialog closes, the notice … and the list refreshes". ui-kit.md:89 says the same for a form's 404.
- Problem: the rule "gone, so `<main>`" (ui-kit.md:38) is checked when the modal closes. At that moment the "…" button is still on the page, especially on a 404, where the refresh is asynchronous. Focus goes back to the button, the button then unmounts, and focus drops to `<body>`. ui-kit.md:38 says this must never happen.
- Fix: either the record leaves the page or list before the modal closes, or on 204 and 404 the page names `<main>` as the element that gets focus back. Add a test to §7: "a 404 with a delayed refresh does not leave focus on `<body>`".

**2. Important. "No, Go Back" still works while the delete is pending (C, 2.3).**
- Spec, ui-kit.md:46: "the confirm button reads "Deleting…" … and the dialog is not dismissible". ui-kit.md:39 lists only Escape, the close button and the backdrop as disabled.
- Problem: Go Back stays active. A click during the request makes the tool return `"cancelled"` while the DELETE is already in flight and may succeed. That breaks the "final outcome" rule at ui-kit.md:59 and NFR-W5.
- Fix: while pending, Go Back gets `aria-disabled` and does nothing. Add it to the ConfirmDeleteDialog test row (ui-kit.md:199).

**3. Important. Unmount while a confirm is pending gives the tool a false `"cancelled"` (C, 2.3).**
- Spec, ui-kit.md:59: "the page unmounting while the dialog is open → `"cancelled"`".
- Problem: if the DELETE is already sent (for example after browser Back, or a 409 or 401 reload racing the answer), the record may be gone while the tool hears "cancelled".
- Fix: "`cancelled` on unmount only before a confirm. After a confirm the result is the request's answer: the bus keeps the pending promise, or resolves `server_error` (outcome unknown)." Add a test row.

**4. Important. Two tool calls in the same tick can open two dialogs (C, 2.3 races).**
- Spec, ui-kit.md:57: "**`busy`** — at once … when any modal of the page is open".
- Problem: an agent can call `delete_budget` twice in parallel. If "open" is React state, both calls see a closed dialog before React re-renders.
- Fix: the check-and-claim is synchronous (a ref or the bus's own flag, set before the first `await`). Add "two calls in one tick → one dialog, the second `busy`" to the bus test row (ui-kit.md:200).

**5. Important. A select's options panel is clipped by the modal's own scrolling (C, 2.2 with 2.6).**
- Spec, ui-kit.md:41: "at most the viewport's height minus `2 × --spacing-200`, scrolling inside when taller". ui-kit.md:69 and 81 say the panels are positioned by CSS alone (a positioned wrapper).
- Problem: an absolutely positioned options panel inside a scrolling container is clipped by it. The Theme field is the last field, and its 300 px panel runs past the modal's bottom, so the person has to scroll the modal to see the options. The design does not draw this inner scrolling; the spec added it.
- Fix: let the full-screen layer behind the panel scroll (the overlay already has 40/16 px padding), with the panel itself `overflow: visible`. The alternative is a fixed-position options panel placed through `element.style`, as `TruncatedText` does. Add a check to the E2E row: at 320 px with the modal open, the Theme options are fully visible.

**6. Important. The `Menu` change for Escape contradicts §6 and is in no hand-off (A, C).**
- Spec, ui-kit.md:39: "the `Menu` of `transactions.md` 2.8 stops the key there (a build note for that component)". But ui-kit.md:182 says "Used, not changed: `Menu`".
- Problem: H13 (`release-2-handoffs.md`:31) and H11 do not carry this note. `transactions.md` 2.8 (line 96) does not say it. The Transactions build task, which builds `Menu` first, will not do it.
- Fix: in §6, list `Menu` as changed (Escape stops propagation). Add the note to H13 (1), or to H11 if Transactions is built first.

**7. Important. The "no longer exists" notice may not be announced (C, 2.9).**
- Spec, ui-kit.md:96: "with `role="status"`, so it is announced".
- Problem: a `role="status"` element inserted already holding its text is not reliably announced by screen readers. The modal's `inert` is also being removed in the same commit. `transactions.md` 2.10 avoids this by keeping the region in the page empty and then setting its text.
- Fix: the notice's live region is always in the page (empty), and its text is set after the modal has closed. Add an announcement check to the Notice test row.

**8. Important. UK-Q5 (a) changes an approved document, and neither the question nor H13 says so (A, D).**
- Spec, ui-kit.md:258: "red at 80 % (the token list's and the style guide's "destroy" hover) … Proposed: full red, its text underlined on hover".
- Problem: `design-tokens.md`:126, "Component states", says "destroy (red → red at 80 % opacity)". Answer (a) changes that text. The Delete item's hover is a new component state too.
- Fix: UK-Q5 (a) says `design-tokens.md` "Component states" is amended. H13 gains "(6) UK-Q5's hover states into `design-tokens.md`, as answered".

**9. Important. The test table is missing rows for criteria the header claims (B, L7).**
- US-34 AC2 (disabled controls have no hover): 2.11 (ui-kit.md:114) promises "no hover" on a used option, and the pending `aria-disabled` buttons need the same. No row asserts either. The E2E row (ui-kit.md:205) lists hovers only.
- US-15 AC2, "the form does not submit": the FormFooter row (ui-kit.md:204) asserts focus but not that no request is sent.
- NFR-W5 is verified at E2E level (`non-functional-requirements.md`:30). The E2E row names only "through the tool, with cancel", not `busy` and `not_found`.
- Fix: add these assertions, or state that the page specs' E2E rows carry them.

**10. Important. Nothing owns "one modal at a time" or the "busy" state across the page (E).**
- Spec, ui-kit.md:35: "One modal is open at a time on a page". ui-kit.md:57: busy "when any modal of the page is open … or a write of the page is pending".
- Problem: the header button (inside `PageHeader`), the cards' "…" menus, the money buttons and the bus handler sit in different subtrees. No part says where "a modal is open" or "a write is pending" is held. `budgets.md` and `pots.md` would each invent it.
- Fix: specify a page-level holder for this state (for example a `src/ui` context, or a client container in each page), or state that each page spec defines it.

**11. Minor. The abort path cannot be built through the stated bus API (C, 2.3).**
- Spec, ui-kit.md:52: `requestDelete(kind, id)`. ui-kit.md:61 says that if a signal "aborts while the dialog is open, the dialog closes".
- Problem: there is no signal parameter, so the aborted case cannot be wired.
- Fix: `requestDelete(kind, id, signal?)`, plus one unit test with an aborted signal.

**12. Minor. The tool-side list of failures that keep the dialog open differs from the person-side list.**
- ui-kit.md:46 lists "429, 403, 415, 500, no response". ui-kit.md:59 lists only "A 429, 500 or network failure".
- Fix: align the two lists.

**13. Minor. §3 is missing some states (B, L8).**
- No rows for: a select field open, or showing an error or `taken`; a tool call with no handler (`cancelled`, nothing shown); a form's 409 or 401 (message, then reload); a second 404 replacing the notice's text.
- The look of a pending button is not stated (dimmed or not).

**14. Minor. Two departures in 2.11 are changes to what the design draws, not additions, and no question was asked (D).**
- ui-kit.md:112: "Input boxes 45 px tall | `Field`'s box". `Field.module.css`:23 gives 12 + 12 px padding, a 21 px line and 2 px of border, so 47 px.
- The source cited is code, not an approved document. Under plan D14 this is an owner question, or the spec should follow the design (45 px).

**15. Minor. UK-Q4 misses one value that has no token (D).**
- The "Already used" swatch at 25 % opacity (ui-kit.md:82, 98) has no token and is not among UK-Q4's six.
- Fix: add it, or say why an opacity needs no token.

**16. Minor. Leading-zero comma groups are read as thousands (C, 2.5).**
- Spec, ui-kit.md:73, step (3): "grouped by commas in threes". This accepts `0,500` → 50,000 cents and `0,123` → 12,300 cents. A reader who writes a decimal comma means 0.5.
- Fix: reject a first group of `0` when commas follow (`invalid_format`), and add both inputs to 4.1.
- Also note the reading itself (strict groups of three, so `1,23` is rejected, where US-15 AC2 only says separators "are stripped") is a scope decision. Record it as such.
- Nit: the 16 characters behind `maxLength` (ui-kit.md:72) are counted on `-$999,999,999.99`, which is not a valid amount. The longest valid amount is `$999,999,999.99` (15 characters).

**17. Minor. Things the page specs would still have to guess (E).**
- `Field` is uncontrolled and has no `defaultValue` (`Field.tsx`:4-20), and the pre-fill of ui-kit.md:75 needs it. The build note lists three new props; it should list four.
- The select trigger's accessible name when there is no value ("Theme: " is not a good name).
- The gap between a select trigger and its options panel (the design: top 74 px, per the handling table) is not stated in 2.6.

**18. Minor. Hand-off and citation housekeeping (A).**
- ui-kit.md:6 "Resolves hand-off H13 (new)": H13 is resolved by a build task (`release-2-handoffs.md`:31). The spec creates H13; it does not resolve it.
- H13 (2) would add "Already used" a second time: H10 already carries it.
- H13 (1) should name `DEFAULT_TOOL_MESSAGE.busy`. `src/webmcp/tool-result.ts`:18 is a `Record` over every code, so the compiler will force it anyway.
- The header cites plan v0.3 "D10–D14". This branch and develop both hold the plan at v0.2, which has no D10–D14. Merge the plan pull request first, or cite its branch.

**19. Minor. UK-Q3 (a) does not say how long the notice stays (D, L6).**
- The rules of ui-kit.md:96 (it stays until dismissed or until the next successful write; dismissing moves focus to `<main>`) are not in option (a). The owner cannot approve behaviour the question does not show.

**20. Minor. The figures did not come from the repository's code (D, L2).**
- `ui-kit-figures/README.md`:12-17: `output.txt` comes from `figures.py`, a hand mirror. `figures.ts`, the script that reads the repository's own code, was never run.
- Fix: run `figures.ts` once and compare the two outputs before the pull request goes ready.

### Found correct
- **A:**
  - L1 is met (2.2–2.7).
  - L3, L4 and L5 do not apply: no ADR is changed, there is no Goal citing NFR rows, and there is no GitHub-state claim.
  - The H3 note claims only the dialog-driven "cancel" that 2.3 resolves.
  - The one-line `transactions.md` 2.8 amendment is in place.
- **B:** every section of the template is present. Behaviour is numbered and citable. Every acceptance criterion in the header has a test row, apart from the gaps in finding 9.
- **C:**
  - The layering is right: `bus.ts` imports only `src/shared`, `app/` joins it to the dialog, and `src/ui` never imports `src/webmcp`. This matches `eslint.config.mjs`.
  - `busy` and `not_found` are answered before any dialog or request. `X-Via: webmcp` is sent on a tool's delete. The result-to-code mapping matches `write-path.md` 2.11 (4).
  - The "…" menu's keys and roles follow the WAI-ARIA menu-button pattern and are consistent with `transactions.md` 2.8 (no wrap, the Tab rule).
  - The amount codes and messages match `write-path.md` 2.7's table. The pre-fill reads back to the same cents.
  - The CSP handling (`element.style`, no server-rendered `style`) is right.
  - The select field's "Already used" options, the record's own value and the "no free option" case are correct.
- **D:**
  - 2.12 and UK-Q1 give a seen/heard table with every term explained.
  - Every figure in §4 and UK-Q5 matches `output.txt`.
  - The spec agrees with the "Design re-read (live)" table: modal, "…" menu, select and delete-dialog values, the focus rule, the Escape order and the colours. The one omission is the select panel's offset (finding 17).
  - UK-Q1, UK-Q2 and UK-Q6 are answerable as written, single-choice, and recommend the best option.
