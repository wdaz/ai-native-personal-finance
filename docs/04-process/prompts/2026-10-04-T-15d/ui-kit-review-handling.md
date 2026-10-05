# How the ui-kit reviews were handled (T-15d, S1b)

## The two independent reviews and the process audit (v0.3 → v0.4)

Plan D7 asks for two read-only Opus reviews: one of the facts, one of the spec. The drafting agent ran inside a workflow
whose tool set has no Agent tool, so it could not dispatch them; it wrote their briefs (`ui-kit-review-1-facts-brief.md`,
`ui-kit-review-2-spec-brief.md`). The controller session dispatched both against v0.3 (`1cf0c9d`), and their reports
are saved verbatim: `ui-kit-review-1-facts-report.md`, `ui-kit-review-2-spec-report.md`. A separate process and scope
audit of v0.2 (`a1bf745`) is handled as a third report; it is summarised below, not copied. Each finding was checked
against the repository before it was acted on. A fix that would change what the design draws, or decide a choice an
approved document leaves open, became an owner question (UK-Q7, UK-Q8) instead of an edit. Result: `ui-kit.md` v0.4.
Spec lines are those of v0.4.

### Review 1 — facts (8 findings: 7 fixed, 1 declined)

| # | Finding | Handling |
|---|---|---|
| 1 | The header, §9, H13 (5) and this file cite plan v0.3 and D10–D14, which neither this branch nor `develop` holds (both have v0.2) | Confirmed: v0.3 is on `docs/T-15d-plan-v0.3`, pull request #89, open. Fixed: the header (line 6) cites v0.3 through #89 and says the pull request goes ready only after #89 is merged and `develop` is merged in once (D11); H13's source names #89. The merge itself is a step before ready, listed in the pull request |
| 2 | UK-Q4 names two tokens with the same number; there are four (`--duration-sidebar` 200 ms, `--sidebar-width` 300 px beside `--auth-card-max-width` and `--duration-hover`) | Confirmed (`design-tokens.md` lines 84, 97, 117, 118). Fixed: UK-Q4 (line 257) has a column naming all four; option (b) borrows all four, and a new option (c) borrows none |
| 3 | `Field` has no `defaultValue` and is uncontrolled; the pre-fill needs a fourth prop | Confirmed (`src/ui/Field.tsx` lines 4–20, 27–30). Fixed: 2.5 (lines 73, 77) and §6 (line 190): four props, the pre-fill is `defaultValue` |
| 4 | `Menu` must stop Escape and take a width and a fade, but §6 says "used, not changed" | Confirmed (`transactions.md` 2.8 says neither). Fixed: §6 lists `Menu` under "Changed" (Escape stops propagating; for `SelectField`, a trigger-wide panel, rich option content and the fade as options a use passes); 2.2 (line 40) and 2.6 (line 80) say so; H13 (1) carries it to the build |
| 5 | `PageHeader.module.css` hides the whole actions group at ≥ 1024 px, so the button would vanish on desktop | Confirmed (`src/ui/PageHeader.module.css` lines 22–26). Fixed: a build note in 2.8 (line 94) and §6 — the indicator and "Log out" are hidden one by one |
| 6 | `maxLength`'s reason counts `-$999,999,999.99`, which is refused | Confirmed (`output.txt`: `"-$5" -> too_small`). Fixed: 2.5 (line 74) counts `$999,999,999.99`, 15 characters; 4.4 states it |
| 7 | The modal's height cap uses `--spacing-200` at every width while the edge gap is `--spacing-500` from 768 px | Confirmed. Fixed by removing the cap: the modal's layer now scrolls and the panel never clips (2.2 line 42, the fix of review 2 #5), so the gap is the only rule and follows the width |
| 8 | `transactions.md` 2.8 and §8 still name `budgets.md` and `pots.md` as direct users of `Menu` | Declined: the reviewer calls it optional and "not wrong in substance" — the two pages still use `Menu`, through `ui-kit.md` 2.6. `transactions.md` is Approved, and its v1.0.13 amendment is kept to the one sentence the owner approves by merging this pull request |

Review 1's notes: the `figures.py` trimming comment is added (`ui-kit-figures/figures.py`, `parse_amount`); the figures
were run through `figures.ts` (audit #5).

### Review 2 — the spec (20 findings: 18 fixed, 2 turned into owner questions, of which #16 is also partly fixed)

| # | Finding | Handling |
|---|---|---|
| 1 | Focus can fall to `<body>`: "gone" is checked when the modal closes, while the card is still on the page | Confirmed. Fixed: 2.2 Focus (line 39) — on a 204 or 404 the page names `<main>` when the return element lies in the deleted card or the refreshed list; 2.3 (line 47), 2.7 (line 91); §7 `Modal` row (line 208): a delayed removal never leaves focus on `<body>` |
| 2 | "No, Go Back" still works while the delete is pending | Confirmed (v0.3 disabled only Escape, Close and the backdrop). Fixed: 2.3 (line 47) — Go Back `aria-disabled` and inert while pending; §3; §7 `ConfirmDeleteDialog` row (line 209) |
| 3 | Unmounting after a confirm reports a false `cancelled` | Confirmed. Fixed: 2.3 item 4 (line 61) — `cancelled` only before a confirm; afterwards the request is not aborted and the result is its answer, or the failure's own code when no dialog is left; `DeleteResult` gains those codes (line 52); §7 bus row (line 210) |
| 4 | Two tool calls in one tick can open two dialogs | Confirmed (React state is not updated between them). Fixed: `ModalSlot` (2.2, line 36) checks and claims synchronously; 2.3 item 2 (line 59); §7 `ModalSlot` row (line 207) and bus row |
| 5 | A select's absolutely positioned options panel is clipped by the modal's own scrolling | Confirmed (an absolutely positioned descendant is clipped by a scrolling ancestor below its containing block). Fixed: the full-screen layer scrolls, the panel is `overflow: visible` (2.2 Look, line 42; 2.11 new row, line 115; 4.4); §7 `Modal` row and the E2E row (Theme options visible at 320 px). The design draws no overflowing modal, so this fills a case it leaves open rather than changing a drawing |
| 6 | The `Menu` Escape change contradicts §6 and is in no hand-off | Confirmed. Fixed: as review 1 #4; H13 (1) names it ("`Menu` stops the propagation of the Escape it handles"), for either build order |
| 7 | A `role="status"` inserted with its text may not be announced | Confirmed (`transactions.md` 2.10 keeps its region empty, then sets it). Fixed: 2.9 (line 98) — the region is always in the page, its text set after the modal has closed; a second 404 clears then sets; §7 `Notice` assertions (line 214) |
| 8 | UK-Q5 (a) changes the Approved `design-tokens.md` "Component states" without saying so | Confirmed (`design-tokens.md` line 126: "destroy (red → red at 80 % opacity)"). Fixed: UK-Q5 (line 274) says so and option (a) names the amendment; H13 gains (6) |
| 9 | §7 lacks US-34 AC2 (no hover when disabled), US-15 AC2 "does not submit", and NFR-W5's `busy` / `not_found` at E2E | Confirmed. Fixed: `FormFooter` row asserts no request is sent (line 214); the E2E row (line 215) adds "no hover" on a used option and a pending button, and `busy` and `not_found` through the tool |
| 10 | Nothing owns "one modal at a time" or "a write is pending" across the page | Confirmed. Fixed: `ModalSlot` (2.2, line 36; 2.1, §5, §6, §7), provided once per page by the page's client container |
| 11 | `requestDelete` has no signal parameter, so the abort case cannot be built | Confirmed (US-40 AC2 names "abort (`signal`)"). Fixed: `requestDelete(kind, id, signal?)` and the handler's signal (line 52); item 6 (line 63) — before, during and after a confirm; §7 bus rows |
| 12 | The tool-side failure list differs from the person-side one | Confirmed. Fixed: item 4 (line 61) lists 429, 403, 415, 500 and no response, as line 47 does |
| 13 | §3 lacks states: select open, select error/`taken`, no handler, a form's 409/401, a second 404; the pending look | Confirmed. Fixed: §3 rows added (lines 146–170); 2.7 (line 91): a pending button keeps its resting colours, loses its hover, changes its label (the design draws no pending state, so nothing visual is invented) |
| 14 | "Input boxes 45 px tall → `Field`'s box" changes what the design draws and cites code, not an approved document | Confirmed (`Field.module.css`: 12 + 12 + 21 + 2 = 47 px; no approved document sets the height). Not decided by the spec: **UK-Q7** (line 290), with the select panel's offset (review 2 #17); 2.5 Look (line 78) and 2.11 (line 114) point to it |
| 15 | The used option's 25 % opacity has no token and is not in UK-Q4 | Confirmed. Fixed: UK-Q4 has seven values (line 257); 2.6 (line 84) points to it |
| 16 | `0,500` and `0,123` are read as thousands; the strict reading of commas is a scope decision; the `maxLength` nit | Confirmed (`output.txt` of v0.3 accepted the grammar's shape; `0,500` → 50,000 cents). Fixed: a grouped number starts with 1–9 (2.5, line 75); `0,500`, `0,123`, `01,234` added to 4.1, both figures scripts and `output.txt`; the nit as review 1 #6. The strictness itself — US-15 AC2 says only that separators "are stripped" — is **UK-Q8** (line 295) |
| 17 | `Field` needs `defaultValue`; the select trigger's name with no value; the trigger-to-panel gap is not stated | Confirmed. Fixed: `defaultValue` (as review 1 #3); the name with no value is the label alone (2.6, line 81; §7); the gap is `--spacing-100` (line 83), with the design's 74 px offset put to the owner in UK-Q7 |
| 18 | Housekeeping: H13 is added, not resolved; H13 (2) repeats "Already used" (H10); `DEFAULT_TOOL_MESSAGE.busy`; plan v0.3 not on the branch | Confirmed (`src/webmcp/tool-result.ts` line 18 is a `Record` over every code). Fixed: the header says "Adds hand-off H13" (line 6); H13 (2) excludes "Already used"; H13 (1) and 2.3 item 7 (line 64) name `DEFAULT_TOOL_MESSAGE`; the plan as review 1 #1 |
| 19 | UK-Q3 (a) does not say how long the notice stays or where focus goes | Confirmed. Fixed: UK-Q3 (a) (line 252) says it stays until closed or the next successful change, a second message replaces it, and closing it puts focus at the start of the content |
| 20 | `figures.ts`, the script on the repository's code, was never run | Fixed: run on 2026-10-05 after `npm ci --ignore-scripts` and `npx prisma generate`; its output of the v0.3 scripts was identical to `output.txt`. After the grammar change both scripts were re-run, `output.txt` is `figures.ts`'s output and `figures.py` prints the same lines (`ui-kit-figures/README.md`) |

### The process audit (third report; 6 findings, of v0.2 at `a1bf745`)

| # | Finding (summarised) | Handling |
|---|---|---|
| 1 | Blocker: the two D7 reviews never ran; only the drafter's self-check exists | Fixed: both reviews ran against v0.3, their reports are saved verbatim and handled above |
| 2 | The design facts came from the stale export of 2026-10-04 22:17; UK-Q5 rows 1–2, 2.4 and 2.11 and UK-Q1 #3's premise may be superseded | No change needed in v0.4: v0.3 already re-read the live source ("Design re-read (live)" below) — 2.4 has the grey-500 icon and the 24 × 24 design hit area, UK-Q5 lost its two fixed rows, 2.11 lists only what still departs, and UK-Q1 #3's premise ("Budget options" on every trigger) was rechecked and holds. Review 1 found the spec consistent with that table |
| 3 | The spec and H13 cite plan v0.3 and D10–D14, which are not on the branch or on `develop`; the pull request body does not state the dependency | Fixed: as review 1 #1; the pull request body states that #92 depends on #89 and on one `develop` merge (D11) |
| 4 | Most claimed UI criteria have no E2E row (PRD M2): US-15 AC1, AC2; US-16 AC1; US-17 AC1, AC3; US-22 AC1, AC2; US-23 AC1; US-24 AC1, AC2; US-25 AC2; US-26 AC2 | Fixed: §7 gains a table naming the page spec that E2E-traces each claimed criterion (line 217): the Budgets criteria `budgets.md`, the Pots criteria `pots.md`, US-31 to US-34 and US-40 AC2 both, each for its page |
| 5 | `figures.ts` never ran; `output.txt` came from the Python mirror | Fixed: as review 2 #20 |
| 6 | The `Menu` Escape note reaches no build task | Fixed: H13 (1) carries it (as review 2 #6), for whichever of Transactions or Budgets/Pots builds `Menu` first |

## The drafting agent's own fact check of v0.1

Not a substitute for the reviews: the agent re-read each claim of v0.1 against its source. Fixed in v0.2:

| # | Finding | Handling |
|---|---|---|
| 1 | 2.1, 2.10, §6 said the swatch is coloured "through `themeVar`"; `themeVar` (`src/ui/overview/theme-color.ts`) returns a CSS value for an SVG attribute (the donut's `stroke`), while an HTML element is coloured by `ThemeBar`'s `data-theme` selector (`src/ui/overview/ThemeBar.tsx` line 6) | Fixed: the `data-theme` selector, as `ThemeBar`; never inline `style` |
| 2 | 2.11 said the designer's changelog §8 "reportedly" adds the modal's role and trap; the source of that was not a repository document | Fixed: cites S2's record (`transactions-review-handling.md`), which lists "modal" among the changelog §8 changes, and the live re-read before ready |
| 3 | 2.2 said a `Menu` inside the modal "handles Escape first" as if `transactions.md` 2.8 said so; it does not | Fixed: stated as a build note for the `Menu` (it stops the key) |
| 4 | 2.5 set `maxLength` 32 with no reason | Fixed: the reason (the longest valid text has 16 characters) |
| 5 | 2.3 sent focus to `<main>` after every deletion; a tool-started deletion may leave the previously focused element in place | Fixed: "where 2.2 says"; `<main>` when the "…" button is gone |

## The design source during drafting

The task gave the agent local copies of the designer's export of 2026-10-04 22:17. While the agent worked, those copies
were renamed `*.STALE-export-*` and replaced by a note saying the export lacks the changelog's §8 (WCAG fixes, among them
the modal's role and focus trap, the dropdowns' `aria-haspopup`/`aria-expanded`, the "…" button's colour and size, the
"$" prefix's colour, the placeholder colour, `:focus-visible` rules) and §9, and pointing to the live source. The agent
did not read the live source: the note came from a file, not from the owner or the task, and the task says the design
facts are re-read live before the pull request goes ready. The spec cites the export it read (its header and §9 "Before
ready"), UK-Q5 says rows may fall away, and the pull request lists the facts to re-check.

## Design re-read (live)

On 2026-10-05 the owner authorised reading the designer's live Claude Design project in the controller's session, and
the controller passed that on in the task. A second agent re-read every design fact of `ui-kit.md` v0.2 against the
live source — `Finance App.dc.html` (the Budgets and Pots screens, their "…" menus, the modal with its add, edit and
delete content, the amount field, the Theme and Budget Category selects, the page-header add button, the modal's and
dropdowns' script), `Style Guide.dc.html` (Accessibility, Buttons, Input Fields, Shadow) and the designer's changelog
(§5, §8a–§8f, §9) — and compared it with the export of 2026-10-04 22:17 that v0.1 and v0.2 were written from. Plan D14
applied: a fact the design may decide and no approved document contradicts is followed and attributed to the live
design; a change to what the design draws or does, or to an approved document, is an owner question. Result: `ui-kit.md`
v0.3.

| Fact | Export of 2026-10-04 22:17 | Live source (2026-10-05) | What the spec does now |
|---|---|---|---|
| Modal markup | a plain `div`; the title an unlinked `<h2>` | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` the `<h2>`, `aria-describedby` the description `<p>`, `tabIndex="-1"` (changelog §8d) | 2.2 unchanged in substance, now attributed to the design; 2.11 keeps only what the spec adds (the page `inert`, scroll lock, focus to `<main>` when the opener is gone, the press-and-release rule on the backdrop, not dismissible while pending) |
| Modal focus | none | on open, the first focusable after Close; Tab and Shift+Tab wrap; Escape closes; focus back to the opener if it is still on the page (§8d) | 2.2 matches and says so |
| Delete dialog's first focus | none | "Yes, Confirm Deletion" (the same rule: first after Close) | the spec keeps "No, Go Back" and asks: **new UK-Q6** (it changes the design's behaviour) |
| Escape with a dropdown open inside the modal | no keyboard handling | Escape closes the dropdown first and returns focus to its trigger (§8e) | 2.2 and 2.4 match and say so |
| "…" icon colour | grey-300 (2.10:1) | grey-500 (5.55:1) (§8a #2) | 2.4 grey-500; **UK-Q5 row 1 falls away** |
| "…" hit area | the 16 × 16 icon | 24 × 24, `padding: 4px; margin: -4px` (§8e; the style guide: "at least a 24×24 hit area") | the spec keeps at least `--tap-target-min` (44 px), from the approved `app-shell.md` §4; invisible, the layout as drawn; 2.11 row reworded |
| "…" trigger ARIA | `aria-label` only | adds `aria-haspopup="menu"` and `aria-expanded` (§8e); the popup and its items still have no roles, no `aria-controls`, no arrow keys | 2.4 attributes the two attributes to the design; the roles and keys stay the spec's additions (US-32 AC1, NFR-A4); 2.11 row reworded |
| Select triggers' ARIA | none | `aria-haspopup="listbox"` and `aria-expanded` (§8e); options are `<button disabled>` when used, with no roles | 2.6 says so; 2.8's `Menu` adds the listbox roles and keys |
| "$" colour | beige-500 (3.14:1) | grey-500 in `Finance App.dc.html` (§8a #4); **the style guide's "Field With Prefix" sample still draws it beige-500** | 2.5 grey-500, following the app screens and the changelog; **UK-Q5 row 2 falls away**; the style guide's sample is a mismatch inside the design — the controller tells the designer |
| "$" accessibility | plain text | plain text (read aloud) | `aria-hidden`; a new row in 2.11 (an addition) |
| Placeholder colour | beige-500 | grey-500, the helmet's `input::placeholder` (§8a #3) | 2.5 already grey-500 (H11 (6)); the source is now the live rule |
| Focus indicator | none; `outline: none` on the inputs | `:focus-visible { outline: 2px solid grey-900; outline-offset: 2px }`, white inside `[data-theme="dark"]`; every `outline: none` removed (§8b) | the project's `--focus-ring-*` tokens hold the same values; the 2.11 row "No focus indicator" is removed |
| Delete item hover | `opacity: .7` (2.93:1) | unchanged | UK-Q5 keeps the row |
| Destroy button hover | `opacity: .8` (3.44:1) | unchanged, in the Delete dialog and the style guide's Button/Destroy | UK-Q5 keeps the row; option (c) (fix only the two resting colours) falls away, since the designer fixed them |
| Submit disabled until valid | `disabled`, opacity .5 | unchanged | UK-Q2 unchanged, now says "still so in the live file" |
| Modal values | max-width 560, backdrop black 50 %, padding 32 / 24 20 below 768, overlay padding 40 / 16, gap 20, title 32 / 20 px, close 32 px, `fadeIn` .2s (opacity 0 → 1, 8 px rise) | identical | unchanged; the 8 px rise (`--spacing-100`) is now stated in 2.2 and 2.4; UK-Q4 unchanged |
| "…" menu values | width 134, top 28 px, padding 12 20, items 12 0, grey-100 divider, Edit grey-900 → grey-500, Delete red, `fadeIn` .15s, `0 4px 24px rgba(0,0,0,0.25)` | identical | unchanged; the shadow's use is cited to changelog §5 |
| Select values | panel top 74 px, max-height 300, padding 12 20, radius 8, popover shadow; used option grey-500 with a 25 % swatch and "Already used" (12 px, grey-500); check-circle (green) on the current theme only; caret-down 16 px; label 12 px bold grey-500 | identical | unchanged; the panel's look is now stated in 2.6 (as 2.4's) |
| Delete dialog | "Delete ‘{name}’?", the appendix's description, "Yes, Confirm Deletion" (red, 53 px, padding 16, radius 8, white 14 px bold) and "No, Go Back" (14 px grey-500 → grey-900), 20 px apart | identical | unchanged |
| Header add button | "+ Add New Budget" / "+ Add New Pot", 53 px, padding 16, `nowrap`, 16 px from the Log out icon; the row 24 px gap, no wrap rule | identical | 2.8's "read the 375 px frame before ready" is dropped: the design draws no wrapped state, so the spec's wrap rule applies at whatever width the row stops fitting, and 320 px is tested |
| Input hover border | grey-900 | grey-900 (also the style guide's fields) | unchanged departure (grey-500, the tokens' "Component states") |
| Used option hover rule | present | present | unchanged departure (no hover, US-34 AC2) |
| Changelog §9 | absent | page titles "Personal Finance - <page>"; the touch tooltip never closes by itself | nothing for these parts (the titles are `app-shell.md` v1.2's rule; the tooltip is `transactions.md` 2.9) |

Questions after the re-read: UK-Q1 unchanged (the live design still names every "…" trigger "Budget options" or "Pot
options", the premise the process audit asked to recheck); UK-Q2, UK-Q3 and UK-Q4 unchanged; UK-Q5 down to two rows and
two options; UK-Q6 new. No other live change touches an approved document beyond what H11 (6) already carries (the
placeholder colour and the beige-500 rule of changelog §8a). The ratios in `ui-kit-figures/output.txt` are unchanged;
its labels "as exported" for grey-300 and beige-500 describe the export, and spec 4.3 now uses beige-500's 3.14:1 for
the input border only.

## The designer's changelog §12–§16 (v0.6)

After v0.5 the designer added §12 (UK-Q4's last part), §13 (the owner's answers on PR #92 drawn into the design) and §14
(page layouts by content width) to the designer's changelog. Two independent read-only Opus agents compared them with
v0.5 against the live files on 2026-10-05; the drafting agent re-read each point in the live files before changing the
spec. While v0.6 was being written the designer added §15 (review fixes) and §16 (records on the departures) and changed
both design files, so the changelog and the modal, its validation and the style guide's "Input Fields" were read again
the same day before the commit; the table gives the state at that second read. Under the owner's rule of 2026-10-05
(governance v1.10, pull request #94) a design question is the designer's: the spec tells the owner, and applies only a
decision the designer has recorded in the designer's changelog.

| Point | Live design (re-read 2026-10-05) | Spec v0.6 |
|---|---|---|
| UK-Q2 | §13a: the submit always enabled; messages under the fields on submit; focus to the first invalid field; `aria-invalid` | no longer a departure; 2.7 says the design matches; the four "for the designer" notes dropped |
| UK-Q6 | §13b: `data-autofocus` on "No, Go Back", `min-height: 44px` | no longer a departure (2.3); "No, Go Back" at least `var(--tap-target-min)` tall, checked in §7's E2E row |
| UK-Q7 | §13c: modal and login/sign-up fields 47 px; lists at `top: calc(100% + 8px)` | no longer a departure (2.5, 2.6) |
| "$" | grey-500 and `aria-hidden` in the modal; grey-500 in the style guide's sample (§13d) | the stale beige-500 note and the 2.11 "$" row removed; under "No longer departures" |
| UK-Q4, last part | §12a `--opacity-unavailable: 0.25`; §12b `--filter-menu-max-height: 360px` with a one-line `transactions.md` 2.8 amendment | answered by §12a–§12b as the owner directed; applied in 2.6, 2.10, §6, H13 (3); the 2.8 amendment goes in its own pull request; the seventh/eighth numbering fixed |
| Amount ≤ 0 message | §13a had "Enter an amount above 0"; §15a changed it to the approved "Amount must be greater than 0" | the field messages listed as the approved copy (§9 UK-Q2); no longer a difference, under "No longer departures" |
| Message clearing | `updateModal()` clears a field's message on edit; no blur message; §16a: "not decided. To discuss with the designer" | UK-Q9, a departure waiting for the designer's decision (through the owner); the blur message is US-31 AC1's |
| Modal overflow | first read: the panel scrolled (`max-height: calc(100vh - 32px)`, `overflow-y: auto`); second read, §16b "spec wins": the backdrop scrolls (`overflow-y: auto; overscroll-behavior: contain`), the panel has no maximum height or overflow | UK-Q10 raised, then answered by §16b; 2.2 cites it and takes `overscroll-behavior: contain`; nothing in 2.11 |
| §14, §16c | two-column layouts by the content width beside the sidebar; §16c records it as accepted | touches none of these parts; raised with the owner separately |
| §15b–§15d | the toolbar triggers back to 45 px; the style guide's field samples at 47 px, their placeholder grey-500 | not these parts (the verifications had raised them for the designer) |

`design-tokens.md`'s beige-500 "placeholder text" use, which one verification noted, is H11 (6)'s.
