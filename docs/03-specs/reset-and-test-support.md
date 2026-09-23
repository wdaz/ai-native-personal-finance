# SPEC-reset-and-test-support — Admin reset, scheduled reset, test-support routes

Status: **Approved** (v1.3 — 2026-09-23: T-08 plan gate, Q1 (a) — Vercel's cron calls with a bodyless `GET`, so `/api/admin/reset` answers `GET` as the scheduled reset; v1.2 — 2026-09-23: T-05's whole-branch review — §2.6's resetEpoch check drops "cached per instance for 30 s"; v1.1 — 2026-09-22: owner decisions at the T-02 plan gate; v1.0, owner approval 2026-09-20) · Author(s): Agent · Date: 2026-09-20 (added after review S-04/S-05/S-25)
Changelog: v1.3 (2026-09-23, owner decision at the T-08 plan gate, Q1 (a): "tövsiyə olunanlarla
başla") — §2.3 said Vercel's cron calls `POST /api/admin/reset` with `reason: "scheduled"` in a
body. Vercel's documentation (vercel.com/docs/cron-jobs, "How cron jobs work", read 2026-09-23;
page last updated 2026-09-16) says it makes an HTTP **GET** request to the configured path,
with no body, sending `CRON_SECRET` as the `Authorization` header and not following
redirects. §2.2 gains `GET` (the scheduled reset, always `reason: "scheduled"`), §2.3 is
corrected, §2.2 states the 400 for a refused body, and §7 names the new API rows. `POST` is
unchanged. v1.2 (2026-09-23, T-05's whole-branch review, finding I1) — §2.6 no longer asks for
the resetEpoch check's `latest ResetLog.at` read to be "cached per instance for 30 s": Next.js
builds `middleware.ts` and an `app/api/**/route.ts` handler into separate bundles, each with
its own instantiation of any module-level state, so a plain in-memory cache in one is never
invalidated by a write that runs through the other — `resetToSeed`'s own cache-clear call
(tried, then removed) only ever cleared the route handlers' copy, never the middleware's,
which is the one this check actually runs in. Reproduced directly: log in, force a second
reset, then request a protected page — the stale-cached middleware kept answering
authenticated for the rest of the (wrongly) cached window. A correctness guarantee this spec
itself calls out — "sessions end on reset" — cannot depend on a cache that silently fails to
invalidate; at R1's traffic (a portfolio demo, not a production service) one extra indexed
`ResetLog` read per authenticated request costs nothing worth trading that guarantee for. A
real cross-process cache (Redis, or a version counter read from the database itself) would
solve this properly and is a fair follow-up if traffic ever justifies it. v1.1 (2026-09-22, owner, T-02 plan gate) — §2.1 29 February moves to 28 February in a year without one; §2.7 `empty-all` = no pots, budgets or transactions, balance unchanged, `variant` is required, and `GET /api/test/log` lands in T-12; §5 money columns are 64-bit and become `Number` at the DTO boundary; §7 the checksum test runs in the unit suite, and the variant shapes are asserted in the database until `/api/overview` exists (T-09).
Implements: US-36 (persistence via the real backend), US-37 AC1 (AC3 in R2) · Constrained by: ADR-0003 (T3 test data via API), ADR-0005, ADR-0007, NFR-D3/D5, NFR-S4

## 1. Purpose
One idempotent seed/reset routine used by deployment, the scheduled job, the threshold check and the test suite; test-only routes that let E2E seed deterministic variants without touching the UI.

## 2. Behaviour
2.1 `resetToSeed(db, reason)` (`src/server/reset.ts`): in one transaction truncates all tables, inserts seed rows from `prisma/data.json` (dates +2 years, amounts → cents, `seeded = true`, 29 February → 28 February when the target year has none, theme hex → enum, avatar path → basename key), writes `ResetLog { at: now, reason }`, clears `LoginAttempt`. Returns `{ at, rows }`.
2.2 `POST /api/admin/reset` — header `Authorization: Bearer <RESET_SECRET>` (or `<CRON_SECRET>`, §2.3); body `{ reason: "scheduled" | "threshold" | "manual" }` (default `manual`; an empty body is `manual`); 204 on success; 400 `validation` for any other reason (including `"test"`), an unlisted field or a body that is not JSON; 401 without/with wrong secret; 500 with the shared error envelope. `GET /api/admin/reset` (v1.3) — the same secret check, no body, always `reason: "scheduled"`: how Vercel's cron calls it (§2.3). Log line: `reset reason=<reason> rows=<n> requestId=<id>`, where `<id>` is the response's `X-Request-Id`.
2.3 Vercel Cron (`vercel.json`): `0 3 */10 * *` (UTC; on the Hobby plan Vercel may run it any time within that hour) → `GET /api/admin/reset` — Vercel sends a bodyless `GET` with `Authorization: Bearer <CRON_SECRET>` and does not follow redirects (v1.3); the route accepts either secret and records `reason: "scheduled"`.
2.4 Threshold check: after every successful write in R2 (`src/server/threshold.ts`, called by repositories; in R1 wired but never triggered): if `count(rows where seeded = false) > RESET_ROW_THRESHOLD (default 2000)` or `pg_database_size(current_database()) > RESET_BYTES_THRESHOLD (default 50 MB)` → `resetToSeed(db, "threshold")` and the write returns 409 `{ error: "conflict", message: "Data was reset" }`.
2.5 First deploy / `npm run db:reset` calls `resetToSeed(db, "manual")`, so `lastResetAt` always exists (banner is deterministic).
2.6 Sessions end on reset (owner decision S-16): the session payload carries `resetEpoch` (ms of the latest `ResetLog.at` at login); middleware rejects a session whose `resetEpoch < latest ResetLog.at` (a plain per-request read — see the v1.2 changelog note on the "cached per instance" wording it replaces) → redirect to `/login?reason=reset` and the login page shows "The demo data was reset — please log in again" (copy appendix).
2.7 Test support (only when `APP_ENV=test`; otherwise the routes do not exist — 404 — and a unit test asserts the router has no `test/*` entries in other envs):
  - `POST /api/test/reset` → `resetToSeed(db, "test")` → 200 `{ at }`.
  - `POST /api/test/seed { variant }` → reset, then apply a variant: `seed` (none), `empty-pots` (delete pots, balance unchanged), `empty-budgets`, `few-transactions` (keep the latest 3), `no-recurring` (set `recurring=false` on all), `empty-all` (no pots, budgets or transactions; balance unchanged). 200 `{ at, variant }`; 400 unknown or missing variant.
  - `GET /api/test/log?requestId=` → 200 `{ requestId, via, route }` or 404.
  - Note: `GET /api/test/log` lands in T-12, with the via-marker logging that writes its entries (backlog v1.6).
  - Test routes require no session and are excluded from rate limiting.

## 3. States
Not user-facing except 2.6 (login page message) and the banner (SPEC-app-shell).

## 4. Rules and boundaries
Thresholds from env with the defaults above; the cron secret and reset secret are distinct env vars; reset never runs concurrently (Postgres advisory lock `pg_advisory_xact_lock(42)`).

## 5. Data
`ResetLog`, `LoginAttempt` (data-model). Seed source file: `prisma/data.json` (copy of `docs/00-discovery/inputs/data.json`, copied in T-02 with a checksum test that they match). Money columns are 64-bit (`BigInt`) and are converted to `Number` at the DTO boundary; NFR-S3's limit, 99,999,999,999 cents, is far below `Number.MAX_SAFE_INTEGER` (9,007,199,254,740,991).

## 6. Interfaces
Server: `resetToSeed`, `applyVariant`, `latestReset(db)`, `checkThreshold(db)`. Routes as above; envelope per SPEC-auth §2.10.

## 7. Tests required
| Level | What is asserted | Traces to |
|-------|------------------|-----------|
| Unit | date shift (+2 y incl. leap-day safety), cents conversion, theme mapping, avatar key; variant functions; `test/*` absent outside test env; `resetEpoch` comparison; checksum of `prisma/data.json` vs `docs/…/data.json` | 2.1, 2.6, 2.7 |
| API | `/api/admin/reset` 204/400/401 and the `ResetLog` row's reason — `POST` without a body `manual`, with one its `reason`, `GET` with either secret `scheduled` (v1.3); a refused request writes no row; `/api/test/seed` each variant produces the documented shape (in the database; via `/api/overview` from T-09); session rejected after reset (US-03 AC3) | US-36, US-37 AC1, US-03 AC3 |
| E2E | after `POST /api/test/reset`, Overview shows the seed figures (US-36 AC1 for R1 = data served by the backend, reload-stable) | US-36 |

## 8. Out of scope
US-37 AC3 UI handling of stale writes (R2, with the first write endpoints).

## 9. Open questions
None.
