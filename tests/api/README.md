# tests/api

Playwright `request`-context tests against route handlers and a seeded test database
(ADR-0003). One file per resource; asserts status, body schema (Zod), side effects.

Run: `npm run test:api` — builds the app, starts it with `APP_ENV=test` and runs the tests on
one worker, because they share the database of `DATABASE_URL` (Postgres from `compose.yaml`
locally). Each test resets it; it holds demo data only.

- `reset.spec.ts` — `resetToSeed` (SPEC-reset-and-test-support §2.1, §4)
- `schema.spec.ts` — the constraints the database enforces (data model, NFR-S3)
- `test-support.spec.ts` — `/api/test/reset` and `/api/test/seed` (§2.7)
