# Report — ui-kit review 8, stand-in, delta (T-15d S1b)

As returned by a read-only Opus reviewer that stood in for Copilot (which kept erroring), by the owner's decision of 2026-10-05, for commit 8268e426595a7592ef98b092da9d0aa93a18b635. Lens: the delta of v0.8.3 (`41d6bc6` → `8268e42`). Stand-in review #8 of the controller's batch.

PR #92 stand-in review (delta lens). Read-only: nothing was edited, committed, pushed or posted.

SHA CHECK (the brief needs correcting)
- `git fetch origin` run. `git rev-parse origin/task/T-15d-spec-ui-kit` = 41d6bc609f722ff052a2e30f07cbdd2b7f2f9986, as stated, and `gh pr view 92` gives the same head (draft, open).
- The two SHAs in the brief are swapped. 8268e42 is a child of 41d6bc6, not its base: 41d6bc6 is v0.8.2 and 8268e42 is "ui-kit v0.8.3 — the stand-in review's findings (round 2)".
- 8268e42 is not on origin. It exists only on the local branch task/T-15d-spec-ui-kit-r3, so it is not pushed and is not the PR head.
- Taken literally, `git diff 8268e42 41d6bc6` is the reverse diff: it deletes the review-6 reports and the handling table's v0.8.3 section.
- I therefore reviewed the forward delta 41d6bc6 → 8268e42, which holds the fixes the handling table's newest section ("v0.8.3 — the stand-in review of `41d6bc6`") describes.
- The delta touches six files: ui-kit.md, tech-debt.md, release-2-handoffs.md, the handling table and the two new review-6 reports.
- 8268e42 must be pushed before a review of "the PR" can cover these fixes.

FIXES CHECKED AND CORRECT
- **W1 (Modal CSS).**
  - The `Modal` row (ui-kit.md:205) now says overflow is CSS, asserted in E2E.
  - The E2E row (:212) asserts the layer `toHaveCSS("overflow-y","auto")` and the panel `toHaveCSS("overflow-y","visible")`. Both checks can fail.
  - vitest.config.ts still sets no `css` option, so the reason for the fix holds.
- **W2 = D1 (pointer focus).** The new `Menu` behaviour is consistent everywhere I looked:
  - 2.6 (:87), §6 (:188) and H13 (1) (release-2-handoffs.md:31): while the menu is open, a press does not move focus (`mousedown` default prevented), and a click on an option or a closing click on the trigger returns focus to the trigger.
  - "Closing the menu by a click on its trigger is not a blur" now appears in 2.5, 2.6, §3's Error row, §7 and TD-24 "What".
  - transactions.md 2.8 Pointer (line 97) indeed states no focus return, so 2.6 no longer credits it with one.
  - The E2E row's "every engine the suites run, WebKit included" matches playwright.config.ts (chromium, firefox and webkit projects).
- **W3.** The E2E row adds the 404 notice and the edited record's own values, and its Traces cell reads 2.2–2.10.
- **W4 = D2.** The TD-24 index row (tech-debt.md:84) and the TD-24 heading (:1062) now name a new choice and say "the target".
- **W5.** The `ConfirmDeleteDialog` row lists 403 and 415, matching 2.3.
- **W6.** 2.6 says what a select field's check covers. §3's Error row ("for `taken`, a free option") and §7's `SelectField` row agree.
- **W7.** 2.5 states its reading of US-25 AC2's "on any input".
- **W8.** The 2.11 intro adds a qualifier. transactions.md 2.15 does have the row "Search input hover border grey-900 | grey-500 | tokens, 'Component states'".
- **Bookkeeping.**
  - The changelog count "two important and nine minor, nine distinct (two important, seven minor)" matches the reports: delta 0+3, whole 2+6, with D1⊂W2 and D2=W4.
  - The header lists the review of `41d6bc6`, and H13 (5) names the v0.8.3 re-read.
- **D3's design re-read.** I re-read the designer's live source myself.
  - Changelog §16a now reads "When the field error clears: Release 1 behaviour".
  - `updateModal` keeps `errs`. `modalCatOptions` and `modalThemeOptions` only set the value, and neither select field has an error span.
  - Those parts of D3's handling are accurate.

IMPORTANT

