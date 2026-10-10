# Report — ui-kit review 8, stand-in, whole (T-15d S1b)

As returned by a read-only Opus reviewer that stood in for Copilot (which kept erroring), by the owner's decision of 2026-10-05, for commit 8268e426595a7592ef98b092da9d0aa93a18b635. Lens: the whole pull request against `develop`. Stand-in review #9 of the controller's batch. `8268e42` was not yet pushed, so this reviewer read the branch's head on GitHub, `41d6bc6`; its findings were checked against `8268e42` (`ui-kit-review-handling.md`, "v0.8.4").

Stand-in Copilot review of PR #92. Read-only: I edited, committed, pushed and posted nothing.

Verified: `git fetch origin`, then `git rev-parse origin/task/T-15d-spec-ui-kit` = 41d6bc609f722ff052a2e30f07cbdd2b7f2f9986. The branch contains origin/develop (develop is merged in, D11).

## Important

**1. docs/03-specs/ui-kit.md:205 (§7, row "Component — `Modal`"): a CSS assertion sits at the jsdom level, where no stylesheet is loaded.**
- **What:** the row asserts "the panel's computed `overflow` is `visible` and the layer's `overflow-y` is `auto`" inside a Vitest + jsdom component test.
- **Evidence:**
  - `vitest.config.ts` on develop has no `css` option. Vitest's default (`css.include: []`) does not process CSS modules: they come back as class-name proxies and no style is injected.
  - No unit test on develop calls `getComputedStyle` or `toHaveStyle`.
  - `app-shell.md` v1.3, §7 Component row and changelog, says hover and focus are "asserted in E2E with `toHaveCSS`, since jsdom applies no stylesheet". `ui-kit.md` §7's own intro (line 198) sends styles to E2E as well.
- **Result:**
  - The layer's `overflow-y: auto`, written in a CSS module as 2.2 intends, can never be seen, so the assertion fails against a correct build. The only way to pass it is an inline `element.style` the spec never asks for.
  - The panel's `overflow: visible` is jsdom's default or empty, never a value from the stylesheet. That assertion cannot detect a regression such as a panel that gets `overflow: auto` back. It is a test that cannot fail for the right reason.
  - This is UK-Q10's rule (the layer scrolls, the panel never clips), so its only direct check is not real.
- **Fix:** remove the computed-overflow clause from the `Modal` component row. Add it to §7's E2E row: with a modal open, `toHaveCSS("overflow-y", "auto")` on the layer and `toHaveCSS("overflow-x", "visible")` / `toHaveCSS("overflow-y", "visible")` on the panel. Keep the existing 320 px "options fully visible after scrolling the layer" check beside it. Optionally say so in the row ("asserted in E2E, jsdom applies no stylesheet").
- **Severity:** important (a test that cannot fail or cannot pass; it guards an owner-and-designer decision, UK-Q10 / changelog §16b).

## Minor

