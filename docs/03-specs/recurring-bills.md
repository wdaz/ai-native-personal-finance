# SPEC-recurring-bills — Recurring Bills page

Status: **Draft v0.1** (T-15d, S3; seven questions for the owner in §9) · Author(s): Agent (Claude Code, Opus 5.5, background session) · Date: 2026-10-05
Implements: US-27 (AC1–AC3), US-28 (AC1), US-29 (AC1), US-30 (AC1, AC2), US-08 AC2 (the receiving side: Overview's "See Details" opens `/recurring-bills`), US-32, US-33, US-34 (for this page), US-36 (AC2), US-38 (AC1: `list_recurring_bills`), US-39 (AC2–AC4 for `list_recurring_bills`); US-31 does not apply (2.13) ·
Constrained by: ADR-0001 (server and client components), ADR-0002, ADR-0003, ADR-0004, ADR-0005 (the clock), `write-path.md` 2.1 and 2.2 step 10 (a read route), `transactions.md` 2.3 (lenient page, strict API), 2.5 (the search field), 2.8 (the `Menu`), 2.9 (`TruncatedText`), NFR-A1, A2, A4, A6, A7, A8, B1, B3, S2, S7, T1–T8, W3–W7, D1, D2, D3 ·
Resolves hand-offs H3 (`list_recurring_bills`'s tool table; a read tool, no `consequentialHint`), H9 (the rows for this page), H12 (the bill names cite `transactions.md` 2.9), H14 (new, `release-2-handoffs.md`) · Design: the designer's Claude Design project — `Finance App.dc.html` (the Recurring Bills screen), `Style Guide.dc.html` and the designer's changelog; outside the repository — `docs/00-discovery/inputs/design/README.md`

## 1. Purpose

The user sees every recurring bill of the demo account — one row per vendor, built from the recurring transactions — with the day of the month it is due, its amount and whether it is paid, due soon or upcoming on the business day, 19 Aug 2026. Beside the list, the page totals the bills and splits the total into paid, upcoming and due soon. The user narrows the list by name and reorders it by one of six sorts; the search and the sort live in the URL. The page only reads: bills are derived from transactions, which have no write route (`write-path.md` 2.1). An AI agent reads the same list through the page-scoped tool `list_recurring_bills`.

## 2. Behaviour

**2.1 Where things run** (ADR-0001: a spec states which components are client components).
- **Server:** `app/(app)/recurring-bills/page.tsx` is an async Server Component. It awaits `searchParams` (a Promise in Next 16), reads the query with the lenient parser of 2.3, calls `getRecurringBills(getDb(), clock, query)` from `src/server/recurring-bills.ts` **directly** (no HTTP self-call, as `overview.md` 2.1 and `transactions.md` 2.1), and renders the page header (title "Recurring Bills", no action button), the two summary cards of 2.6 and the list card of 2.9. `BillsTable` (the rows), `TotalBillsCard` and `BillsSummaryCard` are Server Components. The same `getRecurringBills` backs `GET /api/recurring-bills` (2.11). The clock is the fixed business clock (`fixedClock(BUSINESS_TODAY)`, ADR-0005, NFR-D1), as `getOverview` receives it.
- **Client** (`"use client"`): `BillsNav` (a provider: navigation, `router.push`/`router.replace`, the pending state of `useTransition`, the intended query — `transactions.md` 2.5's `TransactionsNav` with two parameters), `BillsToolbar` (the search field and the Sort menu), `Menu` (`src/ui`, `transactions.md` 2.8), `ResultsRegion` (`aria-busy`, receives the server-rendered table as `children`), `BillsError` (2.10; it calls `router.refresh()`), `TruncatedText` (`src/ui`, `transactions.md` 2.9) and `RecurringBillsTools` (`src/webmcp/tools`, registers the tool, 2.12). `app/(app)/recurring-bills/layout.tsx` renders `children` and `<RecurringBillsTools />` (the Overview pattern, `webmcp-tools.md` 2.3).
- **Domain** (pure, `src/domain/bills.ts`, today `recurringBills`, `billsSummary` and `DUE_SOON_DAYS`): `sortBills` (named by `data-model.md`, "Derived values"; it does not exist yet) and `filterBills` (the search, and the status of 2.12 if §9 RB-Q3 is (a)), used by the server. **Shared** (`src/shared`, pure; `eslint.config.mjs` lets `ui` import only `ui` and `shared`, `webmcp` only `webmcp` and `shared`): `parseRecurringBillsQuery`, `RecurringBillsDtoSchema`, `formatDueDay` (2.9), the sort slugs and labels (one list shared with `transactions.md` 2.4: the same six slugs and labels), `COPY` entries (2.15).

**2.2 The URL contract.** One contract for the page and `GET /api/recurring-bills` (US-29, US-30).

| URL and API name | Tool input | Values | Meaning when absent | Written by the page's own controls |
|---|---|---|---|---|
| `q` | `search` | text, trimmed, at most 60 characters (a transaction name is at most 60, `data-model.md`) | no search | only when non-empty after trimming |
| `sort` | `sort` | `latest`, `oldest`, `a-to-z`, `z-to-a`, `highest`, `lowest` | `latest` | never for `latest` |
| `status` (API only, §9 RB-Q3) | `status` | `paid`, `dueSoon`, `upcoming` | every status | never: the page has no status control and ignores the parameter |

The written order is `q`, `sort`; the page writes the query string with `URLSearchParams` (a space becomes `+`) and reads both `+` and `%20`. Parameters not in the table are ignored and dropped the next time a control writes the URL; a repeated parameter reads as its first value. The page never redirects to a canonical URL; the URL is the source of truth (Back and Forward re-render from it), and a login redirect keeps it (`?next=`, `src/shared/next-path.ts`). These are `transactions.md` 2.2's rules, applied to this page's parameters. There is no `page` parameter: the list is not paginated (2.7).

**2.3 Reading the query — lenient on the page, strict on the API.** `parseRecurringBillsQuery(params, { strict })` returns `{ query, issues }`, with the split of `transactions.md` 2.3, which the owner approved for that page (its §9 Q3 (a)) and this spec applies to this page's parameters (a decision you may override, §9 "Decisions this spec takes"):

| Parameter | The page (`strict: false`) | `GET /api/recurring-bills` and the tool (`strict: true`) |
|---|---|---|
| `sort` | an unknown value → `latest` | 400 `validation`, `issues: [{ path: ["sort"], code: "invalid_format" }]`, `message` "sort must be one of: latest, oldest, a-to-z, z-to-a, highest, lowest" |
| `q` | trimmed, then cut to 60 characters | trimmed; more than 60 → 400 `validation`, `issues: [{ path: ["q"], code: "too_long" }]`, `message` "q must be at most 60 characters" |
| `status` | ignored (the page has no status) | an unknown value → 400 `validation`, `issues: [{ path: ["status"], code: "invalid_format" }]`, `message` "status must be one of: paid, dueSoon, upcoming" |

In both modes an empty value (`q=`, `sort=`, `status=`) reads as absent, and so does a `q` that is empty after trimming. The issues are written by hand with the two codes the contract has today (`invalid_format`, `too_long`), as `transactions.md` 2.3 does, so the route does not depend on `toErrorIssues` (it throws on a Zod `invalid_value`, `src/shared/schemas.ts`; `write-path.md` 2.7 fixes it for the write schemas). The tool's own input schema is a Zod object with `z.enum`; `defineTool` validates the input before any request is sent, so an out-of-enum value is a `validation` tool error whose message names the allowed values (Zod's `z.enum` message). A refused call changes nothing: the tool only reads.

**2.4 The list.** `getRecurringBills` reads every transaction (`db.transaction.findMany()`, the Overview pattern: `BigInt` → `Number` at the edge, the Prisma category key → the display name, no `seeded` filter), builds the bills with `recurringBills(transactions, clock)` and the totals with `billsSummary`, then applies, in this order, the search, the status (API only) and the sort. The dataset is read-only and bounded by the seed, so the whole table is read on every request and the rules live in tested domain functions (NFR-T1), not in SQL.
- **A bill** (US-27 AC1, AC2; `recurringBills`, Release 1 code, unchanged): one per `name` among the transactions with `recurring = true`. Its `day` is the day of the month of the vendor's most recent recurring transaction, its `amount` the **absolute** amount of that transaction (US-30 AC1), its avatar that transaction's avatar. Its status, comparing UTC calendar dates with today = 19 Aug 2026: **paid** when the vendor has a recurring transaction in August 2026 on or before the 19th; otherwise **due soon** when its day is at most 19 + 5 = 24 (`DUE_SOON_DAYS`); otherwise **upcoming**. As the rule is written (and as `src/domain/bills.ts` says), a bill whose day has already passed this month without a payment is **due soon** (4.4).
- **Search** (US-29 AC1): the name only, case-insensitive substring (`toLowerCase` on both sides; a `&` or a `.` is literal), the needle trimmed on both ends with its inner spaces kept; a needle of only spaces is empty and filters nothing.
- **Sort** (US-30 AC1, R-09; `Intl.Collator('en')` for names, as `compareLatest` uses):

| Label (menu) | Slug | Order of keys |
|---|---|---|
| Latest (default) | `latest` | day of month, earliest first (US-30 AC1: "earliest day in month"), then name A to Z |
| Oldest | `oldest` | day of month, latest first, then name A to Z |
| A to Z | `a-to-z` | name A to Z |
| Z to A | `z-to-a` | name Z to A |
| Highest | `highest` | absolute amount, largest first, then name A to Z |
| Lowest | `lowest` | absolute amount, smallest first, then name A to Z |

  US-30 AC1 says "tie-breaks: by name" without a direction; this spec reads it as **A to Z for every sort** (as `transactions.md` 2.4 decided for Oldest), so Lowest is not the reverse of Highest when two bills cost the same (4.3). Names are unique by construction (one bill per name), so A to Z and Z to A need no further key; for two different strings the collator calls equal (canonically equivalent Unicode forms), a comparison of their UTF-16 code units decides, so the order is total and stable between requests.
- **The summary** (US-28 AC1) is always over **all** bills: the search and the sort never change it (the design computes it the same way). Total Bills is the sum of every bill's amount; Paid Bills counts and sums the paid ones; Total Upcoming counts and sums every bill **not** paid, so it includes the due-soon ones; Due Soon counts and sums the due-soon ones (`billsSummary`'s overlap: 4 + 4 = 8 bills, 2 of the 4 upcoming due soon).

**2.5 The search field.** As `transactions.md` 2.5, with this page's words: a text input in a `<div role="search">`, a visually hidden `<label>` "Search bills", the placeholder "Search bills" (the design's) in grey-500 (`transactions.md` 2.5: beige-500 placeholder text fails WCAG 1.4.3), `maxLength` 60, `autocomplete="off"`, no submit control and no clear button. One intended query `{ q, sort }` in `BillsNav`; the debounce is 250 ms (Enter applies at once) and writes with `router.replace`; choosing a sort first applies a pending debounce, then uses `router.push`; choosing the current sort does nothing; every navigation passes `{ scroll: false }` and runs in `startTransition` (the latest wins); the field owns its text and is reset from the URL only on Back or Forward and when a link with another `q` is followed. While the answer is pending the results region carries `aria-busy="true"` and the previous rows stay.

