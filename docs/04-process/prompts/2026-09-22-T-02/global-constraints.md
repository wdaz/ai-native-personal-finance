## Global Constraints

Copied verbatim from the approved documents. Every task below inherits them.

- **Backlog T-02:** "Prisma schema + migrations; `prisma/data.json` copy with checksum test;
  `resetToSeed` (+2 y, cents, enums, avatar keys, `ResetLog`, advisory lock); `npm run
  db:reset`; Docker compose for local Postgres; **test-support routes** `/api/test/reset|seed|log`
  gated by `APP_ENV=test` with the absence unit test; **repoint the ADR-0002 boundary
  fixtures** that currently import `src/server/README.md` at the real modules this task adds
  (`tests/fixtures/boundaries/README.md`)". Spec / ADR: "SPEC-reset-and-test-support §2.1, 2.5,
  2.7; ADR-0005". Stories: US-36. Depends on: T-01, T-02a.
- **SPEC-reset-and-test-support §2.1:** "`resetToSeed(db, reason)` (`src/server/reset.ts`): in
  one transaction truncates all tables, inserts seed rows from `prisma/data.json` (dates +2
  years, amounts → cents, `seeded = true`, theme hex → enum, avatar path → basename key),
  writes `ResetLog { at: now, reason }`, clears `LoginAttempt`. Returns `{ at, rows }`."
- **§2.5:** "First deploy / `npm run db:reset` calls `resetToSeed(db, "manual")`, so
  `lastResetAt` always exists (banner is deterministic)."
- **§2.7:** "Test support (only when `APP_ENV=test`; otherwise the routes do not exist — 404 —
  and a unit test asserts the router has no `test/*` entries in other envs): `POST
  /api/test/reset` → `resetToSeed(db, "test")` → 200 `{ at }`. `POST /api/test/seed { variant }`
  → reset, then apply a variant: `seed` (none), `empty-pots` (delete pots, balance unchanged),
  `empty-budgets`, `few-transactions` (keep the latest 3), `no-recurring` (set
  `recurring=false` on all), `empty-all`. 200 `{ at, variant }`; 400 unknown variant. `GET
  /api/test/log?requestId=` → 200 `{ requestId, via, route }` or 404. Test routes require no
  session and are excluded from rate limiting."
- **§4:** "the cron secret and reset secret are distinct env vars; reset never runs
  concurrently (Postgres advisory lock `pg_advisory_xact_lock(42)`)."
- **§5:** "Seed source file: `prisma/data.json` (copy of `docs/00-discovery/inputs/data.json`,
  copied in T-02 with a checksum test that they match)."
- **§7, the rows T-02 owns:** Unit — "date shift (+2 y incl. leap-day safety), cents
  conversion, theme mapping, avatar key; variant functions; `test/*` absent outside test env";
  API — "`/api/test/seed` each variant produces the documented shape (via `/api/overview`); …
  checksum of `prisma/data.json` vs `docs/…/data.json`".
- **ADR-0005:** "Prisma with migrations committed. Money columns are `Int` (cents). Every entity
  has a UUID `id` (server-generated); budgets additionally have a unique `category`, pots a
  unique `name` (case-insensitive index)." — "`prisma/seed.ts` reads
  `docs/00-discovery/inputs/data.json` (copied to `prisma/data.json` at scaffold time), shifts
  every date +2 years, converts amounts to cents, marks rows `seeded = true`. Idempotent: it
  truncates and reinserts inside one transaction." — "Nothing in `domain` or `server` calls
  `new Date()` for business logic (lint rule)."
- **data-model.md (v1.0):** "Money is integer cents. Dates are UTC timestamps … Every entity has
  a UUID `id`, `createdAt`, `updatedAt`, `seeded` (boolean)." `Balance` (singleton) `current`,
  `income`, `expenses`; `Transaction` `name`, `avatar` (asset key), `category` (enum, 10),
  `date`, `amount` (cents, signed), `recurring`; `Budget` `category` (enum, **unique**),
  `maximum`, `theme` (enum, 15, **unique among budgets**); `Pot` `name` (≤ 30, **unique,
  case-insensitive**), `target`, `total`, `theme` (enum, **unique among pots**); `ResetLog`
  `at`, `reason` (`scheduled` | `threshold` | `manual` | `test`); `LoginAttempt` `ip`, `at`,
  `success` ("cleared on reset"). "Enums: `Category` = Entertainment, Bills, Groceries, Dining
  Out, Transportation, Personal Care, Education, Lifestyle, Shopping, General. `Theme` = Green,
  Yellow, Cyan, Navy, Red, Purple, Turquoise, Brown, Magenta, Blue, Navy Grey, Army Green, Gold,
  Orange, Pink."
