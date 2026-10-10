# app/(app)

Authenticated route group: Overview, Transactions, Budgets, Pots, Recurring Bills
(SPEC-app-shell).

T-07: `layout.tsx` (`connection()` — keeps every page per-request, so Next applies the CSP nonce (ADR-0006),
without relying on `app/not-found.tsx`'s own call; the origin-trial `<meta>` when `WEBMCP_ORIGIN_TRIAL_TOKEN` is set; `Shell`
around the page), `Release2Placeholder.tsx` and the four Release 2 pages (`transactions/`,
`budgets/`, `pots/`, `recurring-bills/`: heading and "Coming in Release 2"), and
`overview/page.tsx` (its heading only until T-10). Page names come from `PAGE_NAMES`
(`src/ui/nav.ts`); each page's `metadata.title` is its `<h1>` (SPEC-app-shell §2.5). T-08 adds
`getMeta` and the reset banner, T-11 the WebMCP provider.

T-10: `overview/page.tsx` calls `getOverview(getDb(), fixedClock(BUSINESS_TODAY))` directly
(SPEC-overview §2.1 — no HTTP self-call to its own `GET /api/overview`) and composes the six
`src/ui/overview` cards inside `page.module.css`'s stat row and two-column grid (§6); on a
throw it renders `OverviewError` in place of the grid and logs the failure with the request id
`proxy.ts` forwards (§2.8).

T-12: `overview/layout.tsx` — a Server Component that renders `{children}` and
`<OverviewTools />` (`src/webmcp/tools/`), so the two Release 1 tools are registered while the
Overview segment is mounted and removed when the visitor navigates away (tools are page-scoped,
R-23; SPEC-webmcp-tools §2.3).

T-22: `_write/use-delete-flow.ts` (a private folder, no route) — the one join of
`ConfirmDeleteDialog` (`src/ui`) and the delete bus (`src/webmcp/bus.ts`) both write pages use
(SPEC-ui-kit 2.3; T-22 plan D1). `app/` may import both layers, `src/ui` never imports
`src/webmcp` (ADR-0002). T-24 (Budgets) and T-26 (Pots) call it.

T-26: `pots/` — `page.tsx` calls `getPots(getDb())` directly and renders `PotsBoard` (or, on a throw,
the header with no "Add New Pot" and `PotsError`, logged with the request id); `PotsBoard` is the client
container: the modal slot, the one write function (`apiSend`, then `router.refresh()` in a transition with
`aria-busy` on the grid), the delete flow, and the domain functions passed into `src/ui/pots` as props
(ADR-0002). `pots/layout.tsx` mounts `<PotsTools />`. With Pots built, no page shows "Coming in Release 2",
so `Release2Placeholder.tsx` and its stylesheet are gone (SPEC-pots 2.1, 2.8, 2.9).
