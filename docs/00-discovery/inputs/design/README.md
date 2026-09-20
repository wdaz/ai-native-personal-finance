# Design exports (Claude Design)

> **Location (2026-09-20):** these two files are **not in this repository** and
> never will be. They reproduce the Frontend Mentor premium design, whose
> licence forbids distributing the design files (see
> `../../research/frontend-mentor-license.md`), so they were removed from the
> working tree and from the whole git history before the repository was made
> public. The owner keeps them outside the repository, in `~/Own/design-exports/`;
> anyone who needs them again re-exports the Figma file from Claude Design. The
> rewrite is recorded in `docs/04-process/process-log.md` ("History rewrite:
> Claude Design exports purged before going public"). Everything below describes
> what those exports contain and what they may be used for; it stays valid.

Status: Input · Added: 2026-09-08 · Source: Claude Design, built from the
Frontend Mentor Figma file (`personal-finance-app.fig`, kept outside the repo).

| File | What it is | Size |
|------|------------|------|
| `style-guide.html` | Self-contained, rendered style guide: colours, typography, spacing, icons, buttons, inputs, sidebar, pagination, tabs, imagery | 1.1 MB |
| `app-prototype.html` | Self-contained interactive prototype of the whole app (login → overview, transactions, budgets, pots, recurring bills, modals), desktop/tablet/mobile | 1.2 MB |

Both are Claude Design "bundle" exports: a page template plus an embedded
manifest of compressed images (the challenge's avatars and illustration) and a
script that renders the page. Open them in a browser; they need JavaScript.

## What they are good for

- **Tokens (Phase 3).** The style guide lists 22 colours, 7 text presets
  (Public Sans, 32/20/16/14/12 px), 11 spacing steps (4–128 px) and 27 Phosphor
  icons, with token names (`--color-grey-900`, `--spacing-200`,
  `--font-size-text-preset-1`). All 22 hex values were checked against the
  tokens extracted directly from Figma on 2026-09-01 and match exactly. This is
  the source for `docs/02-architecture/design-tokens.md`.
- **Behaviour reference (Phase 2).** The prototype implements most of the
  challenge brief with the real `data.json` numbers, so it is a useful check
  when writing acceptance criteria: pagination by 10, name search, six sort
  orders, category filter, budget and pot CRUD (used categories/themes are
  disabled in the pickers), latest three transactions per budget, "See All"
  navigating to Transactions with the category filter set, "Spent" computed for
  August 2024 only, pot deposits/withdrawals moving the balance (with a preview
  of the change on the progress bar), pot deletion returning money to the
  balance, bills split into paid / upcoming / due-soon relative to 19 Aug 2024.
- **WebMCP tool candidates (Phase 2–3).** The prototype's state model —
  pages, modals and actions (`addBudget`, `editBudget`, `deleteBudget`,
  `addPot`, `editPot`, `deletePot`, `addMoney`, `withdraw`, search/sort/filter)
  — is a first inventory of what the app could expose to in-browser agents.

## Known gaps versus the challenge brief

These are limits of the prototype, not decisions. Requirements must cover
them explicitly, otherwise an agent told to "match the prototype" will
inherit them.

- No validation messages: an incomplete form only disables the button. The
  brief requires visible validation messages for required fields.
- No keyboard support or focus states: no `:focus` styles, no `tabindex`, no
  key handling; the modal does not close on Escape. The brief requires full
  keyboard navigation and visible focus states.
- Hover states exist in the style guide but are largely not applied in the
  prototype.
- Login / sign-up are visual only (placeholder text, no validation, no
  error state).
- Empty states exist for filtered lists but have no designed copy.

## Rules of use

- The prototype is **not a specification**. Specs in `docs/03-specs/` are
  written from the requirements and cite the prototype only as a visual and
  behavioural reference.
- Do not edit these files; re-export from Claude Design and replace them, and
  note the date here.
- `app-prototype.html` was exported under a wrong default name
  (`bank_hesabat_review.html`) and renamed on import; the content is the
  finance app.
