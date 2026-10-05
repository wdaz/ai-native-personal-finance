# SPEC-overview — Overview page

Status: **Approved** (v1.2 — 2026-10-05: §6 the two-column grid follows the content width (≥ 1060 px), not the window's 1024 px; §7 layout tests — the designer's changelog §14 and §16c, amendment approved by merging this pull request; v1.1 — 2026-09-22: §4.2 dates with three-letter months, §4.3 per-budget amounts in the money format, owner decisions at the T-03 plan gate; v1.0, owner approval 2026-09-20) · Author(s): Agent · Date: 2026-09-20
Changelog: v1.2 (2026-10-05; the designer's changelog §14, "Two-column layouts stack when the sidebar leaves too little room", and §16c, "§14 content-width two-column layout: accepted"; route: governance v1.10, PR #94 — the owner discussed §14 with the designer, and the designer recorded the decision in §16c; this amendment of an Approved document is approved by the owner merging its pull request) — §6: the grid had two columns from a 1024 px window, so between about 1100 and 1440 px the columns sat beside the 300 px sidebar and at 1100 px the Budgets card had about 90 px, its donut and legend overflowing (§14). The grid now takes two columns when the content width (SPEC-app-shell §2.9, v1.5) is at least 1060 px — 608 px left + 24 px gap + 428 px right, the 1440 px design frame — read with a container query on `<main>`; below it the four cards stack in the existing one-column order. The threshold is a number, not a token: breakpoint tokens for it are a separate decision (§14). §7: an E2E row for the layout at content widths below and above 1060 px, with the sidebar expanded and collapsed. The code change is a hand-off (`release-2-handoffs.md` H17). v1.1 (2026-09-22, owner decisions at the T-03 plan gate) — §4.2: dates are written from the UTC calendar date with English three-letter month names instead of `Intl.DateTimeFormat('en-GB', …)`, whose current data writes September as "Sept" (CLDR 48) against `d MMM yyyy` and SPEC-app-shell §2.6's "12 Sep 2026"; §4.3: the per-budget spent amounts take §4.2's money format (`$15.00`, was `15.00`), and the table is checked against `npm run seed:figures` by `tests/unit/seed-figures.test.ts`. v0.2 — S-01 figures corrected and generated rule added; S-02 two-decimal formatting everywhere; S-03 US-04 AC2 deferred to R2; S-11 server-side data access; S-12 UTC dates; S-13 donut geometry; S-26 empty layouts; S-28 avatars; S-35 test rows.
Implements: US-04 (AC1, AC3; AC2 tested in R2), US-05, US-06, US-07, US-08, US-32, US-34 · Constrained by: ADR-0002, ADR-0005, data-model.md, design-tokens.md, NFR-A/P · Design: prototype "Overview"

## 1. Purpose
Everything at a glance, computed by the backend from the current dataset, with links into each page. Read-only.

## 2. Behaviour
2.1 `app/(app)/overview/page.tsx` is a server component that calls `getOverview(db, clock)` from `src/server/overview.ts` directly (no HTTP self-call). The same function backs `GET /api/overview` for tools and tests. Title "Overview".
2.2 Stat cards: "Current Balance" (grey-900 card, white text), "Income", "Expenses" (white cards); values `$4,836.00`, `$3,814.25`, `$1,700.50`.
2.3 Pots card: title "Pots", link "See Details ›" → `/pots`; left tile: jar icon, "Total Saved", `$920.00` (sum of **all** pots); right: the first four pots in creation order as "name / `$159.00`" in a 2×2 grid, each with a 4 px bar in its theme colour. With 1–3 pots the grid keeps its cells and the empty cells stay blank.
2.4 Transactions card: title "Transactions", link "View All ›" → `/transactions`; five rows: avatar (40 px round, `alt` = name), name (preset 4 bold), amount (green `+$75.50` if positive, grey-900 `-$55.50` if negative, preset 4 bold), date (`19 Aug 2026`, preset 5 grey-500); 1 px grey-100 dividers.
2.5 Budgets card: title "Budgets", link "See Details ›" → `/budgets`; donut (§4.4) with centre `$338.00` (preset 1) and "of $975.00 limit" (preset 5 grey-500); legend: first four budgets in creation order, each a 4 px theme bar, category (preset 5 grey-500) and maximum `$50.00` (preset 4 bold). Totals include all budgets.
2.6 Recurring Bills card: title "Recurring Bills", link "See Details ›" → `/recurring-bills`; three beige-100 rows with a 4 px left border: "Paid Bills" (green) `$190.00`, "Total Upcoming" (yellow) `$194.98`, "Due Soon" (cyan) `$59.98`.
2.7 Empty states: no pots → tile `$0.00`, grid replaced by text "No pots yet" and link "Add a pot" → `/pots`; no budgets → single grey-100 ring, centre `$0.00` / "of $0.00 limit", legend replaced by "No budgets yet" + "Add a budget" → `/budgets`; fewer than five transactions → available rows; none → "No transactions yet"; no recurring → three rows at `$0.00`.
2.8 Error: if `getOverview` throws, the page renders inside the shell a single card (in place of the grid) "Couldn't load your overview" with a "Retry" button (`router.refresh()`); the error is logged with the request id.

## 3. States
| State | Trigger | What the user sees | Exit |
|-------|---------|--------------------|------|
| Default | data | five cards | navigate |
| Empty (per card) | no rows | §2.7 | create data (R2) |
| Error | server failure | §2.8 card | Retry |

## 4. Rules and boundaries
4.1 The page performs no arithmetic; all values come from `src/domain` via `getOverview`.
4.2 Formatting (`src/shared/money.ts`, `src/shared/dates.ts`):

| Element | Format | Example |
|---------|--------|---------|
| All money | `$` + thousands separators + two decimals; negative as `-$55.50`; transaction rows prefix positives with `+` | `$4,836.00`, `-$55.50`, `+$75.50` |
| Dates | `d MMM yyyy`, **UTC**: the day without a leading zero, the month from the fixed table `Jan` `Feb` `Mar` `Apr` `May` `Jun` `Jul` `Aug` `Sep` `Oct` `Nov` `Dec` (not `Intl`), the four-digit year — all of the UTC calendar date; input is ISO-8601 text with its zone, or a date | `19 Aug 2026`; `2026-08-19T20:23:11Z` → `19 Aug 2026`; `2026-09-01T00:00:00Z` → `1 Sep 2026` |

4.3 Worked example (seed, generated by `scripts/seed-figures.ts` in T-03 — the table below must equal its output; `npm run seed:figures` prints it, and `tests/unit/seed-figures.test.ts` fails when they differ):

| Item | Value |
|------|-------|
| Balance / Income / Expenses | `$4,836.00` / `$3,814.25` / `$1,700.50` |
| Pots total | `$920.00` |
| First four pots | Savings `$159.00`, Concert Ticket `$110.00`, Gift `$110.00`, New Laptop `$10.00` |
| Budgets spent / limit | `$338.00` / `$975.00` (Entertainment `$15.00`, Bills `$150.00`, Dining Out `$133.00`, Personal Care `$40.00`) |
| Legend | Entertainment `$50.00`, Bills `$750.00`, Dining Out `$75.00`, Personal Care `$100.00` |
| Bills | Paid `$190.00`, Upcoming `$194.98`, Due Soon `$59.98` |
| Latest five (timestamp desc, then name) | Savory Bites Bistro `-$55.50` 19 Aug 2026 · Emma Richardson `+$75.50` 19 Aug 2026 · Daniel Carter `-$42.30` 18 Aug 2026 · Urban Services Hub `-$65.00` 17 Aug 2026 · Sun Park `+$120.00` 17 Aug 2026 |

4.4 Donut: SVG 240 px, ring 24 px; segments proportional to each budget's `maximum`, drawn clockwise from 12 o'clock in creation order, no gaps; an inner ring (ring 8 px, immediately inside) repeats the segments at 25 % opacity (`color-mix(in srgb, var(--color-<theme>) 25%, white)`); `role="img"`, `aria-label="Spent $338.00 of $975.00 limit"`; legend is the accessible detail.
4.5 Card links are `<a>` elements with visible focus; avatars resolve to `/avatars/<key>.jpg` where `key` is the seed's basename (`emma-richardson`); files copied to `public/avatars/` in T-01.
4.6 US-04 AC2 (balance changes after pot money movement) is verified in Release 2 with the deposit API; R1 asserts stored values only.

## 5. Data
Reads Balance, Pot, Budget, Transaction (ADR-0005). No writes.

## 6. Interfaces
### UI
`app/(app)/overview/page.tsx` (server) → `src/ui/overview/{StatCard,PotsCard,TransactionsCard,BudgetsCard,Donut,BillsCard}`. Grid (v1.2): two columns when the content width (SPEC-app-shell §2.9) is at least **1060 px** — `@container (min-width: 1060px)` on `<main>`, not a viewport media query — `grid-template-columns: 1fr 1fr`, Pots (row 1 left), Transactions (rows 2–3 left), Budgets (rows 1–2 right), Bills (row 3 right); below 1060 px one column in the order Pots, Transactions, Budgets, Bills. The 1060 px is the design's 1440 px frame: 608 px left column + 24 px gap + 428 px right column (the designer's changelog §14). In window widths: two columns from 1440 px with the sidebar expanded and from 1228 px with it collapsed; at every tablet and mobile width one column (the content width there is at most 943 px). Until v1.1 the switch was the window's 1024 px (`--bp-desktop`); that text is replaced by this paragraph. The threshold is a number, not a token: breakpoint tokens for it are a separate decision (§14). The stat-card row above the grid is unchanged.
### Server
`getOverview(db, clock): Promise<OverviewDto>` in `src/server/overview.ts`, composed from `src/domain/overviewSummary`.
### API
`GET /api/overview` → `OverviewDto` (cents; dates ISO-8601 UTC):
```
{ balance: { current, income, expenses },
  pots: { total, items: [{ id, name, total, theme }] },                    // first 4, creation order
  transactions: [{ id, name, avatar, amount, date }],                       // latest 5
  budgets: { spent, limit, items: [{ id, category, maximum, spent, theme }] }, // first 4; totals over all
  bills: { paid, upcoming, dueSoon } }
```
`Cache-Control: no-store`; 401 envelope per SPEC-auth §2.10 without session.
### WebMCP tools
`get_balance`, `get_overview_summary` (SPEC-webmcp-tools §3).