- **ADR-0002:** "`app` never imports Prisma directly (only `server`)"; `scripts/` "imports
  shared/domain only".
- **ADR-0003:** API layer — "route handlers against a seeded test DB … asserts status, body
  schema (Zod), side effects via DB"; "Test data: a `test-support` route (`/api/test/reset`,
  `/api/test/seed`) exists only when `APP_ENV=test`; a unit test asserts it is absent
  otherwise. … E2E targets `next build && next start` … — never `next dev`."
- **NFR-S3:** "amounts are integers in cents, 1 ≤ x ≤ 99,999,999,999 cents" (owner decision
  R-17, "999,999,999.99").
- **NFR-T2:** "Every user story has at least one automated test that … names the story id in
  the test title — E2E for UI stories, API/unit tests for non-UI stories (US-36, US-37)".
- **NFR-D3:** "Seed = `data.json` with all dates shifted +2 years (2024 → 2026) at seed time; a
  single idempotent seed/reset routine used by deployment, tests and the scheduled reset".
- **DoD v1.1:** "Any new lint rule, config guard or document-mirror test ships with a fixture
  that deliberately violates it and a test asserting the violation is reported"; "`npm run
  test:all` green locally and in the CI jobs that exist at that point of the backlog";
  "nothing outside the task is changed (drive-by fixes go to a new task)".
- **build-workflow.md:** "Any seed-derived figure in code or tests comes from
  `scripts/seed-figures.ts`, never typed." That script is T-03's; the tests below derive every
  seed figure from `prisma/data.json` itself and type none.
- **Governance v1.1:** "Review and verification subagents run without write tools … and never
  in the shared checkout's `.git`."
- **AGENTS.md §2:** English; conventional commit messages; small, reviewable changes.
- **Owner decisions at the plan gate (2026-09-22):** all nine recommendations, with three
  adjustments — question 5 leaves a one-line note in SPEC-reset §2.7; question 9 takes the
  `overrides` (commented in `package.json`, with a T-13 note to drop them); question 2 adds
  one sentence on converting `BigInt` to `Number` at the DTO boundary. See "Owner answers".
- **Commits.** The shared `.git/config` sets `core.hooksPath` to the main checkout's absolute
  `scripts/git-hooks`, so a commit in any worktree runs the main checkout's hook and the main
  checkout's gitleaks cache (F1, F2). Commit as
  `GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks" git commit …`, so the hook downloads
  and checks its own binary for this worktree. After PR #5 the main checkout's cache repairs
  itself and the prefix is no longer needed, but it stays harmless. Never `--no-verify`.
- **Installs touch the shared git config.** `npm ci` and an argument-less `npm install` run the
  `prepare` script (T-02a), which writes `core.hooksPath` into the shared `.git/config` — the
  relative `scripts/git-hooks`, replacing today's absolute value (F2; for the main checkout it
  names the same file). Governance v1.1 has any subagent that touches hooks stop and report, so
  the controller, not a subagent, runs Task 1 Step 7's `npm ci` and reports the change; the
  installs with package arguments (Task 1 Step 2, Task 3 Step 11) do not run `prepare`.
