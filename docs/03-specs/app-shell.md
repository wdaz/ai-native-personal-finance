# SPEC-app-shell — Authenticated layout: sidebar, bottom navigation, minimise, banner, footer

Status: Draft (v0.1) · Author(s): Agent · Date: 2026-09-20
Implements: US-33, US-34, US-35, US-37 AC2, US-41 (indicator slot), US-03 (logout button slot) · Constrained by: ADR-0002, ADR-0004, design-tokens.md, NFR-A · Design: prototype sidebar (expanded 300 px / collapsed 88 px), tablet/mobile bottom bar; style guide "Sidebar"

## 1. Purpose
The frame every authenticated page lives in: navigation across the five pages, responsive behaviour, the demo-reset banner, and the footer with agent-tools status and logout.

## 2. Behaviour
2.1 `app/(app)/layout.tsx` (server) checks the session (middleware already redirected), fetches `/api/meta` (last reset, mode hint) and renders `<Shell>` (client) around `{children}`.
2.2 Desktop (≥ 1024 px): left sidebar, `--color-grey-900` background, radius `0 16px 16px 0`, logo "finance" (wordmark SVG; collapsed shows "f"), nav items in order Overview, Transactions, Budgets, Pots, Recurring Bills — each an icon + label, active item has beige-100 background, grey-900 text and a green left bar; hover on inactive items turns text white. Footer: agent-tools indicator, "Log out", "Minimize Menu" toggle.
2.3 Minimise: toggle collapses width to 88 px, hides labels (icons keep `aria-label`), flips the caret icon; `aria-expanded` reflects state; state stored in `sessionStorage["pf.sidebar"]`; no layout shift of page content beyond the width change (transition 200 ms, respects `prefers-reduced-motion`).
2.4 Tablet (768–1023 px) and mobile (< 768 px): sidebar hidden; fixed bottom bar with the five items — tablet shows icon + label, mobile icon only with `aria-label`; active item styled as in the design (beige-100 tab with top radius). Page content gets bottom padding equal to the bar height. Footer actions move to the page header's right side: agent indicator (compact dot) and a "Log out" icon button.
2.5 Page header: each page renders `<PageHeader title primaryAction?>`; `<h1>` text preset 1.
2.6 Reset banner: if `meta.lastResetAt` exists, a slim bar above the content: "Demo data resets every 10 days · last reset {date, e.g. 12 Sep 2026}" with a dismiss button ("Dismiss notice"); dismissed state in `sessionStorage["pf.banner"]`; role="status".
2.7 Navigation is client-side (`<Link>`); the current page is announced (`aria-current="page"`).
2.8 Skip link "Skip to content" as the first focusable element, visible on focus.

## 3. States
| State | Trigger | What the user sees | Exit |
|-------|---------|--------------------|------|
| Expanded / Collapsed | toggle | 300 / 88 px sidebar | toggle |
| Banner shown / dismissed | meta / dismiss | bar / nothing | — |
| Meta unavailable | `/api/meta` fails | no banner; indicator shows "unavailable" | reload |

## 4. Rules and boundaries
Breakpoints from design-tokens. Focus indicator token on all controls. Bottom bar height 52 px mobile / 74 px tablet. Minimum tap target 44 px. No horizontal scroll ≥ 320 px.

## 5. Data
`GET /api/meta` → `{ lastResetAt: string|null, resetIntervalDays: 10, webmcp: { originTrial: boolean } }` (public).

## 6. Interfaces
### UI
`src/ui/Shell`, `Sidebar`, `BottomNav`, `NavItem`, `PageHeader`, `ResetBanner`, `AgentToolsStatus` (SPEC-webmcp-tools), `LogoutButton` (SPEC-auth). Icons from `src/ui/icons` (house, arrows-down-up, chart-donut, jar-fill, receipt, arrow-fat-lines-left).
### API
`GET /api/meta` as above.
### WebMCP tools
None registered by the shell; it hosts the indicator only.

## 7. Tests required
| Level | What is asserted | Traces to |
|-------|------------------|-----------|
| Component | NavItem active/hover/focus classes; Sidebar toggle updates `aria-expanded` and storage | 2.2, 2.3 |
| E2E | US-33 AC1–AC3 at 1440/768/375 (sidebar vs bottom bar, no horizontal scroll at 320); US-35 AC1–AC2; US-37 AC2 banner text and dismiss; skip link; keyboard traversal of nav; axe | US-33/35/37 |

## 8. Out of scope
Theming, dark mode, user avatar/menu.

## 9. Open questions
None.
