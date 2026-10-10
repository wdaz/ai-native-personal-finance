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

T-21: `ResultsRegion` moves from `transactions/` to `src/ui` (SPEC-recurring-bills §6): it reads
`{ pending, changes }` from `ResultsNavContext`, which each list page's navigation provider
(`TransactionsNav`, `BillsNav`) provides beside its own context. `recurring-bills/` — the page's
parts: `BillsNav` (`TransactionsNav` with `q` and `sort` only), `BillsToolbar`, `BillsTable`,
`TotalBillsCard` and `BillsSummaryCard` (server components) and `BillsError`. `icons/` gains
`ReceiptIcon`, `CheckCircleIcon` and `WarningCircleIcon` (Phosphor, from the design export).

T-22: the shared write parts of SPEC-ui-kit §6, before either write page uses them. `Modal` (a
`role="dialog"` in a portal, the rest of the page `inert`, focus kept inside and returned when it
closes), `ModalSlot` (one modal or write at a time per page; `ModalSlotProvider` and
`useModalSlot`), `ConfirmDeleteDialog`, `ActionMenu` (the "…" menu button and its `role="menu"`),
`AmountField`, `SelectField` (on `Menu`'s new `variant="field"`), `FormFooter` and `FormError`,
`Notice` and `useNotice`, `ThemeSwatch`; `main-content.ts` (`MAIN_CONTENT_ID`, `focusMain`, which
`Shell` re-exports), `reload.ts` (`reloadPage`) and `open-menu.ts` (one open menu per page, shared
by `Menu` and `ActionMenu`). `Field` gains `leading`, `placeholder`, `inputMode` and
`defaultValue`; `Button` gains `variant` (`primary`, `destroy`, `text`) and `fit`, and shows no
hover while disabled or `aria-disabled`; `PageHeader` gains `primaryAction` and
`HeaderAddButton`; `Menu` gains the field variant's options, and its Escape no longer reaches a
modal under it. `icons/` gains `DotsThreeOutlineIcon` (Phosphor, from the design export).

T-26: `pots/` — `PotCard` (the bar an inline SVG `rect`, its width a presentation attribute, ADR-0006),
`PotForm` (add and edit; the name's counter as the field's helper), `MoneyModal` (the add and withdraw
modals with the live preview; the two segments' corners as SPEC-pots 2.6 asks), `PotsError` and
`AmountText` (an amount that may wrap after its commas). They import no domain code: `PotsBoard` passes
`potFill`, `moneyPreview`, `isPotNameTaken` and `firstFreeTheme` in (ADR-0002). `Notice` is now visually
hidden while idle, so the empty live region takes no space in `<main>`'s flow.
