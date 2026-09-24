# src/server

Prisma client, repositories, session, rate limit, seed/reset (ADR-0002).

- **Imports allowed:** `src/domain`, `src/shared`.
- **Imports forbidden:** `app/`, `src/webmcp`, `src/ui`.
- **No `new Date()`** in business code (ADR-0005).
- The only layer allowed to import Prisma: `@prisma/*` and the generated client in
  `generated/prisma/` (git-ignored; `npm install` regenerates it from `prisma/schema.prisma`).

T-02: `env.ts`, `db.ts` (the Prisma client), `seed.ts` and `variants.ts` (pure),
`reset.ts` (`resetToSeed`), `http.ts`, `test-support.ts`. T-05 adds the session and the rate
limit, T-08 the threshold.

T-08: `meta.ts` (`getMeta`, SPEC-app-shell §5); `reset.ts` gains `latestReset` (throws on an
empty `ResetLog`); `threshold.ts` (`evaluateThreshold`, `checkThreshold` — wired, not called
until Release 2's writes); `admin-reset.ts` (the admin reset: constant-time secret check,
body parsing, the log line); `env.ts` gains the reset interval, thresholds, the two reset
secrets and the configured WebMCP mode.

T-09: `overview.ts` — `CATEGORY_LABEL`/`THEME_LABEL` (Prisma's client spelling, `DiningOut`,
to data-model.md's own, `Dining Out`; built from `src/shared/enums.ts` and checked against
the generated Prisma enum, not hand-typed), the pure `toOverviewDto` and `getOverview(db,
clock)` it composes from `src/domain/overview`'s `overviewSummary` (SPEC-overview §6).

T-12: `request-log.ts` — `recordViaRequest` (called by `middleware.ts` for every `/api` request,
before the session check, so a 401 is on record; only the exact value `webmcp` is kept) and
`findViaRequest` (read by `GET /api/test/log` in `test-support.ts`). In `APP_ENV=test` the entries
live in a `Map` of 200 held on `globalThis`, because `middleware.ts` and the route handlers are
separate bundles and a module-level buffer would not be shared between them (the same reason
`db.ts` holds the Prisma client there); outside test one JSON line goes to stdout and nothing is
kept.