**2. docs/03-specs/ui-kit.md:68 (2.4, the "…" menu's keys): a bare "2.8" points to the wrong section.**
- **What:** "no wrap, as 2.8's listbox" and "(2.8's rule, so focus is never lost when the menu unmounts)" mean `transactions.md` 2.8. In this spec, a bare "2.8" is its own page-header button section: see 2.1's table (line 19), 4.4 (line 179) and §6 (line 188).
- **Effect:** a reader who follows the reference lands on the header button, which has no listbox and no Tab rule. The same bare form appears in 2.6 (lines 80–84), but there the section's first sentence names `transactions.md` 2.8.
- **Fix:** write `transactions.md` 2.8 at line 68 (both places), and preferably at lines 80–84 too.

**3. docs/03-specs/tech-debt.md, TD-24's index row (diff line +81) and its heading (+1059): the title covers typing only.**
- **What:** both say only "the design clears it as soon as the person types".
- **Mismatch:** since v0.8.2, TD-24's Status clause, "What", "Fix" and "How it will be verified" also cover a new choice in a select field ("or chooses a new option"), and so does `ui-kit.md` 2.11's row.
- **Fix:** add "or chooses a new option" to the index row and the heading.

## Checked and consistent (no finding)

- **Select-field blur.** The definition is the same in 2.5, 2.6, §3 (Select field | Error / `taken`), §7 (`SelectField` row) and TD-24's "What" and "Guarded meanwhile by": focus leaving the trigger plus listbox wrapper, i.e. a `focusout` whose `relatedTarget` is outside it, with none counting as outside.
  - It matches `transactions.md` 2.8 on develop. The listbox "holds focus while the menu is open". Enter and Space choose and return focus to the trigger, and Escape returns it there too. Tab and Shift+Tab move focus to the trigger first, then let the browser move on.
  - So opening the menu, moving the highlight, choosing and Escape are rightly not a blur, and Tab out is one.
  - 2.6 puts the panel inside the shared `position: relative` wrapper, as the definition needs.
- **Header "Implements" against §7.** Every claimed criterion appears in §7's Traces column or in the "Which page spec E2E-traces each criterion" table: US-15 AC1/AC2/AC4, US-16 AC1, US-17 AC1/AC3, US-22 AC1/AC2, US-23 AC1, US-24 AC1/AC2, US-25 AC2, US-26 AC2, US-31 AC1–AC3, US-32 AC1/AC2, US-33 AC3, US-34 AC1/AC2, US-40 AC2/AC3. The table and the E2E row agree, US-40 AC3 included.
- **Edits to Approved documents stay in scope.**
  - `transactions.md`: only the 2.8 sentence (pot "…" menu now specified by `ui-kit.md` 2.4), the Status clause naming v1.0.13, and the v1.0.13 changelog entry.
  - `tech-debt.md`: only the v1.29 Status clause, the TD-24 index row and the TD-24 section.
  - `release-2-handoffs.md`: only the H3 Done cell and the new H13 row. The Status line is untouched, as plan D10 requires.
- **TD-24 and `ui-kit.md` agree.** Same owner quotes as §9 UK-Q9. Same sections named (2.5, 2.6, §3, §7, 2.11). Its test facts hold on develop: `login.spec.ts` checks the blur and submit messages, `signup.spec.ts` checks submit, and neither checks typing. `SignupForm` has `validateOnBlur`.
- **Facts checked against develop:**
  - `src/ui/Button.module.css` has only `.primary:hover:not(:disabled)`.
  - In `src/webmcp/tool-result.ts`, `TOOL_ERROR_CODES` has neither `busy` nor `forbidden`, and `DEFAULT_TOOL_MESSAGE` is a `Record<ToolErrorCode, string>`.
  - `write-path.md` agrees on 2.7 (codes and copy), 2.11 (2) and (4) (`X-Via`; 403 `forbidden`, 415 `validation`), §3 (Record gone, 409, 401, 403/415 "Something went wrong"), §6 ("`cancelled`, `busy`, `not_found` before any request", `{ deleted: true }`) and 4.1 (a budget and a pot may share a theme).
  - The `auth.md` "Timing (US-31 AC1)" quote matches, and so does ADR-0003's "focus trap, menu keyboard, validation rendering".
  - Also confirmed: `MAIN_CONTENT_ID`, `ThemeBar`'s `data-theme`, the token values (spacing, radius, `--tap-target-min`, `--duration-hover`, focus ring), and that `Field` has none of the four new props today.
  - The `COPY` keys cited as existing all exist.
  - The 4.1 examples match `output.txt`, and `$999,999,999.99` has 15 characters.
- **No forbidden content.** No `/Users/` path, design address or project id in the added lines. Only commit SHAs, and `~/…` paths in the prompt records.
- **§9.** UK-Q1 to UK-Q10 are all answered. The Status line says no question waits.

Important count: 1.