**2.6 The summary cards** (US-28 AC1; the design's left column).
- **Total Bills:** a grey-900 card with white text: the receipt icon (40 px, decorative, `aria-hidden`), the label "Total Bills" (preset 4) and the total (preset 1, `formatMoney`, `$384.98` with the seed). It is not a heading.
- **Summary:** a white card with the heading "Summary" (`<h2>`, preset 3) and three rows, each a label at preset 5 and a value at preset 5 bold, right-aligned, separated by a 1 px grey-100 line: "Paid Bills" — "4 ($190.00)"; "Total Upcoming" — "4 ($194.98)"; "Due Soon" — "2 ($59.98)". The value is "{count} ({amount})" (US-28 AC1's form). Paid Bills and Total Upcoming are grey-500; the Due Soon row is red (`--color-red`, 4.73:1 on white, output.txt), as the design draws it. The three rows are a description list (`<dl>`, each label a `<dt>`, each value a `<dd>`), so a screen reader pairs them.
- **No bills** (`no-recurring`, `few-transactions`, `empty-all`): Total Bills `$0.00` and the three rows "0 ($0.00)" (US-30 AC2's empty state is the list's, 2.10; the cards keep their layout, as `overview.md` 2.7 keeps the Overview card's three `$0.00` rows).

**2.7 No pagination.** The list shows every bill that matches. Bills come from transactions, which no route writes (`write-path.md` 2.1), so the list holds at most the seed's 8 bills; the design draws no pagination. If a later release lets transactions be written, pagination is that release's spec.

**2.8 The Sort menu.** An instance of the `Menu` of `transactions.md` 2.8 (roles, keys, pointer, look, `--shadow-popover`; its panel 114 px wide, as Transactions' Sort): the six labels of 2.4 in that order; choosing an option applies it at once (2.5); the current option is the effective query's (a URL with an unknown `sort` shows "Latest" selected). At 768 px and up the menu has the visible label "Sort by" and a trigger showing the current option; below 768 px an icon-only trigger with a 44 px tap target (`--tap-target-min`). The trigger's accessible name is "Sort by: {current}" at every width (`transactions.md` 2.8's "{label}: {current}" pattern, owner-approved in its §9 Q1). There is no category menu: bills have no category on this page.

**2.9 The list card and the rows.** One white card (`--radius-150`), padding 32 px (24 px 20 px below 768 px), a 24 px gap between the toolbar and the results region. The page background and padding are the shell's.
- **Toolbar:** the search field on the left (at most 320 px wide on desktop, 215 px on tablet, the full row below 768 px) and on the right the Sort menu. Below 768 px the field never gets narrower than 160 px beside the icon button, as `transactions.md` 2.9.
- **The table.** A real `<table>` with a visually hidden `<caption>` ("Recurring Bills", `PAGE_NAMES.recurringBills`), a `<thead>` and a `<tbody>`; below 768 px CSS lays each row out as the design's two-line card, the header row is visually hidden but stays in the DOM, and the table, row groups, rows, headers and cells carry explicit `role` attributes, as `transactions.md` 2.9 explains (verified with axe and a screen-reader pass noted in the pull request).
- **768 px and up:** columns "Bill Title", "Due Date", "Amount" (the design's headers), tracks `minmax(0, 1fr) 120px 100px`, 32 px apart (the design's, the same on desktop and tablet); the amount right-aligned; header text preset 5 grey-500 with 12 px 16 px padding; rows with 20 px 16 px padding; a 1 px grey-100 line under the header and under each row but the last. The due text and the amount never wrap (the widest due text, "Monthly - 11th", is 14 characters; the widest amount `$100.00`).
- **Below 768 px:** no visible header; each row is two lines: the avatar (32 px) and the name; below them the due text with its status icon on the left and the amount on the right.
- **A row** (US-27 AC1, AC2): the avatar `<img src="/avatars/<key>.jpg">`, 32 px, its `width` and `height` set, `alt=""` (decorative: the name is beside it; NFR-A6; `transactions.md` 2.9's reasoning); the name at preset 4 bold on one line, truncated with "…" when it does not fit and shown whole in the custom tooltip of `transactions.md` 2.9 (`TruncatedText`, H12; only a cut name is a focus stop); the due text "Monthly - {ordinal day}" at preset 5 (`formatDueDay(day)`: 1st, 2nd, 3rd, 4th … 11th, 12th, 13th … 21st, 22nd, 23rd … 31st, output.txt "ORDINALS"); the amount at preset 4 bold, `formatMoney` of the absolute amount (no sign).
- **The status, not by colour alone** (US-27 AC2, R-10, NFR-A7):

| Status | Due text | Icon after the due text (16 px, 8 px gap) | Amount | Heard by a screen reader (visually hidden text after the due text) |
|---|---|---|---|---|
| Paid | green (`--color-green`, 4.95:1) | check-circle, green | grey-900 | "Paid" |
| Due soon | grey-500 | warning-circle, red | red (`--color-red`, 4.73:1) | "Due soon" |
| Upcoming | grey-500 | none | grey-900 | "Upcoming" |

  The icons are decorative (`aria-hidden`): the hidden text carries the status, so a screen reader reads "Monthly - 21st, Due soon" and every row says its status, including Upcoming, which has no icon (the hidden texts are new strings, §9 RB-Q1). Rows are not interactive: no hover, no click, no focus stop.

**2.10 Loading, empty, error.**
- **Loading.** While a navigation started by a control is pending, the results region has `aria-busy="true"` (2.5). No loading route, no skeleton.
- **The status line.** A visually hidden `role="status"` element, empty on first render; after every change made by a control it is emptied and then set to "{count} bills" ("1 bill" for one) — the rows now shown — or, when there are none, the empty message below (`transactions.md` 2.10's pattern; new string, §9 RB-Q1).
- **No results** (US-29 AC1: "empty state when no match"): bills exist but none matches the search: the toolbar stays with the typed text; on 768 px and up the header row stays; in the table body one row with one cell spanning the three columns (`colspan="3"`), centred, "No bills match your search" (`COPY.billsNoResults`, the appendix's row), preset 4 grey-500, 48 px 16 px padding (the design's). The summary cards are unchanged (2.4).
- **No bills at all** (US-30 AC2; the `no-recurring` variant, and `few-transactions` and `empty-all`, which leave no recurring transaction, output.txt "SEED VARIANTS"): the same place and layout, with the text of §9 RB-Q2; it wins over "No results" (with no bills a search has nothing to match). The summary cards show `$0.00` (2.6).
- **Error.** If `getRecurringBills` throws, the page logs `RecurringBills: getRecurringBills failed requestId=<id>` (the id from `x-request-id`) and renders, in place of the two summary cards and the list card, one card "Couldn't load your recurring bills" with a "Retry" button (`router.refresh()`), inside the shell with the header (the Overview pattern, `overview.md` 2.8; new string, §9 RB-Q1). No `error.tsx`: any other error falls to Next's default handling.
- **Session ended.** A page request without a session meets the proxy's redirect to `/login` (the query string kept in `?next=`); the API and the tool answer 401 `unauthenticated` (`write-path.md` 2.2 step 2, US-39 AC4).

**2.11 `GET /api/recurring-bills`.** The route for the tool and the tests (the page calls `getRecurringBills` directly). It reads `q`, `sort` (and `status`, §9 RB-Q3 (a)) with `parseRecurringBillsQuery(…, { strict: true })`, calls `getRecurringBills(getDb(), clock, query)` and answers:
- 200 with a `RecurringBillsDto` (a `z.strictObject`) and `Cache-Control: no-store` (the route sets it itself, `write-path.md` 2.2 step 10); every answer carries `X-Request-Id` (the proxy);
- 400 `validation` with `issues` and `message` (2.3); 401 `unauthenticated` from the proxy; 500 `server_error` with `message: "The recurring bills are unavailable"` after `console.error("GET /api/recurring-bills failed", error)`. The 400 and the 500 carry `Cache-Control: no-store` too (the helpers in `src/server/http.ts` set none, as `transactions.md` 2.13 notes).
It never changes data (`write-path.md` 2.1 and its test 7.2).

```
RecurringBillsDto = {
  items: {                           // the rows, after the search (and status) and the sort; at most the number of bills
    name: string (1–60),
    avatar: key,
    day: integer 1–31,               // the due day; the page writes it "Monthly - 2nd"
    amount: integer cents ≥ 0,       // absolute
    status: "paid" | "dueSoon" | "upcoming"
  }[],
  summary: {                         // over ALL bills, never filtered (2.4)
    total:    { count, amount },     // Total Bills
    paid:     { count, amount },     // Paid Bills
    upcoming: { count, amount },     // Total Upcoming: every bill not paid (includes due soon)
    dueSoon:  { count, amount }      // Due Soon
  }
}
```

The item has the fields the row shows plus the `avatar` key. It has no `id`: a bill is derived from transactions and has none (§9 RB-Q6). `status` uses the domain's spelling (`BillStatus`, `src/domain/bills.ts`), the same value the tool takes as input.

**2.12 The agent tool `list_recurring_bills`** (page-scoped, R-23; registered after login by `RecurringBillsTools`, unregistered on leaving the page; `webmcp-tools.md` §3's columns).

| Tool | Title | Description | Annotations | Input | Output (`structuredContent`) | Calls |
|---|---|---|---|---|---|---|
| `list_recurring_bills` | List recurring bills | "Lists the demo account's recurring bills, one per vendor, with status (paid, dueSoon, upcoming) and the totals. Optional name search, status and sort. Money in USD cents. Recurring Bills page." (192 characters, output.txt; at most 200, `defineTool`) | `readOnlyHint: true`; `untrustedContentHint: true` (§9 RB-Q5) | `{ search?: string (max 60), status?: "paid" \| "dueSoon" \| "upcoming", sort?: one of the six slugs }` | `RecurringBillsDto` + `{ currency: "USD", unit: "cents" }` | `GET /api/recurring-bills` with `q` ← `search`, `sort`, `status` (§9 RB-Q3) |

- **Status** filters the rows on the row's own status (US-27 AC2: three exclusive statuses), so `upcoming` returns the 2 bills not paid and not due soon, while the summary's Total Upcoming counts 4 (§9 RB-Q4). The summary in the output is always over all bills, as on the page.
- **Parity** (US-39 AC2): without `status`, the tool's `items` and `summary` equal what the page shows for the same `q` and `sort`; with `status`, the items are the page's rows for that `q` and `sort` that have that status, in the same order. Valid parameters only: an invalid one is refused (2.3).
- The tool calls `apiGet` with the query string built by `URLSearchParams` and the header `X-Via: webmcp`; a 400 becomes a `validation` tool error, a 401 `unauthenticated`. The registry gains `PAGE_TOOLS.recurringBills`; the indicator reads "Agent tools: polyfill · 1" on this page. A read tool carries no `consequentialHint` (H3).
- **Safety rule** (NFR-S7, R-24): the names are transaction names, returned as JSON strings, never as HTML; with §9 RB-Q5 (a) the tool carries `untrustedContentHint: true`, which the registry test asserts.

**2.13 Responsive, hover and focus; keyboard; what does not apply.**
- **Layout** (the design's, at the tokens' breakpoints — tablet from 768 px, desktop from 1024 px; the prototype switches at 1100 px): *desktop* — two columns, 24 px apart: on the left, 337 px wide, Total Bills above Summary (24 px gap, the column as tall as the list card); on the right the list card. *Tablet* — one column: Total Bills and Summary side by side (equal widths, 24 px gap), the list card below. *Below 768 px* — one column: Total Bills (its icon beside the label and the total, vertically centred), Summary, the list card. Verified at 1440, 768, 375 and 320 px with no horizontal scroll (US-33 AC2, AC3).
- **Hover and focus** (US-34): the search field and the Sort trigger as `transactions.md` 2.12 (border beige-500, grey-500 on hover, grey-900 on focus, plus the 2 px grey-900 focus outline with 2 px offset); a menu option's text turns grey-500 on hover; a cut name shows the focus indicator. The cards and rows have no hover. Transitions use `--duration-hover`.
- **Keyboard walkthrough** (US-32 AC1, AC3; documented in the E2E test). After the shell's own order — the skip link, the five navigation items, the footer controls — Tab visits: the search field; the Sort trigger; then each name cut at the current width, in row order (its tooltip opens on focus). The summary cards and the rows are not stops. Enter or Space on the trigger opens the menu; the arrow keys, Home, End, Enter, Escape, Tab and Shift+Tab work as in `transactions.md` 2.8. Every stop shows the focus indicator. US-32 AC2 (modals) does not apply: the page has none.
- **US-31 (validation messages) does not apply:** the page has no required field and no form; the search field accepts any text up to its `maxLength` and has no error state.

**2.14 Where this spec departs from the prototype** (the design README: the prototype "is not a specification"; each departure has its source). Every row adds what the design cannot show or follows an approved document; none changes what the design draws, except where §9 asks.

| The prototype | This spec | Source |
|---|---|---|
| The bills are a fixed list in the prototype's script, "paid" when the day is before the 19th | built from the recurring transactions with US-27 AC2's rule (the seed gives the same 8 bills and statuses) | US-27, R-01, R-10 |
| Latest and Oldest have no tie-break; Highest and Lowest none | then name A to Z (2.4) | US-30 AC1, R-09 |
| Tablet below 1100 px | tablet 768–1023 px, desktop from 1024 px | US-33 AC1, tokens (`--bp-desktop`) |
| A 20 px icon-only sort button below 768 px, named "Sort" | a 44 px tap target named "Sort by: {current}" | `--tap-target-min`; `transactions.md` 2.8 |
| The status icons have no name; Upcoming has no mark at all | hidden text "Paid", "Due soon", "Upcoming" in every row; icons decorative | NFR-A1, NFR-A7 (§9 RB-Q1 for the words) |
| The summary rows are two `span`s | a description list | NFR-A1 |
| Avatars unnamed (`role="img"`) | decorative, `alt=""` | NFR-A6; `transactions.md` 2.9 |
| No focus indicator; menus are plain buttons with no roles or keys | the project's 2 px outline; the `Menu` of `transactions.md` 2.8 | NFR-A2, A4, US-32 AC1 |
| Search and sort in memory; no URL | the URL is the source of truth | `transactions.md` 2.2 (the same rule) |
| Search input hover border grey-900; placeholder beige-500; no label | hover grey-500; placeholder grey-500; a hidden label | tokens "Component states"; `transactions.md` 2.5; NFR-A1 |
| "No bills match your search." with a full stop | without it | the copy appendix (R-07, approved) |
| The empty message only for a search; nothing for no bills at all | a message for each (2.10) | US-30 AC2 (§9 RB-Q2 for the words) |
| Dates 2024 | the seed, shifted +2 years (2026) | OQ-4, NFR-D3 |

**2.15 Copy.** `COPY` is the only source of user-visible copy, mirrored by the appendix (`tests/unit/shared/copy.test.ts`). Every visible and every accessible string of the page, with its source. The spec only lists them; the appendix and `src/shared/copy.ts` change in the build task (H14 (1)).

| String | Where | Source |
|---|---|---|
| Recurring Bills | title, table caption (hidden) | `PAGE_NAMES.recurringBills` (exists, `src/ui/nav.ts`) |
| Total Bills · Summary | the cards | the design |
| Paid Bills · Total Upcoming · Due Soon | summary labels | the design (written in `src/ui/overview/BillsCard.tsx` today, not in `COPY`) |
| {count} ({amount}) | summary values | US-28 AC1 |
| Search bills | placeholder | the design |
| Search bills | hidden label of the field | **new** (the placeholder's words) |
| Sort by · Latest · Oldest · A to Z · Z to A · Highest · Lowest | menu label and options | the design, US-30 AC1 (the same strings `transactions.md` 2.16 lists) |
| Sort by: {current} | accessible name of the trigger | `transactions.md` §9 Q1 #8 (approved) |
| Bill Title · Due Date · Amount | column headers | the design |
| Monthly - {ordinal day} | due text | US-27 AC1 |
| Paid · Due soon · Upcoming | hidden status of a row | **new** |
| {count} bills (singular for 1) | the status line | **new** |
| No bills match your search | no results | `COPY.billsNoResults` (exists) |
| §9 RB-Q2's text | no bills at all | **new** or existing (RB-Q2) |
| Couldn't load your recurring bills · Retry | error card | **new** · `COPY.retry` (exists) |

## 3. States

| State | Trigger | What the user sees | Exit |
|---|---|---|---|
| Default | `/recurring-bills` | Total Bills `$384.98`; Summary 4 ($190.00), 4 ($194.98), 2 ($59.98); the 8 rows, Latest, Spark Electric Solutions first; "Latest" current | any control |
| No bills | no recurring transaction (`no-recurring`, `few-transactions`, `empty-all`) | `$0.00` and "0 ($0.00)" ×3; the toolbar; the header row (768 px and up); §9 RB-Q2's text | none (read-only) |
| No results | bills exist, none matches the search (e.g. `bill`) | the summary unchanged; the toolbar with the typed text; the header row (768 px and up); "No bills match your search" | change or clear the search |
| Loading | a control's navigation is pending | `aria-busy="true"` on the results region; the previous rows stay | the new rows |
| Invalid parameter | `?sort=nope`, `?q=` of 61+ characters | the default sort / the first 60 characters searched; for the same value the API answers 400 and the tool refuses (2.3) | any control |
| Error | `getRecurringBills` throws | the card "Couldn't load your recurring bills" with Retry, the header kept | Retry |
| Session ended | no session | the proxy's redirect to `/login?next=…` | log in; the same URL opens |

## 4. Rules and boundaries

**4.1 Constants.** Search at most 60 characters; debounce 250 ms; six sort options; Due Soon window `DUE_SOON_DAYS` = 5 (US-27 AC2: day ≤ 24); business today 19 Aug 2026 (NFR-D1); no page size.

**4.2 The seed's numbers** (recomputed on 2026-10-05 by `docs/04-process/prompts/2026-10-04-T-15d/recurring-bills-figures/figures.ts` with the repository's `seedRows`, `recurringBills`, `billsSummary` and `formatMoney`; reproduced from the repository root by `FORCE_COLOR=0 npx tsx docs/04-process/prompts/2026-10-04-T-15d/recurring-bills-figures/figures.ts`; the output is `output.txt` beside it). **The bills, statuses and totals are repository code; the sorts, the search and the status filter apply this spec's reading (2.4) to the seed.** The build task moves them into `scripts/seed-figures.ts` (H14 (2)), so the E2E never types a number.
- 49 transactions, 11 recurring, **8 bills** (US-27 AC3). Per vendor (day shown · amount · status · the recurring transactions): Pixel Playground · 11th · $10.00 · paid (11 Aug) · Elevate Education · 4th · $50.00 · paid (4 Aug, 5 Jul) · Serenity Spa & Wellness · 3rd · $30.00 · paid (3 Aug, 3 Jul) · Spark Electric Solutions · 2nd · $100.00 · paid (2 Aug, 2 Jul) · Aqua Flow Utilities · 30th · $100.00 · upcoming (30 Jul) · EcoFuel Energy · 29th · $35.00 · upcoming (29 Jul) · ByteWise · 23rd · $49.99 · due soon (23 Jul) · Nimbus Data Storage · 21st · $9.99 · due soon (21 Jul).
- **Summary** (US-28 AC1): Total Bills **$384.98** (38,498 cents); Paid Bills **4 ($190.00)**; Total Upcoming **4 ($194.98)**; Due Soon **2 ($59.98)** — Nimbus Data Storage ($9.99, 21st) and ByteWise ($49.99, 23rd), as US-27 AC3 says. The rows whose own status is Upcoming are 2 ($135.00): EcoFuel Energy and Aqua Flow Utilities.

**4.3 Each sort, all 8 rows** (output.txt "SORTS"):

| Sort | Order |
|---|---|
| Latest | Spark Electric Solutions (2nd), Serenity Spa & Wellness (3rd), Elevate Education (4th), Pixel Playground (11th), Nimbus Data Storage (21st), ByteWise (23rd), EcoFuel Energy (29th), Aqua Flow Utilities (30th) |
| Oldest | Aqua Flow Utilities, EcoFuel Energy, ByteWise, Nimbus Data Storage, Pixel Playground, Elevate Education, Serenity Spa & Wellness, Spark Electric Solutions |
| A to Z | Aqua Flow Utilities, ByteWise, EcoFuel Energy, Elevate Education, Nimbus Data Storage, Pixel Playground, Serenity Spa & Wellness, Spark Electric Solutions |
| Z to A | Spark Electric Solutions, Serenity Spa & Wellness, Pixel Playground, Nimbus Data Storage, Elevate Education, EcoFuel Energy, ByteWise, Aqua Flow Utilities |
| Highest | Aqua Flow Utilities ($100.00), Spark Electric Solutions ($100.00), Elevate Education ($50.00), ByteWise ($49.99), EcoFuel Energy ($35.00), Serenity Spa & Wellness ($30.00), Pixel Playground ($10.00), Nimbus Data Storage ($9.99) |
| Lowest | Nimbus Data Storage, Pixel Playground, Serenity Spa & Wellness, EcoFuel Energy, ByteWise, Elevate Education, Aqua Flow Utilities, Spark Electric Solutions |

**Ties in the seed:** no two bills share a day, so Latest and Oldest never reach the name key with the seed (a hand-built fixture does: three bills on the 21st — "alpha", "Alpha", "beta" — come out "alpha", "Alpha", "beta" in both Latest and Oldest, output.txt "BOUNDARIES"). One amount repeats: Aqua Flow Utilities and Spark Electric Solutions both cost $100.00, so the name decides — Aqua first in **both** Highest and Lowest, which is why Lowest is not the reverse of Highest. No two names differ only in case; the collator's A to Z order of the 8 names equals their code-unit order.

**4.4 Status boundaries** (hand-built fixtures through the repository's `recurringBills`, today 19 Aug 2026, output.txt "BOUNDARIES"): a bill last paid on the 24th of July is **due soon** (24 ≤ 24); on the 25th, **upcoming**; one with a recurring transaction on 19 Aug 2026 at 23:59:59Z is **paid** (calendar dates, time ignored); one dated 20 Aug 2026 is **due soon** (in August but after today, so not paid; 20 ≤ 24); one last paid on 10 Jul is **due soon** (the day has passed this month unpaid; the rule as written); one on the 31st of July is **upcoming** and shows "Monthly - 31st"; a recurring income of +$20.00 is a bill of `$20.00` (absolute).

**4.5 Search examples** (Latest order, output.txt "SEARCH"): `a` → 6 (only ByteWise and EcoFuel Energy have no `a`); `e` → all 8; `co` → 1, EcoFuel Energy; `data` → Nimbus Data Storage; `BYTE` → ByteWise (case-insensitive); `&` and `spa & w` → Serenity Spa & Wellness (a literal `&`); `  flow  ` → Aqua Flow Utilities (trimmed); one space → trimmed to empty, all 8; `bill`, `Bills` and `xyz` → 0, the no-results state (a category name is not searched). With the tool: `search: "e", status: "upcoming", sort: "highest"` → Aqua Flow Utilities, EcoFuel Energy; `status: "paid"` → 4, $190.00 in total; `status: "dueSoon"` → 2; `status: "upcoming"` → 2.

**4.6 Other boundaries.** A search of 60 characters is accepted, 61 is cut (page) or refused (API, tool). The longest bill name is 24 characters ("Spark Electric Solutions"); a name that does not fit is cut with "…" and shown whole in its tooltip (2.9), and the 320 px check of US-33 uses it. "Serenity Spa & Wellness" is rendered as text. "ByteWise" is the one name without a space. No name is non-ASCII.

## 5. Data

Reads `Transaction` (`name`, `avatar`, `date`, `amount`, `recurring`; `category` is read by `findMany` and not used); writes nothing (`write-path.md` 2.1). The source of truth is the database; `data.json` is only the seed (US-36 AC2). A bill is not stored: it is computed on every request from the transactions and the fixed clock (`data-model.md`, "Derived values"). Money is `BigInt` in the database and integer cents in every DTO; it becomes text only at the edge (`formatMoney`). Avatars are the static files `public/avatars/<key>.jpg` (the 8 vendors' files exist).

## 6. Interfaces

### UI
Components and their kind are in 2.1. New code: `app/(app)/recurring-bills/{page.tsx, layout.tsx, page.module.css}` (no `error.tsx`, 2.10), `src/ui/recurring-bills/` (`TotalBillsCard`, `BillsSummaryCard`, `BillsTable`, `BillsToolbar`, `ResultsRegion` or the Transactions one if it is shared by then, `BillsError`, `BillsNav`); reused: `src/ui/Menu.tsx`, `src/ui/TruncatedText.tsx` (both from the Transactions build); new icons if not yet present: receipt, check-circle, warning-circle, sort, caret-down, magnifying-glass (Phosphor; `design-tokens.md` lists them). Keyboard and focus: 2.5, 2.8, 2.13. Accessible names: 2.8, 2.9, 2.15.

### Server and API
`src/server/recurring-bills.ts` (`getRecurringBills`, `toRecurringBillsDto`), `app/api/recurring-bills/route.ts` (2.11), `src/shared/schemas.ts` (`RecurringBillsDtoSchema`), `src/shared/recurring-bills-query.ts` (`parseRecurringBillsQuery`), `src/domain/bills.ts` (`sortBills`, `filterBills`).

### WebMCP tools
`list_recurring_bills` (2.12). `webmcp-tools.md` §4 points here for its definition (S6).

## 7. Tests required

Figures in tests come from the extended `scripts/seed-figures.ts` (H14 (2)) and are formatted with the shared functions, never typed. Role and label locators, no `.first()`, no time-based waits (the debounce is a unit test with fake timers).

| Level | What is asserted | Traces to |
|-------|------------------|-----------|
| Unit — domain | `sortBills`: each of the six orders on the seed's bills (4.3) and on fixtures for every tie rule (same day → name A to Z in both Latest and Oldest; same amount → name A to Z in both Highest and Lowest; case variants); `filterBills`: case-insensitive substring, a needle with `&` and `.`, a needle empty after trimming, the status filter alone and with a search; `recurringBills`'s existing tests stay, plus the boundaries of 4.4 not yet covered (day 24 and 25, day 31, a recurring income) | 2.4, 4.3, 4.4 · US-27 AC2, US-29 AC1, US-30 AC1 |
| Unit — shared and server | `parseRecurringBillsQuery` lenient and strict, every row of 2.3 (repeated parameter, `+` and `%20`, every empty value, the strict `message` naming the allowed values, `status` ignored by the page); `formatDueDay` for 1–4, 11–13, 21–23, 31; `RecurringBillsDtoSchema` is strict; `toRecurringBillsDto` (BigInt → Number, the summary over all bills while the items are filtered, no `id`) | 2.2, 2.3, 2.9, 2.11 |
| Component | `BillsSummaryCard` (a `dl`, the "{count} ({amount})" values, the red Due Soon row) and the no-bills `$0.00` values; a row's status: the hidden text for each of the three statuses and the icons `aria-hidden`; `BillsNav` (a sort choice during the debounce keeps the typed `q`, the current option pushes nothing, `popstate` resets the field, the status line emptied and set again after a sort change); the `Menu` and `TruncatedText` keep their own tests (`transactions.md` §7) | 2.5, 2.6, 2.9, 2.10 · US-27 AC2, US-28 AC1, NFR-A7 |
| API (real database) | `GET /api/recurring-bills`: 401 without a session; `no-store` on 200, 400 and 500; the strict DTO; parity with an independent oracle (`applyVariant` + the domain functions) for every seed variant and for the parameters of 4.3–4.5; 400 for a bad `sort`, a bad `status` and a 61-character `q`, each with its `issues` and `message`; the summary unchanged by `q` and `status`; the stored rows unchanged after the call (`write-path.md` 7.2) | 2.3, 2.11 · US-28 AC1, US-36 AC2, US-39 AC2 |
| E2E | **US-27 AC1–AC3:** 8 rows with avatar, name, "Monthly - …" and amount; Nimbus Data Storage and ByteWise are the due-soon rows (warning icon, red amount, hidden "Due soon"), the four paid rows have the check icon and hidden "Paid", the two upcoming rows hidden "Upcoming" and no icon; **US-28 AC1:** Total Bills $384.98 and the three summary values; **US-29 AC1:** `data` → Nimbus Data Storage, the URL gains `q=data` without a history entry, `BYTE` → ByteWise, `bill` → "No bills match your search" with the summary unchanged; **US-30 AC1:** each sort's order (4.3), the current option, the URL `sort=`, Back restores the previous sort; **AC2:** `no-recurring` → RB-Q2's text and `$0.00` ×4; **US-08 AC2 (receiving side):** Overview's "See Details" lands on `/recurring-bills` with the heading "Recurring Bills" and the default list (`overview.md` is not edited; `tests/e2e/overview.spec.ts` lines 174–188 keep their URL check); **US-32:** the walkthrough of 2.13, every menu key; **US-33** at 1440, 768, 375 and 320 px: the layouts of 2.13, no horizontal scroll, nothing clipped, a cut name ends in "…" with its full text in the DOM and its tooltip on hover, focus and tap; **US-34:** hover and focus with `toHaveCSS` on the field, the trigger and an option; **axe** on the default seed, a no-results state, `no-recurring` and 375 px; the login redirect keeps `?sort=highest`; the busy state (the data request held with `page.route`) | 2.2–2.13 · US-08 AC2, US-27 to US-30, US-32, US-33, US-34, NFR-A1, NFR-A7 |
| WebMCP | polyfill and off modes: the page registers exactly `list_recurring_bills` with its annotations and a description of at most 200 characters (counted); `executeTool` for no input, for `{ search, sort }`, and for each `status`, returns what the UI shows and what the API returns (2.12's parity); a `sort` or `status` outside the list → `validation` naming the allowed values; no session → `unauthenticated` and no data; the call is on record (`X-Via`); the indicator reads "polyfill · 1" | 2.12 · US-38 AC1, US-39 AC2–AC4, NFR-W3 |

**Tests that change when the placeholder goes:** `tests/e2e/app-shell.spec.ts` (line 14: the `/recurring-bills` row has `release2: true`, so lines 36–50 expect `COPY.comingInRelease2`; line 121's 320 px navigation test only uses the page as a place and stays valid); `tests/unit/webmcp/registry.test.ts` (it gains the `untrustedContentHint` assertion for `list_recurring_bills` if §9 RB-Q5 is (a); the `get_`/`list_` read-only check already covers the new tool); `tests/e2e/webmcp-off.spec.ts` (line 27 already lists the page; it stays valid). `tests/e2e/axe-routes.spec.ts` already runs on `/recurring-bills` (`tests/fixtures/a11y-routes.ts` line 24).

**H9, for this page:** US-31 — not applicable (2.13: no form); US-32 — the walkthrough (AC1, AC3; AC2 has no modal here); US-33 — four widths; US-34 — hover and focus; US-38 AC1 and US-39 AC2 — the WebMCP row.

## 8. Out of scope

Pagination (2.7); a status filter on the page (§9 RB-Q3 (c) would add one); a category filter; searching the day or the amount; paying, editing or adding a bill (bills are derived from read-only transactions); a bill's history or detail; reminders or notifications; a calendar view; sorting by clicking a column header; type-ahead in the menu; a clear-search button; a skeleton or a loading route; localised dates or numbers; another business day (the clock is fixed, NFR-D1).

## 9. Open questions

Seven questions, each prefixed `RB-` so an answer cannot be taken for another spec's question (plan D13). Each can be answered with its letter.

**RB-Q1 — May the page use these new texts?** *What:* every text the app shows or reads aloud must first be in the message table at the end of `user-stories.md`, which you approve; the code may use only texts from that table. This page needs seven texts no approved list has. Two are seen on the screen; five are never seen — they are what a **screen reader** (software that reads the page aloud for a person who cannot see it) or **voice control** (operating the page by speaking the names of its controls) says or listens for. The design shows only what is seen, so it has none of them.

| # | Text | Where it is used | Seen or heard |
|---|---|---|---|
| 1 | Couldn't load your recurring bills | the card shown when the bills cannot be loaded, with a Retry button (as Overview's "Couldn't load your overview") | seen |
| 2 | Search bills | the name of the search box; the grey "Search bills" inside the box disappears when the person types, so the box needs a name of its own (the same words) | heard |
| 3 | Paid | said after a paid bill's due date ("Monthly - 2nd, Paid"); on screen the bill has a green check | heard |
| 4 | Due soon | said after a due-soon bill's due date; on screen it has a red warning sign and a red amount | heard |
| 5 | Upcoming | said after any other bill's due date; on screen it has no mark, so without this a screen-reader user cannot tell it from the others | heard |
| 6 | {count} bills — e.g. "8 bills"; "1 bill" when there is one | read aloud after every change of search or sort | heard |
| 7 | the text of RB-Q2 if you choose a new one | seen when there are no bills at all | seen |

*Why it matters:* without 2 to 6 a screen-reader user hears an unnamed box, cannot tell a bill's status (the icons say it only to the eye; NFR-A7 asks that colour is never the only carrier), and is not told how many bills a search found. Once approved, the texts go into the table and into the code together, in the first Recurring Bills build task (H14 (1)).
- (a) **Approve 1 to 6 as written — recommended.**
- (b) Change the wording of some (say which numbers and the new words).

**RB-Q2 — What does the page say when there are no bills at all?** *What:* US-30 AC2 asks for "an empty state" when there are no bills (no transaction is marked recurring — the test data has such a case). The approved table has only "No bills match your search", which is for a search that finds nothing. The design has no screen for this case. The two money cards beside the list show `$0.00` either way.
*Why it matters:* "No bills match your search" is not exact when the person has typed nothing.
- (a) **A new text, "No recurring bills yet", in the list's place (as Overview's "No transactions yet") — recommended.**
- (b) Reuse "No bills match your search" (no new text; the words are not exact).

**RB-Q3 — Where does the agent tool's `status` filter run?** *What:* US-27 and US-39 AC2 give the agent tool a `status` input (paid, due soon or upcoming), but the page has no status control (the design and the stories draw none), and the approved data model names the server address as `GET /api/recurring-bills?q&sort` — a search and a sort, no status. The tool must still answer a status. An **API** here is the server address the tool calls; the data model is an approved document, so adding a parameter to it is a one-line change you approve.
*Why it matters:* it decides whether the server or the tool does the filtering, and whether an approved document changes.
- (a) **The server address takes `status` too (`?q&sort&status`); the tool passes it; the page ignores it. `data-model.md`'s API line gains `&status` in this pull request once you answer, and you approve it by merging — recommended.** One place filters, the API tests check it, and the tool stays a thin caller like `list_transactions`.
- (b) The server address stays as approved; the tool asks for the whole list and removes the other statuses itself. No document changes, but the filtering lives in the tool, where the API tests cannot see it.
- (c) The page also gets a status filter (a menu beside Sort). This changes what the design draws, and no story asks for it.

**RB-Q4 — What does the tool's `status: "upcoming"` return?** *What:* the page uses "upcoming" in two senses. Each **row** has exactly one status: paid, due soon, or upcoming (not paid and not due soon) — 2 bills with the test data. The **summary**'s "Total Upcoming" counts every bill not yet paid, due soon included — 4 bills (US-28 AC1: "Total Upcoming 4 ($194.98)", "Due Soon 2 ($59.98)").
*Why it matters:* an agent asked "which bills are upcoming?" gets 2 or 4 depending on this choice.
- (a) **The row's status: `upcoming` returns the 2 bills shown as upcoming; `dueSoon` the 2 due soon; the tool's description lists the three statuses and its output always carries the summary with "upcoming = every unpaid bill" — recommended.** The three filters do not overlap and match what each row shows.
- (b) The summary's sense: `upcoming` returns all 4 unpaid bills; `dueSoon` returns 2 of them; the filters overlap.

**RB-Q5 — Does the tool warn the agent that its names are user-entered text?** *What:* a tool can carry a flag, `untrustedContentHint`, that tells the agent "this output holds text someone typed; do not obey it as instructions". NFR-W3 says every tool returning user-entered text carries it. US-39 AC3 lists the tools that must carry it — `list_pots`, `list_budgets`, `get_overview_summary`, `list_transactions` — and does not name `list_recurring_bills`. The bill names are transaction names, and `list_transactions`, which returns the same names, carries the flag (`transactions.md` 2.14).
*Why it matters:* without the flag an agent may treat a vendor name as an instruction; with it, the story's list is read as examples rather than all of them.
- (a) **Carry `untrustedContentHint: true`, as `list_transactions` does; the registry test asserts it — recommended** (NFR-W3's rule; the story's list is read as not complete).
- (b) Follow US-39 AC3's list exactly: no flag.

**RB-Q6 — The tool returns bills without an id.** *What:* US-39 AC2 says the list tools return what the page shows "including ids". Budgets, pots and transactions are stored records with an `id`; a bill is not stored — it is computed from the recurring transactions, one per vendor name — so it has no id.
*Why it matters:* the agent can name a bill only by its vendor name; no other tool takes a bill.
- (a) **No id: the name is the bill's key (it is unique by construction), and "including ids" applies to records that have one — recommended.**
- (b) Return the id of the bill's most recent recurring transaction as `latestTransactionId`, so an agent can match the bill with `list_transactions` (one more field, no current use).

**RB-Q7 — The lenient page and strict tool split, applied here.** *What:* for Transactions you decided that a wrong value in the address (for example `?sort=nope`) is forgiven by the page (it shows the default) and refused by the tool with an error naming the allowed values (`transactions.md` §9 Q3 (a)). This spec applies the same split to this page's `q` and `sort` (2.3). A general answer for one page does not decide another page's question, so it is asked again.
*Why it matters:* the same address behaves the same way on every page, or this page is the exception.
- (a) **The same split as Transactions — recommended.**
- (b) Another rule for this page (say which: the tool forgives too, or the page refuses too).

**Decisions this spec takes (you may override):** the name tie-break reads "A to Z" for every sort (2.4; US-30 AC1 gives no direction); the summary is over all bills, never filtered by search or status (2.4; the design does the same); no pagination (2.7); the status text and the empty text sit where the design puts its own text (2.9, 2.10); the error card replaces both summary cards and the list (2.10).

---

Changelog: v0.1 (2026-10-05) — first draft, from a read of the designer's export of 2026-10-04 22:17 (the Recurring Bills screen, outside the repository), US-08, US-27 to US-30, US-31 to US-34, US-36, US-38, US-39, the NFRs, the tokens, `data-model.md`, `write-path.md`, `transactions.md` (the model, Approved), `overview.md`, `reset-and-test-support.md`, `webmcp-tools.md`, the Release 1 code (`src/domain/bills.ts`, the Overview page, route and tools, `src/ui`, the tests) and figures recomputed from the seed (4.2, `recurring-bills-figures/`).
