# SPEC-reset-and-test-support — Admin reset, scheduled reset, test-support routes

Status: **Approved** (v1.6.1 — 2026-09-25: wording only — §2.6 and one §2.7 bullet say "proxy" (T-13a, Q5); v1.6 — 2026-09-25: T-13c, owner decision on TD-10 — the first seed is `POST /api/admin/reset`, and the test-support routes do not exist on a Vercel deployment or against another machine's database, and `npm run db:reset` refuses such a database before it applies any migration (the owner's choice "B", 2026-09-25, made after PR #39 was opened); v1.5 — 2026-09-24: §2.7's `GET /api/test/log` note resolved — the route and the via-marker landed in T-12, T-12 plan gate; v1.4 — 2026-09-23: the daily cron and the interval check, PR #20 review finding 2, owner decision; v1.3 — 2026-09-23: T-08 plan gate, Q1 (a) — Vercel's cron calls with a bodyless `GET`, so `/api/admin/reset` answers `GET` as the scheduled reset; v1.2 — 2026-09-23: T-05's whole-branch review — §2.6's resetEpoch check drops "cached per instance for 30 s"; v1.1 — 2026-09-22: owner decisions at the T-02 plan gate; v1.0, owner approval 2026-09-20) · Author(s): Agent · Date: 2026-09-20 (added after review S-04/S-05/S-25)
Changelog: v1.6.1 (2026-09-25, T-13a) — `middleware.ts` is `proxy.ts` (Next 16's name for the file convention); the older changelog entries below keep the name they were written with. v1.6 (2026-09-25, T-13c, owner decision on TD-10: the plan's Q2, "tövsiyə olan", option (a))
— §2.5 named `npm run db:reset` for the first deploy. TD-10's guard makes `db:reset` refuse a
`DATABASE_URL` whose host is not `localhost`, `127.0.0.1` or `[::1]`, so the first seed of a
deployed database is `POST /api/admin/reset` with `RESET_SECRET` and an empty body (§2.2, reason
`manual`), after `npx prisma migrate deploy`, which is not guarded when run directly (T-14 runs it
against the deployed database). The guard was first written into `db:reset`'s seed step only;
the owner's choice "B" of 2026-09-25, made after PR #39 was opened, also enforces it at
`db:reset`'s first step: `prisma.config.ts` refuses before `prisma migrate deploy` applies any
migration, keyed on the npm script's name. §2.7's opening line
says when the test-support routes exist: `APP_ENV=test` alone no longer makes them, because the
process must be neither on a Vercel deployment (`VERCEL` or `VERCEL_ENV` set) nor pointed at another
machine's database; `next.config.ts` refuses that combination at build and start, `isTestEnv` at
runtime. The guard is stricter than the two sentences: it fails closed, so a scheme other than
`postgres:`/`postgresql:`, whitespace or a malformed percent escape in the URL is refused as well
(`src/shared/env.ts`). Nothing else in this spec changed. v1.5 (2026-09-24, T-12 plan gate) — §2.7's note that `GET /api/test/log` "lands in T-12" is resolved: the route and the marker that writes its entries landed in T-12 (`middleware.ts` records `X-Via: webmcp` requests before the session check; a missing or empty `requestId` answers 404 like an unknown one, SPEC-webmcp-tools §2.8). v1.4 (2026-09-23, owner decision on PR #20's review, finding 2: "Bu pr-da düzəlt.
Tövsiyyə ilə davam et") — §2.3's `0 3 */10 * *` fired on days 1, 11, 21 and 31, not every 10
days. The cron now runs daily at `0 3 * * *`. `GET /api/admin/reset` resets only once
`RESET_INTERVAL_DAYS` have passed since the latest `ResetLog.at`, less one hour of slack for
Hobby's within-the-hour timing. Otherwise it answers 200 `{ reset: false, dueAt }`. `POST` still
always resets. ADR-0007 carries the matching dated amendment. The owner's second review of PR #20: `GET` accepts only `CRON_SECRET` (`POST` either), so a `scheduled` row is always the cron's; an unset secret matches nothing (401, not 500). v1.3 (2026-09-23, owner decision at the T-08 plan gate, Q1 (a): "tövsiyə olunanlarla
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
2.2 `POST /api/admin/reset` — header `Authorization: Bearer <RESET_SECRET>` (or `<CRON_SECRET>`, §2.3); body `{ reason: "scheduled" | "threshold" | "manual" }` (default `manual`; an empty body is `manual`); 204 on success; 400 `validation` for any other reason (including `"test"`), an unlisted field or a body that is not JSON; 401 without/with wrong secret; 500 with the shared error envelope. `GET /api/admin/reset` (v1.3, v1.4) — no body, and only `CRON_SECRET` is accepted: how Vercel's daily cron calls it (§2.3). An unset secret matches nothing. It resets with `reason: "scheduled"` (204) only when `RESET_INTERVAL_DAYS` have passed since the latest `ResetLog.at`, less one hour of slack; otherwise it answers 200 `{ reset: false, dueAt }`, where `dueAt` is the earliest check that will reset. A database with no `ResetLog` row is due. Log line: `reset reason=<reason> rows=<n> requestId=<id>`, where `<id>` is the response's `X-Request-Id`.
2.3 Vercel Cron (`vercel.json`): `0 3 * * *` — daily (v1.4; UTC; on the Hobby plan Vercel may run it any time within that hour) → `GET /api/admin/reset`, which resets once `RESET_INTERVAL_DAYS` (default 10) have passed since the last reset of any kind, so the banner's interval is the schedule's — Vercel sends a bodyless `GET` with `Authorization: Bearer <CRON_SECRET>` and does not follow redirects (v1.3); `GET` accepts only that secret and records `reason: "scheduled"`, and `POST` accepts either secret.
2.4 Threshold check: after every successful write in R2 (`src/server/threshold.ts`, called by repositories; in R1 wired but never triggered): if `count(rows where seeded = false) > RESET_ROW_THRESHOLD (default 2000)` or `pg_database_size(current_database()) > RESET_BYTES_THRESHOLD (default 50 MB)` → `resetToSeed(db, "threshold")` and the write returns 409 `{ error: "conflict", message: "Data was reset" }`.
2.5 First deploy: `POST /api/admin/reset` with `RESET_SECRET` and an empty body (§2.2) calls `resetToSeed(db, "manual")`, so `lastResetAt` always exists (banner is deterministic). `npm run db:reset` does the same for a local database only: it refuses a `DATABASE_URL` whose host is not `localhost`, `127.0.0.1` or `[::1]` (TD-10) before it applies any migration; `npx prisma migrate deploy` itself is not guarded (T-14 runs it against the deployed database).
2.6 Sessions end on reset (owner decision S-16): the session payload carries `resetEpoch` (ms of the latest `ResetLog.at` at login); the proxy rejects a session whose `resetEpoch < latest ResetLog.at` (a plain per-request read — see the v1.2 changelog note on the "cached per instance" wording it replaces) → redirect to `/login?reason=reset` and the login page shows "The demo data was reset — please log in again" (copy appendix).
2.7 Test support (only when `APP_ENV=test` and the process is neither on a Vercel deployment — `VERCEL` or `VERCEL_ENV` set — nor pointed at another machine's database; otherwise the routes do not exist — 404 — and a unit test asserts the router has no `test/*` entries in other envs. `next.config.ts` refuses that combination at build and start, TD-10):
  - `POST /api/test/reset` → `resetToSeed(db, "test")` → 200 `{ at }`.
  - `POST /api/test/seed { variant }` → reset, then apply a variant: `seed` (none), `empty-pots` (delete pots, balance unchanged), `empty-budgets`, `few-transactions` (keep the latest 3), `no-recurring` (set `recurring=false` on all), `empty-all` (no pots, budgets or transactions; balance unchanged). 200 `{ at, variant }`; 400 unknown or missing variant.
  - `GET /api/test/log?requestId=` → 200 `{ requestId, via, route }` or 404.
  - The route and the marker that writes its entries landed in T-12 (v1.5): `proxy.ts` records `X-Via: webmcp` requests, a missing or empty `requestId` answers 404 like an unknown one.
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
| API | `/api/admin/reset` 204/400/401 and the `ResetLog` row's reason — `POST` without a body `manual`, with one its `reason`, `GET` with `CRON_SECRET` `scheduled` once the interval has passed, 200 `{ reset: false, dueAt }` before it, 401 with `RESET_SECRET` (v1.4); a refused request writes no row; `/api/test/seed` each variant produces the documented shape (in the database; via `/api/overview` from T-09); session rejected after reset (US-03 AC3) | US-36, US-37 AC1, US-03 AC3 |
| E2E | after `POST /api/test/reset`, Overview shows the seed figures (US-36 AC1 for R1 = data served by the backend, reload-stable) | US-36 |

## 8. Out of scope
US-37 AC3 UI handling of stale writes (R2, with the first write endpoints).

## 9. Open questions
None.
