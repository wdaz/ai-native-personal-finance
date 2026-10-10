# Report — ui-kit review 7, stand-in, delta (T-15d S1b)

As returned by a read-only Opus reviewer that stood in for Copilot (which kept erroring), by the owner's decision of 2026-10-05, for commit 8268e426595a7592ef98b092da9d0aa93a18b635. Lens: the delta of v0.8.3 (`41d6bc6` → `8268e42`). Stand-in review #5 of the controller's batch.

PR #92 delta review, 41d6bc6..8268e42 ("docs(specs): ui-kit v0.8.3 — the stand-in review's findings (round 2)")

PRECONDITION FAILED. After `git fetch origin`, `git rev-parse origin/task/T-15d-spec-ui-kit` returns 41d6bc609f722ff052a2e30f07cbdd2b7f2f9986, and `git ls-remote` agrees. It is not 8268e426595a7592ef98b092da9d0aa93a18b635. Commit 8268e42 exists only locally, on branch `task/T-15d-spec-ui-kit-r3`, so it has not been pushed to the PR. I reviewed the local commit as the delta. The findings below are about 8268e42 and the PR will not show them until that commit is pushed.

I checked the design claims behind D3 against the designer's live source on 2026-10-05:
- CHANGELOG §16a reads "When the field error clears: Release 1 behaviour". It also says "form decisions do not change. Forms follow Release 1 and the spec" and "the error stays while typing. It is re-checked on the next blur or submit".
- In `Finance App.dc.html`, `updateModal` keeps `errs`. `blurField` returns early when the field has no message, so a first blur shows nothing. It is wired only to `#modal-name` and `#modal-amount`.
- `modalCatOptions` and `modalThemeOptions` only set the value. Neither select field has an error span.
- `openAdd` opens each form on a free option.

All of these match the spec text. Fixes W1, W2 (2.5, 2.6, §3, §6, §7, TD-24 "What", H13 (1)), W3, W5, W6 and W8 are present where the handling table says. The finding counts in the changelog (2 important + 9 minor = 11; 9 distinct, of which 2 important and 7 minor) are consistent. The `transactions.md` 2.8 "Pointer" text (no focus return on a click) and the 2.15 row ("Search input hover border grey-900 | grey-500 | tokens, 'Component states'") are quoted correctly.

IMPORTANT

1. docs/03-specs/ui-kit.md:76 (2.5, the new US-25 AC2 sentence, fix W7). This contradicts 2.5's own check order.
   - What: the sentence reads US-25 AC2 ("Given Current Balance is $0.00, the field shows that message on any input") as "any value the field is checked with, at its blur or at submit". So with a $0.00 balance, every checked value would show "Amount exceeds your current balance".
   - Evidence: the same bullet list says the shared parse runs first and "the page adds its own rules after these (Pots' `exceeds_balance`, …)". With a $0 balance, "" gives `required`, "abc" gives `invalid_format` and "0" gives `too_small`, so none of them shows the AC's message. The sentence also says "`pots.md` states it for its field", but no `pots.md` exists on this commit, on `origin/develop` or on any remote branch, and no handoff requires it to say so.
   - Fix: limit the sentence to timing ("on any input" means whenever the field is checked, not at each keystroke). Say which message wins at $0 (for example: any value that passes 2.5's checks shows `exceeds_balance`; empty, malformed or 0 show 2.5's message). Either the PRD owner approves this as a reading of US-25 AC2, or it is left as an open question for `pots.md`. Change "states" to "must state" and give it a hand-off.

2. docs/03-specs/tech-debt.md:85 (TD-24's index row, fix D3). The fix is incomplete and the row now states a wrong fact.
   - What: the row reads "the target clears it as soon as the person types or chooses a new option (the designer's changelog §13a, §16a as first written)". The parenthetical cites the designer's changelog for the select part too.
   - Evidence: the D3 entry in the handling table says the select part is now attributed to `ui-kit.md`'s reading, not to §16a, and lists the "index row" among the places fixed. The Status clause (line 3), "What", ui-kit 2.11's row and §8 do separate the two parts. §13a's messages exist only for Pot Name and the amount, and the select fields never had a message, so the changelog never drew clearing a select message.
   - Fix: write "…as soon as the person types (the designer's changelog §13a, §16a as first written) or, in `ui-kit.md`'s reading, chooses a new option".

MINOR

3. docs/03-specs/tech-debt.md, TD-24 "Fix", second bullet ("drop `ui-kit.md` 2.11's row"). This contradicts the row as v0.8.3 rewrote it.
   - Evidence: 2.11's row and 2.5 now say the difference that remains is that the design shows no message on a field's first blur (`blurField` returns when there is no error). TD-24's target keeps "the blur and submit checks of US-31 AC1", so that difference survives the fix and the row would still be needed.
   - Fix: "amend 2.11's row to the first-blur difference" instead of "drop".

4. docs/03-specs/ui-kit.md:212 (E2E row, the new pointer clause). One half of the new check cannot fail.
   - What: "opening and closing a field by a click on its trigger and choosing by a click show no message on an untouched field".
   - Evidence: every form opens a select field on a free option, or on the edited record's own value (2.6; the design's `openAdd`). A stray blur on WebKit would check a valid value and still show no message. Only the "leave focus on the trigger" half can catch the bug.
   - Fix: keep the focus assertion. Make the message check meaningful, for example: on a field showing a server `taken`, choosing a free option by click in WebKit leaves the message and `aria-invalid` in place.

5. docs/03-specs/ui-kit.md:159 (§3, "Select field | Open"). This row was missed by the W2 sweep.
   - What: the exit cell still lists only "Escape, Tab, outside click, a choice". 2.6, the §3 "Error / `taken`" row and §7 now treat closing the menu by a click on its trigger as a separate way of closing.
   - Fix: add "a click on its trigger".

No other defects found in the delta. The `release-2-handoffs.md` H13 (1) text, the §6 `Menu` changes, the `ConfirmDeleteDialog` row (403 and 415 match 2.3's list) and the 404-on-edit E2E clause (2.7 sends focus to `<main>`, as 2.3 does) are consistent.
