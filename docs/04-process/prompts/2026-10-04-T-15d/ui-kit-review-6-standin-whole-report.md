# Report — ui-kit review 6, stand-in, whole (T-15d S1b)

As returned by a read-only Opus reviewer that stood in for Copilot (which kept erroring), by the owner's decision of 2026-10-05, for commit 41d6bc609f722ff052a2e30f07cbdd2b7f2f9986. Lens: the whole pull request against `develop`.

PR #92 stand-in review (whole lens). Read-only; nothing edited, committed, pushed or posted.

Head confirmed: origin/task/T-15d-spec-ui-kit = 41d6bc609f722ff052a2e30f07cbdd2b7f2f9986. The merge-base equals origin/develop (5c79948), so develop is already merged in (D11).

PASSED CHECKS
- Approved-document edits stay within scope:
  - transactions.md: the Status clause, one 2.8 sentence and the v1.0.13 changelog entry.
  - tech-debt.md: the v1.29 Status clause, the TD-24 index row and the TD-24 section. The Status says "nothing else in the file changes", and that is true.
  - release-2-handoffs.md: the H3 Done cell and the new H13 row. The Status line is untouched, as plan D10 asks.
- The added lines contain no /Users/ path, design URL or project id. The only "~/" hits are the old transactions changelog text and a home-path form in a review report.
- §9 has all ten questions answered, and the spec says "No question waits".
- The select-field blur wording is the same in 2.5, 2.6, §3, §7 and TD-24: a focusout whose relatedTarget is outside the wrapper holding the trigger and its listbox.
- The header's Implements list matches §7's Traces column and the E2E-tracing table: every criterion claimed in the header has a row in the table.
- Facts checked and correct:
  - transactions.md 2.8: the listbox "holds focus while the menu is open"; Escape and Tab return focus to the trigger.
  - write-path.md: 2.7 codes and copy; 2.8 (stale ids give 404); 2.11 (2) X-Via; 2.11 (4) mapping (415 validation, 403 forbidden); the build note on busy and forbidden; §3 messages; §6 "`cancelled`, `busy`, `not_found` before any request"; 4.1 shared theme.
  - src/ui/Button.module.css has only `.primary:hover:not(:disabled)`.
  - src/webmcp/tool-result.ts has neither busy nor forbidden, and DEFAULT_TOOL_MESSAGE is a Record over every code.
  - auth.md "Timing (US-31 AC1)" is quoted exactly.
  - LoginForm and SignupForm have validateOnBlur.
  - login.spec.ts tests blur and submit; signup.spec.ts tests submit only; neither tests typing.
  - The seed in 4.2 matches prisma/data.json.
  - The COPY keys cited exist.
  - app-shell 2.5 has primaryAction; §4 says 44 px tap target.
  - MAIN_CONTENT_ID is defined.
  - The icons are listed in design-tokens.md.
  - governance v1.10, steps 1–4.

IMPORTANT (confirmed defects)

1. A component test in §7 that cannot work in jsdom.
   - Where: docs/03-specs/ui-kit.md:205 (§7, row "Component — `Modal`"), last assertion: "the panel's computed `overflow` is `visible` and the layer's `overflow-y` is `auto`".
   - What: this checks CSS-module layout through computed style in a Vitest jsdom test, and jsdom never loads that CSS.
   - Evidence:
     - vitest.config.ts on develop sets no `css` option, so Vitest's default (`css.include: []`) does not process .module.css and no rule reaches jsdom.
     - No existing test uses getComputedStyle or toHaveStyle.
     - Probed with the repo's jsdom 30 on an unstyled div: `overflow` = "", `overflowY` = "visible".
     - So the panel check either always fails (the shorthand is "") or passes even when the CSS is wrong (overflowY defaults to "visible"). The layer's `auto` can never be read.
     - This breaks the spec's own §7 rule (line 198, after app-shell.md §7): CSS is asserted in E2E with toHaveCSS.
   - Fix: move both checks to the E2E row (line 212) as `toHaveCSS("overflow-y", "auto")` on the layer and `toHaveCSS("overflow-y", "visible")` on the panel, beside the 320 px check that already exists. Drop them from the Modal component row.
   - Severity: important (a test that cannot fail, or cannot pass).

