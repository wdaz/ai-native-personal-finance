# app/api

Route handlers. Thin: parse → call `src/server`/`src/domain` → respond (ADR-0002).

- **Never imports Prisma directly** — only through `src/server`.

Filled by T-02 (`test/[...path]` — test support, only when `APP_ENV=test`), T-05 (auth), T-08
(meta, admin reset), T-09 (overview).

T-08: `meta/route.ts` — `GET /api/meta` (public, `no-store`, `getMeta`); `admin/reset/route.ts`
— `POST` (an operator's reset, `reason` in the body) and `GET` (Vercel's cron, the scheduled
reset), both Bearer `RESET_SECRET` or `CRON_SECRET`, handled in `src/server/admin-reset.ts`.

T-09: `overview/route.ts` — `GET /api/overview` (session-protected by `proxy.ts`,
`no-store`, `getOverview`).
