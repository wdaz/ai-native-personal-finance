# How the ui-kit reviews were handled (T-15d, S1b)

## The two independent reviews have not run yet

Plan D7 asks for two read-only Opus reviews of `ui-kit.md` v0.1 (`06cfcd4`): one of the facts, one of the spec. The
drafting agent ran inside a workflow whose tool set has no Agent tool, so it could not dispatch them. Their briefs are
written (`ui-kit-review-1-facts-brief.md`, `ui-kit-review-2-spec-brief.md`); there are **no report files**, and none
were written in their place. The controller dispatches both against the pull request's head before it goes ready, saves
each report verbatim, and this file gains a table per report, as `transactions-review-handling.md` has.

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
