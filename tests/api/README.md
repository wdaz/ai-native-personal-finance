# tests/api

Playwright `request`-context tests against route handlers and a seeded test database
(ADR-0003). One file per resource; asserts status, body schema (Zod), side effects.

Run: `npm run test:api` — builds the app, starts it with `APP_ENV=test` and runs the tests on
one worker, because they share the database of `DATABASE_URL` (Postgres from `compose.yaml`
locally). Each test resets it; it holds demo data only.

- `reset.spec.ts` — `resetToSeed` (SPEC-reset-and-test-support §2.1, §4)
- `schema.spec.ts` — the constraints the database enforces (data model, NFR-S3)
- `test-support.spec.ts` — `/api/test/reset` and `/api/test/seed` (§2.7)
- `threshold.spec.ts` — `checkThreshold` against real rows (§2.4; failed logins never count)
- `meta.spec.ts` — `GET /api/meta` (SPEC-app-shell §3, §5)
- `admin-reset.spec.ts` — `/api/admin/reset` GET/POST, each `ResetLog` reason, 400/401 (§2.2–2.3)
- `overview.spec.ts` — `GET /api/overview` against all six seed variants, 401, `no-store`,
  the "never seeded" 500 (SPEC-overview §6)
- `via-log.spec.ts` (T-12) — an `X-Via: webmcp` request is on record at `GET /api/test/log`
  under its `X-Request-Id`, also when it answers 401; 404 for an unknown, empty or missing id
  (SPEC-webmcp-tools §2.8). A green run also proves the buffer is shared between the middleware
  and the route bundles through `globalThis`.
