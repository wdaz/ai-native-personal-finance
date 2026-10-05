# How the pots reviews were handled (T-15d, S5)

Reviews of `pots.md` v0.1 (`88a2dd2`); every fix is in v0.2. Each claim a fix depends on was checked by the agent
before the edit (the command or file named). A fix that would change what the design draws, or decide a choice an
approved document leaves open, became a §9 question for the owner instead (governance v1.10).

## Review 1 — facts (`pots-review-1-facts-report.md`)

| # | Finding | Handling |
|---|---|---|
| 1 | The E2E row misses `ui-kit.md` §7's items for this page | Checked `ui-kit.md` §7 (the E2E row and the criterion table). Fixed in §7: the Theme field by pointer in every engine (WebKit included) and a server `taken` kept after a click choice; the "…" menu opened by a click; a message kept while typing; the Theme trigger's `toHaveCSS`; "No, Go Back" ≥ 44 px; the used swatch at 0.25; the destructive hovers; a 404 on an edit and on a move; the header at 320 px and 1440 px; the tool delete's `X-Via: webmcp` (WebMCP row) |
| 2 | The bus contract contradicts `budgets.md` v0.1 | Checked `budgets.md` at `1db13be` (2.13: `router.refresh()` from `BudgetsTools`). Fixed in 2.8, 2.13, §6, H16 (4): `router.refresh()` from `PotsTools`, no bus contract; §9 re-reads `budgets.md` (with review 2's 7 and 14) |
| 3 | Test line 244 is the US-34 phone test | Checked `tests/e2e/app-shell.spec.ts` (147, 170, 185; 240/244). Fixed in §7 |
| 4 | R-08 is the decimals rule | Checked the adversarial review (R-08 line 22, R-19 line 33). Fixed in 2.2: R-19 only |
| 5 | "Add a pot" is US-05 AC2 | Checked `user-stories.md` US-05. Fixed in the header: "See Details" only |
| 6 | `overview.md` 2.1 does not say "every request" | Checked `app/(app)/layout.tsx` (`connection()`, ADR-0006) and `tests/api/app-pages.spec.ts`. Fixed in 2.8: cites them |
| 7 | 2 px tokens exist (the focus ring's) | Checked `src/ui/tokens.css`. Fixed in PO-Q6: no spacing token is 2 px |
| 8 | `delete_pot`'s results are incomplete | Checked `ui-kit.md` 2.3 (`DeleteResult`, items 4 and 7). Fixed in 2.13: every code, mapped by item 7 |
| 9 | 2.14's intro misnames two rows | Fixed in 2.14: the intro names every row's kind (with review 2's 2) |
| 10 | Two claims not in `output.txt` | Fixed: `figures.ts` prints the numerator (111,511,999,999, within `Number.MAX_SAFE_INTEGER`), re-run, `output.txt` replaced; 4.7 says the text fit is asserted by E2E only, and §7 asserts it at 320 px and 1024 px expanded |
| 11 | The hand-offs status line not amended | Fixed in `release-2-handoffs.md` line 3: "amended by the Pots spec's PR #97 …" |
| — | `formatAmountInput` examples are `ui-kit.md` 4.1's | Fixed in 2.5 (with the seed's five targets) |
| — | "Test data through the API" is NFR-T3's | Checked `non-functional-requirements.md` T3. Fixed in 4.5: NFR-T3 quoted; ADR-0003's test-support route named for what it does |
| Design facts | For the controller to check live | Not a finding. Re-read live on 2026-10-05 for v0.2 (read only): `L.potsCols` is `isMobile ? '1fr' : 'repeat(2, …)'`, the card text `pct.toFixed(pct >= 10 ? 1 : 2)`, the preview bar `transition: width .3s ease`, "characters left" — as v0.1 states. The other values were not re-read in this round; no repository document contradicts them (the reviewer's check) |

## Review 2 — the spec (`pots-review-2-spec-report.md`)

| # | Finding | Handling |
|---|---|---|
| 1 | The window breakpoint contradicts `app-shell.md` §2.9 (Approved v1.5) | Checked `app-shell.md` on `origin/develop` (`28ad970`, §2.9 and its table). Not decided in the spec: **PO-Q7** (a: a 644 px content width, recommended; b: an `app-shell.md` exception; c: another width the designer names); 2.4, 4.1, 4.7 and the figures script (PO-Q7 (a)'s widths) follow |
| 2 | Design departures decided without a question | **PO-Q8** lists rows 1–4 (two decimals, "$2,000.00", stacking, the duplicate check) with a recommendation; the error state's button is PO-Q9 (3). The 2.14 intro is rewritten: `type="text"` and the timing rows cite `ui-kit.md` 2.11 (merged), "1 character left" is PO-Q1 |
| 3 | The error state's missing header button contradicts `ui-kit.md` §3 | Checked `ui-kit.md` §3 and `budgets.md` 2.6, 2.12 (the same choice). **PO-Q9** (a: no button in that state, `ui-kit.md` §3 amended in its own PR, recommended; b: the button stays, server checks only); PO-Q3's premise reworded; 2.9, §3 and H16 (4) follow |
| 4 | §7 misses `ui-kit.md` §7's items | Fixed as review 1's 1 |
| 5 | A server 400 leaves the page's data stale | Checked `ui-kit.md` 2.6 ("refreshed from the page's data"). Fixed in 2.5, 2.6, 2.8 (a 400 with `taken`, `exceeds_balance` or `exceeds_total` calls `router.refresh()`) and in §7 (component and E2E "stale data") |
| 6 | `PotsDto.total` is not shown; the parity sentence omits it | Fixed: `total` removed from `PotsDto` (2.12, 4.2, §7's API row); the parity sentence (2.13) quotes "including ids" and says why the balance is data the page shows. `list_pots`'s description never named the sum, so its count (171) is unchanged |
| 7 | The bus contract is not needed | Fixed as review 1's 2 |
| 8 | Typing cannot be observed through `Field` | Checked `src/ui/Field.tsx` (only `onBlur`). Fixed differently from the suggestion, with no `Field` change: `PotForm` and `MoneyModal` read the text from the `input` events that bubble to their `<form>` (React's `onInput`), 2.5, 2.6; `Field` stays uncontrolled with `ui-kit.md` 2.5's four props, so no `ui-kit.md` mirror is needed |
| 9 | H6 and H8 Done cells mix ☐ and ☑ | Fixed: both ☑, with every part's section |
| 10 | Test line attribution | Fixed as review 1's 3 |
| 11 | US-05 citation | Fixed as review 1's 5 |
| 12 | US-36 AC1 partly traced | Fixed in §7: a create, an edit, a delete and a move each survive a reload and show in a second tab |
| 13 | PO-Q4 (a): two messages under one field | Fixed: under (a) "All themes already have a pot" is the field's one message from the opening, and submit adds no "Can't be empty" (as `budgets.md` 2.6 does); 2.5 follows |
| 14 | The `budgets.md` read must be redone | Fixed in §9: re-read at `1db13be` (BU-Q1–BU-Q4 unanswered, nothing to reuse) and the D12 points listed (tool refresh, page refresh, the error header, the empty and error texts, the column switch, the animation question). `budgets.md` 2.9, not 2.8, holds its `startTransition` refresh (checked) |

## Review 3 — the cross-spec review of plan D12 (`pots-review-3-crossspec-report.md`)

Reviewed `pots.md` v0.2 (`6927a5a`) against `budgets.md` v0.2 (`a122984`); every fix is in v0.3. Only the findings for
`pots.md` and the hand-off rows this pull request owns are applied here; the `budgets.md` findings (B1–B11) are
`budgets.md`'s pull request's, except where one asks for the same change on both sides (noted). Design facts re-read
live on 2026-10-05 (read only): the Pots card's bar is a beige-100 track 8 px tall, 4 px radius, `overflow: hidden`,
holding a fill 8 px tall, 4 px radius, `transition: width .4s ease`; the preview's track holds two segments `gap: 2px`,
each `transition: width .3s ease`; the gap from a bar to its text row is `gap: 13px`; Budgets' card bar is
`transition: width .4s ease`.

| # | Finding | Handling |
|---|---|---|
| P1 (with B1, H-a) | The agent-write refresh contradicts `budgets.md` and the bus contract; stale `budgets.md` v0.1 citations | Checked `src/webmcp/tools/registry.ts` (`PAGE_TOOLS` holds module-level `execute` functions), `OverviewTools.tsx` and `WebMcpTools.tsx` (the tools component only registers the array; nothing in it sees a tool's result, so v0.2's "`PotsTools` calls `router.refresh()`" had no path), `ui-kit.md` 2.3 (only `requestDelete`/`onDeleteRequest`) and `budgets.md` 2.13 at `a122984` (the bus's `notifyWrite`/`onWrite`). Fixed by taking `budgets.md` v0.2's mechanism, stated identically: 2.8 (the four write tools call `notifyWrite("pot")`; `PotsBoard` subscribes with `onWrite("pot", …)` and runs its own refresh), 2.13, §6, §7 (component and bus tests); H16 (4) names the two functions, the build task that adds them (the first Budgets or Pots build task, as H13 (1)) and the `ui-kit.md` 2.3 and §6 wording amendment in its own pull request, shared with `budgets.md`, which the owner approves by merging. The §9 read of `budgets.md`, PO-Q4 and PO-Q9 now cite v0.2 at `a122984`. If `budgets.md`'s own pass changes B1's resolution, this spec follows it again |
| P2 | The bar's width has no mechanism under ADR-0006 | Checked `ui-kit.md` line 33 (no `style` attribute in server-rendered HTML; `element.style` only for browser-computed positions), `src/ui/overview/ThemeBar.module.css` (a `data-theme` selector sets a colour only), `theme-color.ts` (`themeVar`) and `budgets.md` 2.4. Fixed in 2.2: an inline SVG as wide as the track with one `rect` whose `width` presentation attribute is `potFill` as a percentage and whose `fill` is `themeVar(theme)`, as Budgets draws its bar; 2.6: the preview's two segments are `rect`s the same way; 2.11: an animation, if PO-Q6 keeps it, is a CSS `transition` on the `rect`'s `width`, checked in every engine by the build, with the no-animation state as the fallback; 2.14 gains the row |
| P3 | `write-path.md` 7.5's 429 and threshold-reset E2E are missing | Checked `write-path.md` line 229 (7.5) and `budgets.md` §7 (both present). Fixed in §7's E2E row: a 429 with the `WriteAttempt` rows pre-filled shows its message with the modal open; a threshold reset on a pot write → the login page with the reset message (US-37 AC3 added to the row's trace) |
| P4 (with B4) | The animation default differs from Budgets | Fixed: the bars do not animate until §9 PO-Q6 is answered (2.11, §8, as `budgets.md` 2.4 and §8); PO-Q6 is now the animation question alone, worded as BU-Q3's bars part, with the same recommendation (no animation) and one `--duration-progress` token under (b) |
| P5 | The hand-offs Status line edit breaks plan D10 | Checked plan D10 (lines 81–83: "edits only its own new row and the Done cells it fills") and `origin/develop`'s Status line (not edited by #91 or #96). Fixed: the Status line is back to `develop`'s text. This reverses review 1's finding 11 of v0.2, which D10 overrides |
| P6 | The walkthrough order is wrong below 1024 px | Checked `src/ui/Shell.tsx` (skip link, `Sidebar`, `<main>` with `ResetBanner` first, `BottomNav` last) and `src/webmcp/AgentToolsStatus.tsx` (a `role="status"` `div`, no stop). Fixed in 2.10: the page's stops, then the desktop and below-1024 orders as `budgets.md` 2.14 gives them, with the reset banner's and the notice's "Dismiss notice" |
| P7 | Partial edits not covered | Checked `write-path.md` 4.4 (`{}` is `required` on each missing field) and `budgets.md` 2.10, §7. Fixed: 2.12's `PATCH` row says all three are required, with `{}` and an absent or `null` field; §7's API row tests both; `edit_pot`'s description now says "send all three" (138 characters, `figures.ts` re-run, `output.txt` replaced, 4.8); the WebMCP row tests `edit_pot` with only `{ id, name }` |
| P8 | The after-write model differs from Budgets | Fixed by taking `budgets.md` 2.9's pattern: every success (and a stale-data 400, and a tool's `notifyWrite`) refreshes inside `startTransition` with `aria-busy="true"` on the grid; the page renders the server's last read and does not apply the answer's body (2.1, 2.6, 2.7, 2.8, 2.9, §3 "Refreshing", 2.14's row, §7) |
| B7 (pots side) | Schema names are not noun-first; the create answer's shape differs | Checked `src/shared/schemas.ts` (`LoginSchema`, `OverviewDtoSchema`, …) and `write-path.md` 2.2 step 9 ("201 … with the record"; no shape fixed). Names fixed: `PotCreateSchema`, `PotUpdateSchema`, `PotMoneyMoveSchema` (2.12, §6). The `{ pot }` wrapping is kept, with its reason stated in 2.12: a money move must answer two parts (`{ pot, balance }`), so wrapping every write under its noun reads the pot from one key; `budgets.md`'s pass decides whether it wraps `{ budget }` to match (B7 is its finding) |
| B11 (pots side) | The `forbidden` tool test is missing | Checked `write-path.md` 7.6 (line 230). Fixed in §7's WebMCP row: a write tool refused with 403 returns `forbidden`, not `server_error` |
| B2, B3, B5 (pots side) | One answer for the error-state button, the window-keyed layout and the no-token policy | PO-Q9 says `budgets.md` 2.12 makes the same choice and one answer covers both; PO-Q7 names `budgets.md` 2.2's summary-card row as the same kind of switch; PO-Q10 offers the option B5 finds missing from BU-Q4 (the design's number with a comment, as `ThemeBar.module.css` writes 4 px today) — the two questions should offer the same three choices, which is `budgets.md`'s side to add |
| H-b | Shared form strings overlap H15 (1) and H16 (1) | Fixed in 2.15 and H16 (1): "Save Changes", "Theme" and "e.g. 2000" are added by whichever of the first Budgets and the first Pots build task comes first and reused by the other |
| H-c | H16 omits the H17 dependency | Checked H17 on `origin/develop` (`container-type: inline-size` on `<main>`, sent to hotfix 2). Fixed in 2.4 and H16 (4): under PO-Q7 (a) or (c) the pot grid depends on H17 |
| H-d | The Done cells need reconciling at merge | No edit on this branch: the cells this pull request fills (H6 ☑, H8 ☑, the Pots notes of H1, H3, H9, H12, H13) stay; at the D11 merge of `develop`, whichever of the two spec branches merges second keeps H6 ☑ with both notes, and H1 and H9 are ticked once both are merged (H3 once #90 lands). Noted in the pull request body for that merge |
| Same question 1 | BU-Q2 / PO-Q3, the empty state | PO-Q3 takes BU-Q2's three options and recommendation word for word with "pot" for "budget" (its (c) is now "the designer draws one"), and names BU-Q2 |
| Same question 2 | PO-Q9 / `budgets.md` 2.12 | As B2 above |
| Same question 3 | BU-Q3 / PO-Q6, the animation | PO-Q6 split: the animation question alone, BU-Q3's bars part, one answer for both pages |
| Same question 4 | BU-Q4 / PO-Q6 (3)–(4), values with no token | Moved to a new **PO-Q10**, worded as BU-Q4 (its (a) and (b) as BU-Q4's), with (c) as B5 asks |
| Same question 5, 6 | BU-Q1 / PO-Q1, the error text and the names that include the record | PO-Q1 says BU-Q1 #1 and #2 ask the same pattern and can be approved once |
| Same question 7 | PO-Q7 / `budgets.md` 2.2 | As B3 above |
| Same question 8 | PO-Q8 #2 / `budgets.md` 2.3, two decimals | Kept as a question (governance v1.10: "Where the design contradicts an Approved document … the agent tells the owner"); PO-Q8 says `budgets.md` makes the same change and one ruling covers both |
| Same question 9 | BU-Q5 / PO-Q8 #3, a row with no room at 320 px | Moved to a new **PO-Q11**, worded as BU-Q5 with three options (stack where it does not fit, recommended; smaller text; the designer draws one); PO-Q8 keeps three rows (#4 renumbered #3) and 2.2, 2.14, 4.7 and §7 cite PO-Q11 |
| §9 | The read of `budgets.md` | Rewritten for v0.3 (`a122984`, BU-Q1–BU-Q5 unanswered) with a table of the questions the two specs share, each with the sibling's id |

## Review 4 — the stand-in review of `07209a4` (v0.5, after the owner's answers)

Two read-only stand-in reviews (facts; scope and process) of `pots.md` v0.5 (`07209a4`) against `budgets.md` v0.5
(`fece1ac`); every fix is in v0.5.1. No owner answer changed. The design's preview was re-read live on 2026-10-06
(read only): a beige-100 track 8 px tall, `display: flex; gap: 2px; overflow: hidden`, holding the staying segment
(grey-900, `border-radius: 4px 0 0 4px`) and the moving one (`border-radius: 0 4px 4px 0`), each
`transition: width .3s ease`.

| # | Finding | Handling |
|---|---|---|
| F1 (important) | The PO-Q9 (a) error-state test sits on `PotsBoard`, which gets no DTO in that state; the page's error branch, its log and `PotsError` are untested | Checked `budgets.md` 2.1 and §7 at `fece1ac` and `app/(app)/overview/page.tsx` (`x-request-id`, `console.error`). Fixed: 2.1's Server bullet renders `PotsBoard` or, when `getPots` throws, `PageHeader` with no `primaryAction` and `PotsError`; 2.9 names the page; §7 tests `page.tsx` with `getPots` mocked to throw (no "+ Add New Pot", the card, the log with the request id) and `PotsError`'s Retry, as `budgets.md` §7 |
| F2 (important) | One answer (S45-4), two rules for an engine that does not animate | Fixed in 2.11 with `budgets.md` 2.4's wording: such an engine is reported to the owner before the page ships |
| F3 | PO-Q8 (S45-9) missing from "asked only here" | Fixed in §9: "PO-Q8, PO-Q2, PO-Q4 and PO-Q5 (S45-9 to S45-12) only here" |
| F4 (with scope 2) | The sibling cited at v0.4 (`c3cfbcd`) | Fixed in §9: `budgets.md` v0.5, `fece1ac`; the v0.5 changelog entry is history and stays |
| F5 (with scope 1) | Who adds `--duration-preview` when Budgets is built first | Checked `budgets.md` §6 and H15 (3) at `fece1ac` (only `--duration-progress` is Budgets'). Fixed in 2.11 and H16 (3): `--duration-progress` is shared (whichever build task comes first); `--duration-preview` is Pots-only and is added by the first Pots build task unless already there |
| F6 (plausible) | The preview's moving segment may jump while the staying width animates | Confirmed against the design: its flex row moves the second segment with the first's end. Fixed in 2.6: the moving `rect`'s `x` is the staying width as a percentage, shifted by `translateX(var(--spacing-25))` from the CSS module (no `style` attribute, ADR-0006), and `x` transitions with `width` (2.11); past a full track its 2 px are clipped by the track; §7's `MoneyModal` test asserts the two `rect`s' attributes |
| Scope 3 (note) | The branch conflicts with `develop` in `release-2-handoffs.md` | Not a defect of the spec; left to the planned D11 merge of `develop`, with the resolution the review gives (both Done-cell notes kept, H16 between H14 and H17, the Status line untouched) |
| Scope nit | The pull request body's "Where it lands" table omits 2.15 for PO-Q3 and 2.14 for PO-Q6 | Fixed in the pull request body |
