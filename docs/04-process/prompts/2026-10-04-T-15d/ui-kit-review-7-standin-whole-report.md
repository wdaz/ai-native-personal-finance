# Report — ui-kit review 7, stand-in, whole (T-15d S1b)

As returned by a read-only Opus reviewer that stood in for Copilot (which kept erroring), by the owner's decision of 2026-10-05, for commit 8268e426595a7592ef98b092da9d0aa93a18b635. Lens: the whole pull request against `develop`. Stand-in review #6 of the controller's batch.

PR #92 stand-in review (whole lens), read-only. Nothing was edited, committed, pushed or posted.

PRECONDITION: SHA CHECK FAILED
- After `git fetch origin`, `origin/task/T-15d-spec-ui-kit` is 41d6bc609f722ff052a2e30f07cbdd2b7f2f9986 (v0.8.2), not the expected 8268e426595a7592ef98b092da9d0aa93a18b635.
- 8268e42 ("ui-kit v0.8.3 — the stand-in review's findings (round 2)") exists only on the local branch `task/T-15d-spec-ui-kit-r3`. It is one commit ahead of 41d6bc6 and has not been pushed. Anyone looking at PR #92 on GitHub still sees v0.8.2.
- I reviewed 8268e42, the intended head, using `git diff origin/develop...8268e42`. This does not count as a document defect. Push 8268e42 (or confirm which head is meant) before relying on this review.

CHECKS THAT PASSED
- Approved-doc scope:
  - `transactions.md`: only the Status clause, the one 2.8 sentence, and the v1.0.13 changelog entry.
  - `tech-debt.md`: only Status v1.29, the TD-24 index row, and the TD-24 section.
  - `release-2-handoffs.md`: only the H3 status cell and H13.
- No `/Users/` path, URL, design address or project id appears in any added line.
- §9: UK-Q1 to UK-Q10 are all answered, and "No question waits" holds.
- Select-field blur definition: the same wording appears in 2.5, 2.6, §3, §7 (`SelectField`) and TD-24 "What". That wording is "a focusout whose relatedTarget is outside the wrapper holding the trigger and its listbox". The list of non-blurs is identical in all five places.
- Header "Implements" against the §7 E2E-tracing table: every claimed criterion is assigned. US-31 has AC1–AC3 and US-34 has AC1–AC2, matching the stories.
- Facts against develop all hold:
  - `transactions.md` 2.8: keys return focus; the "Pointer" bullet has no focus return; the listbox holds focus.
  - `write-path.md` 2.11 (4): 415 maps to `validation`, 403 to `forbidden`; plus the build note, §3 and §6.
  - `Button.module.css` has only `.primary:hover:not(:disabled)`.
  - `tool-result.ts`: `TOOL_ERROR_CODES` lacks `busy` and `forbidden`, and `DEFAULT_TOOL_MESSAGE` is a `Record` over every code.
  - Also confirmed: `Field.module.css` states, `PageHeader.module.css` `.compactActions`, `MAIN_CONTENT_ID`, `LoginForm.validateOnBlur`, the `auth.md` "Timing (US-31 AC1)" text, the `login.spec`/`signup.spec` blur/submit claims, the seed figures in 4.2, and the `COPY` strings named "exists" in 2.12.

DEFECTS

1. [important] `docs/03-specs/tech-debt.md:109` (in the TD-24 "Fix" section) contradicts `ui-kit.md` 2.5 and §9 UK-Q9.
   - What: TD-24 "Fix" says to "drop `ui-kit.md` 2.11's row" when the debt is fixed.
   - Evidence: since v0.8.3 that row also records the first-blur difference:
     - 2.11 row: "A field's message first appears on submit only — a field's first blur shows none".
     - `ui-kit.md:76` (2.5): "the difference left is that the design shows no message on a field's first blur (2.11)".
     - `ui-kit.md:339` (UK-Q9): "the difference left is the first-blur message (2.11)".
   - TD-24 does not change that difference: the blur check stays. So dropping the row would erase a departure that is still live. Also, the live design no longer clears on typing, so the fix itself would create a new difference from the design, which 2.11 would then need to list.
   - Fix: change the bullet to "amend `ui-kit.md` 2.11's row (keep the first-blur difference; record any difference the re-read design then shows)".

