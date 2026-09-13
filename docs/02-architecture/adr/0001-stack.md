# 0001 — Stack: Next.js full-stack on Vercel, Postgres (Neon), Prisma, Zod, Vitest, Playwright

- Status: **Accepted**
- Date: 2026-09-13
- Author(s): Agent (Claude) — proposal and analysis; Owner — decision
- Driven by: NFR-W1/W2 (one adapter, polyfill baseline), NFR-D3–D6 (seed/reset, public deploy, one-command run), NFR-P1/P3, NFR-Q2 (shared schemas), NFR-T3–T5, PS §5 (solo owner, public deploy, all browsers), PRD R1 scope
- Supersedes: the informal ADR-0001 of the earlier `finance-app` attempt (2026-09-01, Angular 22 + Nx + NestJS + SQLite), which is treated here as Alternative B with credit

## Context

The product is small (five pages, ~15 API operations, one demo account) but
the non-functional requirements are demanding in specific ways:

- **WebMCP must not depend on the framework.** NFR-W1 requires all tool
  registration to go through one app-owned adapter with no framework
  fallback, because the spec renamed its entry point in July 2026 and
  framework integrations lag (research note F8, F11). Page-scoped tools
  (US-38) are a routing concern in any framework. So a framework's built-in
  WebMCP support is *not* a selection criterion.
- **Operations must be trivial for one person.** Public deployment, a
  scheduled full reset every 10 days plus a storage-threshold reset (D5),
  a warm instance for Lighthouse (P1), and a one-command local run (D6).
- **One set of validation rules** shared by UI, API and tools (Q2, S3).
- **Testing is a headline claim.** Vitest for pure domain logic, Playwright
  for E2E against a real backend with a per-run seeded database (T1–T5),
  API tests without a browser.
- **Portfolio reach.** The public technical audience (PS §2) is widest for
  React; Angular has a smaller but engaged audience. The owner asked the
  agent to recommend rather than express a preference.
- **Fixed business time** (D1) and integer cents (D2) must be easy to inject
  everywhere, including serverless handlers.

## Decision

**Next.js (App Router, TypeScript strict) as a single full-stack app**,
deployed on **Vercel**, with:

- **Postgres on Neon** (free tier, no sleep-to-zero for the database
  connection pooler) accessed through **Prisma**; `data.json` seeded by an
  idempotent script that shifts dates +2 years (D3).
- **Vercel Cron** calling a protected `/api/admin/reset` route every 10 days;
  the same route is called by the storage-threshold check (D5). Test mode
  exposes seed/reset to Playwright fixtures (T3).
- **Zod** schemas in `src/shared/` used by forms, route handlers and WebMCP
  tools (Q2, S3); money as integer cents; a `Clock` provider fixed to
  2026-08-19 (D1).
- **Sessions** via signed httpOnly cookies (`iron-session` or equivalent),
  7 days sliding (S2); one demo account from environment variables (S1).
- **WebMCP adapter** as a client-only module under `src/webmcp/` that installs
  the polyfill when `document.modelContext` is absent, registers a page's
  tools from that page's client layout, unregisters on route change, and
  emits the readiness signal (W1–W3, US-38). Loaded lazily after first paint
  (P3). `WEBMCP_MODE` selects native / polyfill / off.
- **Vitest** for domain logic and adapter; **Playwright** for E2E, API tests
  (request context) and axe; **GitHub Actions** for CI; Lighthouse CI on
  release (T1–T9, P1).
- **Public Sans** via `next/font`; design tokens as CSS custom properties from
  `design-tokens.md`; plain CSS Modules (no UI framework), keeping the shell
  under the 250 kB budget (P3).

Repository layout, testing details and the WebMCP adapter design get their
own ADRs (0002–0004); this ADR fixes the platform.

## Alternatives considered

### A. Next.js full-stack on Vercel — **chosen**
Attractive: one deploy and one process for a solo owner; cron and
environment handling built into the platform; Playwright/Vitest are
first-class; React has the widest reviewer audience; Zod sharing is
trivial in one package; free tier does not sleep the web tier.
Costs: the server/client component boundary must be respected (WebMCP and
forms are client components; data fetching stays server-side); serverless
cold starts of a few hundred ms on the API (acceptable under "warm
instance" P1); Prisma on serverless needs the Neon pooler; vendor coupling
to Vercel for cron (mitigated: the reset is a plain HTTP route any
scheduler can call).

### B. Angular 22 + Nx + NestJS + Prisma/SQLite (prior attempt)
Attractive: Angular's first-party experimental WebMCP providers and
Signal-Forms-to-tool generation; route-level providers map naturally to
page-scoped tools; NestJS gives clear API boundaries and easy API tests;
the owner has prior familiarity from the earlier attempt.
Why it lost: NFR-W1 forbids relying on the framework's WebMCP layer, which
removes its main advantage, and that layer currently lags the spec rename
(F11); two deployables (SPA + Nest API) on free tiers that sleep (Render/
Fly) conflict with P1 and add a second pipeline; SQLite on an ephemeral
filesystem cannot honour the reset semantics deterministically without
extra work; Nx adds tooling weight a solo project does not need; smaller
public audience.

### C. React + Vite SPA + Fastify API + Prisma/Postgres
Attractive: lightest client bundle; explicit API boundary; no RSC
concepts. Why it lost: same two-deployable problem as B; no built-in cron;
more glue (routing, forms, sessions) to write and test for no requirement
that demands it.

### D. SvelteKit or Nuxt full-stack
Attractive: single deploy like A, smaller bundles. Why it lost: narrower
audience for a portfolio, smaller WebMCP/MCP-B ecosystem, and no
requirement they satisfy better than A.

## Consequences

- Easier: one repo, one command (`npm run dev` with a local Postgres via
  Docker or Neon branch), one deploy, cron for free, shared schemas without
  a monorepo tool. Agents work a feature end-to-end in one codebase.
- Harder: agents must respect the client/server boundary — every spec will
  state which components are client components. Serverless means no
  in-memory state; sessions and rate limits use the database or the edge.
- To watch: Prisma + serverless connection limits (use the pooler);
  Vercel hobby limits (cron frequency ≥ daily is fine); WebMCP origin-trial
  token per deployed origin (W8) — preview deployments will run in polyfill
  mode.
- Effect on verification: E2E runs against `next build && next start` with
  a seeded test database; API tests hit route handlers directly; the WebMCP
  adapter is framework-agnostic and unit-tested in isolation, so a later
  framework change would not touch it.
- The prior Angular ADRs remain in `~/Own/finance-app` as history; their
  testing and WebMCP thinking is carried into ADR-0003/0004.

## Review

Owner decision: **Accepted**, 2026-09-13. Owner comment: "Qəbul edirəm" — no changes requested; the owner had asked the agent to recommend and justify rather than express a preference, and the recommendation stands as written.
