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
