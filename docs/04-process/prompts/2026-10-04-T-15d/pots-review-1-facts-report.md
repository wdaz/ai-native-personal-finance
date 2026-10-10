# Report — pots review 1, every factual claim against the repository (T-15d, S5)

The reviewer's final report as returned (who: a read-only review subagent dispatched by the controller, Claude Code — Opus by governance v1.3; what: brief
`pots-review-1-facts-brief.md`, the fact-check of plan D7; reviewed `pots.md` v0.1, commit `88a2dd2`). How each
finding was handled: `pots-review-handling.md`.

    **Fact-check of `docs/03-specs/pots.md` v0.1 (branch task/T-15d-spec-pots, commit 88a2dd2): 2 important and 9 minor findings.**

    Nothing was edited. I could not open the worktree with `git -C` or `cd`, so I read its files by absolute path and used `git show` / `git diff` from my own worktree, which shares the same commits.

    The figures and the arithmetic all hold:
    - **Script output:** I re-ran `figures.ts` (tsx, with the reviewed worktree's tsconfig) and the output is byte-identical to `output.txt`.
    - **Type-check:** `tsc --noEmit --incremental false` on the reviewed worktree exits 0 with no errors. `figures.ts` has no index access that could be undefined: line 17 checks its access, line 234 uses `?? a`, and line 12 indexes a literal with a union key.
    - **Tool descriptions:** all six in `figures.ts` match `pots.md` 2.13 character for character (171, 152, 120, 181, 139, 140).
    - **Spot-checks against `prisma/data.json`:** Savings 159/2000 Green; Holiday 531/1440 Purple; Concert Ticket is Navy (#626070); balance 4836, income 3814.25, expenses 1700.5; budget themes Green, Cyan, Yellow, Navy. All match.
    - **Every figure in §4.2–4.9** matches `output.txt`.

    ### Findings

    **1. important — missed requirement.** The §7 E2E row (pots.md:215) leaves out items that `ui-kit.md` §7 (ui-kit.md:212) says "each page spec's Tests table names, for its page". Missing:
    - the select fields by pointer in every engine, and a server `taken` that stays after choosing a free option by click
    - the "…" menu opened by click with focus on its first item
    - an amount field's message still shown while typing (UK-Q9 (a))
    - `toHaveCSS` on a select trigger
    - "No, Go Back" at least 44 px tall
    - a used swatch at opacity 0.25
    - the Delete item and the confirm staying full red and underlined on hover
    - a 404 on an **edit**
    - at 1440 px, the header button visible and the indicator and "Log out" hidden
    - the tool's confirmed delete carrying `X-Via: webmcp`

    Fix: add these to the E2E row (and the WebMCP row for the last one).

    **2. important — contradiction with the sibling spec.** pots.md:55 says "`budgets.md` needs the same for `add_budget` and `edit_budget`" (the `notifyWrite` / `onWrite` bus). pots.md:228 says budgets.md "was not yet on `origin`". But `budgets.md` v0.1 (origin/task/T-15d-spec-budgets, 1db13be, pushed 23:00:05, 17 s after pots) states the opposite at its line 116: "`add_budget` and `edit_budget` call `router.refresh()` from `BudgetsTools`", with no bus. Fix: pick one contract (in the D12 cross-spec review) and update §9's statement, which is now out of date.

    **3. minor.** "its US-35 tests that open `/pots` (lines 147–244)" (pots.md:218). The US-35 tests open `/pots` at app-shell.spec.ts lines 147, 170 and 185. Line 244 is in "US-34 AC1 phone", inside the `US-34 hover states` describe that starts at line 199. Fix: "the US-35 tests (147, 170, 185) and US-34 AC1 phone (244)".

    **4. minor.** "creation order (`seq` ascending; R-08, R-19 …)" (pots.md:19). R-08 is the two-decimals rule (2026-09-13-adversarial-review.md:22); the order rule is R-19 alone. Fix: drop R-08 here.

    **5. minor.** "US-05 AC3 (the receiving side: Overview's "See Details" and "Add a pot" open `/pots`)" (pots.md:4). US-05 AC3 is only "'See Details' navigates to Pots" (user-stories.md:46). "Add a pot" belongs to AC2 and overview.md 2.7. Fix: say "AC3 (and AC2's 'Add a pot' link)" or drop "Add a pot".

    **6. minor.** "Overview reads the database on every request (`overview.md` 2.1)" (pots.md:54). overview.md:11 says only that the server component calls `getOverview` directly; it says nothing about every request. Fix: cite what does guarantee it, or reword.

    **7. minor.** PO-Q6 says the "**2 px** gap … [has] no token" (pots.md:266). `--focus-ring-width: 2px` and `--focus-ring-offset: 2px` exist (tokens.css:101–102). Fix: "no spacing token for 2 px".

    **8. minor.** The `delete_pot` output is given as "`{ deleted: true }`, or `cancelled`, `busy`, `not_found` (`ui-kit.md` 2.3)" (pots.md:102). ui-kit.md:52 and :61 also give `conflict`, `unauthenticated`, `rate_limited`, `forbidden`, `validation` and `server_error`. Fix: list them all, or write "… and the rest of `DeleteResult`".

    **9. minor.** 2.14's intro says "the rest add what the design cannot show" (pots.md:108). The `type="number"` → `type="text"` row and the "Release 1's timing" row change what the design does, as ui-kit.md:109–110 treats them. Fix: name these two rows in the intro.

    **10. minor — not in output.txt.** Two claims have no line in the figures record:
    - 2.3's "largest numerator … about 1.1 × 10¹¹" (pots.md:27). The arithmetic is right (111,511,999,999).
    - 4.7's "'Total Saved' and an amount of at most '$5,756.00' … fit every card width" (pots.md:184). Nothing measures this. At 320 px the row has 248 px for preset-1 bold "$5,756.00" plus preset-4 "Total Saved", which is close.

    Fix: print the numerator in `figures.ts`; mark the fit as asserted by E2E only.

    **11. minor.** The status line of `release-2-handoffs.md` (line 3) records each amending PR (#87, #88) but is not amended for this PR, which adds H16 and notes H1, H3, H6, H8, H9, H12 and H13. Fix: add "amended by the Pots spec's PR (H16 added; …)".

    Two smaller citation slips:
    - The `formatAmountInput` examples "2000", "150", "1440" are in `ui-kit.md` 4.1, not 2.5 (pots.md:34).
    - "Test data through the API" is NFR-T3's text; ADR-0003 has only the test-support route (pots.md:180).

    ### Design facts (group 6), for the controller to check against the live source

    **Card:**
    - white, `--radius-150`, padding `--spacing-300` (`--spacing-300`/`--spacing-250` below 768 px), parts `--spacing-400` apart
    - swatch `--spacing-200` from the title; h2 at preset-2
    - "Total Saved" preset-4 grey-500; the total preset-1
    - bar `--spacing-200` below, an 8 px beige-100 track with rounded ends, the fill in the theme colour
    - percentage preset-5-bold grey-500; "Target of" preset-5 grey-500
    - a 13 px gap from the bar to the text row
    - money buttons: beige-100 with a beige-100 border, grey-900 preset-4-bold, `--radius-100`, 53 px tall, `--spacing-200` apart, half width each

    **Grid:** `--spacing-300` gap; `L.potsCols` (one column below 768 px, two from 768 px, by window not `cw`).

    **Animation:** card bar 400 ms, preview bar 300 ms; a 2 px gap between the preview's segments.

    **Texts:**
    - add and edit form titles, descriptions and submit labels
    - the placeholders "e.g. Rainy Days" and "e.g. 2000"
    - "1 characters left"
    - the money-modal titles, descriptions, labels, "New Amount", "Confirm Addition", "Confirm Withdrawal"

    **Money modal:**
    - part order: title, description, preview, field, submit
    - preview colours: grey-900 for the part that stays, green or red for the part that moves; the percentage text in green or red
    - the clamp `Math.min(amt, s.balance)` / `Math.min(amt, pot.total)`

    **Design code and behaviour:**
    - `pct.toFixed(pct >= 10 ? 1 : 2)`, giving 73.3% and 36.9%
    - `fmtShort` ("Target of $2,000")
    - `firstFreeTheme()` falling back to the first theme
    - `type="number"` on the amount input
    - buttons named alike on every card
    - bars as plain divs
    - no empty or error states
    - no duplicate-name check

    **Changelog references:** §6d ("Pots → pot card title (h2)"); §10 ("prefer separate tokens over reuse"); §14/§16c naming no Pots threshold.

    **Confirmed by an approved or merged repository document:**
    - the secondary-button hover (design-tokens "Component states")
    - "Pot options", "Edit Pot" / "Delete Pot", the submit labels, `type="number"`, the `firstFreeTheme()` fallback and the "e.g. 2000" amount placeholder (`ui-kit.md` 2.4, 2.5, 2.7, 2.11)
    - the pot card title for §6d (H12)
    - the §14/§16c thresholds for Overview, Budgets and Recurring Bills only (app-shell §2.9 in PR #96)
    - the pot targets' pre-fill (`ui-kit.md` 4.1)

    No repository document contradicts any of these design facts. The live-source values (sizes, durations, texts, the clamp, `pct.toFixed`, `fmtShort`, `L.potsCols`) cannot be confirmed from the repository.

    ### Claim groups fully correct

    - **Group 6:** no contradiction with any repository document.
    - **Group 5's numbers:** every figure matches `output.txt`, the re-run is identical, `figures.ts` type-checks and computes what its README says, and the descriptions are identical.

    Groups 1–4 are correct apart from findings 1–9 and 11. Group 5's remaining gap is finding 10, two unmeasured claims.
