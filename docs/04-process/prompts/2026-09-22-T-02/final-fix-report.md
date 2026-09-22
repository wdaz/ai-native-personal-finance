# T-02 final fix wave — report

Branch `task/T-02-persistence-reset`, starting HEAD `7718a1e`. Items 1, 2, 4, 5, 6, 7 from
`final-fix-findings.md` (item 3 excluded, not this wave's). One commit per item, in order.

## Item 1 — pin the one-transaction guarantee of resetToSeed

**Change:** `tests/api/reset.spec.ts` — added import `applyVariant` from
`@/src/server/variants` (line 6) and a new test (lines 97–104):
`"US-36 a reset that fails part-way leaves the previous data (§2.1: one transaction)"`.
Commit `47e9897`.

**Verification — green run (test added, `src/server/reset.ts` unchanged):**

```
$ npm run test:api -- --grep "one transaction"
Running 1 test using 1 worker
  ✓  1 [api] › tests/api/reset.spec.ts:97:1 › US-36 a reset that fails part-way leaves the previous data (§2.1: one transaction) (153ms)
  1 passed (4.3s)
```

**Verification — red run** (temporarily replaced the `db.$transaction(async (tx) => {…}, {…})`
wrapper in `src/server/reset.ts` with an IIFE that runs the same body against `db` directly
via `const tx = db;`, keeping everything else unchanged):

```
$ npm run test:api -- --grep "one transaction"
  1) [api] › tests/api/reset.spec.ts:97:1 › US-36 a reset that fails part-way leaves the previous data (§2.1: one transaction)

    Error: expect(received).toEqual(expected) // deep equality

    - Expected  - 26
    + Received  +  1

    @@ -5,36 +5,11 @@
             "expenses": 170050,
             "income": 381425,
             "seeded": true,
           },
         ],
    -   "budgets": Array [
    -     Object {
    -       "category": "Entertainment",
    -       "maximum": 5000,
    -       "seeded": true,
    -       "theme": "Green",
    -     },
    -     Object {
    -       "category": "Bills",
    -       "maximum": 75000,
    -       "seeded": true,
    -       "theme": "Cyan",
    -     },
    -     Object {
    -       "category": "DiningOut",
    -       "maximum": 7500,
    -       "seeded": true,
    -       "theme": "Yellow",
    -     },
    -     Object {
    -       "category": "PersonalCare",
    -       "maximum": 10000,
    -       "seeded": true,
    -       "theme": "Navy",
    -     },
    -   ],
    +   "budgets": Array [],
        "pots": Array [],
        "transactions": Array [
          ...

      101 |   const broken = { ...rows, budgets: [...rows.budgets, rows.budgets[0]!] }; // duplicate category
      102 |   await expect(resetToSeed(db, "test", broken)).rejects.toMatchObject({ code: "P2002" });
    > 103 |   expect(await storedRows(db)).toEqual(before);
          |                                ^
      104 | });

  1 failed
    [api] › tests/api/reset.spec.ts:97:1 › US-36 a reset that fails part-way leaves the previous data (§2.1: one transaction)
```

Confirms the claim: `before` is captured after an `empty-pots` reset, so `"pots": Array []`
is unchanged context, not new damage. The discriminating evidence is `budgets`: all four seed
rows are gone from `after` — the truncate committed and stayed committed even though the
following `budget.createMany` (with the deliberately duplicated category) rejected with
P2002 — because without `$transaction` there is nothing to roll the truncate back. The test
catches exactly that.

Restored `src/server/reset.ts` by hand to the original `db.$transaction(...)` form; confirmed
with `git diff src/server/reset.ts` (no output — byte-identical to HEAD) and re-ran the full
`reset.spec.ts` file: 5/5 passed, including this test (green again).

## Item 2 — the one-worker rule lives in the config, not only the script

**Change:** `playwright.config.ts` — the `api` project now sets `workers: 1,
fullyParallel: false` (alongside `testDir`/`use`), plus an updated header comment saying
where the rule lives. Commit `4c4ddaf`.

**Verification** (no `--workers` flag):

```
$ npx playwright test --project=api
Running 17 tests using 1 worker
  ✓  1 … 17 …
  17 passed (5.0s)
```

"using 1 worker" with no `--workers` flag confirms the project-level setting, not the npm
script's flag, is what serialises these tests.

## Item 4 — health-check Postgres over TCP

**Change:**
- `compose.yaml` line 18: `pg_isready -h 127.0.0.1 -U postgres -d personal_finance`
  (plus an explanatory comment).
- `.github/workflows/ci.yml` line 55: same `--health-cmd`.

Commit `646e291`.

**Verification:**

```
$ docker compose up -d --wait
 Container ai-native-personal-finance-postgres-1 Recreate
 Container ai-native-personal-finance-postgres-1 Recreated
 Container ai-native-personal-finance-postgres-1 Starting
 Container ai-native-personal-finance-postgres-1 Started
 Container ai-native-personal-finance-postgres-1 Waiting
 Container ai-native-personal-finance-postgres-1 Healthy
```

`docker compose ps` showed `Up ... (healthy)`; the named volume was kept (not `-v`), confirmed
by `SELECT count(*) FROM _prisma_migrations` returning `1` immediately after recreation — the
prior migration history survived the container recreation.

The `.github/workflows/ci.yml` `--health-cmd` half of this change (line 55, same
`pg_isready -h 127.0.0.1 -U postgres -d personal_finance`) cannot be exercised locally — it
runs against GitHub's service container. Verified by inspection and parity with the
`compose.yaml` healthcheck only, not executed in this session.

## Item 5 — the ResetLog.at comment names the wrong source

**Change:** `src/server/reset.ts`, the doc comment on `resetToSeed` (above the function),
reworded per the findings' suggested wording. Commit `ceabbdc`. No code changed, comment only
(confirmed with `git diff`).

**Evidence** (throwaway script at
`.superpowers/sdd/2026-09-22-T-02/throwaway-resetlog-at.ts`, gitignored, deleted after use):
created a `PrismaClient` with `log: [{ emit: "event", level: "query" }]`, inserted one
`ResetLog` row, and logged the query event for the `INSERT INTO "public"."ResetLog"`
statement:

```
QUERY: INSERT INTO "public"."ResetLog" ("id","at","reason","seeded","createdAt","updatedAt")
VALUES ($1,$2,CAST($3::text AS "public"."ResetReason"),$4,$5,$6)
RETURNING "public"."ResetLog"."id", "public"."ResetLog"."at",
"public"."ResetLog"."reason"::text, "public"."ResetLog"."seeded",
"public"."ResetLog"."createdAt", "public"."ResetLog"."updatedAt"
PARAMS: ["44322846-4491-4da4-8104-a58a530c5a4c","2026-09-22T15:30:13.905Z","test",false,
"2026-09-22T15:30:13.905Z","2026-09-22T15:30:13.905Z"]
created row.at: 2026-09-22T15:30:13.905Z
```

The INSERT names `"at"` explicitly and binds it as a parameter (`$2`), with the exact same
timestamp as `createdAt`/`updatedAt` ($5/$6) — i.e. Prisma 7's client runtime fills
`@default(now())` itself from the process clock and sends the value, rather than leaving it to
Postgres's own column default. New comment: `"at" is filled by Prisma's runtime from the
server's clock when the row is created (@default(now())) — operational time, not the fixed
business clock — so this module itself reads no clock (ADR-0005)`. The throwaway-inserted row
was deleted from the database (`DELETE FROM "ResetLog" WHERE reason = 'test'`) and the script
file removed after use.

## Item 6 — .env.example still lists /api/test/log

**Change:** `.env.example`, the `APP_ENV` comment now reads: `APP_ENV=test enables
/api/test/reset|seed (/api/test/log arrives in T-12) and the window.__pf test hook.`
Variable names unchanged. Commit `28711b1`.

**Verification:** `npx vitest run tests/unit/scaffold.test.ts` — 98/98 passed, including
`.env.example lists every documented variable`.

## Item 7 — other HTTP methods must show the route does not exist outside test

**Change:**
- `app/api/test/[...path]/route.ts` — added `PUT`, `PATCH`, `DELETE`, `OPTIONS` exports,
  each delegating to `handleTestSupport` with its method name, same shape as `POST`/`GET`.
- `tests/unit/test-support.test.ts` — `import * as route from ".../route"` in place of named
  `{ GET, POST }`; the test `"answers 404 through the route file when APP_ENV is not test"`
  is now `"… for every exported method"`: it asserts the exported name set is exactly
  `["DELETE","GET","OPTIONS","PATCH","POST","PUT"]`, then calls every one of them and asserts
  404.

Commit `232bbbc`.

**Verification:**

```
$ npx vitest run tests/unit/test-support.test.ts
 Test Files  1 passed (1)
      Tests  15 passed (15)
```

Also built and ran a real production server on the extra port:

```
$ npm run build
$ APP_ENV=production npx next start -p 3100
$ curl -i -X OPTIONS http://127.0.0.1:3100/api/test/reset
HTTP/1.1 404 Not Found
{"error":"not_found","message":"Not found"}
$ curl -i -X PUT    http://127.0.0.1:3100/api/test/reset   → 404, same envelope
$ curl -i -X PATCH  http://127.0.0.1:3100/api/test/reset   → 404, same envelope
$ curl -i -X DELETE http://127.0.0.1:3100/api/test/reset   → 404, same envelope
```

Server (PIDs 7654/7686) stopped afterwards; `lsof -i :3100` empty.

## Final gates

Run from a clean tree, port 3000 free beforehand:

```
$ npm run lint                                    → clean (eslint . --max-warnings 0)
$ npm run format:check                             → "All matched files use Prettier code style!"
$ npm run typecheck                                → clean (tsc --noEmit)
$ npx vitest run                                    → Test Files 8 passed (8); Tests 229 passed (229)
$ npm run test:api                                  → 17 passed (4.8s)
$ npx playwright test --project=api                 → 17 passed (3.8s)
$ npm audit --audit-level=high                      → "found 0 vulnerabilities"
```

All seven gates green. Vitest is 229 (not more): item 7 extended the existing test in place
with a loop over the module's exports rather than adding new `it()`/`it.each` cases, so it
does not add to the count — the task's "229 or more" is satisfied at 229. API count is
17 = 16 + item 1's new transaction test, both via `npm run test:api` and via
`npx playwright test --project=api` directly (item 2's config-level `workers: 1` holds without
the npm script's `--workers=1` flag).

Port 3000 was checked empty both before and after the whole run: nothing was listening before
the gates started, so Playwright started its own webServer for each run and tore it down
afterwards, confirmed by `lsof -i :3000` returning nothing once the gates finished.

## Commits

```
47e9897 test(reset): pin the one-transaction guarantee of resetToSeed (T-02)
4c4ddaf fix(test): run the api project on one worker in the config (T-02)
646e291 fix(db): health-check Postgres over TCP (T-02)
ceabbdc docs(reset): say where ResetLog.at comes from (T-02)
28711b1 docs: /api/test/log arrives in T-12 (.env.example) (T-02)
232bbbc fix(test-support): every HTTP method answers 404 outside test (T-02)
```

Every commit made with `GITLEAKS_CACHE_DIR="$PWD/node_modules/.cache/gitleaks"`, no
`--no-verify`, nothing pushed. `git status` after the last commit: clean, 19 commits ahead of
`origin/task/T-02-persistence-reset`.

## Concerns

- **Item 7's export-set assertion is intentionally brittle.** The new unit test asserts the
  route file's exports are exactly the six HTTP method names, then calls each one as a
  handler. If a later task adds a non-handler export to that file (e.g.
  `export const dynamic = "force-dynamic"`), the name-set assertion fails first and, if that
  assertion were ever loosened instead of fixed, the loop would try to call a non-function.
  This is the "fails loudly" behaviour the findings asked for (a handler added later is
  covered automatically; one dropped fails loudly) — flagging it so the next person isn't
  surprised by the failure mode, not asking for a change.
- **Item 5's evidence is empirical, tied to this Prisma/Postgres version pairing
  (`@prisma/client` 7.10.0, `postgres:18.6-alpine`).** The comment now describes what was
  observed (Prisma's runtime fills `@default(now())` and sends it as a bound parameter), which
  is Prisma 7's documented behaviour, but the throwaway script's INSERT log is the concrete
  proof for this stack, not a general guarantee across all Prisma versions.
- **No other cleanup needed.** No stray processes, no modified files outside the six commits.
  `.superpowers/sdd/2026-09-22-T-02/` (gitignored by `.superpowers/sdd/.gitignore`) contains
  only the pre-existing planning files plus this report — the throwaway script and the
  temporary commit-message text files were deleted after use.
