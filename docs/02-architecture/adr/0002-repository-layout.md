# 0002 — Repository layout: single Next.js app with enforced internal boundaries

- Status: **Accepted** · Date: 2026-09-13 · Author(s): Agent (proposal), Owner (decision)
- Driven by: ADR-0001; PS decision "monorepo" (2026-09-03); NFR-Q2 (shared schemas); AGENTS.md (docs as agent context)

## Context
The 2026-09-03 decision was "frontend and backend in one repository so an agent can work a feature end-to-end". With ADR-0001 both live in one Next.js app, so the question becomes how to keep boundaries visible to agents without a monorepo tool.

## Decision
One npm package, no workspace tool. Boundaries are folders plus lint rules:

```
/                     README, AGENTS.md, CLAUDE.md, docs/ (unchanged)
app/                  Next.js App Router: routes, layouts, client components per page
  (auth)/login, (app)/overview, transactions, budgets, pots, recurring-bills
  api/                route handlers (thin: parse → call domain → respond)
src/
  domain/             pure functions: money, budgets, pots, bills, sorting, paging, clock
  shared/             Zod schemas, DTO types, enums (categories, themes), test ids, copy
  server/             Prisma client, repositories, session, rate limit, seed/reset
  webmcp/             adapter, tool registry per page, polyfill loader, readiness signal
  ui/                 design-system primitives (tokens.css, Button, Input, Modal, Menu…)
prisma/               schema, migrations, seed script
tests/
  unit/               Vitest (domain, shared, webmcp adapter)
  api/                Playwright request-context tests against route handlers
  e2e/                Playwright browser tests, one file per story area
  fixtures/           seed/reset helpers, auth state
```
Import rules (eslint `no-restricted-imports` / boundaries plugin): `domain` imports nothing from `app`, `server`, `webmcp`; `shared` imports nothing from the rest; `app` never imports Prisma directly (only `server`); `webmcp` imports only `shared` and calls the HTTP API.

## Alternatives considered
**A. This layout — chosen.** Simplest for one app; boundaries enforced by lint rather than packaging.
**B. pnpm/npm workspaces with `apps/web` + `packages/shared` + `packages/domain`.** Cleaner physical separation and reusable packages; cost: build/watch plumbing, path aliases, Vercel monorepo config — nothing here needs a second app, so the weight buys nothing today. Revisit if a second app (e.g. a separate MCP relay service) appears.
**C. Nx (prior attempt).** Rejected in ADR-0001 for tooling weight.

## Consequences
Easier: one `npm install`, one `tsconfig`, one CI job; agents find everything by folder name; `apps/README.md` placeholder is replaced by this layout when Phase 5 scaffolds. Harder: boundaries depend on lint discipline — CI must fail on violations. `docs/` remains the source of truth; code never contradicts an Accepted ADR.

## Review
Owner decision: **Accepted**, 2026-09-13. Owner chose alternative A as proposed.
