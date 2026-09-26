# Assumptions and open questions

Status: Draft · Updated: 2026-09-26 (Q3 and Q4 status cells only — closed by the NFRs and ADR-0001; the assumptions and the other questions are as of 2026-09-08) · 2026-09-08 (A4, A5, Q1, Q2 settled)

## Assumptions

| # | Assumption | Risk if wrong | Owner | Check by |
|---|------------|---------------|-------|----------|
| A1 | WebMCP remains experimental (Chrome/Edge origin trial, polyfills elsewhere) for the life of the project | Design for progressive enhancement is wasted or insufficient | Agent | **Confirmed 2026-09-08** — see `research/webmcp-status.md` |
| A2 | Free-tier hosting (app + small database) is enough for a public demo that resets every 10 days | Need paid hosting or a different persistence model | Owner | Phase 3 |
| A3 | The challenge's fixed business time is kept rather than the real clock | Bills/budgets logic and tests become non-deterministic | Owner | **Decided 2026-09-13:** fixed, shifted to 2026 (today = 2026-08-19) |
| A4 | Real bank/payment integrations are out of scope | Scope creep | Owner | **Confirmed 2026-09-08** |
| A5 | Native mobile apps are out of scope; responsive web only | Scope creep | Owner | **Confirmed 2026-09-08** |
| A6 | The Claude Design prototype's behaviour is a valid reference where it agrees with the brief; the brief wins where they differ | Requirements inherit prototype gaps (validation, keyboard) | Agent | Phase 2 |

## Open questions

| # | Question | Needed by | Status |
|---|----------|-----------|--------|
| Q1 | Auth vs single-user: demo login with shared data, per-visitor sandbox, or no auth? | Requirements | **Decided 2026-09-08: demo login, shared dataset** |
| Q2 | Reset semantics: full reset to seed, or only user-created records? | Requirements | **Decided 2026-09-08: full reset to seed data** |
| Q3 | Browser matrix for WebMCP: native / polyfill / none, and how it is surfaced to the user | Requirements | **Answered** in `research/webmcp-status.md` §Implications 1; **written as NFR-W2 and NFR-B2** (`docs/01-requirements/non-functional-requirements.md`, approved 2026-09-13) |
| Q4 | Stack (Next.js vs Angular vs other) | Architecture | **Decided** in `docs/02-architecture/adr/0001-stack.md` (Accepted, 2026-09-13): Next.js full-stack |
| Q5 | Which WebMCP capabilities are exposed, and what safeguards apply to mutating tools | Requirements (NFR) → Architecture (ADR) | **Decided 2026-09-13:** read + add/edit/money tools; delete tools with on-screen confirmation (PRD OQ-5, NFR-W5) |
