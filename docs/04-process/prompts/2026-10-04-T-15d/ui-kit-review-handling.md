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
