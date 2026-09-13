# Architecture Decision Records

| # | Title | Status | Driven by |
|---|-------|--------|-----------|
| [0001](./0001-stack.md) | Stack: Next.js full-stack on Vercel, Postgres (Neon), Prisma, Zod, Vitest, Playwright | Accepted 2026-09-13 | NFR-W1/W2, D3–D6, P1/P3, Q2, T3–T5 |
| [0002](./0002-repository-layout.md) | Repository layout: single Next.js app with enforced internal boundaries | Accepted 2026-09-13 | Monorepo decision, Q2, AGENTS.md |
| [0003](./0003-testing-strategy.md) | Testing strategy: pyramid, tooling and rules (no visual snapshots) | Accepted 2026-09-13 | NFR-T1–T10, A1–A5, M1/M2/M5 |
| [0004](./0004-webmcp-adapter.md) | WebMCP adapter: one module, page-scoped registries, polyfill baseline, client-side confirmation | Accepted 2026-09-13 | NFR-W1–W9, US-38–41, R-16, R-23 |
| [0005](./0005-persistence-and-reset.md) | Persistence, seed and reset: Neon Postgres, Prisma, integer cents, fixed clock, scheduled full reset | Accepted 2026-09-13 | NFR-D1–D6, S3/S4, US-36/37 |
| [0006](./0006-auth-and-session.md) | Authentication and session: single demo account, signed httpOnly cookie, 7-day sliding | Accepted 2026-09-13 | US-01–03, NFR-S1/S2/S6, OQ-1 |
| [0007](./0007-hosting-and-delivery.md) | Hosting and delivery: Vercel + Neon, GitHub Actions CI, previews, origin trial on production | Accepted 2026-09-13 | NFR-D4–D6, P1, T4/T5, W8 |

Template: `docs/templates/adr.md`. An ADR is immutable once Accepted; a
changed decision gets a new ADR that supersedes the old one.
