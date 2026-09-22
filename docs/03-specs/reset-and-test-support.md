# SPEC-reset-and-test-support — Admin reset, scheduled reset, test-support routes

Status: **Approved** (v1.1 — 2026-09-22: owner decisions at the T-02 plan gate; v1.0, owner approval 2026-09-20) · Author(s): Agent · Date: 2026-09-20 (added after review S-04/S-05/S-25)
Changelog: v1.1 (2026-09-22, owner, T-02 plan gate) — §2.1 29 February moves to 28 February in a year without one; §2.7 `empty-all` = no pots, budgets or transactions, balance unchanged, `variant` is required, and `GET /api/test/log` lands in T-12; §5 money columns are 64-bit and become `Number` at the DTO boundary; §7 the checksum test runs in the unit suite, and the variant shapes are asserted in the database until `/api/overview` exists (T-09).
Implements: US-36 (persistence via the real backend), US-37 AC1 (AC3 in R2) · Constrained by: ADR-0003 (T3 test data via API), ADR-0005, ADR-0007, NFR-D3/D5, NFR-S4

## 1. Purpose
One idempotent seed/reset routine used by deployment, the scheduled job, the threshold check and the test suite; test-only routes that let E2E seed deterministic variants without touching the UI.

## 2. Behaviour
2.1 `resetToSeed(db, reason)` (`src/server/reset.ts`): in one transaction truncates all tables, inserts seed rows from `prisma/data.json` (dates +2 years, amounts → cents, `seeded = true`, 29 February → 28 February when the target year has none, theme hex → enum, avatar path → basename key), writes `ResetLog { at: now, reason }`, clears `LoginAttempt`. Returns `{ at, rows }`.
2.2 `POST /api/admin/reset` — header `Authorization: Bearer <RESET_SECRET>`; body `{ reason: "scheduled" | "threshold" | "manual" }` (default `manual`); 204 on success; 401 without/with wrong secret; 500 with the shared error envelope. Log line: `reset reason=<reason> rows=<n> requestId=<id>`.
2.3 Vercel Cron (`vercel.json`): `0 3 */10 * *` → `POST /api/admin/reset` with `reason: "scheduled"` (Vercel sends the `CRON_SECRET`; the route accepts either secret).
2.4 Threshold check: after every successful write in R2 (`src/server/threshold.ts`, called by repositories; in R1 wired but never triggered): if `count(rows where seeded = false) > RESET_ROW_THRESHOLD (default 2000)` or `pg_database_size(current_database()) > RESET_BYTES_THRESHOLD (default 50 MB)` → `resetToSeed(db, "threshold")` and the write returns 409 `{ error: "conflict", message: "Data was reset" }`.
2.5 First deploy / `npm run db:reset` calls `resetToSeed(db, "manual")`, so `lastResetAt` always exists (banner is deterministic).
2.6 Sessions end on reset (owner decision S-16): the session payload carries `resetEpoch` (ms of the latest `ResetLog.at` at login); middleware rejects a session whose `resetEpoch < latest ResetLog.at` (cached per instance for 30 s) → redirect to `/login?reason=reset` and the login page shows "The demo data was reset — please log in again" (copy appendix).
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
| API | `/api/admin/reset` 204/401 and `ResetLog` row; `/api/test/seed` each variant produces the documented shape (in the database; via `/api/overview` from T-09); session rejected after reset (US-03 AC3) | US-36, US-37 AC1, US-03 AC3 |
| E2E | after `POST /api/test/reset`, Overview shows the seed figures (US-36 AC1 for R1 = data served by the backend, reload-stable) | US-36 |

## 8. Out of scope
US-37 AC3 UI handling of stale writes (R2, with the first write endpoints).

## 9. Open questions
None.