## 7. Tests required
| Level | What is asserted | Traces to |
|-------|------------------|-----------|
| Unit | `formatMoney` (positive/negative/zero/large); `formatDate` UTC incl. `20:23Z` case; `overviewSummary(seed, clock)` equals the generated figures of 4.3 (order included) | 4.2, 4.3 |
| API | `GET /api/overview` matches `OverviewDtoSchema` and 4.3; 401 without session; `no-store` header | 6.API |
| E2E | US-04 AC1; US-05 AC1/AC3 and AC2 via `empty-pots` seed variant; US-06 AC1–AC3 (`few-transactions` variant); US-07 AC1/AC3 and AC2 via `empty-budgets`; US-08 AC1–AC3 (`no-recurring`); US-32 keyboard walkthrough (skip link → nav → four card links → footer, documented in the test); US-34 hover/focus styles on the four card links (`toHaveCSS`); axe | US-04…08, US-32, US-34 |
| E2E | Layout (v1.2), each case first asserting `<main>`'s content-box width so that a padding or scrollbar change fails loudly: sidebar expanded — at 1440 px (content 1060 px) Pots and Budgets share a row, Budgets to the right of Pots, Bills to the right of Transactions; at 1439 px (content 1059 px) and at 1100 px (content 720 px) the four cards stack in the order Pots, Transactions, Budgets, Bills, and at 1100 px the Budgets card's donut and legend lie inside the card (the overflow of the designer's changelog §14); sidebar collapsed ("Minimize Menu", read after the 200 ms transition) — at 1228 px (content 1060 px) two columns, at 1227 px (content 1059 px) one column; collapsing at 1300 px switches one column to two and expanding switches back; 1024 px and 768 px: one column | §6 UI, SPEC-app-shell §2.9, US-33 |
| WebMCP | SPEC-webmcp-tools §7 | US-38/39 |

## 8. Out of scope
Any mutation; per-card refresh; charts beyond the donut; US-04 AC2 (R2).

## 9. Open questions
None.