2. [important] `docs/03-specs/tech-debt.md:85` (the TD-24 index row) gets the source wrong, and the record says it was already fixed.
   - What: the row says "the target clears it as soon as the person types or chooses a new option (the designer's changelog §13a, §16a as first written)". That credits the "chooses a new option" part to the designer's changelog.
   - Evidence that this is wrong:
     - TD-24's own "What" says the select part is "in `ui-kit.md`'s reading (the design has no select message to clear)".
     - `ui-kit.md` 2.11's row and §8 say "in this spec's reading, on a new choice".
     - The v0.8.3 changelog says TD-24 "attributes the select part to this spec's reading, not to §16a".
   - Evidence that it was recorded as fixed: `ui-kit-review-handling.md` (v0.8.3, row D3) lists the "index row" among the places fixed.
   - Fix: change the parenthesis to "(typing: the designer's changelog §13a, §16a as first written; a new choice: `ui-kit.md`'s reading)".

3. [important] `docs/03-specs/ui-kit.md:97` (2.8, "Fit") points to a check that §7 does not have.
   - What: 2.8 says the header's actions wrap at narrow widths and "the E2E check at 320 px (§7) proves nothing is clipped". §4.4 (line 179) repeats "the header wraps (2.8)".
   - Evidence: §7's E2E row (line 212) has only "320 px with a modal open, the layer … the panel … the Theme field's options fully visible". It says nothing about the page header at 320 px. With a modal open the page behind is `inert`, and the row asserts nothing about the header.
   - Result: the 2.8 wrap rule and its link to US-33 AC3 have no test that could fail, and page specs that copy §7's E2E row will not add one.
   - Fix: add to the E2E row: "at 320 px with no modal open, the header button and the compact actions are fully inside the viewport (each `boundingBox()` within the page width; no horizontal scroll)".

4. [minor] `docs/03-specs/ui-kit.md:95` (2.8): a CSS change has no test that would catch a regression.
   - What: the build note says that with a `primaryAction` the `.compactActions` group stays visible at 1024 px and up, and the indicator and "Log out" are hidden one by one. Today's CSS hides the whole group at 1024 px and up (`PageHeader.module.css:23-26`), so built without this change the header button would vanish on desktop.
   - Evidence: §7's `PageHeader` component row tests only the order and the name. jsdom loads no CSS, as the v0.8.3 handling row W1 notes. The E2E row's "hover and focus … on the header button" gives no width.
   - Fix: in the E2E row, state "at 1440 px the header button is visible, and the indicator and Log out are not".

5. [minor] `docs/03-specs/ui-kit.md:159` (§3, "Select field | Open"): the Exit column is incomplete.
   - What: it lists "Escape, Tab, outside click, a choice" but leaves out a click on the trigger.
   - Evidence: 2.6, `transactions.md` 2.8 "Pointer", and the §7 `SelectField` row all treat a trigger click as a way to close.
   - Fix: add "a click on its trigger".

6. [minor] `docs/03-specs/ui-kit.md:68-69` (2.4): the spec doesn't say where focus goes when the "…" menu is opened by pointer.
   - What: the keys "focus the first item" and the open menu says "(focus moves onto the items)". The Pointer bullet only says "a click on the trigger opens or closes".
   - Evidence: 2.6 itself notes that in WebKit (and Firefox on macOS) pressing a button does not focus it. So after a pointer open, focus is on neither the trigger nor an item, and the in-menu keys (ArrowDown/Up, Home/End, Escape) have nothing focused inside the menu to act on.
   - Fix: say that a pointer open moves focus to the first item (or to the menu), as `Menu`'s listbox takes focus whenever it is open.

Important count: 3. Of the minor findings, 4 is about test coverage and 5–6 are spec gaps. The unpushed head is a separate blocker for anyone reviewing on GitHub.
