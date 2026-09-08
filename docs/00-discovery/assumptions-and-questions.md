# Assumptions and open questions

Status: Draft · Updated: 2026-09-08

## Assumptions

| # | Assumption | Risk if wrong | Owner | Check by |
|---|------------|---------------|-------|----------|
| A1 | WebMCP remains experimental (Chrome behind a flag, polyfills elsewhere) for the life of the project | Design for progressive enhancement is wasted or insufficient | Agent (research note) | Phase 1 |
| A2 | Free-tier hosting (app + small database) is enough for a public demo that resets every 10 days | Need paid hosting or a different persistence model | Owner | Phase 3 |
| A3 | The challenge's fixed business time (August 2024, "today" = 19 Aug) is kept rather than using the real clock | Bills/budgets logic and tests become non-deterministic | Owner | Phase 2 |
| A4 | Real bank/payment integrations are out of scope | Scope creep | Owner | Phase 1 (confirm) |
| A5 | Native mobile apps are out of scope; responsive web only | Scope creep | Owner | Phase 1 (confirm) |
| A6 | The Claude Design prototype's behaviour is a valid reference where it agrees with the brief; the brief wins where they differ | Requirements inherit prototype gaps (validation, keyboard) | Agent | Phase 2 |

## Open questions

| # | Question | Needed by | Status |
|---|----------|-----------|--------|
| Q1 | Auth vs single-user: demo login with shared data, per-visitor sandbox, or no auth? | Requirements | Open |
| Q2 | Reset semantics: full reset to seed, or only user-created records? | Requirements | Open |
| Q3 | Browser matrix for WebMCP: native / polyfill / none, and how it is surfaced to the user | Requirements (research note first) | Open |
| Q4 | Stack (Next.js vs Angular vs other) | Architecture | Deferred by decision |
| Q5 | Which WebMCP capabilities are exposed, and what safeguards apply to mutating tools | Requirements (NFR) → Architecture (ADR) | Open |
