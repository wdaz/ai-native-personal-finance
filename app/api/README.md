# app/api

Route handlers. Thin: parse → call `src/server`/`src/domain` → respond (ADR-0002).

- **Never imports Prisma directly** — only through `src/server`.

Filled by T-02 (`test/[...path]` — test support, only when `APP_ENV=test`), T-05 (auth), T-08
(meta, admin reset), T-09 (overview).
