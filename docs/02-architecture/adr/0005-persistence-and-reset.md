# 0005 — Persistence, seed and reset: Neon Postgres, Prisma, integer cents, fixed clock, scheduled full reset

- Status: **Accepted** · Date: 2026-09-13 · Author(s): Agent, Owner (decisions OQ-2/OQ-4/R-01/R-29)
- Clarification 2026-09-23 (owner, T-08 — plan gate Q1 (a) and PR #20's review, finding 2): the
  scheduled reset is `GET /api/admin/reset` from a **daily** Vercel cron (`0 3 * * *`); Vercel
  sends a bodyless `GET` with `CRON_SECRET` as its Bearer token, and the route resets only once
  `RESET_INTERVAL_DAYS` have passed since the last reset; `GET` accepts only `CRON_SECRET`.
  `POST` with `{ reason }` stays the operator's reset, with either secret. The threshold check counts user-created rows only (transactions, budgets,
  pots) — not `ResetLog` or `LoginAttempt`. See ADR-0007's amendment of the same date and
  SPEC-reset-and-test-support v1.4.
- Clarification 2026-09-22 (owner, T-02 plan gate): money columns are integer cents stored as
  64-bit (Prisma `BigInt`) — a Prisma `Int` is 32-bit and stops at 2,147,483,647 cents, below
  the 99,999,999,999 that NFR-S3 allows (R-17). The seed routine is `resetToSeed` in
  `src/server/reset.ts`, which reads `prisma/data.json` (a checksum-tested copy of the
  challenge's `data.json`); `prisma/seed.ts` is its command-line entry (`npm run db:reset`).
- Clarification 2026-09-22 (owner, T-03 plan gate): parsing a date is allowed; reading the
  clock is not. The lint rule forbids the calls that read the wall clock — `new Date()`
  without arguments, `Date()` and `Date.now()` — and allows `new Date(<value>)`, which builds
  a fixed date: `fixedClock("2026-08-19")` in `src/domain/clock.ts` is written that way, and
  its `today()` answers 00:00 UTC of that day, a new `Date` on every call. T-02's seed keeps
  its dates as text; that was a side effect of the earlier, wider rule, not a requirement —
  `shiftYears` is unchanged, so the behaviour stays, but the rule no longer enforces it.
- Driven by: NFR-D1–D6, NFR-S3/S4, US-36, US-37, PRD OQ-4

## Context
One shared dataset seeded from `data.json`, fully reset every 10 days and when it grows beyond a threshold; fixed business time in August 2026; money must be exact.

## Decision
- **Database:** Neon Postgres (free tier) with the pooled connection string for serverless; a second Neon branch for CI/E2E, or local Postgres via Docker for development.
- **ORM:** Prisma with migrations committed. Money columns are `Int` (cents). Every entity has a UUID `id` (server-generated); budgets additionally have a unique `category`, pots a unique `name` (case-insensitive index).
- **Seed:** `prisma/seed.ts` reads `docs/00-discovery/inputs/data.json` (copied to `prisma/data.json` at scaffold time), shifts every date +2 years, converts amounts to cents, marks rows `seeded = true`. Idempotent: it truncates and reinserts inside one transaction.
- **Reset:** `POST /api/admin/reset` protected by a bearer secret; body `{ reason }`. Called by Vercel Cron (~~`0 3 */10 * *`~~ a daily `GET`, clarification 2026-09-23) and by the threshold check that runs on every write: if `count(rows where seeded = false) > 2000` or database size > 50 MB (`pg_database_size`), reset immediately. Writes a `ResetLog` row (`at`, `reason`) — the latest is exposed at `GET /api/meta` for the banner (US-37).
- **Clock:** `src/domain/clock.ts` exports `Clock = { today(): Date }`; production and tests inject `fixedClock("2026-08-19")`. Nothing in `domain` or `server` calls `new Date()` for business logic (lint rule).
- **Consistency:** pot money movements and deletions update `balance.current` in the same transaction; a lightweight optimistic check (`updatedAt`) returns 409 on stale writes, which the UI turns into "Data was reset — reloading" when the record is gone.

## Alternatives considered
**A. This — chosen.**
**B. SQLite (prior attempt).** Fine locally; on Vercel there is no persistent filesystem, and a separate host with a disk brings back the two-deploy problem. Turso/libSQL would work but adds a vendor for no benefit over Neon.
**C. Drizzle instead of Prisma.** Lighter for serverless; Prisma's migration workflow and typed client are better known to reviewers and agents; revisit if cold starts breach P1.
**D. Store balance as derived (sum of transactions) instead of a stored field.** Rejected by requirements (US-04 AC3): seed `expenses` ≠ sum of negatives; the challenge treats them as given.

## Consequences
Easier: deterministic tests (fixed clock, seeded DB), exact money, one reset routine used everywhere. Harder: schema changes need migrations even for a demo; the threshold check adds a cheap query per write. To watch: Neon free-tier compute hours; keep the cron sparse and connections pooled.

## Review
Owner decision: **Accepted**, 2026-09-13. Owner chose alternative A as proposed.
