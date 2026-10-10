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
  (SPEC-webmcp-tools §2.8). A green run also proves the buffer is shared between the proxy
  and the route bundles through `globalThis`.
- `schema-drift.spec.ts` (T-13) — `prisma/schema.prisma` and the migrations agree
  (`scripts/schema-drift.sh`, `npm run db:drift`); needs a migrated database (`npm run db:reset`
  first), and a schema with an extra model, and one with the `LoginAttempt` model removed, must
  each be reported as drift (exit 2, naming the model).
- `write-refusals.spec.ts` (T-17) — the proxy's 403 and 415 on the eight planned write paths,
  401 first, the `Sec-Fetch-Site` and content-type cases, DELETE, the exempt routes, logout's
  403 envelope, and a lower-case method answered 400 by Node (SPEC-write-path 7.3)
- `transactions.spec.ts` (T-18) — `GET /api/transactions`: 401, every seed variant and the views of
  `transactions.md` 4.3–4.6 against an independent oracle (`applyVariant` + the domain), the clamp,
  the strict 400s with the allowed values, `no-store`, nothing written (2.13; the 500 is a unit test,
  v1.0.17)
- `recurring-bills.spec.ts` (T-20) — `GET /api/recurring-bills`: 401, every seed variant and the views of
  `recurring-bills.md` 4.3–4.5 with each `status` against an independent oracle (`applyVariant` + the
  domain on the business day), the summary over every bill, the strict 400s with the allowed values (one
  and several at once), `no-store`, nothing written (2.11; the 500 is a unit test, v0.7.1)
- `budgets.spec.ts` (T-23) — `GET`, `POST /api/budgets`, `PATCH` and `DELETE /api/budgets/:id`: 401, every
  seed variant against an independent oracle (`applyVariant` + `budgetsSummary`), the writes' answers, `taken`,
  `required`, 404 and the non-UUID 400, nothing but `Budget` written; `write-path.md` 7.2 on a real route (an
  id from before a reset, two concurrent creates, the threshold's 409, a throwing check run in-process)
- `pots.spec.ts` (T-25) — `GET`, `POST /api/pots`, `PATCH` and `DELETE /api/pots/:id`, `POST
/api/pots/:id/deposit` and `/withdraw`: 401, every seed variant against an independent oracle (`applyVariant` +
  `potPercent`), the writes' answers, `taken`, `required`, `exceeds_balance`, `exceeds_total`, 404 and the
  non-UUID 400; `write-path.md` 7.2 on the pot routes (conservation after 4.2's chain, a deposit and a delete of
  one pot at once, two concurrent deposits over the balance, an id from before a reset, the `citext` unique
  constraint as `taken`) and US-04 AC2 through `GET /api/overview`
- `write-limit.spec.ts` (T-17) — the write limiter against real `WriteAttempt` rows: per IP,
  pruned, emptied by a reset, `retryAfter` (2.10)
- `write-wrapper.spec.ts` (T-17) — `guardedWrite` called directly (no write route exists
  before T-23): the order of 2.2 steps 5–10, `taken` from a unique violation, the threshold's
  409, a throwing check, `X-Request-Id` and `no-store` on every answer
