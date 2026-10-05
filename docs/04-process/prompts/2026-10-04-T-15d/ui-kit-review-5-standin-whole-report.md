# Report — ui-kit review 5, stand-in, whole (T-15d S1b)

As returned by a read-only Opus reviewer that stood in for Copilot (which errored), by the owner's decision of 2026-10-05, for commit 3ad9032f758ea19409047f9ad45bcd6b64afcd56. Lens: the pull request as a whole (`origin/develop...3ad9032`).

I found 2 important and 1 minor findings. I confirmed `origin/task/T-15d-spec-ui-kit` is at `3ad9032f758ea19409047f9ad45bcd6b64afcd56`. I reviewed `git diff origin/develop...origin/task/T-15d-spec-ui-kit` as a whole, checking the v0.8.1 fixes against the rest of the PR.

1. **important** — `docs/03-specs/ui-kit.md:87` (2.6, "A choice is not a check"), with line 162 (§3 "Select field | Error / `taken`") and line 210 (§7 `SelectField` row)
   - **What is wrong:** 2.6 says that after a choice, focus returns to the trigger, "so the field has not been left", and that the field is checked again "at the trigger's next blur". But the `Menu` it is built on moves focus off the trigger as soon as the menu opens. The trigger therefore blurs on every open, not only when the person leaves the field.
   - **Evidence:** `transactions.md` 2.8 (line 93 on the branch) says the highlighted option is named by `aria-activedescendant` "on the listbox, which holds focus while the menu is open". 2.5 (line 76) shows a message on blur "once the field has been touched (focused and left)".
   - **Failure:** read as written, an empty select (the "No free option" case, or a form that opens with no value) counts as "focused and left" when its menu opens. Its message then appears while the person is still choosing, and by 2.6 it stays after they make a valid choice. With a `taken` message, opening the menu re-checks the field. Either way, the v0.8.1 explanation contradicts the spec it cites.
   - **Fix:** in 2.6, define a select field's blur as focus leaving the field as a whole: a `focusout` whose `relatedTarget` is outside the wrapper that holds the trigger and its listbox. Opening the menu and returning to the trigger are then not a blur. Add a §7 `SelectField` assertion that opening and closing the menu neither shows nor clears a message.

2. **important** — `docs/03-specs/ui-kit.md:214–221` (§7, "Which page spec E2E-traces each criterion") against the header at line 4
   - **What is wrong:** v0.8.1 added US-40 AC3 to the header's "Implements" line (finding F5). The §7 paragraph says "each criterion the header claims is also traced at E2E level by the page spec named here", but the table's US-40 row (line 221) lists only AC2. US-40 AC3 is claimed and never assigned. US-33 AC3, added in the same fix, is in the table (line 220).
   - **Evidence:** the header has "US-40 AC2 (…), AC3 (the delete's `X-Via: webmcp`)". Line 221 has "US-40 AC2 (`delete_budget` / `delete_pot`, …)". PRD M2 (`prd.md:120`) asks for every story to be traced by a test.
   - **Fix:** extend line 221 to "US-40 AC2, AC3 (… the delete carries `X-Via: webmcp`, and the page changes as after a person's delete)" for `budgets.md` / `pots.md`. Alternatively, name `write-path.md` 7.6 as AC3's trace and limit the paragraph's claim to match.

3. **minor** — `docs/03-specs/tech-debt.md:1076, 1089, 1095` (TD-24 "What", "Guarded meanwhile by" and "Fix")
   - **What is wrong:** v0.8.1 extended Release 1's timing to the select fields. 2.5 (line 76) now names "the select fields of 2.6", 2.6 gained "A choice is not a check" (line 87), and §7's `SelectField` row pins it. TD-24 was not updated:
     - "What" (line 1076) still scopes the rule to "the amount fields and `pots.md`'s Pot Name".
     - "Guarded meanwhile by" (line 1089) names only the `AmountField` row.
     - "Fix" (line 1095) lists `ui-kit.md` "2.5, §3, §7" but not 2.6.
   - The 2.11 UK-Q9 row (`ui-kit.md:110`) also describes only clearing on typing. If the prototype's `onChange` clears a select's error on a choice too, a choice is a departure as well. TD-24 itself says "each field's `onChange` deletes that field's error".
   - **Fix:** in TD-24, add the select fields of 2.6 to "What", the `SelectField` row to "Guarded meanwhile by", and 2.6 to "Fix". If the design clears a select's message on a choice, say "or chooses an option" in the 2.11 row.

**Checked and in order:**
- The edits to Approved documents stay within their limits:
  - `transactions.md`: only the 2.8 sentence, the Status line's v1.0.13 clause and the v1.0.13 changelog entry.
  - `tech-debt.md`: only the v1.29 Status line, the TD-24 index row and the TD-24 section.
  - `release-2-handoffs.md`: only the H3 Done cell and the H13 row. Its Status line is identical to `develop`'s.
- The added lines contain no `/Users/` path, URL, design address or project id.
- UK-Q1 to UK-Q10 are all answered in §9, and no question is left waiting.
- The owner's quotes are identical across `ui-kit.md`, `tech-debt.md` and `ui-kit-review-handling.md`.
- The other v0.8.1 fixes are consistent with the code and the specs they cite:
  - F2: §3's pending "No, Go Back" is `aria-disabled`.
  - F3: `Button.module.css` has only `.primary:hover:not(:disabled)`.
  - F4: `TOOL_ERROR_CODES` and `DEFAULT_TOOL_MESSAGE` have neither code, as `write-path.md:156` says.
  - S1: the governance v1.10 citation.
  - S3: the re-read versions.
- The header's other claims match §7's Traces.

VERDICT: 2 important findings