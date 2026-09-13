# System overview

Status: **Approved** (v1.0, owner approval 2026-09-13) · Author(s): Agent · Date: 2026-09-13 · Consistent with ADR-0001…0007

```
Browser (any modern)                              Vercel (production / preview)
┌───────────────────────────────────────┐         ┌────────────────────────────────────┐
│ Next.js client                        │  HTTPS  │ Next.js server                     │
│  pages (client components per route)  │────────▶│  route handlers /api/*             │
│  forms ── Zod (shared) ── api-client  │         │   parse (Zod) → domain → server     │
│  src/webmcp adapter                   │         │  middleware: session, headers      │
│   native | polyfill | off             │         │  src/server: Prisma, session, seed  │
│   page registry → tools → api-client  │         └──────────────┬─────────────────────┘
│  document.modelContext ◀── agent /    │                        │ pooled
│   Tool Inspector / relay              │                        ▼
└───────────────────────────────────────┘         ┌────────────────────────────────────┐
                                                   │ Neon Postgres (main / CI branch)   │
   GitHub Actions ── build, tests, axe,            │ Balance · Transaction · Budget ·   │
   traceability, snapshots, Lighthouse             │ Pot · ResetLog · LoginAttempt      │
   Vercel Cron ── POST /api/admin/reset            └────────────────────────────────────┘
```

Boundaries: `domain` is pure and clock-injected; `server` is the only module touching Prisma; `app/api` is thin; `webmcp` talks to the API exactly like the UI; nothing in the client trusts the browser (all validation repeated server-side).

Request flow for a tool call: agent → `executeTool("add_money_to_pot", {id, amount})` → adapter validates with the shared schema → `POST /api/pots/:id/deposit` with `X-Via: webmcp` → handler validates again, transaction updates pot + balance → response DTO → tool returns structured content and the page re-fetches → UI shows the change. Delete tools insert the confirmation dialog between validation and the request (ADR-0004).

Environments: `development` (local Postgres via Docker or a Neon branch, `WEBMCP_MODE=polyfill`), `test` (CI service container, test-support routes enabled), `preview` (Neon branch per PR), `production` (main branch, OT token, cron).
