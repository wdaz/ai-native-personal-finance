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
`middleware.ts` forwards (§2.8).
