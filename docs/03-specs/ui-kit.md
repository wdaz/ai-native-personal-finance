# SPEC-ui-kit — the shared write-UI parts of Budgets and Pots

Status: **Draft v0.2** — five questions for the owner in §9 (UK-Q1 to UK-Q5); the two independent reviews of plan D7 are still to run (`prompts/2026-10-04-T-15d/ui-kit-review-handling.md`) · Author(s): Agent (Claude Code, Opus 5.5, background session) · Date: 2026-10-05
Implements (the shared parts of): US-15 AC1 (the "Already used" options), AC2 (typed amounts), AC4 (the modal); US-16 AC1 (the record's own category and theme stay selectable); US-17 AC1 (the confirmation dialog, "No, Go Back"), AC3 (the "no longer exists" notice); US-22 AC1 (the theme field), AC2 (target "limits as US-15"); US-23 AC1 (the pot's own theme); US-24 AC1, AC2; the amount field of US-25 AC2 and US-26 AC2; US-31 (the field messages of these parts); US-32 AC1 (the theme, category and "…" menus), AC2 (modals); US-34 (their hover and focus); US-40 AC2 (the dialog side of `delete_budget` and `delete_pot`) ·
Constrained by: ADR-0002 (`src/ui` holds the design-system primitives; the layers), ADR-0003 (component tests: "focus trap, menu keyboard, validation rendering"), ADR-0004 (the delete flow), ADR-0006 (`style-src`), `write-path.md` 2.7, 2.11, §3, 4.1, `transactions.md` 2.8, 2.9, NFR-A1–A8, NFR-W5, NFR-W6 ·
Resolves hand-off H13 (new) and the dialog part of H3 of `release-2-handoffs.md` · Plan: `docs/04-process/plans/2026-10-04-T-15d.md` v0.3, Task S1b ("Owner's amendment (v0.3)", D10–D14)
Design: the designer's Claude Design project — `Finance App.dc.html` (the Budgets and Pots screens and the modal), `Style Guide.dc.html` (Buttons, Input Fields, Shadow) and the designer's changelog; outside the repository — `docs/00-discovery/inputs/design/README.md`. **Read from the designer's export of 2026-10-04 22:17**, which lacks the changelog's later sections (§8, the WCAG fixes; §9): every design fact here is re-read from the designer's live source before this spec leaves draft (§9, "Before ready").

## 1. Purpose

Budgets and Pots are the two pages that change data, and they draw the same controls to do it: a page-header button that opens a form in a modal, a "…" menu on each card with Edit and Delete, a delete confirmation, an amount field, a theme field (and on Budgets a category field) with "Already used" options. `src/ui` has none of them (ADR-0002 and `src/ui/README.md` promise a `Modal`; `write-path.md` §6 "UI" leaves the components to the page specs). This spec states each part once — what it does, its keyboard and accessible names, its states, its look in tokens and its component tests — so `budgets.md` and `pots.md` cite its sections by number, as they cite `write-path.md`, and add only what belongs to their page (which fields a form has, the money rules, the records shown). It also states the contract between the delete dialog and the agent tools `delete_budget` and `delete_pot` (ADR-0004), which `webmcp-tools.md` §4 points to.

## 2. Behaviour

**2.1 The parts, and what the design draws on both pages.** The Budgets and Pots screens of the designer's project, read part by part. A part both pages draw is specified here; a part one page draws stays in that page's spec.

