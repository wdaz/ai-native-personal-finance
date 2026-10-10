# src/ui

Design-system primitives: `tokens.css`, Button, Input, Modal, Menu, icons (ADR-0002).

- **Imports allowed:** `src/shared`.
- `tokens.css` is generated from `docs/02-architecture/design-tokens.md` and is the only
  place design values are written. No hard-coded hex or pixel values anywhere else.

T-06: `Button` (primary), `Field` (label, input, helper, error — `aria-describedby`,
`aria-invalid`, a polite live region), `PasswordField` (show/hide toggle), `Logo`
(`LogoLarge`), `icons/EyeIcon`, `icons/EyeSlashIcon` (challenge assets, drawn in
`currentColor`). No `style` prop and no `next/image` anywhere: the CSP's `style-src` blocks
inline style attributes (ADR-0006).

T-07: the app shell — `Shell` (skip link, `<main>`, the back/forward-cache session re-check in
`session-recheck.ts`), `Sidebar` (minimise; `sidebar-state.ts` keeps
`sessionStorage["pf.sidebar"]`), `BottomNav`, `NavItem`, `PageHeader`, `LogoutButton`
(sidebar row or header icon; `logout.ts` completes the logout even when the request fails),
`OriginTrialMeta`; `nav.ts` (`PAGE_NAMES`, `NAV_ITEMS`, `isActive`); `cx.ts`. `icons/` gains
the five navigation icons and the minimise caret (challenge assets) and `SignOutIcon`
(Phosphor, MIT); `Logo` gains `LogoSmall`. Their component tests are in `tests/unit/ui/`.

T-08: `ResetBanner` (SPEC-app-shell §2.6 — `banner-state.ts` keeps
`sessionStorage["pf.banner"]`, the dismissed reset's date, through `session-store.ts`, which
`sidebar-state.ts` now shares; dismissing it moves focus to `<main>`), rendered by `Shell` from
the `meta` the `(app)` layout reads; `icons/CloseCircleIcon` — the Claude Design prototype's
modal close control, drawn inline there, not one of the Figma icons (T-08 plan Q2 (d)).

T-10: `overview/` — the six components SPEC-overview §6 names (`StatCard`, `PotsCard`,
`TransactionsCard`, `BudgetsCard`, `Donut`, `BillsCard`), plus `OverviewError` (client — the
§2.8 retry card), `CardLink` (the "See Details ›"/"View All ›" links every card shares),
`ThemeBar` (a pot/budget's 4 px theme-colour bar — a `data-theme` attribute selector per theme,
never inline `style`, ADR-0006), `theme-color.ts` (`themeVar`, reused by `Donut`'s SVG `stroke`
attribute — a plain SVG presentation attribute, not the `style` prop, so the CSP does not apply)
and `donut-geometry.ts` (pure `donutSegments`, unit-tested without rendering). `icons/` gains
`JarIcon` (Phosphor `jar-fill`, MIT — design-tokens.md already named it, unlike `sign-out`'s
project addition). Avatars are bare `<img>` (still no `next/image`, per T-06's rule above).

T-11: `agent-tools-indicator.ts` — a `ReactNode` slot context (`sidebar`/`compact`), no
`src/webmcp` knowledge; `app/(app)/layout.tsx` is the one file that fills it, from
`AgentToolsStatus` (`src/webmcp` — this layer may not import that one, ADR-0002). `Sidebar` and
`PageHeader` each place whichever slot fits their layout; `PageHeader` becomes a Client
Component for the `useContext` call. `Sidebar.module.css` gains `.indicatorCollapsed`
(centres the indicator's compact dot in the 88 px collapsed rail — no design source for this
placement, T-11 plan D5).

T-19: `Menu` (SPEC-transactions 2.8) — choosing one value from a list: a button trigger with one
name, "{label}: {current}", a `role="listbox"` panel that holds focus and names its highlighted
option with `aria-activedescendant`, positioned by CSS alone (no inline `style`, ADR-0006);
the trigger is as wide as its longest option (hidden sizers in one grid cell, v1.0.18). Later
uses (the forms' category and theme) add what `ui-kit.md` 2.6 lists. `useDebouncedValue`
(a value and its `flush`). `transactions/` — the page's parts: `TransactionsNav` (the one
intended query and every navigation), `TransactionsToolbar`, `ResultsRegion` (`aria-busy` and
the status line), `TransactionTable` (a server component), `TransactionsPagination` and
`TransactionsError`. `icons/` gains `SearchIcon`, `CaretDownIcon`, `CaretRightIcon`, `SortIcon`
and `FilterIcon`, their paths copied from the owner's design export (Phosphor, MIT).
