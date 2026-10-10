# SPEC-app-shell — Authenticated layout: sidebar, bottom navigation, minimise, banner, footer

Status: **Approved** (v1.5 — 2026-10-05: §2.9 pages take two columns from the content width, not the window; §2.3, §4, §7 follow — the designer's changelog §14 and §16c, amendment approved by merging this pull request; v1.4.1 — 2026-09-25: wording only — §2.1 says "proxy" (T-13a, Q5); v1.4 — 2026-09-23: §2.6 the reset banner's look and dismiss control, §6 icon list, T-08; v1.3 — 2026-09-23: §2.2/§2.4 the "Log out" control's style and icon, §6 icon list, §7 hover/focus asserted in E2E; v1.2 — 2026-09-23: §2.5 document-title rule for every page, "Personal Finance - <page name>"; v1.1 — 2026-09-23: §2.6 banner interval from `meta.resetIntervalDays`; v1.0, owner approval 2026-09-20) · Author(s): Agent · Date: 2026-09-20
Changelog: v1.5 (2026-10-05; the designer's changelog §14, "Two-column layouts stack when the sidebar leaves too little room", and §16c, "§14 content-width two-column layout: accepted"; route: governance v1.10, PR #94 — the owner discussed §14 with the designer, and the designer recorded the decision in §16c; this amendment of an Approved document is approved by the owner merging its pull request) — between about 1100 and 1440 px of window the two-column pages kept two columns beside the 300 px sidebar, and on Overview at 1100 px the Budgets card had about 90 px, so its donut and legend overflowed (§14). New §2.9: `<main>` is a size container (`container-type: inline-size`) and a page switches to two columns by the width of the content area — window − sidebar (300 px, or 88 px collapsed) − 80 px padding — not by the window; each page spec holds its threshold; breakpoint tokens for the thresholds are a separate decision, so no token is added. §2.3: collapsing or expanding the sidebar may change a page's column count. §4: window breakpoints and content-width thresholds are told apart. §7: a row for the size container. v1.4.1 (2026-09-25, T-13a) — §2.1 names the proxy (`proxy.ts`, formerly `middleware.ts`); no behaviour changed. v1.4 (2026-09-23, T-08; the dismiss control is the owner's decision at the T-08
plan gate, Q2 (d); §2.1's forwarded reset time from the owner's review of PR #20) — no design shows the reset banner. §2.6 now states its look: a white card,
radius 12 px, text preset 4 in grey-900 (T-08 plan D14). Its dismiss button reuses the Claude
Design prototype's modal close control, a 32 px outlined circle with an x, grey-500 and
grey-900 on hover, in a 44 px tap target (§4). Dismissing moves focus to `<main>`. The stored dismissal is the dismissed reset's `lastResetAt`, not a flag, so it does not outlive that reset (PR #20 review, finding 4). §6 lists
the icon as `close-circle` (drawn in the prototype, not one of the Figma icons; design-tokens
v1.3). v1.3 (2026-09-23, owner decision at the T-07 plan gate, Q3 (a)) — the design has no logout control and no logout icon, so the two places §2.2 and §2.4 already name get a stated look: the sidebar footer's "Log out" is styled as the "Minimize Menu" row (icon + label, 56 px, grey-300 → white on hover) and sits above it; the header's icon button below 1024 px is Phosphor "sign-out" (fill weight, MIT — the style guide's icons are Phosphor), grey-500 → grey-900 on hover, at least 44 px. §6 lists the icon (28 icons; design-tokens v1.2). §7's Component row says hover and focus are CSS pseudo-classes asserted in E2E with `toHaveCSS`, since jsdom applies no stylesheet. Nine shell values become tokens (design-tokens v1.2). v1.2 (2026-09-23, owner decision on T-06's whole-branch review, finding M3) — §2.5: every page's document `<title>` is "Personal Finance - <page name>" (owner: "Bütün səhifələr üçün title qaydası. Personal Finance - page name"), so a screen-reader or tab-switching user can tell pages apart (WCAG 2.4.2, NFR-A1). The page name is the page's own `<h1>` text; `app/layout.tsx` holds the template, each page sets its name, and a page without one falls back to "Personal Finance". The rule covers the auth pages (SPEC-auth §6) and the 404 page as well as this shell's pages. v1.1 (2026-09-23, owner decision at the T-04 plan gate) — §2.6: the banner writes the configured interval, `meta.resetIntervalDays` (§5), as `.env.example` already said; the copy appendix (user-stories v1.2) reads "every {days} days". v0.2 — S-10 indicator owned by WebMcpProvider; S-11 server-side meta; S-14 US-35 confirmed R1 (PRD amended); S-24 meta DTO + OT meta tag; S-25 deterministic lastResetAt; S-27 names/storage; S-35 test rows.
Implements: US-33, US-34, US-35, US-37 AC2, US-41 (indicator slot), US-03 (logout button slot) · Constrained by: ADR-0002, ADR-0004, design-tokens.md, NFR-A · Design: prototype sidebar (expanded 300 px / collapsed 88 px), tablet/mobile bottom bar; style guide "Sidebar"

## 1. Purpose
The frame every authenticated page lives in: navigation across the five pages, responsive behaviour, the demo-reset banner, and the footer with agent-tools status and logout.

## 2. Behaviour
2.1 `app/(app)/layout.tsx` (server) reads meta via `getMeta(db)` from `src/server` (no HTTP self-call), reusing the latest reset time the proxy already read for the session check, forwarded as the request header `x-last-reset-at` (a client-sent copy is always removed; a missing or malformed value falls back to the database — v1.4, PR #20 review), renders `<meta http-equiv="origin-trial" content={WEBMCP_ORIGIN_TRIAL_TOKEN}>` only when that env var is set (production origin only, ADR-0007), then `<WebMcpProvider>` (SPEC-webmcp-tools §2.3) and `<Shell meta>` (client) around `{children}`.
2.2 Desktop (≥ 1024 px): left sidebar, `--color-grey-900` background, radius `0 16px 16px 0`, logo "finance" (wordmark SVG; collapsed shows "f"), nav items in order Overview, Transactions, Budgets, Pots, Recurring Bills — each an icon + label, active item has beige-100 background, grey-900 text and a green left bar; hover on inactive items turns text white. Footer: agent-tools indicator, "Log out" (styled as the "Minimize Menu" row, with the Phosphor sign-out icon — v1.3), "Minimize Menu" toggle.
2.3 Minimise (US-35, Release 1 by owner decision S-14): toggle collapses width to 88 px, hides labels (icons keep `aria-label`), flips the caret icon; accessible name "Minimize Menu" when expanded, "Expand Menu" when collapsed; `aria-expanded` reflects state; `sessionStorage["pf.sidebar"] = "collapsed"` when collapsed, key removed when expanded; no layout shift of page content beyond the width change (transition 200 ms, respects `prefers-reduced-motion`). The width change gives the content area 212 px more or less, so it can switch a page between one and two columns (§2.9, v1.5); that switch is the intended result of the width change, not a layout shift.
2.4 Tablet (768–1023 px) and mobile (< 768 px): sidebar hidden; fixed bottom bar with the five items — tablet shows icon + label, mobile icon only with `aria-label`; active item styled as in the design (beige-100 tab with top radius). Page content gets bottom padding equal to the bar height. Footer actions move to the page header's right side: agent indicator (compact dot) and a "Log out" icon button (Phosphor "sign-out", fill; grey-500, grey-900 on hover; at least 44 px — v1.3).
2.5 Page header: each page renders `<PageHeader title primaryAction?>`; `<h1>` text preset 1. Document title (every page of the app, v1.2): "Personal Finance - <page name>", the page name being the page's `<h1>` text — e.g. "Personal Finance - Overview"; `app/layout.tsx` sets `title.template` "Personal Finance - %s" and the default "Personal Finance", each page's `metadata.title` its name (WCAG 2.4.2).
2.6 Reset banner: if `meta.lastResetAt` exists, a slim bar above the content: "Demo data resets every {resetIntervalDays} days · last reset {date, e.g. 12 Sep 2026}" (`COPY.resetBanner`; "1 day" when the interval is 1) with a dismiss button ("Dismiss notice"); dismissed state in `sessionStorage["pf.banner"]`, whose value is the `lastResetAt` the user dismissed: a later reset shows the banner again, with its new date (v1.4); role="status". Look (v1.4): the first block of the page, a white card, radius 12 px, text preset 4 in grey-900; the dismiss button is the prototype's modal close icon (`close-circle`, 32 px, grey-500, grey-900 on hover) in a 44 px tap target, and dismissing moves focus to `<main>`.
2.7 Navigation is client-side (`<Link>`); the current page is announced (`aria-current="page"`).
2.8 Skip link "Skip to content" as the first focusable element, visible on focus.
2.9 Content width (v1.5; the designer's changelog §14, accepted in §16c): `<main>` is a size container (`container-type: inline-size`). A page that has a two-column layout switches to two columns by the width of `<main>`'s content box — the room the shell leaves the page — and never by the window width. That width is:

| Window | Content width |
|--------|---------------|
| ≥ 1024 px, sidebar expanded | window − 300 px (sidebar) − 80 px (page padding, 40 + 40) |
| ≥ 1024 px, sidebar collapsed | window − 88 px (sidebar) − 80 px (page padding) |
| 768–1023 px (no sidebar) | window − 80 px (page padding) |
| < 768 px (no sidebar) | window − 32 px (page padding, 16 + 16) |

Pages read it with a container query on `<main>` (`@container (min-width: …)`), not with a viewport media query; below their threshold the columns stack. The shell's own layout (sidebar or bottom bar, §2.2, §2.4, and the page padding) still follows the window breakpoints of §4. Each page spec holds its own threshold: Overview 1060 px (`overview.md` §6); Budgets 952 px and Recurring Bills 961 px (the designer's changelog §14), stated in their own specs. Breakpoint tokens for these thresholds are a separate decision (the designer's changelog §14): the specs write the numbers, and `design-tokens.md` gains no token in this amendment.

## 3. States
| State | Trigger | What the user sees | Exit |
|-------|---------|--------------------|------|
| Expanded / Collapsed | toggle | 300 / 88 px sidebar | toggle |
| Banner shown / dismissed | meta / dismiss | bar / nothing | — |
| Meta unavailable | `getMeta` fails | no banner (indicator is independent, SPEC-webmcp-tools §2.7) | reload |

## 4. Rules and boundaries
Window breakpoints from design-tokens (`--bp-tablet` 768 px, `--bp-desktop` 1024 px) decide the shell's layout; a page's column count is decided by the content width (§2.9, v1.5), whose thresholds are numbers in the page specs, not tokens. Focus indicator token on all controls. Bottom bar height 52 px mobile / 74 px tablet. Minimum tap target 44 px. No horizontal scroll ≥ 320 px.

## 5. Data
`GET /api/meta` → `{ lastResetAt: string (ISO, always present — the first seed writes a ResetLog row), resetIntervalDays: number (env `RESET_INTERVAL_DAYS`, default 10), webmcp: { configuredMode: "native"|"polyfill"|"off", originTrial: boolean } }` (public, `no-store`). Same data via `getMeta(db)` server-side.

## 6. Interfaces
### UI
`src/ui/Shell`, `Sidebar`, `BottomNav`, `NavItem`, `PageHeader`, `ResetBanner`, `AgentToolsStatus` (SPEC-webmcp-tools), `LogoutButton` (SPEC-auth). Icons from `src/ui/icons` (house, arrows-down-up, chart-donut, jar-fill, receipt, arrow-fat-lines-left, sign-out, close-circle — v1.4).
### API
`GET /api/meta` as above.
### WebMCP tools
None registered by the shell; it hosts the indicator only.

## 7. Tests required
| Level | What is asserted | Traces to |
|-------|------------------|-----------|
| Component | NavItem active class, `aria-current` and tooltip; Sidebar toggle updates `aria-expanded` and storage (hover and focus are CSS pseudo-classes — asserted in E2E with `toHaveCSS`, not here, v1.3) | 2.2, 2.3 |
| E2E | US-33 AC1–AC3 at 1440/768/375 (sidebar vs bottom bar, no horizontal scroll at 320); US-35 AC1–AC2 (names, storage value, keyboard operable when collapsed); US-37 AC2 banner shows the date of the `ResetLog` row written by `/api/test/reset` (UTC) and dismiss persists for the session; US-32 keyboard traversal: skip link → five nav items → footer controls, Enter activates; US-34 hover/focus styles on nav items and footer buttons (`toHaveCSS`); OT meta tag absent in test env; axe | US-32/33/34/35/37 |
| E2E | Content width (v1.5): `<main>`'s computed `container-type` is `inline-size`; its content-box width is 1060 px at 1440 px with the sidebar expanded and 1272 px after "Minimize Menu" (read once the 200 ms transition has ended), 688 px at 768 px and 343 px at 375 px — the table of 2.9. Each page's switch at its threshold is asserted in that page's spec (`overview.md` §7) | 2.9, US-33 |

## 8. Out of scope
Theming, dark mode, user avatar/menu.

## 9. Open questions
None.