| Drawn on | Part | Where it is specified | File (a build task's name) |
|---|---|---|---|
| both | the page-header button "+ Add New Budget" / "+ Add New Pot" | 2.8 | `src/ui/PageHeader.tsx` (`primaryAction`, `app-shell.md` 2.5), `src/ui/Button.tsx` |
| both | the "…" button on each card and its Edit / Delete menu | 2.4 | `src/ui/ActionMenu.tsx` |
| both | one modal for every form and for the delete confirmation | 2.2 | `src/ui/Modal.tsx` |
| both | the delete confirmation ("Yes, Confirm Deletion", "No, Go Back") | 2.3 | `src/ui/ConfirmDeleteDialog.tsx`; `src/webmcp/bus.ts` |
| both | an amount field with a "$" prefix (Maximum Spend; Target; Pots' Amount to Add and Amount to Withdraw) | 2.5 | `src/ui/AmountField.tsx`; `parseAmountInput`, `formatAmountInput` in `src/shared/money.ts` |
| both | the Theme field; on Budgets also the Budget Category field (one field, two option lists) | 2.6 | `src/ui/SelectField.tsx` (on `transactions.md` 2.8's `Menu`) |
| both | the form's submit button | 2.7 | `src/ui/FormFooter.tsx` (with `Button`) |
| both | a 16 px theme dot (card headers, the Theme field, its options) | 2.10 | `src/ui/ThemeSwatch.tsx` (a `data-theme` selector, as `src/ui/overview/ThemeBar.tsx`) |
| neither (no design) | the "no longer exists" notice after a 404 (`write-path.md` §3) | 2.9 | `src/ui/Notice.tsx` |
| both | a cut name with its tooltip (Budgets' "Latest Spending" names; the Pots card title) | `transactions.md` 2.9 (`TruncatedText`, H12) — cited, not repeated | — |
| Budgets only | Spending Summary and donut, the 32 px progress bar, Spent / Remaining, "Latest Spending" with "See All" | `budgets.md` | — |
| Pots only | Total Saved, the 8 px bar, "+ Add Money" / "Withdraw" (secondary buttons), the Pot Name field with "N characters left", the money modals' preview bar | `pots.md` | — |
| both, but different | the white card (32 px padding on Budgets, 24 px on Pots) and the progress bars | each page spec | — |

Every part is a client component (`"use client"`; ADR-0001), imports only `src/ui` and `src/shared` (ADR-0002, `eslint.config.mjs`), takes its text as props from `COPY` (the Definition of Done) and writes no `style` attribute into server-rendered HTML (ADR-0006); a position computed in the browser is set through `element.style`, as `transactions.md` 2.9 does.

**2.2 The modal** (`Modal`; US-15 AC4, US-32 AC2, NFR-A3). One modal is open at a time on a page.
- **Props, in plain words:** whether it is open; the title; the description (optional); what to do when the person asks to close it; whether it may be closed now (`dismissible`, false while a request is pending, 2.7); which element gets focus first (optional); which element gets focus back (optional, otherwise the one that had focus when it opened); the body.
- **Roles.** Rendered in a portal on `document.body`: a backdrop element and, above it, a container with `role="dialog"`, `aria-modal="true"`, `aria-labelledby` the title (an `<h2>`) and `aria-describedby` the description when there is one. While it is open every other child of `document.body` gets the `inert` attribute (restored on close), so the page behind can be neither focused nor clicked nor read; the page's scroll is locked (`overflow: hidden` on `<html>` through `element.style`, restored on close).
- **Focus.** On open: the element the page names (a form names its first field; the delete dialog names "No, Go Back", 2.3), otherwise the first focusable element after the close button. **Tab and Shift+Tab wrap** inside the dialog (Tab on the last focusable element goes to the first, Shift+Tab on the first to the last; the list is read at each key press, since an open `Menu` adds elements). On close: focus returns to the element named, else to the one that had focus when the modal opened; when that element is gone or disabled (the card was deleted), focus goes to `<main>` (`MAIN_CONTENT_ID`, `src/ui/Shell.tsx`), as the reset banner's dismissal does (`app-shell.md` 2.6). Focus is never left on `<body>`.
- **Closing.** Escape, the close button and a click on the backdrop each ask to close, when `dismissible`. Escape while a `Menu` inside the modal is open closes only the menu: the `Menu` of `transactions.md` 2.8 stops the key there (a build note for that component), so the modal never sees it. A backdrop click counts only when the press also started on the backdrop, so selecting text in a field and releasing outside the panel does not close the form. While a request is pending (`dismissible` false) all three do nothing.
- **Close button.** A `<button type="button">` named "Close" (the design's `aria-label`) holding `CloseCircleIcon` (`src/ui/icons`, 32 px, decorative), grey-500, grey-900 on hover (`--duration-hover`), the project's focus ring (`app/globals.css`, `--focus-ring-*`). It sits at the end of the title row, `--spacing-200` from the title.
- **Look** (the design's, in tokens): the backdrop black at 50 % (no token: UK-Q4); the panel white, `--radius-150`, padding `--spacing-400` (`--spacing-300` `--spacing-250` below 768 px), its parts `--spacing-250` apart, as wide as the viewport allows up to 560 px (no modal token: UK-Q4), centred, kept `--spacing-500` from the viewport's edges (`--spacing-200` below 768 px), at most the viewport's height minus `2 × --spacing-200`, scrolling inside when taller; **no shadow** (`transactions.md` §9 Q2: the backdrop sets a modal apart). The title is `--text-preset-1` (`--text-preset-2` below 768 px) and wraps, an unbroken word too (`overflow-wrap: anywhere`), so a 30-character pot name in "Delete ‘…’?" never overflows the panel; the description is `--text-preset-4`, grey-500. It fades in over 200 ms (no token: UK-Q4) and does not animate under `prefers-reduced-motion: reduce`.

**2.3 The delete confirmation and its contract with the agent tools** (`ConfirmDeleteDialog`; US-17 AC1, AC3, US-24 AC1, AC2, US-40 AC2, NFR-W5, ADR-0004). One component for both pages and for both ways in — a person's "Delete" in the "…" menu (2.4) and an agent's `delete_budget` / `delete_pot`. `webmcp-tools.md` §4's delete-flow sentence points here (S6).
- **What it shows** (a `Modal`): the title "Delete ‘{name}’?" (the design's words and curly quotes, U+2018 and U+2019; `{name}` is the budget's category or the pot's name), the description (`COPY.deleteBudgetConfirm` or `COPY.deletePotConfirm`, the appendix's), the error area of 2.7 when a request failed, then two buttons, `--spacing-250` apart: **"Yes, Confirm Deletion"** — full width, red, white `--text-preset-4-bold`, padding `--spacing-200`, `--radius-100`, the tokens' "destroy" button (its hover: UK-Q5) — and **"No, Go Back"** — a text button, `--text-preset-4`, grey-500, grey-900 on hover.
- **Focus.** It opens on "No, Go Back", the action that loses nothing (a person who presses Enter at once keeps the record). Go Back, Escape, the close button and the backdrop all cancel.
- **Confirming.** The page's delete (`apiSend("DELETE", …)`, `write-path.md` 2.11 (2)) runs; meanwhile the confirm button reads "Deleting…" (UK-Q1) and has `aria-disabled="true"` (it keeps focus; a click or Enter does nothing) and the dialog is not dismissible. Then, by answer (`write-path.md` §3): **204** — the dialog closes, the record leaves the page with no reload, and focus goes where 2.2 says (after a person's delete the "…" button that opened it is gone, so `<main>`); **404** — the dialog closes, the notice of 2.9 says the record no longer exists and the list refreshes (US-17 AC3, US-24 AC2); **409** — the error area says "Data was reset — reloading" and the page reloads; **401** — the page reloads (the proxy's redirect to the login page); **429, 403, 415, 500, no response** — the error area shows `write-path.md` §3's message, the dialog stays open and the confirm button works again.
- **The contract with the tools** (`src/webmcp/bus.ts`, imports `src/shared` only; the page — `app/` may import both layers — joins it to the dialog, and `src/ui` never imports `src/webmcp`):

```
type DeleteKind = "budget" | "pot";
type DeleteResult = "deleted" | "cancelled" | "busy" | "not_found" | "conflict" | "unauthenticated";
requestDelete(kind, id): Promise<DeleteResult>            // called by delete_budget / delete_pot
onDeleteRequest(kind, handler: (id) => Promise<DeleteResult>): () => void   // the page subscribes; returns its unsubscribe
```

  1. The page subscribes on mount and unsubscribes on unmount, as its tools register and unregister (`webmcp-tools.md` 2.3); one handler per kind, the latest subscription wins. A request with no handler resolves `"cancelled"` at once (nothing was shown or deleted) and the tool's message says the page's dialog is not available.
  2. **`busy`** — at once, nothing opened, when any modal of the page is open (this dialog, a form, a money modal) or a write of the page is pending: a second call while the dialog is open (US-40 AC2) and a call while a person is editing are refused the same way, so two modals never stack.
  3. **`not_found`** — at once, no dialog and no request, when the `id` is not one of the records the page shows (`write-path.md` §6: "`cancelled`, `busy`, `not_found` before any request"). A well-formed `id` from before a reset is such an `id` (`write-path.md` 2.8).
  4. Otherwise the **same dialog** opens with that record's title. The tool's result is the dialog's **final** outcome: Go Back, Escape, the close button, the backdrop, or the page unmounting while the dialog is open → `"cancelled"`; a confirm answered 204 → `"deleted"`, and the tool returns `{ deleted: true }` (`write-path.md` §6); 404 → `"not_found"`; 409 → `"conflict"` and 401 → `"unauthenticated"`, each resolved before the page reloads. A 429, 500 or network failure leaves the dialog open with its message, as for a person; the tool waits for the person's next choice.
  5. The delete that a confirm triggers is the **same function** the "…" path uses, with `X-Via: webmcp` added for a tool's request (`write-path.md` 2.11 (2)), so the request is on record (US-40 AC3) and the page changes exactly as after a person's delete.
  6. Nothing reaches the server before the confirm (R-16). The runtime hands a tool no `AbortSignal` (H3; `webmcp-tools.md` 2.5); if a signal is ever given and aborts while the dialog is open, the dialog closes and the result is `"cancelled"`.
  7. The result maps to the tool's answer as `write-path.md` 2.11 (4) says, plus `busy` (the build note there: `TOOL_ERROR_CODES` gains `busy`). The tool tables are `budgets.md`'s and `pots.md`'s.

**2.4 The "…" action menu** (`ActionMenu`; US-32 AC1 names the pot "…" menu; NFR-A4: "listbox or menu semantics"). A menu of actions on one record — not the one-value `Menu` of `transactions.md` 2.8, which has a current value and options. Its items are the page's: on Budgets "Edit Budget", "Delete Budget"; on Pots "Edit Pot", "Delete Pot" (the design's words).
- **Roles.** The trigger is a `<button type="button">` with `aria-haspopup="menu"`, `aria-expanded` and `aria-controls`; its accessible name is "{label}: {name}" — "Budget options: Entertainment", "Pot options: Savings" (the design names every trigger "Budget options" or "Pot options"; UK-Q1 asks for the record's name after it). The popup is a `role="menu"` with `aria-labelledby` the trigger; each item is a `<button type="button" role="menuitem" tabindex="-1">`. The icon (`dots-three-outline`, Phosphor, 16 px) is decorative.
- **Keys on the trigger:** Enter, Space and ArrowDown open the menu and focus the first item; ArrowUp opens it and focuses the last. **In the open menu** (focus moves onto the items): ArrowDown and ArrowUp move (no wrap, as 2.8's listbox); Home and End go to the first and last item; Enter and Space activate the focused item; Escape closes and returns focus to the trigger; Tab and Shift+Tab close, put focus back on the trigger and let the browser move on from it (2.8's rule, so focus is never lost when the menu unmounts). Type-ahead is not required (two items).
- **Pointer:** a click on the trigger opens or closes; a click on an item activates it; a click anywhere else closes; opening one "…" menu closes any other menu on the page.
- **Activating** an item closes the menu; Edit opens the page's form modal and Delete the dialog of 2.3, each given the trigger as the element to return focus to (2.2).
- **Look** (the design's): the icon grey-300, grey-900 on hover (grey-300 on white is 2.10:1: UK-Q5); its hit area is at least `--tap-target-min` by an invisible box around the 16 px icon, so the card's layout stays as drawn. The panel: white, `--radius-100`, padding `--spacing-150` `--spacing-250`, 134 px wide (no token: UK-Q4), its top `--spacing-150` below the icon and its right edge on the icon's, `var(--shadow-popover)` (`transactions.md` 2.8, H11 (2); the designer's style guide names this menu as one of its uses), fading in over 150 ms (UK-Q4), none under `prefers-reduced-motion`. Items: `--text-preset-4`, padding `--spacing-150` 0, a 1 px grey-100 divider between them; the Edit item grey-900, grey-500 on hover; the Delete item red, at 70 % opacity on hover (UK-Q5). Positioned by CSS alone (a positioned wrapper), as 2.8's panels are.

**2.5 The amount field** (`AmountField`; US-15 AC2, US-22 AC2 "limits as US-15", US-25 AC2, US-26 AC2, US-31). The existing `Field` (`src/ui/Field.tsx`: label, input, helper, error, `aria-describedby`, `aria-invalid`, a polite live region) with a leading "$". `Field` gains three props (a build note): a leading adornment, a `placeholder` and an `inputMode`.
- **The input** is `type="text"` with `inputMode="decimal"`, `autocomplete="off"` and `maxLength` 32 (the longest valid text, `-$999,999,999.99`, has 16 characters; 32 leaves room for leading zeros and spaces and bounds the parse) — not the design's `type="number"`, which cannot hold "$" or "," (2.11). The "$" is drawn inside the field's start edge, `--spacing-250` from it, and is `aria-hidden` (the label names the field). The placeholder is the page's (the design: "e.g. 2000"), grey-500 (the designer's changelog §8a, H11 (6)).
- **What it accepts** — the spec's reading of US-15 AC2 ("an optional leading `$` and thousands separators, which are stripped"; R-17), one pure function `parseAmountInput(text)` in `src/shared/money.ts` (which has formatters only today), returning integer cents or one of `write-path.md` 2.7's codes. In this order: (1) surrounding white space is trimmed; nothing left → `required`; (2) one leading `-` is noted and removed, then one leading `$`; (3) the rest must be ASCII digits, either plain (`1234`) or grouped by commas in threes (`1,234`, `12,345,678`), optionally followed by `.` and one or two digits, or `.` and one or two digits alone (`.5`), with at least one digit → otherwise `invalid_format`; (4) the value in cents is computed from the digits as an integer (no floating point, so a 20-digit input loses nothing); a `-` or a value of 0 → `too_small`; more than 99,999,999,999 → `too_large`; (5) otherwise the cents. 4.1 lists the worked examples. The messages are `write-path.md` 2.7's table ("Can't be empty", "Enter an amount with up to two decimals", "Amount must be greater than 0", "Amount is too large"); the page adds its own rules after these (Pots' `exceeds_balance`, `exceeds_total`).
- **When the message shows** (US-31 AC1, AC2): on blur once the person has typed in the field, and on submit; on submit the first invalid field of the form gets focus. A server `validation` answer puts each `issues` entry under its field the same way (`write-path.md` §3). The message is linked by `aria-describedby` and announced by `Field`'s live region (NFR-A5).
- **Pre-filled** (an edit form; US-16 AC1, US-23 AC1): `formatAmountInput(cents)` — whole dollars as digits only ("750"), otherwise two decimals ("75.50"); no "$" and no separators, so every seed value shows as the design shows it and `parseAmountInput` reads it back to the same cents (4.1).
- **Look:** `Field`'s (Release 1, `Field.module.css`): beige-500 border, grey-500 on hover, grey-900 when focused, plus the focus ring; the error in red under the field.

**2.6 The select field — Theme, and Budget Category** (`SelectField`; US-15 AC1, US-16 AC1, US-22 AC1, US-23 AC1, US-32 AC1, NFR-A4). A form field built on `transactions.md` 2.8's `Menu` (listbox semantics, its keys, its `aria-disabled` options, its focus return); this section adds the label, the error wiring (2.8: "a form adds its own label and error wiring, US-31") and the option rows. The page passes the options and which are used.
- **Label and name.** A visible label above the trigger (`--text-preset-5-bold`, grey-500, as `Field`'s): "Theme", "Budget Category" (the design's). The trigger's accessible name is 2.8's "{label}: {current}" — "Theme: Green", "Budget Category: Groceries". With an error, the trigger has `aria-invalid="true"` and `aria-describedby` the message, shown under it like `Field`'s.
- **The trigger** looks like an input: `Field`'s box, border and hover, the current value (and its swatch, 2.10, for a theme) on the left, a 16 px caret-down icon on the right.
- **The options** fill the field's width, under the trigger: `--text-preset-4`, padding `--spacing-150` 0, a 1 px grey-100 divider; at most 300 px tall, then scrolling (no token: UK-Q4). The current option is bold and `aria-selected` (2.8); the Theme list also draws a green `check-circle` icon at its end (decorative; the design's). A theme option starts with its swatch.
- **"Already used."** An option another record holds — another budget's category or theme on Budgets, another pot's theme on Pots (`write-path.md` 4.1: a budget and a pot may share a theme) — is shown, has `aria-disabled="true"`, is skipped by the arrow keys and cannot be chosen (2.8); its label is grey-500, its swatch at 25 % opacity, and the text "Already used" (`--text-preset-5`, grey-500; US-15 AC1, the design) sits at its end, inside the option, so a screen reader reads "Bills, Already used" and the state is never told by colour alone (NFR-A7). **The record being edited never counts against itself** (US-16 AC1, US-23 AC1, R-18). With the seed, 4.2 lists what each form disables.
- **No free option.** When every option is used (all ten categories have a budget; fifteen pots hold the fifteen themes), the trigger shows no value and the page shows its message under the field (Budgets: `COPY.budgetCategoriesUsed`, "All categories already have a budget"); the page decides whether the form opens at all.
- **A server `taken`** (another tab used the value meanwhile) shows "Already used" under the field (`write-path.md` 2.7, §9 Q5) and the option list is refreshed from the page's data.

**2.7 The form footer: submit, pending, failure** (`FormFooter`; `write-path.md` §3, US-31 AC3). The end of every form modal (Budgets' and Pots' add and edit forms, Pots' money modals).
- **The error area** — one `role="alert"` paragraph above the submit button, empty and taking no space until a request fails with a message that belongs to no field: `write-path.md` §3's rate-limit, server-error, network and refused messages, and "Data was reset — reloading" before a reload. `--text-preset-5`, red, as a field error. The design has no failure states; this is one (2.11).
- **The submit button** is `Button` (primary: grey-900, grey-500 on hover, `--text-preset-4-bold`, padding `--spacing-200`, `--radius-100`, full width), labelled by the page ("Add Budget", "Save Changes", "Add Pot", "Confirm Addition", "Confirm Withdrawal" — the design's). **Whether it is disabled until the form is valid is UK-Q2**; this draft writes the recommended answer: it is always enabled, and pressing it with an invalid field shows the messages and focuses the first invalid field (US-31 AC1, AC2).
- **Pending:** from the request until its answer the button reads "Saving…" (UK-Q1), has `aria-disabled="true"` (it keeps focus; a click or Enter does nothing, so one press sends one request), and the modal is not dismissible (2.2). Then `write-path.md` §3: success closes the modal and returns focus to its trigger (2.2); a field error re-enables the button and focuses the first invalid field; 404 closes the modal and shows 2.9's notice; 409 and 401 as in 2.3; the rest show their message in the error area and re-enable the button.

**2.8 The page-header button** (`PageHeader`'s `primaryAction`, `app-shell.md` 2.5; plan T-07 D21: "arrives with Release 2's first page that has one"). Both pages draw it to the right of the title: "+ Add New Budget", "+ Add New Pot".
- `PageHeader` takes a `primaryAction` node (a client component of the page, because opening the modal needs a handler a Server Component cannot pass) and renders it first in its actions group, before the compact indicator and the "Log out" icon below 1024 px (`--spacing-200` apart, as the design draws them). At 1024 px and up it is the group's only item.
- The button is `Button` with a width that fits its text (`Button` gains this option; today it is always full width), `white-space: nowrap`. The "+" is drawn in an `aria-hidden` span, so the accessible name is "Add New Budget" / "Add New Pot", which the visible label contains (WCAG 2.5.3).
- It opens the page's add form; the modal returns focus to it (2.2). **Fit:** when the title and the actions do not fit on one line (US-33 AC3 at 320 px), the actions wrap to a second line, right-aligned, and nothing is clipped — the rule `transactions.md` 2.9 uses for its toolbar. Whether the row already needs it at 375 px is read from the designer's mobile frame before ready (§9).

**2.9 The "no longer exists" notice** (`Notice`; `write-path.md` §3 "Record gone": "a message that the budget/pot no longer exists, the modal closes, the list refreshes"; US-17 AC3, US-24 AC2). The design has no such state; where the message appears is **UK-Q3**, and this draft writes the recommended answer: a notice at the top of the page's content, under the page header, drawn as the reset banner is (`app-shell.md` 2.6: a white card, `--radius-150`, `--text-preset-4` grey-900, the close-circle "Dismiss notice" button in a `--tap-target-min` box), with `role="status"`, so it is announced. It holds `COPY` "This budget no longer exists" or "This pot no longer exists" (approved, `write-path.md` §9 Q5). It stays until dismissed or until the next write of the page succeeds; a second 404 replaces its text. Dismissing it moves focus to `<main>`, as the reset banner's dismissal does. The reset banner (`ResetBanner`) and this notice share the card's look; the build may make `ResetBanner` a use of `Notice`.

**2.10 The theme swatch** (`ThemeSwatch`). A 16 px circle (`--spacing-200` square, fully rounded) filled with a theme's colour token through a `data-theme` attribute selector per theme, as `ThemeBar` does (`src/ui/overview/ThemeBar.tsx`); never an inline `style` (ADR-0006). (`themeVar`, `src/ui/overview/theme-color.ts`, is for an SVG presentation attribute such as the donut's `stroke`, not for this element.) Decorative (`aria-hidden`): the theme's name is always written beside it (the field, the option) or the card's title names the record; a theme is never told by colour alone (NFR-A7). A used option's swatch is drawn at 25 % opacity (2.6).

**2.11 Where this spec departs from the design, or adds to it.** Only what the design cannot show is added here; a change to what the design draws is a question in §9.

| The design (export of 2026-10-04 22:17) | This spec | Source |
|---|---|---|
| The modal is a plain `div`: no `role`, no focus handling, the page behind stays reachable | `role="dialog"`, `aria-modal`, named by its title, focus trapped and returned, the page `inert` | US-15 AC4, US-32 AC2, NFR-A3 (S2's record, `transactions-review-handling.md`, lists "modal" among the designer's changelog §8 changes — re-read before ready) |
| The "…" menu and the select fields are plain buttons: no roles, no keys | menu-button and listbox semantics with the keys of 2.4 and `transactions.md` 2.8 | US-32 AC1, NFR-A4 |
| No focus indicator | the project's focus ring on every control | tokens, NFR-A2 |
| The amount input is `type="number"` | `type="text"`, `inputMode="decimal"`: a number input cannot hold "$" or "," | US-15 AC2, R-17 |
| No validation messages; the form shows nothing when invalid | the messages of `write-path.md` 2.7 under each field, the first invalid field focused | US-31 |
| No failure states | the error area of 2.7; the notice of 2.9 (its place: UK-Q3) | `write-path.md` §3 |
| Input border grey-900 on hover | grey-500 | tokens, "Component states" (as `transactions.md` 2.15) |
| Input boxes 45 px tall | `Field`'s box (padding `--spacing-150` `--spacing-250`, the login page's since Release 1) | `Field.module.css` |
| The "…" button's hit area is its 16 px icon | at least `--tap-target-min`, invisible; the icon as drawn | `--tap-target-min` (`app-shell.md` §4) |
| An "Already used" option still has a hover rule | no hover | US-34 AC2 |
| Pending: nothing | the submit says it is working and sends once | `write-path.md` §3 |
| "+" read aloud as part of the button's name | the "+" is `aria-hidden` | WCAG 2.5.3 (the name still contains the visible label) |

Not decided here, asked in §9: the submit button disabled until the form is valid (UK-Q2), the place of the "no longer exists" message (UK-Q3), four colours that fail WCAG AA contrast (UK-Q5).

**2.12 Copy.** Every visible and accessible string of these parts, with its source. The strings marked *the design*, *US-15* and *US-17* are not in the copy appendix today; they go into its "R2 additions" table and into `COPY` together, with UK-Q1's once approved (H13; `tests/unit/shared/copy.test.ts` holds the two equal). This spec only lists them.

| String | Where | Source |
|---|---|---|
| Close | the modal's close button (heard) | the design (`aria-label`) |
| Delete ‘{name}’? | the delete dialog's title | the design |
| Are you sure you want to delete this budget? … / … this pot? … | the delete dialog's description | the appendix (`COPY.deleteBudgetConfirm`, `deletePotConfirm`) |
| Yes, Confirm Deletion · No, Go Back | the delete dialog's buttons | the design; US-17 AC1 ("No, Go Back") |
| Deleting… · Saving… | the confirm and the submit button while pending | **new** (UK-Q1) |
| Budget options: {name} · Pot options: {name} | the "…" button's name (heard) | the design's "Budget options", "Pot options" + `transactions.md` §9 Q1's approved pattern "{label}: {current}" — **new use** (UK-Q1) |
| Edit Budget · Delete Budget · Edit Pot · Delete Pot | the "…" menu's items (the page passes them) | the design |
| Already used | a used option; a server `taken` | the design, US-15 AC1; `COPY` with H10 (`write-path.md` §9 Q5) |
| {label}: {current} | a select field's name (heard) | `transactions.md` §9 Q1 (approved) |
| + Add New Budget · + Add New Pot | the header buttons (the page passes them) | the design |
| This budget no longer exists · This pot no longer exists · Dismiss notice | the notice of 2.9 | `write-path.md` §9 Q5 (approved) · `COPY.dismissNotice` (exists) |
| Can't be empty · Enter an amount with up to two decimals · Amount must be greater than 0 · Amount is too large | the amount field's messages | `COPY` (exists) |
| All categories already have a budget | Budgets' category field with no free option | `COPY.budgetCategoriesUsed` (exists) |
| Data was reset — reloading · Too many changes. Try again in {N} seconds · Something went wrong. Try again · Can't reach the server. Check your connection and try again | the error area | `write-path.md` §3 (existing, or approved in its §9 Q5) |

The field labels, placeholders and button labels of each form ("Budget Category", "Maximum Spend", "Theme", "Pot Name", "Target", "e.g. 2000", "Add Budget"…) are the page specs' to list.

## 3. States

| Part | State | Trigger | What the user sees | Exit |
|---|---|---|---|---|
| Modal | Open | a header button, a menu item, a tool's delete | the panel over a darkened, inert page; focus inside | close, or a request's answer |
| Modal | Pending | a submit or a confirm | "Saving…" / "Deleting…"; nothing closes it | the answer |
| Modal | Failed | 429, 403, 415, 500, no answer | the message in the error area; the form keeps what was typed | retry, or close |
| Delete dialog | Busy (tool) | `delete_*` while a modal is open or a write is pending | nothing changes on screen; the tool gets `busy` | — |
| Delete dialog | Unknown id (tool) | `delete_*` with an id the page does not show | nothing changes; the tool gets `not_found` | — |
| Delete dialog | Record gone | 404 on confirm | the dialog closes; the notice of 2.9; the list refreshes | dismiss the notice |
| Action menu | Closed / open | its trigger | the icon / the two items under it | Escape, Tab, outside click, an item |
| Amount field | Empty, untouched | the form opens | the placeholder, no message | typing |
| Amount field | Invalid | blur after typing, submit, a server 400 | the field's message in red, `aria-invalid` | a valid value |
| Select field | An option used | another record holds it | the option greyed with "Already used"; not choosable | — |
| Select field | No free option | every option used | no value; the page's message under the field | — |
| Notice | Shown | a 404 | the card under the header | dismiss; the next successful write |
| Header button | — | always on Budgets and Pots | "+ Add New …" | — |

Loading and empty states of the pages are the page specs'; these parts have none of their own.

## 4. Rules and boundaries

The figures below are printed by `docs/04-process/prompts/2026-10-04-T-15d/ui-kit-figures/` (its README says how `output.txt` was made and which parts are the repository's code); the build task moves the amount examples into the parser's unit test.

**4.1 The amount grammar, worked** (`parseAmountInput`, 2.5; each line of `output.txt`). Accepted: `0.01` → 1 cent; `1` → 100; `42` and ` 42 ` → 4,200; `007` → 700; `75.5` and `75.50` → 7,550; `.5` → 50; `$1,234.50`, `1,234.5` and `1234.50` → 123,450; `12,345,678` → 1,234,567,800; `$999,999,999.99` and `999999999.99` → 99,999,999,999 (the maximum). `required`: the empty text and only spaces. `too_small`: `0`, `0.00`, `$0`, `-5`, `-$5`, `-0`. `too_large`: `1,000,000,000`, `1000000000`, `99999999999999999999`. `invalid_format`: `5.`, `$-5`, `1.234`, `1,23`, `1,2345`, `12,34.5`, `$ 5`, `$$5`, `$`, `-`, `1e3`, `0x10`, `Infinity`, `NaN`, `5 000`, a full-width digit (`５`), a minus sign that is not the ASCII hyphen (`−5`), `USD 5`. Pre-fill (`formatAmountInput`): the seed's budget maximums show as 50, 750, 75, 100 and its pot targets as 2000, 150, 150, 1000, 1440; 1 cent as `0.01`, 7,550 as `75.50`, 123,450 as `1234.50`, the maximum as `999999999.99`, and each reads back to the same cents.

**4.2 "Already used" with the seed** (`prisma/data.json`): 4 budgets (Entertainment Green, Bills Cyan, Dining Out Yellow, Personal Care Navy) and 5 pots (Savings Green, Concert Ticket Navy, Gift Cyan, New Laptop Yellow, Holiday Purple). **Add Budget:** 4 of 10 categories used, 6 free (Groceries, Transportation, Education, Lifestyle, Shopping, General); 4 of 15 themes used, 11 free. **Add Pot:** 5 themes used (Green, Navy, Cyan, Yellow, Purple), 10 free. The first free option in `CATEGORIES` / `THEMES` order is Groceries and Red (both forms); whether a form opens on it, as the design does, is the page spec's. **Edit forms:** each budget disables the other 3 categories and the other 3 themes and keeps its own (e.g. Entertainment disables Bills, Dining Out, Personal Care and Cyan, Yellow, Navy); each pot disables the other 4 themes. Green is used by both a budget and a pot, which is allowed (`write-path.md` 4.1). **Delete titles:** "Delete ‘Entertainment’?" … "Delete ‘Personal Care’?", "Delete ‘Savings’?" … "Delete ‘Holiday’?"; the longest seed pot name has 14 characters, the limit is 30.

**4.3 Contrast of the drawn colours** (WCAG 2.1; opacity composited over white). Pass AA: grey-500 on white 5.55:1, grey-900 on white 16.37:1, red on white 4.73:1, white on red 4.73:1, white on grey-900 16.37:1, white on grey-500 5.55:1. **Fail:** grey-300 on white 2.10:1 (the "…" icon; WCAG 1.4.11 asks 3:1 for a control's graphic), beige-500 on white 3.14:1 (the "$"; 1.4.3 asks 4.5:1 for text), red at 70 % on white 2.93:1 (the Delete item's hover), white on red at 80 % 3.44:1 (the destroy button's hover, the tokens' "red → red at 80 % opacity"). UK-Q5.

**4.4 Boundaries.** An amount: 4.1. A theme or category list: 10 and 15 options (`src/shared/enums.ts`), all, some or none used. A name in a dialog title: up to 30 characters, any characters, rendered as text (NFR-S7), wrapping (2.2). One modal at a time; one "…" menu open at a time. The narrowest width: 320 px (US-33 AC3): the modal keeps `--spacing-200` around it and scrolls inside; the header wraps (2.8).

## 5. Data

None. The parts read only their props; the records, the used values and the writes are the page specs' (`write-path.md` §5). The bus (2.3) holds one handler per kind in memory, in the page, and nothing else.

## 6. Interfaces

### UI
New: `src/ui/Modal.tsx`, `ConfirmDeleteDialog.tsx`, `ActionMenu.tsx`, `AmountField.tsx`, `SelectField.tsx`, `FormFooter.tsx`, `Notice.tsx`, `ThemeSwatch.tsx`, their CSS modules, and the icons `dots-three-outline`, `caret-down` (also `transactions.md`'s) and `check-circle` (Phosphor, listed in `design-tokens.md`). Changed: `Field` (leading adornment, `placeholder`, `inputMode`), `Button` (a fitting width), `PageHeader` (`primaryAction`), and `ResetBanner` if it becomes a `Notice`. Shared: `parseAmountInput`, `formatAmountInput` (`src/shared/money.ts`). Used, not changed: `Menu` and `TruncatedText` (`transactions.md` 2.8, 2.9), `CloseCircleIcon`, the `data-theme` selectors of `ThemeBar`. Keyboard: 2.2, 2.4, 2.6. Accessible names: 2.12.

### API
None of its own. The writes these parts send are `write-path.md`'s and the page specs'.

### WebMCP tools
None of its own. The delete tools' dialog side and their results: 2.3. The tool tables (`delete_budget`, `delete_pot`) are `budgets.md`'s and `pots.md`'s.

## 7. Tests required

Component tests are Vitest + Testing Library in jsdom (ADR-0003; `// @vitest-environment jsdom`), role and label locators, fake timers where time matters; hover and focus styles are asserted in E2E with `toHaveCSS` (`app-shell.md` §7's rule). Each test title names the stories it covers.

| Level | What is asserted | Traces to |
|-------|------------------|-----------|
| Unit — shared | `parseAmountInput`: every example of 4.1 (failing first: the function does not exist); `formatAmountInput`: the pre-fill examples and that every value of 4.1 it formats reads back to the same cents | 2.5, 4.1 · US-15 AC2, US-22 AC2, US-25 AC2, US-26 AC2 |
| Unit — webmcp | the bus: no handler → `cancelled`; a handler's `busy` and `not_found` returned unchanged; the latest subscription wins; an unsubscribe removes only its own handler; a tool's result mapping including `busy` | 2.3 · US-40 AC2 |
| Component — `Modal` | roles and names (`dialog`, `aria-modal`, labelled, described); first focus (the named element, else the first after Close); **Tab and Shift+Tab wrap**; Escape closes; Escape with a `Menu` open inside closes only the menu; the close button and a backdrop press-and-release close; a press inside and release on the backdrop does not; nothing closes it when not dismissible; focus returns to the trigger, and to `<main>` when the trigger is gone; body siblings `inert` while open and restored after; scroll restored | 2.2 · US-15 AC4, US-32 AC2, NFR-A3 |
| Component — `ConfirmDeleteDialog` | the title and description; first focus on "No, Go Back"; every cancel path calls cancel once; confirm shows "Deleting…" with `aria-disabled` and keeps focus; a second press sends nothing; each answer of 2.3 (204, 404, 409, 401, 429, 500, network) does what 2.3 says; the error area is `role="alert"` | 2.3 · US-17 AC1, AC3, US-24 AC1, AC2 |
| Component — the dialog with the bus | a tool request opens the same dialog; cancel → `cancelled`; confirm + 204 → `deleted` and the delete carried `X-Via: webmcp`; confirm + 404 → `not_found`; a request while a modal is open → `busy`; an unknown id → `not_found` with no dialog and no request; unmounting while open → `cancelled`; a 429 keeps the dialog open and the result pending until the person's next choice | 2.3 · US-40 AC2, AC3, NFR-W5 |
| Component — `ActionMenu` | roles (`aria-haspopup="menu"`, `aria-expanded`, `menu`, `menuitem`), the name "Budget options: Entertainment"; every key of 2.4 (Enter, Space, ArrowDown, ArrowUp on the trigger; ArrowDown, ArrowUp, Home, End, Enter, Space, Escape, Tab, Shift+Tab in the menu); focus back on the trigger; outside click; one menu open at a time; an item's action called once | 2.4 · US-32 AC1, NFR-A4 |
| Component — `AmountField` | validation rendering: no message before typing; the message on blur after typing and on submit; `aria-invalid` and `aria-describedby` set and cleared; the live region; a server `issues` entry shown; the "$" `aria-hidden`; `inputMode="decimal"`, `type="text"` | 2.5 · US-31 AC1, AC2, US-15 AC2, NFR-A5 |
| Component — `SelectField` | the label and the name "Theme: Green"; used options `aria-disabled`, skipped by the arrows, not choosable, with "Already used" in their text; the edited record's own value enabled; no free option → no value and the page's message; a `taken` error under the field; the swatch `aria-hidden` | 2.6 · US-15 AC1, US-16 AC1, US-22 AC1, US-23 AC1, US-32 AC1, NFR-A7 |
| Component — `FormFooter`, `PageHeader`, `Notice` | the pending label and `aria-disabled`; the error area appears only with a message; the submit stays enabled with invalid fields and focuses the first one (as UK-Q2 is answered); `primaryAction` renders before the compact actions, its name without "+"; the notice is `role="status"` and its dismissal focuses `<main>` | 2.7–2.9 · US-31 AC3, US-17 AC3, US-24 AC2 |
| E2E (in `budgets.md` and `pots.md`) | each page spec's Tests table names, for its page: the modal's trap, Escape and focus return; the "…" menu and the select fields by keyboard (its US-32 walkthrough); a validation message per amount field; hover and focus with `toHaveCSS` on the header button, the "…" icon, an item, a select trigger, an option, the confirm and Go Back (US-34); a delete through the "…" menu and through the tool, with cancel; axe with a modal open; 320 px with a modal open | 2.2–2.8 · US-15 AC4, US-31, US-32, US-33, US-34, US-40 AC2 |

## 8. Out of scope

Which fields each form has, their order, labels, placeholders and defaults; the Pot Name field and its counter; the money modals' preview bar and rules; the records, their cards and bars; the tool tables (`budgets.md`, `pots.md`). Toasts and undo; a confirmation before closing a form with typed data (the design closes it); type-ahead in menus; nested modals; a date or a free-text select; a currency other than USD; the native `<dialog>` element (the spec states behaviour that a `div` with `role="dialog"` and `inert` meets in every engine the suites run, and that jsdom can test without stubs; the build may use `<dialog>` only if every row of §7 still passes). `Menu` and `TruncatedText` themselves (`transactions.md` 2.8, 2.9).

## 9. Open questions

Five questions, UK-Q1 to UK-Q5 (prefixed so an answer cannot be taken for another spec's question, plan D13). Each can be answered by its letter.

**UK-Q1 — May these parts use three new texts?** *What:* the shared parts need three short English texts that no approved list has. Every text the app shows or reads aloud must first be in the message table at the end of `user-stories.md`, which you approve; the code may use only texts from that table. Two are seen on the screen; one is never seen — it is what a **screen reader** (software that reads the page aloud for a person who cannot see it) says, or what a person using **voice control** (operating the page by speaking the names of its buttons) says to press it.

| # | Text | Where it is used | Seen or heard |
|---|---|---|---|
| 1 | Saving… | the button at the end of every Budgets and Pots form, while the change is being sent (write-path asks the button to "say it is working") | seen |
| 2 | Deleting… | the "Yes, Confirm Deletion" button while the deletion is being sent | seen |
| 3 | Budget options: {name} — e.g. "Budget options: Entertainment"; Pot options: {name} — e.g. "Pot options: Savings" | the name of the "…" button on each card. The design names every one of them just "Budget options" (or "Pot options"), so on a page with four budgets a screen reader hears four identical buttons and a voice-control user cannot say which one; adding the record's name tells them apart. It uses the pattern "{label}: {current}" you approved for the Transactions menus | heard |

*Why it matters:* without 1 and 2 the button gives no sign that something is happening; without 3 the four "…" buttons sound the same. Once approved, the texts go into the table and into the code together, in the first Budgets or Pots build task (H13).
- (a) **Approve all three as written — recommended.**
- (b) Change the wording of some (say which numbers and the new words).
- (c) Approve 1 and 2; keep the design's names "Budget options" and "Pot options" for 3.

**UK-Q2 — Is the form's button always pressable, or greyed out until the form is complete?** *What:* the design greys out the button at the end of each form (half transparent, cannot be pressed) until the required fields hold something — for example "Add Budget" stays grey while Maximum Spend is empty. Story US-31, which you approved, asks for a message under each empty or wrong field "on submit" (when the button is pressed) and says the greyed-out button alone is not enough. A greyed-out button cannot be pressed, so the "on submit" messages could never appear for an empty field, and a person using only the keyboard who presses Enter gets no answer at all.
*Why it matters:* it changes what the design draws, so the spec does not decide it.
- (a) **The button is always pressable (except while the change is being sent); pressing it with an empty or wrong field shows the messages and moves the cursor to the first one. The design's grey state is not used — recommended** (it is what US-31 asks).
- (b) Greyed out as drawn, with the messages shown when a person leaves a field after typing; US-31's "on submit" messages then do not exist, which the spec records as a gap.

**UK-Q3 — Where does "This budget no longer exists" appear?** *What:* when a person edits or deletes a budget or a pot that someone deleted meanwhile (in another browser tab, or an AI agent), the server answers "not found". The approved write-path spec says: a message that the budget (or pot) no longer exists is shown, the form closes and the list refreshes. The design has no such message, so it does not say where it goes.
*Why it matters:* it adds an element the design does not draw.
- (a) **A small white card at the top of the page, under the title, looking like the existing "Demo data resets every…" card, with the same round close button; a screen reader reads it out — recommended** (the form is gone, so the message needs a place on the page; the look already exists).
- (b) The form stays open and shows the message in place of its fields, with only a close button; the list refreshes behind it. This changes the approved write-path text ("the modal closes"), so that spec would be amended too.

**UK-Q4 — Six design values that have no token: new tokens, or written as the design's values?** *What:* the project's rule is that every colour, size and duration comes from `design-tokens.md` (the token list) and nowhere else. These six, which the design draws, have no token:

| Value | Where | Proposed token |
|---|---|---|
| black at 50 % opacity | the dark layer behind a modal | `--color-backdrop: rgba(0, 0, 0, 0.5)` |
| 560 px | a modal's maximum width (the same number as the existing `--auth-card-max-width`, which is named for the login card) | `--modal-max-width: 560px` |
| 134 px | the width of the "…" menu | `--action-menu-width: 134px` |
| 300 px | the tallest a Theme or Category list grows before it scrolls | `--field-menu-max-height: 300px` |
| 200 ms | a modal fading in | `--duration-modal: 200ms` |
| 150 ms | a menu fading in (the same number as `--duration-hover`, named for colour changes) | `--duration-popover: 150ms` |

*Why it matters:* a value written outside the token list breaks the rule and is not covered by the test that holds the list and the code equal.
- (a) **Add the six tokens to `design-tokens.md` and `src/ui/tokens.css` together, in the first Budgets or Pots build task — recommended.**
- (b) Reuse the two tokens that already hold the same numbers (560 px, 150 ms), and write the other four in the components' style files as the design's numbers, each with a comment naming the design (as `transactions.md` writes its menus' widths).

**UK-Q5 — Four drawn colours are too faint for the accessibility standard: change them?** *What:* the project must meet WCAG 2.1 AA (NFR-A1), which asks text to stand out from its background by at least 4.5 to 1 and an icon that is a control by at least 3 to 1. In the design file this draft read (the export of 4 October, 22:17), four colours fall short (4.3):

| Element | As drawn | Contrast | Proposed |
|---|---|---|---|
| the "…" icon on each card | light grey (grey-300) | 2.1 : 1 | grey-500 (5.55 : 1), dark on hover as drawn |
| the "$" inside an amount field | beige (beige-500) | 3.1 : 1 | grey-500 (5.55 : 1) |
| "Delete Budget" / "Delete Pot" in the "…" menu, on hover | red at 70 % | 2.9 : 1 | full red, underlined on hover |
| the red "Yes, Confirm Deletion" button, on hover | red at 80 % (the token list's "destroy" hover) | 3.4 : 1 | full red, its text underlined on hover |

The designer's changelog has a later section of accessibility fixes (§8) that this export does not include; S2's record says it touches the "…" button, and it may already change some of these. The spec is re-read against the designer's live file before it leaves draft, and any row the designer has already fixed falls away.
*Why it matters:* option (b) leaves the pages short of NFR-A1 for these four; automated checks (axe) do not catch hover colours, so only this decision covers them.
- (a) **Use the proposed colours; the designer is told, and may replace the two underlined hovers with hover states of their own that pass — recommended.**
- (b) Keep the colours as drawn; the spec records that NFR-A1 is not met for these four.
- (c) Fix the two resting colours (the "…" icon, the "$") only; keep the two hovers as drawn.

**Before ready (not a question).** The design facts of 2.2–2.11 were read from the designer's export of 2026-10-04 22:17. They are re-read from the designer's live source — `Finance App.dc.html`, `Style Guide.dc.html` and the designer's changelog (its §8 and §9) — before this spec leaves draft, and every difference is either applied (where it only adds what the design could not show, or matches an approved document) or asked here.

---

Changelog: v0.2 (2026-10-05) — the drafting agent's own fact check of v0.1 (`docs/04-process/prompts/2026-10-04-T-15d/ui-kit-review-handling.md`; the two independent reviews could not be dispatched from the drafting workflow and are still to run): the swatch is coloured by `ThemeBar`'s `data-theme` selector, not `themeVar` (2.1, 2.10, §6); the changelog §8 is cited through S2's record (2.11); Escape inside an open `Menu` is a build note (2.2); the reason for `maxLength` 32 (2.5); focus after a deletion follows 2.2 (2.3). v0.1 (2026-10-05) — first draft (T-15d plan v0.3, Task S1b), from the plan's "Owner's amendment (v0.3)", `write-path.md`, `transactions.md`, the stories US-14 to US-26, US-31 to US-34 and US-40, the NFRs, the tokens, ADR-0002 to ADR-0004 and ADR-0006, the Release 1 `src/ui` code, and the designer's export of 2026-10-04 22:17; figures in `docs/04-process/prompts/2026-10-04-T-15d/ui-kit-figures/`.
