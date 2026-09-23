# User stories

Status: **Approved** (v1.3 — 2026-09-23: a not-found row for the 404 page, plan T-06 finding F1 — pending owner approval in PR review; v1.2 — 2026-09-23 amendments, owner decisions at the T-04 plan gate: the copy appendix's demo banner takes the configured interval (`{days}`), and three R1 additions give the sign-up maxima their messages; v1.1 — 2026-09-20 amendments: copy appendix "R1 additions"; US-35 moved to Release 1; US-04 AC2 and US-37 AC3 verified in Release 2 — see PRD v1.2) · Author(s): Agent (draft) · Date: 2026-09-08
Source: `../00-discovery/inputs/challenge-brief.md` (brief), `../00-discovery/problem-statement.md` (PS), `../00-discovery/inputs/design/` (design; visual reference only)
Conventions: ids are stable; priorities Must/Should/Could; every story lists ≥1 error or boundary criterion; "Agent tool" names the WebMCP tool the story implies (final set decided in NFR-W / ADR). Business "today" is **19 Aug 2026** and the current month is **August 2026** (OQ-4); seed dates are shifted +2 years at seed time. **Where the design and `data.json` differ, `data.json` wins** (owner decision R-01). Every budget and pot has a server-generated `id`; tools take and return ids (R-26). Validation copy: see the copy table at the end of this document (R-07). Money is USD, shown with two decimals and a sign as in the design.

---

## Authentication

### US-01 — Log in with the demo account
Must · Source: brief (bonus: auth), PS Q1 · Agent tool: none
**As a** visitor, **I want** to log in with the demo credentials shown on the login page, **so that** I can use the app without creating an account.
- AC1 — Given the login page, When I submit the demo email and password, Then I land on Overview and my session persists across reload.
- AC2 — Given the login page, When I submit an empty email or password, Then each empty field shows its message from the copy table and no request is sent.
- AC3 — Given the login page, When I submit wrong credentials, Then a visible, screen-reader-announced error appears and the password field is cleared.
- AC4 — Given any app page without a session, When I open its URL, Then I am redirected to login and back to that page after logging in.
- AC5 — The password field has a show/hide toggle with an accessible name.

### US-02 — Sign-up screen
Must · Source: brief (bonus: auth), PS Q1, PRD OQ-1 · Agent tool: none
**As a** visitor, **I want** a sign-up screen that validates my input, **so that** the auth flow matches the design.
- AC1 — Given the sign-up screen, When fields are empty or the email is malformed or the password is shorter than 8 characters, Then per-field validation messages appear and submission is blocked.
- AC2 — Given valid input, When I submit, Then no account is created; a message explains this is a demo instance and points to the demo account (OQ-1, decided 2026-09-13).
- AC3 — Login and sign-up link to each other as in the design.

### US-03 — Log out
Should · Source: implied by auth · Agent tool: none · Release 1
- AC1 — Given I am logged in, When I activate "Log out" in the sidebar footer (next to the agent-tools indicator, US-41), Then my session ends and I am on the login page; back navigation does not reveal app pages.
- AC2 — Logout always completes client-side even if the server call fails; the failure is logged.
- AC3 — Sessions last 7 days sliding (renewed on activity) and end on logout or demo reset (R-25).

## Overview

### US-04 — See balance, income and expenses
Must · Source: brief (overview) · Agent tool: `get_balance` (read)
- AC1 — Given seed data, When I open Overview, Then Current Balance shows $4,836.00, Income $3,814.25, Expenses $1,700.50.
- AC2 — Given money moved into or out of a pot, When I return to Overview, Then Current Balance reflects the change.
- AC3 — Current Balance, Income and Expenses are **stored values** seeded from `balance` in `data.json`; they are not derived from transactions. Only pot deposits, withdrawals and deletions change Current Balance; Income and Expenses never change (R-03).

### US-05 — Pots summary
Must · Source: brief · Agent tool: `list_pots` (read)
- AC1 — Given seed data, Then the Pots card shows Total Saved **$920.00** (sum of all pot totals, not only those displayed) and the first four pots in creation order (seed order) with their totals.
- AC2 — Given no pots, Then the card shows an empty state with a link to create one.
- AC3 — "See Details" navigates to Pots.

### US-06 — Latest transactions
Must · Source: brief · Agent tool: `list_transactions` (read)
- AC1 — The Transactions card shows the five most recent transactions (name, avatar, signed amount, date), ordered as US-11 Latest.
- AC3 — Given fewer than five transactions, Then the available ones; given none, an empty message.
- AC2 — "View All" navigates to Transactions.

### US-07 — Budgets summary
Must · Source: brief · Agent tool: `list_budgets` (read)
- AC1 — Given seed data, Then the Budgets card shows a donut with $338 spent of $975 limit and the first four budgets (creation order) with their limits; totals always include all budgets.
- AC2 — Given no budgets, Then an empty state with a link to create one.
- AC3 — "See Details" navigates to Budgets.

### US-08 — Recurring bills summary
Must · Source: brief · Agent tool: `list_recurring_bills` (read)
- AC1 — Given seed data, Then the card shows Paid Bills $190.00, Total Upcoming $194.98, Due Soon $59.98.
- AC2 — "See Details" navigates to Recurring Bills.
- AC3 — Given no recurring transactions, Then all three rows show $0.00.

## Transactions

### US-09 — Paginated transaction list
Must · Source: brief · Agent tool: `list_transactions` (read)
- AC1 — Given seed data, Then 10 transactions per page, columns Recipient/Sender, Category, Date, Amount as in the design; page controls Prev / numbered / Next.
- AC2 — Prev is disabled on page 1, Next on the last page; the current page is highlighted and announced.
- AC3 — On mobile, the row layout collapses as in the design without losing information; page numbers collapse to at most 3 with an ellipsis.
- AC4 — Filters and page live in the URL: `?q=&category=&sort=&page=`; an out-of-range or non-numeric `page` is clamped to 1 or the last page (R-27).

### US-10 — Search transactions by name
Must · Source: brief · Agent tool: `list_transactions({ search })`
- AC1 — Typing in the search field filters by recipient/sender name, case-insensitive, substring, on input debounced ≤ 300 ms; the results region has `aria-busy="true"` while loading; pagination resets to page 1 (R-28).
- AC2 — Given no matches, Then an empty state message is shown and pagination is hidden.

### US-11 — Sort transactions
Must · Source: brief · Agent tool: `list_transactions({ sort })`
- AC1 — Options exactly: Latest (default), Oldest, A to Z, Z to A, Highest, Lowest. Highest/Lowest sort by **signed** amount (incomes first for Highest). Tie-breaks: Latest/Oldest by full timestamp then name; A–Z/Z–A by name then timestamp desc; Highest/Lowest by amount then timestamp desc (R-09).
- AC2 — The sort control is a keyboard-operable menu with the current option indicated.

### US-12 — Filter transactions by category
Must · Source: brief · Agent tool: `list_transactions({ category })`
- AC1 — Options: All Transactions (default) plus the ten categories from the brief; filtering shows only that category.
- AC2 — Search, sort and filter combine; the URL reflects them so a filtered view can be linked (used by US-19).

### US-13 — Transactions empty state
Must · Source: NFR (prototype gap)
- AC1 — Given a search and/or category filter with no matching transactions, Then the empty-state message is shown, the table header stays, and pagination is hidden.

## Budgets

### US-14 — View budgets
Must · Source: brief · Agent tool: `list_budgets` (read)
- AC1 — Each budget card shows category, theme colour, Maximum, Spent, Remaining (never below $0.00), and a progress bar capped at 100 %. **Spent = sum of absolute values of negative-amount transactions in the category for the current month (August 2026); positive transactions are ignored** (R-11).
- AC4 — Budgets are listed in creation order (seed order).
- AC2 — Given seed data, Then Entertainment shows Spent $15.00 / Remaining $35.00; Dining Out shows Spent $133.00 of $75.00 with Remaining $0.00 and the bar full.
- AC3 — Given no budgets, Then an empty state with "Add New Budget".

### US-15 — Create a budget
Must · Source: brief · Agent tool: `add_budget` (mutating)
- AC1 — The modal offers Category (ten categories; already-used ones disabled and marked "Already used"), Maximum Spend (positive amount, two decimals), Theme (15 themes; used ones disabled).
- AC2 — Given a missing or invalid amount, Then a validation message appears under the field and the form does not submit. Amounts: 0.01 ≤ x ≤ 999,999,999.99, at most two decimals; input accepts an optional leading `$` and thousands separators, which are stripped (R-17).
- AC3 — Given a valid submission, Then the budget appears with its August spent and latest three transactions computed immediately, and the Overview summary updates.
- AC4 — The modal traps focus, closes on Escape and on the close button, and returns focus to the trigger.

### US-16 — Edit a budget
Must · Source: brief · Agent tool: `edit_budget` (mutating)
- AC1 — Pre-filled modal; same validation as US-15; the budget's own category and theme remain selectable; any other used one is disabled (R-18).
- AC2 — Saving updates the card and Overview without reload.

### US-17 — Delete a budget
Must · Source: brief · Agent tool: `delete_budget` (mutating, destructive)
- AC1 — A confirmation dialog with the design's copy; "No, Go Back" cancels.
- AC2 — Confirming removes the budget from Budgets and Overview.
- AC3 — If the budget no longer exists (deleted elsewhere), Then a message says so and the list refreshes.

### US-18 — Latest spending per budget
Must · Source: brief
- AC1 — Each budget shows its three most recent transactions in that category regardless of month and **regardless of sign** (incomes appear with a + sign, as in the design) (R-11).
- AC2 — Given fewer than three, Then the available ones; given none, a short empty message.

### US-19 — "See All" opens filtered transactions
Must · Source: brief
- AC1 — Activating "See All" on a budget navigates to Transactions with `?category=<category>&page=1`.
- AC2 — Given the category has no transactions, Then the Transactions empty state (US-13).

### US-20 — Spending summary
Must · Source: brief
- AC1 — The Budgets page shows a donut of all budgets and a list "spent of limit" per budget in theme colour; totals match the Overview card.
- AC2 — Given no budgets, Then the donut shows $0 of $0 and the summary list is empty.

## Pots

### US-21 — View pots
Must · Source: brief · Agent tool: `list_pots` (read)
- AC1 — Each pot shows name, theme, Total Saved, percentage of target with **two decimals, round half up** (159/2000 → 7.95%), Target, progress bar capped at 100 %. Pots are listed in creation order (R-08, R-19).
- AC2 — Given no pots, Then an empty state with "Add New Pot".

### US-22 — Create a pot
Must · Source: brief · Agent tool: `add_pot` (mutating)
- AC1 — Modal with Pot Name (max 30 characters with live "N characters left"), Target (positive amount), Theme (used ones disabled).
- AC2 — Empty name, empty/invalid target (limits as US-15 AC2) → validation messages; duplicate name (case-insensitive after trim) → "already exists" message.
- AC3 — Valid submission adds the pot with $0 saved.

### US-23 — Edit a pot
Must · Source: brief · Agent tool: `edit_pot` (mutating)
- AC1 — Pre-filled; same validation; the pot's own name and theme remain valid/selectable; saving updates in place.
- AC2 — The target may be set below the current total; the bar then shows 100 % (R-18).

### US-24 — Delete a pot
Must · Source: brief · Agent tool: `delete_pot` (mutating, destructive)
- AC1 — Confirmation dialog; confirming removes the pot and **adds its total back to Current Balance**.
- AC2 — If the pot no longer exists, Then a message says so and the list refreshes.

### US-25 — Add money to a pot
Must · Source: brief, PRD OQ-2 · Agent tool: `add_money_to_pot` (mutating)
- AC1 — Modal shows current total, an amount field, and a preview bar with the new total and percentage before confirming.
- AC2 — Amount must be > 0, at most two decimals, and ≤ Current Balance (OQ-2); otherwise a validation message ("Amount exceeds your current balance"). Given Current Balance is $0.00, the field shows that message on any input.
- AC3 — Confirming increases the pot total and **deducts the amount from Current Balance**; the pot may exceed its target — the preview and the bar cap at 100 % while the percentage text shows the real value.

### US-26 — Withdraw from a pot
Must · Source: brief · Agent tool: `withdraw_from_pot` (mutating)
- AC1 — Same modal pattern with a preview of the reduced total.
- AC2 — Amount must be > 0, at most two decimals, and ≤ pot total; otherwise a validation message ("Amount exceeds this pot's total").
- AC3 — Confirming decreases the pot total and **adds the amount to Current Balance**.

## Recurring bills

### US-27 — List recurring bills with status
Must · Source: brief · Agent tool: `list_recurring_bills({ status })` (read)
- AC1 — One row per vendor (deduplicated from recurring transactions), with avatar, name, "Monthly - <ordinal day>", amount.
- AC2 — Status relative to today = 19 Aug 2026 (calendar dates; time of day ignored): **Paid** if the vendor has a recurring transaction dated in the current month on or before today; **Due Soon** if not paid and its day-of-month ≤ today + 5 (≤ 24); otherwise **Upcoming**. The day shown ("Monthly - 2nd") is the day-of-month of the vendor's most recent recurring transaction. Paid rows show the green check; Due Soon rows show the red warning and red amount, as in the design (R-10).
- AC3 — Given seed data, Then the list contains 8 vendors and the Due Soon rows are Nimbus Data Storage ($9.99, 21st) and ByteWise ($49.99, 23rd).

### US-28 — Bills summary
Must · Source: brief
- AC1 — Total Bills $384.98; Paid Bills 4 ($190.00); Total Upcoming 4 ($194.98); Due Soon 2 ($59.98) with seed data.

### US-29 — Search bills by name
Must · Source: brief · Agent tool: `list_recurring_bills({ search })`
- AC1 — Case-insensitive substring on vendor name; empty state when no match.

### US-30 — Sort bills
Must · Source: brief · Agent tool: `list_recurring_bills({ sort })`
- AC1 — Latest (earliest day in month, default), Oldest, A to Z, Z to A, Highest, Lowest. Bills amounts are displayed and sorted as **absolute** values; tie-breaks: by name (R-09).
- AC2 — Given no bills, Then an empty state.

## Cross-cutting

### US-31 — Validation messages
Must · Source: brief ("Receive validation messages if required form fields aren't completed"); prototype gap
- AC1 — Every required field in every form shows an inline message on submit and on blur after first interaction, with the copy from the copy table below.
- AC2 — Messages are associated with their field (`aria-describedby`) and announced; the first invalid field receives focus on failed submit.
- AC3 — Submit buttons are **not** the only feedback: the prototype's "disabled button" pattern alone does not satisfy this story.

### US-32 — Keyboard-only operation
Must · Source: brief ("Navigate the whole app and perform all actions using only their keyboard"); prototype gap
- AC1 — Every interactive element is reachable in a sensible order and operable with Enter/Space; menus (sort, filter, theme, category, pot "…" menu) support arrow keys and Escape.
- AC2 — Modals trap focus, close on Escape, and restore focus to their trigger.
- AC3 — A documented keyboard walkthrough of each page exists and is part of the E2E suite.

### US-33 — Responsive layout
Must · Source: brief
- AC1 — Desktop (≥1024 px): fixed, collapsible sidebar; tablet (768–1023) and mobile (<768): bottom navigation bar — labels shown on tablet, icons only on mobile; layouts as in the design at 1440 / 768 / 375 (R-12, verified against `inputs/design/style-guide.html`).
- AC3 — At 320 px every page remains usable (no clipped controls).
- AC2 — No horizontal scrolling at any width ≥ 320 px.

### US-34 — Hover and focus states
Must · Source: brief ("See hover and focus states for all interactive elements"); prototype gap
- AC1 — Every interactive element has a visible hover state (from the style guide) and a visible focus indicator meeting NFR-A contrast.
- AC2 — Disabled controls have no hover state and are excluded from the tab order or announced as disabled.

### US-35 — Minimise the sidebar
Should · Source: design · **Release 1** (owner decision 2026-09-20, S-14)
- AC1 — "Minimize Menu" collapses the sidebar to icons and back; the state persists for the session; the toggle has an accessible name reflecting state.
- AC2 — Collapsed items keep accessible names (tooltip/`aria-label`); keyboard navigation is unchanged.

### US-36 — Changes persist
Must · Source: PS constraints (backend), brief bonus (database)
- AC1 — Given any create/edit/delete or pot money movement, When I reload or open the app in another tab, Then the change is present.
- AC2 — Data is served by the backend; `data.json` is only the seed.

### US-37 — Demo data resets
Must · Source: PS Q2
- AC1 — The dataset resets fully to seed every 10 days and whenever storage exceeds **2,000 user-created rows or 50 MB** (configurable); the reset is written to the server log and the last-reset timestamp is stored (R-29).
- AC3 — A request that arrives after a reset for a record that no longer exists returns 409/404 with a structured error; the UI shows "Data was reset" and reloads.
- AC2 — A small dismissible banner states the reset policy and the last reset time (OQ-3, decided).

## Agent tools (WebMCP)

### US-38 — Tools are discoverable
Must · Source: PS S2, research note
- AC1 — Tools are **page-scoped** (owner decision R-23): on each authenticated page, `document.modelContext.getTools()` returns that page's tools (Overview: `get_balance`, `get_overview_summary`; Transactions: `list_transactions`; Budgets: `list_budgets`, `add_budget`, `edit_budget`, `delete_budget`; Pots: `list_pots`, `add_pot`, `edit_pot`, `delete_pot`, `add_money_to_pot`, `withdraw_from_pot`; Recurring Bills: `list_recurring_bills`), each with name, description, inputSchema and annotations. Tools are registered only after login; leaving a page unregisters its tools.
- AC3 — Readiness: the adapter sets `document.documentElement.dataset.webmcp = "ready"` and dispatches `toolchange` after registration completes; tests wait for that signal (R-13).
- AC2 — Modes (R-14): **native** = `document.modelContext` existed before the app loaded; **polyfill** = installed by the app; **off** = the app is built with `WEBMCP_MODE=off` or the polyfill failed to load — the app is unaffected. E2E runs in polyfill and off modes in CI; native mode is verified headed (Chrome ≥149 with the flag) per the runbook (R-15).

### US-39 — Read tools
Must · Source: PS S2 · Release 1: `get_balance`, `get_overview_summary`; Release 2: the `list_*` tools (R-02)
- AC1 — `get_balance` returns current balance, income, expenses. `get_overview_summary` returns what the Overview shows: pots total and first four pots, first four budgets with spent/limit and totals, bills paid/upcoming/due-soon totals, latest five transactions.
- AC2 — Release 2: `list_transactions({ search?, category?, sort?, page? })`, `list_budgets`, `list_pots`, `list_recurring_bills({ status?, search?, sort? })` return exactly the data the UI shows for the same parameters, including ids.
- AC3 — All read tools carry `readOnlyHint: true`; tools that return user-entered text (`list_pots`, `list_budgets`, `get_overview_summary`, `list_transactions`) also carry `untrustedContentHint: true` (R-24).
- AC4 — If the session has expired, tools return a structured `unauthenticated` error, never data.

### US-40 — Mutating tools with safeguards
Must (Release 2) · Source: PS S2, research note §4, PRD OQ-5 · All mutating tools take the record `id` (R-26)
- AC1 — `add_budget`, `edit_budget`, `add_pot`, `edit_pot`, `add_money_to_pot`, `withdraw_from_pot` exist with `consequentialHint: true`; inputs are validated with the same rules as the UI (US-15…US-26) on the server; errors are returned as structured content.
- AC2 — `delete_budget` and `delete_pot` are exposed on their pages with `consequentialHint: true`; calling one opens the same confirmation dialog the UI uses, and **the client sends the delete request only after the user confirms on screen** (OQ-5; confirmation is client-side, the server treats it as a normal delete — R-16). Cancel or abort (`signal`) → structured `cancelled`; a second call while the dialog is open → `busy`; unknown id → `not_found`.
- AC3 — Every mutating tool call is visible in the UI immediately (same state as a user action) and appears in the server log with a "via tool" marker.

### US-41 — Agent-tools status indicator
Should · Source: research note §1
- AC1 — A small, non-intrusive indicator (e.g. in the sidebar footer) shows "Agent tools: native / polyfill / unavailable" with a tooltip explaining what that means; it has an accessible name.


---

## Appendix — validation and message copy (R-07)

Source: `../00-discovery/inputs/design/app-prototype.html` and the challenge design; where the design has no copy, the text below is the decision.

| Context | Condition | Message |
|---------|-----------|---------|
| Any required field | empty | Can't be empty |
| Email | malformed | Enter a valid email address |
| Password (sign-up) | < 8 characters | Password must be at least 8 characters |
| Login | wrong credentials | Email or password is incorrect |
| Sign-up | valid submit | This is a demo instance — sign up is disabled. Use the demo account: <email> / <password> |
| Amount fields | not a number / > 2 decimals | Enter an amount with up to two decimals |
| Amount fields | ≤ 0 | Amount must be greater than 0 |
| Amount fields | > 999,999,999.99 | Amount is too large |
| Add money | > current balance | Amount exceeds your current balance |
| Withdraw | > pot total | Amount exceeds this pot's total |
| Pot name | > 30 characters | Maximum 30 characters |
| Pot name | duplicate | A pot with this name already exists |
| Budget category | all used | All categories already have a budget |
| Delete budget | confirm | Are you sure you want to delete this budget? This action cannot be reversed, and all the data inside it will be removed forever. |
| Delete pot | confirm | Are you sure you want to delete this pot? This action cannot be reversed, and all the data inside it will be removed forever. |
| Transactions | no results | No transactions match your search |
| Bills | no results | No bills match your search |
| Demo banner | always | Demo data resets every {days} days · last reset <date> |
| After reset | stale request | Data was reset — reloading |

### R1 additions (2026-09-20, owner-approved with the Release 1 specs)

| Context | Condition | Message |
|---------|-----------|---------|
| Login | network/server error | Something went wrong. Try again |
| Login | rate limited | Too many attempts. Try again in {N} minutes |
| Login | after demo reset (`?reason=reset`) | The demo data was reset — please log in again |
| Login demo box | copy failed | Copy failed — select the text |
| Login button | submitting | Logging in… |
| Sign-up notice | link | Go to login |
| Overview | load error | Couldn't load your overview · button: Retry |
| Overview pots | empty | No pots yet · link: Add a pot |
| Overview budgets | empty | No budgets yet · link: Add a budget |
| Overview transactions | empty | No transactions yet |
| Banner | dismiss button | Dismiss notice |
| Shell | skip link | Skip to content |
| Sidebar toggle | names | Minimize Menu / Expand Menu |
| R2 placeholder pages | body | Coming in Release 2 |
| Agent tools indicator | states | Agent tools: checking… / native · N / polyfill · N / unavailable (titles in SPEC-webmcp-tools §2.7) |
| Stale write after reset (R2) | 409 | Data was reset — reloading |
| Sign-up name | > 60 characters | Maximum 60 characters |
| Email | > 254 characters | Enter a valid email address |
| Password (sign-up) | > 128 characters | Maximum 128 characters |
| Any page | not found (404) | This page could not be found. |

`{N}` and `{days}` are whole numbers; a count of 1 is written in the singular ("1 minute", "1 day").
