# Report — ui-kit review 5, stand-in, delta (T-15d S1b)

As returned by a read-only Opus reviewer that stood in for Copilot (which errored), by the owner's decision of 2026-10-05, for commit 3ad9032f758ea19409047f9ad45bcd6b64afcd56. Lens: the delta of v0.8.1 (`00fc2cf` → `3ad9032`).

I found 2 important and 1 minor defects in the delta. The branch head is confirmed: `git rev-parse origin/task/T-15d-spec-ui-kit` = `3ad9032f758ea19409047f9ad45bcd6b64afcd56`.

**Important**

1. **`docs/03-specs/ui-kit.md:87` (2.6, the new bullet "A choice is not a check")**
   - What is wrong: the reason it gives is false. It says "after a choice focus returns to the trigger (`transactions.md` 2.8's focus return), so the field has not been left".
   - Evidence: `transactions.md` 2.8 (on develop, about line 93) says the highlighted option is named by `aria-activedescendant` "on the listbox, which holds focus while the menu is open". Opening the menu therefore moves focus off the trigger, so the trigger blurs before any choice. The same section says Tab in the open menu sends focus to the trigger first, then moves it on.
   - Consequence: the rule in 2.6, §3 (line 162) and §7 (line 210) is "the trigger's next blur". Read literally, that check runs when the menu opens, against the old value.
     - For a server `taken`, the value is still present, so the field passes the only client check (a value is set). The message is removed at open, before the choice.
     - That breaks §7's `SelectField` assertion: "the message and `aria-invalid` stay after a valid choice".
     - It also means an untouched select would get its blur check just from being opened.
   - Fix: define the select field's blur as focus leaving the field as a whole: the trigger and its listbox, i.e. a `focusout` whose `relatedTarget` is outside the field's wrapper. Opening, moving the highlight, choosing and Escape are then not a blur. Replace "so the field has not been left" with that definition, and use the same wording in §3 line 162 and §7 line 210.

2. **`docs/03-specs/tech-debt.md:1076, 1089, 1095` (TD-24) was not updated for F1's widening of 2.5**
   - What is wrong: 2.5 (`ui-kit.md:76`) now covers "the amount fields here, the select fields of 2.6 (where a choice is not a check) and `pots.md`'s Pot Name". TD-24 still disagrees with it in three places:
     - "What" (line 1076) still describes 2.5 as "the amount fields and `pots.md`'s Pot Name".
     - "Guarded meanwhile by" (line 1089) names only §7's `AmountField` row. The new `SelectField` assertion also pins the rule now.
     - "Fix" (line 1095) lists "`ui-kit.md` 2.5, §3, §7" but not 2.6. Line 87's bullet states the current rule for selects and would be left contradicting the fix when TD-24 is closed.
   - Evidence: TD-24 itself says the design's prototype clears "each field's" error in `onChange`, and the previous facts report called clear-on-choice "the design's rule the owner set aside as TD-24". `ui-kit.md` 2.11's row (line 109) also names only typing.
   - Fix:
     - TD-24 "What": add "the select fields of 2.6 (a choice does not clear a message)".
     - "Guarded meanwhile by": add the §7 `SelectField` row.
     - "Fix": amend 2.5, 2.6, §3 and §7.
     - 2.11's row: add "or chooses a new option" on the design side.
     - Bump `tech-debt.md`'s version line.

**Minor**

3. **`docs/03-specs/ui-kit.md:188` (§6) and `release-2-handoffs.md:31` (H13 (1)): the F3 fix covers only `Button`'s `.primary`**
   - What is wrong: 2.7 (line 92) says "Deleting…" and a pending "No, Go Back" also show no hover. But "Yes, Confirm Deletion" is "the tokens' destroy button", whose hover is red with underlined text (UK-Q5 (a), H13 (6)). `Button.module.css` has only `.primary`, and §6 lists no destroy or secondary `Button` variant. Nothing in §6, H13 (1) or H13 (6) excludes `[aria-disabled="true"]` from the underline hover or from "No, Go Back"'s hover.
   - Fix: in H13 (6) and §6, add "no hover with `[aria-disabled="true"]`" to the destroy and "No, Go Back" states, or say that both buttons are `Button` variants covered by the new rule.

**Checked and correct**
- F2: §3 line 148 now says `aria-disabled`, matching 2.3 line 47 and §7 line 206. The only "inert" left for "No, Go Back" is in the v0.4 changelog entry, which is history.
- F3: the §6 and H13 (1) sentence matches `src/ui/Button.module.css` on develop exactly: only `.primary:hover:not(:disabled)`.
- F4: matches `src/webmcp/tool-result.ts`. `TOOL_ERROR_CODES` has seven codes, neither `busy` nor `forbidden`, and `DEFAULT_TOOL_MESSAGE` is a `Record<ToolErrorCode, string>`. It also matches `write-path.md` lines 155–156, and 2.3 item 4 does list 403 → `"forbidden"`.
- F5: US-33 AC3 ("At 320 px every page remains usable") and US-40 AC3 ("via tool" marker) match `user-stories.md`. Both are traced in §7.
- S1: the governance v1.10 quote "Every amendment of an Approved document" is verbatim (governance line 61). The D14 quote in H13 (5) is verbatim (plan line 93).
- S2: the Status line of `release-2-handoffs.md` is byte-identical to origin/develop's (`cmp` on line 3). The only other differences from develop are the H3 Done cell and the H13 row, which D10 allows.
- S3: the header (line 7) and H13 (5) both say "(v0.3, again for v0.6 and v0.7)".
- The changelog entry's count ("one important … and seven minor") and the "v0.8.1" table in `ui-kit-review-handling.md` both match the two reports.

VERDICT: 2 important findings