2. The select-field blur definition rests on a focus-return rule that transactions.md 2.8 does not state for pointer use.
   - Where: docs/03-specs/ui-kit.md:87 (2.6): "a choice, Escape and Tab return focus to the trigger first" (citing transactions.md 2.8). Related: line 188 (§6, the list of `Menu` changes) and release-2-handoffs.md:31 (H13 (1)).
   - What: 2.8 returns focus to the trigger only for keyboard Enter/Space, Escape and Tab (transactions.md lines 95–96). Its Pointer bullet says only "a click on an option chooses it" and "a click on the trigger opens or closes", with no focus return.
   - Consequence: if a click choice closes and unmounts the focused listbox without moving focus, focus leaves the wrapper. The relatedTarget is null, which 2.6 counts as "outside", so a pointer choice becomes a field blur and runs the check. That contradicts 2.6, §3 (line 162), §7 (line 210) and TD-24: "choosing … is not a blur". Otherwise focus is lost to `<body>`.
   - Possible further case (not verified): in WebKit a click does not focus a `<button>`, so clicking the trigger to close the menu may blur the listbox with relatedTarget null. That would also count as a blur.
   - Neither §6's `Menu` change list nor H13 (1) adds a pointer focus return.
   - Fix:
     - Add to §6's `Menu` changes and to H13 (1): "a click on an option, and a click on the trigger that closes the menu, return focus to the trigger (as Enter, Space and Escape do)".
     - Reword 2.6 so it no longer credits that rule to 2.8.
     - Add to §7's SelectField row: "choosing by click on a field with a message neither checks nor clears it".
   - Severity: important (wrong fact, and a missed requirement the definition depends on).

MINOR
3. ui-kit.md:212 (E2E row) and 214–221 (tracing table). The table gives US-16 AC1 and US-17 AC3 to budgets.md and US-24 AC2 to pots.md for E2E. The E2E row's list (what page specs must name) has no 404 "no longer exists" notice check and no "own category/theme stays selectable" check, and its Traces cell says "2.2–2.8", leaving out 2.9.
   - Fix: add both items to the row and change the cell to 2.2–2.10.
4. docs/03-specs/tech-debt.md:84 (index row) and :1062 (TD-24 heading) mention only typing. The Status clause (lines 3–7) and the body add "or chooses a new option" in a select field.
   - Fix: add those words to the row and the heading.
5. ui-kit.md:206 (ConfirmDeleteDialog row) lists the answers "204, 404, 409, 401, 429, 500, network" and leaves out 403 and 415, which 2.3 (line 47) lists among the codes that keep the dialog open.
6. ui-kit.md:87 / 76. A server `taken` "stays until the field is checked again … replaced by the new result or removed". The spec never says whether a select field's client check includes "used by another record". If it checks only for no value, the next blur removes the `taken` message while the value is still taken.
   - Fix: say what the select check covers.
7. ui-kit.md:76 says "Typing … never shows [a message]" for every amount field. US-25 AC2 (user-stories.md:161) says "Given Current Balance is $0.00, the field shows that message on any input."
   - If "on any input" means on each keystroke, the rules conflict. Name the reading (any value, on blur or submit) or hand it to pots.md explicitly.
8. ui-kit.md:103 (2.11 intro) says "a change to what the design draws is a departure in §9". The table then lists drawn changes that have no §9 question and rest on approved documents: input hover border grey-500 against the design's grey-900 (tokens "Component states"), the 44 px "…" hit area, no hover on a used option, type="text".
   - Fix: qualify the sentence, for example "…unless an approved requirement or token already decides it". transactions.md 2.15 sets the precedent for the grey-500 border.

Count of important findings: 2.