1. **The delta says the live design now follows, or "matches", Release 1's rule. The design source shows it does not, and the spec itself still lists a difference.**
   - Where:
     - tech-debt.md:1073 (TD-24 "Found"): "So the live design now matches today's rule".
     - ui-kit.md:3 (header), :7, :76 (2.5), :118 (2.11 "No longer departures"), :120, :225 (§8), :229, :251 and :336 (§9 UK-Q9) say "redrawn to Release 1's rule".
     - ui-kit.md:76 and :336 narrow the remaining difference to "the first-blur message" only.
     - ui-kit.md:110 (2.11's row) says "a field's first blur shows none … the field is checked again on blur".
   - Evidence: in `Finance App.dc.html`, `blurField(key)` returns at once when the field shows no message: `if (!cur || !cur.errs || !cur.errs[key]) return;`. The handling table's D3 row records this too: "a field already showing a message only".
     - So the design never shows a message on blur for a field that has none. This covers the first blur, and also every later blur after a valid blur has removed the message.
     - Example: submit with the amount empty → "Can't be empty"; type 5 and leave → removed; clear the field and leave again → the design shows nothing. Release 1's rule (`auth.md` "Timing", ui-kit 2.5) shows "Can't be empty".
     - Release 1's rule is therefore not what the design draws.
   - The contradictions:
     - TD-24 says the design "matches today's rule", while ui-kit.md 2.11 keeps a departure row for this exact rule and TD-24's own "What" says "`ui-kit.md` 2.11 lists the difference".
     - "The difference left is the first-blur message" is wrong in scope.
   - Fix:
     - Drop "matches today's rule" from TD-24.
     - Say "§16a is titled 'Release 1 behaviour'" rather than asserting the design follows Release 1's rule.
     - State the remaining difference in 2.5, 2.11's row and §9 as: "the design re-checks on blur only a field that already shows a message; a field showing none gets no message on blur, first or later".
   - Severity: important (wrong fact, and a contradiction between two documents in this delta).

MINOR

2. **ui-kit.md:110 (2.11's row): "each form opens on a free option" is not true when no option is free.**
   - Evidence: the design's `openAdd` uses `CATS.find(c => !usedCats.has(c)) || CATS[0]` and `firstFreeTheme()` falls back to `THEMES[0]`. With every option used, the form opens on a used option.
   - Fix: write "each add form opens on the first free option (the design falls back to the first option when none is free)", or drop the parenthesis.

3. **ui-kit.md:339 (§9 UK-Q9 answer): "The blur check, which the design does not draw, stays as US-31 AC1 asks" is now stale.**
   - The re-read paragraph added on the next line, :336 in this delta, says the design re-checks on blur (`blurField()`).
   - Fix: write "the blur check of an untouched or message-free field, which the design does not draw, …", or add "(as first read)".

4. **ui-kit.md:159 (§3, Select field "Open" row): the exits "Escape, Tab, outside click, a choice" leave out closing by a click on the trigger.**
   - 2.6 (:87) now treats that close as a distinct, specified case: focus returns to the trigger and it is not a blur. transactions.md 2.8 Pointer allows it ("a click on the trigger opens or closes").
   - The changelog says §3 was updated for the trigger click, but only the Error row was.
   - Fix: add "a click on its trigger" to the Open row's exits.

5. **ui-kit.md:80, :87, :188 and H13 (1) change the Approved `transactions.md` 2.8 `Menu` "for every use", with no amendment of that spec.**
   - The change: a pointer choice or closing click now returns focus to the trigger, and `mousedown` is prevented while the menu is open.
   - This alters observable focus behaviour on the Transactions page, unlike v0.8.2's Escape `stopPropagation`, which had no effect there.
   - transactions.md 2.8's Pointer bullet (line 97) still states no focus return, and its v1.0.13 entry in this same PR says "no behaviour of this page".
   - Fix: add the pointer focus rule to transactions.md 2.8 in its v1.0.13 amendment, and adjust its changelog wording. Or tell the owner explicitly that the Approved spec's `Menu` behaviour changes through H13 (1).
   - Plausible rather than proven: the earlier rounds accepted the same mechanism for the Escape change.

Count of important findings: 1 (in the forward delta 41d6bc6 → 8268e42; the brief's literal reverse diff is a mis-specified range, noted above).