- **Out of scope:** T-03 (`src/domain`, `scripts/seed-figures.ts`, the fixtures that import
  `src/domain/README.md`); T-04 (`src/shared` — Zod schemas incl. `ErrorEnvelope`, `enums.ts`,
  `copy.ts`); T-05 (auth, the rate limit that uses `LoginAttempt`, `X-Request-Id`, middleware);
  T-08 (`/api/admin/reset`, cron, `latestReset`, `checkThreshold`, `getMeta`); T-12 (`GET
  /api/test/log`, owner answer 5); T-14 (Neon, Vercel); `agentRules` (PR #4) and the gitleaks
  cache key (PR #5), which the owner split out before T-02.

---

## Decisions taken in this plan (owner may overturn)

Implementation choices inside an approved spec (governance.md: "Implementation details within
an approved spec — agent decides, documents in PR"). Each is listed so the owner can reject it
before any code exists.

| # | Decision | Why | Alternative rejected |
|---|----------|-----|----------------------|
| D1 | `prisma`, `@prisma/client` and `@prisma/adapter-pg` pinned **exactly** at 7.10.0; `pg`, `@types/pg`, `tsx` with a caret, like the rest of `package.json` | E4: the CLI's `latest` is an 8.x release candidate, and CLI, client and adapter must be the same version. `pg` and `@types/pg` are devDependencies: `@prisma/adapter-pg` brings `pg` itself, and only the API tests import it | Caret ranges for Prisma (the next `npm install prisma` crosses into 8.x); Prisma 8 RC |
| D2 | Generator `prisma-client` with `output = "../src/server/generated/prisma"`; the folder is git-ignored and `postinstall: prisma generate` rebuilds it on every `npm install`/`npm ci` | ADR-0002 gives the Prisma client to `src/server`; the `prisma` segment keeps the existing import guard in force (E10); generation needs no database (E6), so CI's `verify` job keeps working | Committing 384 KB of generated code (E7) that changes with every Prisma release; `prisma-client-js`, deprecated in v7 (E21) |
| D3 | `prisma.config.ts` reads `process.env.DATABASE_URL` and loads `.env.local` with `process.loadEnvFile` when the file exists | Prisma 7 loads no env file; the repository keeps local settings in `.env.local` (README); `env()` would break `postinstall` wherever the variable is unset (E6); a variable already set (CI) wins (E17) | `import "dotenv/config"` — reads `.env`, not `.env.local`, and adds a dependency |
| D4 | `Category`, `Theme` and `ResetReason` are Postgres enums; the database stores the documented names (`@map("Dining Out")`), the client uses identifiers without spaces | The data model says "enum"; SQL reads like the documents (E8). T-04's `src/shared/enums.ts` will hold the display names and the mapping | Text columns with CHECK constraints (no client types; Prisma does not manage CHECKs) |
| D5 | All six tables carry `id` (UUID), `createdAt`, `updatedAt`, `seeded` — `ResetLog` and `LoginAttempt` included; timestamps are `timestamptz(3)`; names are `text`, their lengths and every amount range left to the shared Zod schemas (NFR-S3, T-04) | The data model's "Every entity has…", read literally; millisecond precision matches the session's `resetEpoch` (SPEC-auth §2.9); one source of truth for validation rules | CHECK constraints duplicating the Zod rules |
| D6 | `Pot.name` is `citext` with `@unique`; the init migration starts with a hand-written `CREATE EXTENSION IF NOT EXISTS "citext";` | "unique, case-insensitive" enforced by the database with Prisma's own `@db.Citext` (E6); the extension line is the documented v7 route (E9); Neon has `citext` (E20). Risk E22 is measured in Task 3 Step 6 | A `lower(name)` expression index (the kind of hand-made object #29220 shows Prisma dropping); a `nameKey` column the application must keep in step |
| D7 | Seed transforms are pure functions in `src/server/seed.ts`; dates are shifted **as text**; `ResetLog.at` comes from `@default(now())` | The ADR-0005 lint rule rejects `new Date(…)` in `src/server` even to parse a string (`server-uses-new-date` fixture); Prisma accepts ISO-8601 text for `DateTime` (E7); no clock is read in `src/server` at all | A lint exception for parsing — an ADR conversation, not a plan decision |
| D8 | A variant is a pure function of the seed rows (`applyVariant(rows, variant)`), applied before the rows are inserted | One transaction per test seed; the spec's unit row asks for "variant functions" (§7), which a database-bound variant could not have; the end state equals "reset, then apply a variant" | Reset, then delete or update rows in a second step |
| D9 | `resetToSeed(db, reason, rows = seedRows())`: one interactive transaction — `pg_advisory_xact_lock(42::bigint)` through `$executeRaw`, `TRUNCATE` of the explicit `RESET_TABLES` list `RESTART IDENTITY`, `createMany` per table, one `ResetLog` row — with `maxWait` 10 s and `timeout` 30 s. `rows` counts the seed rows inserted. A unit test holds `RESET_TABLES` to the schema's models | Truncating by name keeps `_prisma_migrations`; `::bigint` pins the overload whatever type the parameter is sent as; `$executeRaw` reads no result, so the `void` column is never deserialised; the defaults (2 s / 5 s, E21) would abort a reset that waits for the lock instead of serialising it; the third parameter is how `/api/test/seed` passes a variant | Truncating every table of the schema via `information_schema` (would include `_prisma_migrations` unless filtered); `$queryRaw` for the lock |
| D10 | One catch-all route file, `app/api/test/[...path]/route.ts`, delegating to `src/server/test-support.ts`, whose route table is empty unless `APP_ENV === "test"`, read on every request | "the router has no `test/*` entries" becomes a plain unit assertion (`testSupportRoutes(env)`) with no build and no database; E14 shows the gate holds under `next start`; `APP_ENV` is not inlined into server code | Excluding the files from non-test builds (`pageExtensions`): nothing a unit test can assert, and a second build for tests |
| D11 | Errors use `src/server/http.ts` — `{ error, message }` with SPEC-auth §2.10's codes; no Zod dependency in T-02 | T-04 owns `ErrorEnvelope` and the Zod dependency; the test routes validate one field | Pulling T-04's schema forward (T-03 and T-04 may run beside T-02) |
| D12 | `POST /api/test/seed` requires `variant`: missing, unknown and non-JSON bodies all answer 400 | §2.7 gives no default (unlike §2.2's `manual`), and a test that forgot the variant should fail rather than seed | Defaulting to `seed` |
| D13 | Unit tests (Vitest, no database, in CI's `verify` job) for the pure parts, the checksum and the route gate; API tests (Playwright request context, `tests/api/`) for everything that touches Postgres, asserting through the database. Variant shapes are asserted in the database, not via `/api/overview`, which is T-09's | ADR-0003's layers; the checksum and the gate need no server, so they run in CI now; T-09 adds the overview-shape assertions (§7 "via `/api/overview`") when the endpoint exists | Waiting for T-09 to test the variants at all |
| D14 | `playwright.config.ts`: `webServer.env = { APP_ENV: "test" }`; `.env.local` loaded for the test process; `test:api` runs `--workers=1` and loses `--pass-with-no-tests`; the first API test fails with a message when the server it reached has no test routes | The web server serves E2E too (ADR-0003: test data through these routes); the API tests share one database, so two workers would reset it under each other; outside CI Playwright reuses a server already on the port (`npm run dev` answers 404) | Per-worker databases (T-06 may need them for E2E) |
| D15 | `compose.yaml` at the root: `postgres:18.6-alpine`, bound to `127.0.0.1:5432`, a named volume at `/var/lib/postgresql`, a `pg_isready` health check; the URL in `.env.example` is unchanged | Neon's default is 18 (E20); loopback because the password is a local default; the PG18 volume path (E20); `docker compose up -d --wait` returns when healthy; `localhost` keeps the T-02a rule quiet (E18) | `postgres:17` (a different major from production); a `db` service host (needs a new gitleaks exemption) |
| D16 | `npm run db:reset` = `prisma migrate deploy && prisma db seed`; the seed command, `tsx prisma/seed.ts`, lives in `prisma.config.ts` | `migrate deploy` applies pending migrations without resetting; `prisma db seed` is the one v7 entry point for seeding (E21) and inherits the config's environment; `prisma/` is outside ADR-0002's layers, so the entry point may import `src/server` where `scripts/` may not | A script under `scripts/` (forbidden to import `src/server`); Node's own TypeScript support (E7: extensionless imports) |
| D17 | `allowScripts` records `prisma@7.10.0` (preinstall: checks the environment), `@prisma/engines@7.10.0` (postinstall: downloads the schema engine) and `esbuild@0.28.2` (postinstall: checks its platform binary), written by `npm install-scripts approve` | The field is the repository's record of reviewed install scripts (T-01); E5 shows it records rather than gates | Leaving three unreviewed-script warnings on every install |
| D18 | The six fixtures that import `src/server/README.md` import `src/server/db` instead; a new violation fixture imports the generated client from `app/`; the fixtures README and `importTargets` follow | The backlog's repointing; the new fixture proves the Prisma guard covers a path that is not `@prisma/client` (E10) | Leaving the READMEs as targets |
| D19 | `package.json` `overrides` force `deepmerge-ts` 8.0.2 and `mysql2` 3.24.4; a top-level `"//"` key beside them carries the reason and the T-13 note (JSON has no comments) | **Owner answer 9**: `npm audit` must stay at 0 behind the T-02a gate; E24 measured the whole set-up | Accepting the four advisories (the agent's recommendation, declined by the owner) |

---

## Owner answers at the plan gate (2026-09-22)

The owner's reply arrived as pasted text with no words of the owner's own around it, so the
agent asked whether it was the owner's plan-gate reply and how much of it to act on. The owner
chose "Bəli — plan v0.2 + PR (a), (b)" ("Yes — plan v0.2 and PRs (a) and (b)"): update the plan,
open the two PRs, and start no T-02 execution before a separate go-ahead. The reply, verbatim:

> Go with all recommendations, with these adjustments:
> 5 — move GET /api/test/log to T-12 in the backlog, but leave a one-line note in SPEC-reset §2.7 that it lands in T-12.
> 9 — use the overrides (audit must stay 0 behind the T-02a gate); comment the reason in package.json; add a T-13 note to drop the overrides when Prisma updates.
> 2 — add one sentence to the spec: BigInt columns are converted to Number at the DTO boundary (our limit is far below MAX_SAFE_INTEGER).
> Before T-02: two separate small PRs — (a) next.config agentRules: false with a process-log line that the tool tried to edit AGENTS.md; (b) fix(secret-guard): key the gitleaks cache by platform (os_arch), with its failing fixture. Document F2 (hooksPath is absolute; worktrees use the main checkout's hook) as a known limitation in the T-02a docs.

| # | Question | Answer | What changed in this plan |
|---|----------|--------|---------------------------|
| 1 | `seq` for creation order | **Yes** | Nothing — the plan already had it; data-model v1.1 in Task 5 |
| 2 | 64-bit money | **Yes**, plus one sentence: `BigInt` columns become `Number` at the DTO boundary | Task 5 Step 3 adds the sentence to SPEC-reset §5 (the spec this task amends); ADR-0005 clarification and data-model v1.1 as planned |
| 3 | 29 February | **28 February** | Nothing |
| 4 | `empty-all` | **Pots, budgets and transactions; balance stays** | Nothing |
| 5 | `GET /api/test/log` | **T-12**, with a one-line note in SPEC-reset §2.7 | Task 5 Step 3: the §2.7 note is one line; backlog v1.6 as planned |
| 6 | CI job with Postgres | **Now** | Nothing — Task 5 Step 1 |
| 7 | Document amendments in this PR | **Yes** | Task 5 Step 3 also records answers 2, 5 and 9 |
| 8 | `next dev` rewrites `AGENTS.md` | **Separate small PR before T-02**, with a process-log line | Delivered as PR #4, outside this plan |
| 9 | `npm audit` | **Overrides** — audit stays 0; the reason commented in `package.json`; a T-13 note to drop them | D19, E24; Task 1 Step 3 adds the overrides; Task 1 Step 13 and Task 5 Step 5 expect 0; backlog v1.6 amends T-13 |
| F1, F2 | Findings outside T-02 | **Separate small PR before T-02** — the cache keyed by `os_arch` with its failing fixture; F2 documented as a known limitation | Delivered as PR #5, outside this plan |

**Disagreement (AGENTS.md §5):** on question 9 the agent recommended accepting the four
advisories, because an override forces a major version onto a dependency Prisma pins and
outlives Prisma's own fix unless someone removes it. The owner chose the overrides so that the
audit stays at 0, and put their removal on T-13. The owner decides.

---

- R1 Ruling: T1 Step 3's `npm install` runs as `npm install --ignore-scripts` (applies the overrides; the engine binary from Step 2 stays; root prepare/postinstall are not set or not wanted yet) — cost if wrong: none observable; `npm ci` in Step 7 exercises the scripts anyway.
- R2 Ruling: the T1 implementer does Step 7's `npm pkg set scripts.postinstall=…` but not `rm -rf src/server/generated && npm ci`; the controller runs that command after the implementer reports and before the review, and records the core.hooksPath change — cost if wrong: none, the plan's Global Constraints already assign it to the controller.
- R3 Ruling: temporary moves in mutation checks go to the SDD workspace, not /tmp — cost if wrong: none.
- R4 Ruling: every Vitest count in the plan is +3 on the merged main (PR #4 +2, PR #5 +1): T1 161, T2 212, T3 214, T4 229 — cost if wrong: a reviewer flags a count.
- R5 Ruling: compose.yaml gets a top-level `name: ai-native-personal-finance`, so every checkout and worktree shares one project, container and volume and only one binds 127.0.0.1:5432 — cost if wrong: worktrees share one demo database, which every test resets anyway.
- R6 Ruling: the T5 implementer writes the process-log entry's factual fields; the controller fills "what the agent got right/wrong", "disagreements" and "lessons" from this ledger at the end — cost if wrong: none.
- R7 Ruling: copying briefs, reports and reviews to docs/04-process/prompts/2026-09-22-T-02/ (build-workflow §7) is the controller's last docs commit, after the final review — cost if wrong: none.
