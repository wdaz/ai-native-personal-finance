# SPEC-overview — Overview page

Status: Draft (v0.1) · Author(s): Agent · Date: 2026-09-20
Implements: US-04, US-05, US-06, US-07, US-08, US-13 (n/a), US-31 (n/a), US-32, US-34 · Constrained by: ADR-0002, ADR-0005, data-model.md, design-tokens.md, NFR-A/P · Design: prototype "Overview" (desktop: 3 stat cards, then two columns — left Pots + Transactions, right Budgets + Recurring Bills; tablet/mobile: single column in the same order)

## 1. Purpose
Everything at a glance, computed by the backend from the current dataset, with links into each page. Read-only.

## 2. Behaviour
2.1 `GET /overview` (server component) fetches `GET /api/overview` and renders; the page is a client component only where interaction exists (links, indicator). Title "Overview".
2.2 Stat cards: "Current Balance" (grey-900 card, white text), "Income", "Expenses" (white cards) — values formatted `$4,836.00` (thousands separators, two decimals).
2.3 Pots card: title "Pots", link "See Details ›" → `/pots`; left tile with jar icon, "Total Saved", `$920` (whole dollars if `.00`, else two decimals — the design shows `$850`; formatting rule 4.2); right: up to four pots as "name / $total" in a 2×2 grid, each with a 4 px bar in its theme colour.
2.4 Transactions card: title "Transactions", link "View All ›" → `/transactions`; five rows: avatar (40 px, alt = name), name (preset 4 bold), amount (green with `+` if positive, grey-900 with `-` if negative, preset 4 bold), date (`19 Aug 2026`, preset 5 grey-500). Divider between rows.
2.5 Budgets card: title "Budgets", link "See Details ›" → `/budgets`; donut (240 px, ring 24 px, inner ring lighter tint) with centre text `$338` (preset 1) and "of $975 limit" (preset 5); legend: up to four budgets, each with a 4 px theme bar, category (preset 5 grey-500) and `$50.00` maximum (preset 4 bold).
2.6 Recurring Bills card: title "Recurring Bills", link "See Details ›" → `/recurring-bills`; three rows on beige-100 with a 4 px left border: "Paid Bills" (green) `$190.00`, "Total Upcoming" (yellow) `$194.98`, "Due Soon" (cyan) `$59.98`.
2.7 Empty states: no pots → tile shows `$0` and text "No pots yet" with link "Add a pot" → `/pots`; no budgets → donut `$0 of $0 limit` and "No budgets yet" + "Add a budget" → `/budgets`; fewer than five transactions → available rows; none → "No transactions yet"; no recurring → three rows at `$0.00`.
2.8 Loading: server-rendered, so no client loading state; on `GET /api/overview` failure the page renders the shell with an error card "Couldn't load your overview" and a "Retry" button (router.refresh).

## 3. States
| State | Trigger | What the user sees | Exit |
|-------|---------|--------------------|------|
| Default | data | five cards | navigate |
| Empty (per card) | no rows | per 2.7 | create data |
| Error | API 5xx/network | error card | retry |

## 4. Rules and boundaries
4.1 All numbers come from `src/domain` via the API; the page performs no arithmetic.
4.2 Money formatting (`src/shared/money.ts`): `formatMoney(cents, { compact })` — default `$1,234.56`; `compact: true` drops `.00` (used for pot tile, pot legend, donut centre, budget legend maximums keep two decimals as in the design). Negative amounts render `-$55.50`, positive with `+$75.50` only in transaction rows.
4.3 Worked example with seed data (dates already shifted): balance 483600 → `$4,836.00`; income `$3,814.25`; expenses `$1,700.50`; pots total 92000 → `$920`; first four pots Savings `$159`, Concert Ticket `$110`, Gift `$40`, New Laptop `$10`; budgets spent 33800 of 97500 → `$338` / `of $975 limit`; legend Entertainment `$50.00`, Bills `$750.00`, Dining Out `$75.00`, Personal Care `$100.00`; bills `$190.00` / `$194.98` / `$59.98`; latest five: Emma Richardson +$75.50 (19 Aug 2026), Savory Bites Bistro −$55.50 (19 Aug 2026), Daniel Carter −$42.30 (18 Aug 2026), Sun Park +$120.00 (17 Aug 2026), Urban Services Hub −$65.00 (17 Aug 2026). Order: US-11 "Latest" (timestamp desc, then name).
4.4 Donut: SVG, segments in budget creation order, colours from theme; `role="img"` with `aria-label="Spent $338 of $975 limit"`; legend is the accessible detail.
4.5 Card links are real links (`<a>`), with visible focus.

## 5. Data
Reads Balance, Pot, Budget, Transaction (ADR-0005). No writes.

## 6. Interfaces
### UI
`app/(app)/overview/page.tsx` (server) → `<StatCard>`, `<PotsCard>`, `<TransactionsCard>`, `<BudgetsCard>` (+ `<Donut>`), `<BillsCard>` in `src/ui/overview/`. Layout: CSS grid — desktop `grid-template-columns: 1fr 1fr` with row spans (Pots 1, Transactions 2, Budgets 2, Bills 1) as in the design; below 1024 px one column.
### API
`GET /api/overview` → `OverviewDto`:
```
{ balance: { current, income, expenses },                 // cents
  pots: { total, items: [{ id, name, total, theme }] },    // first 4
  transactions: [{ id, name, avatar, amount, date }],      // latest 5
  budgets: { spent, limit, items: [{ id, category, maximum, theme }] }, // first 4; totals over all
  bills: { paid, upcoming, dueSoon } }                     // cents
```
Cache: `no-store`. 401 when no session.
### WebMCP tools
`get_balance`, `get_overview_summary` — registered by this page's client layout; definitions in SPEC-webmcp-tools §3.

## 7. Tests required
| Level | What is asserted | Traces to |
|-------|------------------|-----------|
| Unit | `formatMoney` cases; domain `overviewSummary(seed, clock)` equals 4.3 | 4.2, 4.3 |
| API | `GET /api/overview` DTO matches the schema and 4.3 values; 401 without session | 6.API |
| E2E | US-04 AC1 (three values), AC2 after a deposit made through the API fixture; US-05 AC1/AC3; US-06 AC1–AC3; US-07 AC1/AC3; US-08 AC1–AC2; empty states via test seed variants; keyboard: Tab reaches all four links; axe | US-04…08 |
| WebMCP | see SPEC-webmcp-tools §7 | US-38/39 |

## 8. Out of scope
Any mutation; per-card refresh; charts beyond the donut.

## 9. Open questions
None.
