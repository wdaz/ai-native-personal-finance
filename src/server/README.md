# src/server

Prisma client, repositories, session, rate limit, seed/reset (ADR-0002).

- **Imports allowed:** `src/domain`, `src/shared`.
- **Imports forbidden:** `app/`, `src/webmcp`, `src/ui`.
- **No `new Date()`** in business code (ADR-0005).
- The only layer allowed to import `@prisma/client`.

Filled by T-02 (`resetToSeed`, threshold) and T-05 (session, rate limit).
