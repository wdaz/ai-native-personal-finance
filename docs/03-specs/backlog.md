# Backlog — Release 1 (vertical slice: Auth + Overview)

Status: Draft (v0.1) · Author(s): Agent · Date: 2026-09-20 · Order is the intended execution order; each task is sized for one agent session and ends with the Definition of Done.

| Id | Task | Spec / ADR | Stories | Depends on |
|----|------|------------|---------|------------|
| T-01 | Scaffold: Next.js (App Router, TS strict), folder layout, ESLint boundaries, Prettier, Vitest, Playwright (3 engines), `tokens.css` + Public Sans via `next/font`, `.env.example`, README run instructions | ADR-0001/0002, design-tokens | — | — |
| T-02 | Prisma schema + migrations for all entities; `seed.ts` (+2 years, cents, `seeded` flag, theme hex→enum); `npm run db:reset`; Docker compose for local Postgres | ADR-0005, data-model | US-36 | T-01 |
| T-03 | `src/domain`: `Clock`, money helpers, `budgetSpent`, `latestSpending`, `recurringBills` (+status, summary), `sortTransactions`/`filter`/`paginate`, `sortBills`, `potPercent`, `overviewSummary` — with unit tests reproducing every seed figure in SPEC-overview §4.3 | ADR-0005, data-model | US-04…08 (logic), US-11/27/28 (logic) | T-01 |
| T-04 | `src/shared`: Zod schemas (auth, budgets, pots, transactions query, overview DTO), enums, `copy.ts`, `test-ids.ts`, `money.ts` formatting + tests | NFR-Q2, user-stories appendix | US-31 | T-01 |
| T-05 | Auth API: login/logout/signup/session routes, iron-session, rate limit (`LoginAttempt`), middleware redirects, security headers; API tests | SPEC-auth §6, ADR-0006 | US-01…03 | T-02, T-04 |
| T-06 | Auth UI: `(auth)` layout, `LoginForm`, `SignupForm`, `Field`, `PasswordField`, `Button`; demo box; E2E for US-01/02/03 + keyboard + axe | SPEC-auth §2–3 | US-01…03, US-31/32 | T-05 |
| T-07 | App shell: `(app)` layout, sidebar, bottom nav, minimise, page header, skip link, reset banner, `/api/meta`; placeholder pages for the four R2 routes ("Coming in Release 2"); E2E for US-33/35/37 AC2 + axe | SPEC-app-shell | US-33, US-35, US-37 | T-05 |
| T-08 | Overview API: `GET /api/overview` built on `overviewSummary`; DTO schema; API tests incl. 401 | SPEC-overview §6 | US-04…08 | T-03, T-04, T-05 |
| T-09 | Overview UI: stat cards, pots/transactions/budgets(donut)/bills cards, empty and error states; E2E for US-04…08 incl. deposit-via-API balance check and empty-seed variants; axe | SPEC-overview §2–4 | US-04…08 | T-07, T-08 |
| T-10 | WebMCP adapter: `adapter.ts`, `defineTool`, `WebMcpProvider`, `AgentToolsStatus`, lazy loading, test hook; unit tests for modes/readiness/annotations/error mapping | SPEC-webmcp-tools §2, §6, ADR-0004 | US-38, US-41 | T-07 |
| T-11 | R1 tools `get_balance`, `get_overview_summary`; E2E in polyfill and off modes; `X-Via` logging; headed native runbook page | SPEC-webmcp-tools §3, §7 | US-38, US-39, US-41 | T-09, T-10 |
| T-12 | Reset: `/api/admin/reset` (secret), threshold check on writes (stub until R2 writes exist), `ResetLog`, `vercel.json` cron, test-support routes gated by `APP_ENV=test` + the unit test asserting absence | ADR-0005, SPEC-app-shell §5 | US-37 | T-02, T-05 |
| T-13 | CI: GitHub Actions (lint, typecheck, unit, API, E2E ×3 engines with Postgres service, axe), traceability script (`US-\d\d` ↔ user-stories), coverage gate 90 % on domain | ADR-0003/0007 | NFR-T | T-06…T-12 |
| T-14 | Deploy: Vercel project, Neon main + preview branches workflow, env vars, first seed, cron verified, Lighthouse CI on warm instance, `runbooks/deploy.md` (incl. OT token, native check, relay demo) | ADR-0007 | NFR-D4/D5, P1 | T-13 |
| T-15 | Release 1 retrospective entry: what the specs missed, what agents got wrong, template/AGENTS.md changes; open Release 2 spec work | roadmap Phase 5 exit | S4 | T-14 |

Notes
- T-03 and T-04 can run in parallel with T-02; T-06 and T-07 after T-05.
- Every task's PR follows `definition-of-done.md`; the owner merges.
- Release 2 backlog is written after T-15, using the lessons recorded there.
