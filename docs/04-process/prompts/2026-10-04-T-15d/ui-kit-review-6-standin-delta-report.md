# Report — ui-kit review 6, stand-in, delta (T-15d S1b)

As returned by a read-only Opus reviewer that stood in for Copilot (which kept erroring), by the owner's decision of 2026-10-05, for commit 41d6bc609f722ff052a2e30f07cbdd2b7f2f9986. Lens: the delta of v0.8.2 (`3ad9032` → `41d6bc6`).

PR #92 delta review, 3ad9032 -> 41d6bc6 (read-only stand-in for Copilot)

Verified: git fetch origin; `git rev-parse origin/task/T-15d-spec-ui-kit` = 41d6bc609f722ff052a2e30f07cbdd2b7f2f9986. The delta is one commit, 41d6bc6 ("ui-kit v0.8.2"). It touches six files: ui-kit.md, tech-debt.md, release-2-handoffs.md, the handling table and the two new report files.

Result: 0 important findings, 3 minor. All four fixes in the handling table's v0.8.2 section (D1=W1, D2=W3, W2, D3) were applied where the table says, and none introduces a contradiction.

**Checked and correct**
- **D1=W1 (select-field blur).** The new definition is consistent with `transactions.md` 2.8, lines 93–96:
  - the listbox holds focus while the menu is open;
  - a choice, Escape and Tab/Shift+Tab return focus to the trigger first, then the browser moves on.
  - The "`position: relative` wrapper above" exists in 2.6 (line 83, the trigger and panel share it).
  - The same wording is in 2.5 (line 76), 2.6 (line 87), §3 (line 162) and §7's `SelectField` row (line 210).
  - §7 adds the open/close assertions: untouched empty field, a field with a message, and Tab out of the open menu.
  - No "trigger's blur" wording is left anywhere in ui-kit.md.
- **D2=W3 (TD-24).** All of these now cover the select fields:
  - "What", "Where it applies" (2.6), "Guarded meanwhile by" (`AmountField` and `SelectField` rows), "Fix" (2.5, 2.6, §3, §7) and "How it will be verified";
  - the Status clause, which keeps v1.29;
  - 2.11's row (line 110) and §8.
  - The edits stay inside what plan D10 allows: the Status line and the TD-24 section only.
  - Not bumping the version is a deliberate deviation from the delta report, explained in the handling row ("the pull request has not merged").
- **W2 (US-40 AC3).** The §7 traces table (line 221) and the E2E row (line 212) now trace US-40 AC3, matching the header (line 4). "Visible in the UI immediately (same state as a user action)" in `user-stories.md:251` matches "the page changes as after a person's delete".
- **D3 (no hover while pending).**
  - 2.3 (line 42) gives both dialog buttons "no hover with `[aria-disabled="true"]`".
  - §6 (line 188) and H13 (1) and (6) (`release-2-handoffs.md:31`) carry it; the parentheses are balanced.
  - §7's E2E row lists the pending submit, confirm and Go Back.
  - The handoffs Status line is untouched; only line 31 changed.
- **Bookkeeping.**
  - The changelog's count, "three important and one minor", matches the table (D1=W1 important, D2 important, W2 important, D3 minor).
  - The Status line says "reviews of `00fc2cf` and `3ad9032`".
  - Both report files match the findings in the table.

**Minor**

1. **`docs/03-specs/ui-kit.md:87` (2.6), also line 162 (§3) and line 210 (§7): the new blur definition misses closing the menu by clicking its own trigger.**
   - What: the rule is "a `focusout` whose `relatedTarget` is outside the wrapper", with no `relatedTarget` counted as outside. It lists what is not a blur: opening, moving the highlight, choosing and Escape. It does not cover closing the menu by clicking the trigger, which `transactions.md` 2.8 line 97 allows ("a click on the trigger opens or closes").
   - Evidence: in WebKit/Safari a mouse click does not focus a `<button>`. So mousedown on the trigger while the listbox holds focus fires `focusout` with `relatedTarget` null. That is "outside" by the new rule.
   - Consequence: an untouched empty select that is opened and then closed by clicking its trigger counts as "focused and left" and shows its message while focus is still on the field. §7 asserts no message only for closing by Escape or by a choice. The E2E suites run on WebKit (TD-24's verification names Chromium, Firefox and WebKit).
   - Fix: add closing by a trigger click to the list of non-blurs. Implement it either by treating a `pointerdown` inside the wrapper as keeping the field, or by having a trigger-click close return focus to the trigger the way the other closes do. Then add "closing by a click on the trigger" to §7's `SelectField` assertion.

2. **`docs/03-specs/tech-debt.md:84` (TD-24 index row) and `:1062` (TD-24 heading): not updated with the D2 fix.**
   - What: both still say "the design clears it as soon as the person types". The Status clause (lines 3–7), "What" (line 1081) and "Fix" now say "types or chooses a new option".
   - Fix: append "or chooses a new option" to the index row and the heading, or keep them general ("…clears it on change").

3. **`docs/03-specs/tech-debt.md:6` (Status), `:1081` ("What"), and `docs/03-specs/ui-kit.md:110` (2.11) and §8: the claim that the design also clears a select's message on a new choice has no cited design re-read.**
   - What: line 6 attributes "clears it as soon as the person types or chooses a new option" to "the designer's changelog §16a". The §16a text quoted in TD-24's own "Found" bullet (lines 1065–1066) says only "The message clears as soon as the user types in the field".
   - Both review reports made this step conditional ("If the prototype's `onChange` clears a select's error on a choice too"). The handling row D2's "Checked" column lists only `tech-debt.md` and `ui-kit.md` as at `3ad9032`, not the design, and the ui-kit header still lists re-reads only for v0.3, v0.6 and v0.7.
   - It is plausibly true: TD-24 says "each field's `onChange` deletes that field's error", and handling line 152 says `updateModal()` clears on edit. But it is not confirmed from the source.
   - Fix: either confirm the prototype's select choice clears the error and cite where, or attribute it to the prototype's `onChange`/`updateModal()` instead of §16a. If it cannot be confirmed, ask the owner (AGENTS.md "Never fabricate").

VERDICT: 0 important findings, 3 minor.
