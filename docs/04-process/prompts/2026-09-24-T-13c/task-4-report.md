# Task 4 report — TD-10: `APP_ENV=test` and database resets refuse to run where a real database could be behind them

Status: DONE_WITH_CONCERNS
Commit: `c1ef26d feat(env): refuse APP_ENV=test and database resets outside this machine (TD-10)` on `task/T-13c-tech-debt` (not pushed)
Final totals: `Test Files 80 passed (80)`, `Tests 1029 passed (1029)`; prettier, tsc, `npm run lint` (ESLint + Stylelint) all clean.

## What was implemented

- `src/shared/env.ts` (still no imports, only the global `URL`): `isLocalDatabaseUrl`, `localDatabaseRefusal`, `testEnvRefusal`, exactly as in the brief's diff. Local hosts are `localhost`, `127.0.0.1`, `[::1]`; a `host=` or `hostaddr=` query parameter, an unparseable value or a URL with no host is not local; an unset or empty `DATABASE_URL` is left to `databaseUrl()`. Neither message contains the URL.
- `src/server/env.ts`: `isTestEnv(env)` is `env.APP_ENV === "test" && testEnvRefusal(env) === null` (second line of defence at runtime).
- `next.config.ts`: `testEnvRefusal(process.env)` is checked when the config loads, so `next build` and `next start` stop (first line of defence).
- `prisma/seed.ts`: `localDatabaseRefusal(process.env)` before `createDb`; prints the refusal to stderr and `process.exit(1)`.
- `playwright.config.ts`: `localDatabaseRefusal(process.env)` after the `.env.local` load; throws, so no Playwright command loads the config.
- Tests: new `tests/unit/shared/env.test.ts` (46), new `tests/unit/database-guard.test.ts` (4), additions to `tests/unit/server/env.test.ts` (+9), `tests/unit/test-support.test.ts` (+2), `tests/unit/next-config.test.ts` (+5, including the DoD v1.1 violation fixture that cuts the guard block out).
- Docs: `.env.example` and `README.md` say what refuses what (brief's Step 12 text, verbatim).

## TDD evidence

### Stage 1 — the three functions (Steps 1–4)

- Red: `npx vitest run tests/unit/shared/env.test.ts` -> `Test Files 1 failed (1)`, `Tests 46 failed (46)`. Every test failed with `TypeError: testEnvRefusal is not a function` (and the same for `isLocalDatabaseUrl` / `localDatabaseRefusal`): the module exports none of them yet. Matches the brief's prediction.
- Green (after writing the functions): `Tests 46 passed (46)`. Matches the brief (measured 46).

### Stage 2 — `isTestEnv` and the route list (Steps 5–6)

- Red: `npx vitest run tests/unit/server/env.test.ts tests/unit/test-support.test.ts` -> `Tests 3 failed | 61 passed (64)`. Failures: `expected true to be false` twice (`isTestEnv` on Vercel, and against the Neon-shaped URL) and `expected [ { method: 'POST', …(2) }, …(2) ] to deeply equal []` (`testSupportRoutes` still returns the three routes). Matches the brief.
- Green: `npx vitest run tests/unit/server/env.test.ts tests/unit/test-support.test.ts tests/unit/server/request-log.test.ts` -> `Test Files 3 passed (3)`, `Tests 75 passed (75)`. Matches.

### Stage 3 — `next.config.ts` (Steps 7–8)

- Red: `npx vitest run tests/unit/next-config.test.ts` -> the header line read `(17 tests | 3 failed)`; the summary line was truncated in my output, so "14 passed" is derived (17 - 3), not quoted. The three failures: two `AssertionError: promise resolved "{ env: { …(2) }, webpack: null, …(50) }" instead of rejecting` (Vercel case; other-machine case), and, re-running only that test with `-t "would let a deployment build"`, `expected 'import type { NextConfig } from "next…' not to be 'import type { NextConfig } from "next…'` (the guard block does not exist to cut out). Matches the brief's description.
- Green: `Tests 17 passed (17)`. Matches.

### Stage 4 — the seed and Playwright (Steps 9–10)

- Red: `npx vitest run tests/unit/database-guard.test.ts` -> `Tests 2 failed | 2 passed (4)`. **The brief predicted `3 failed | 1 passed`; I measured `2 failed | 2 passed`. I did not edit anything to fit.** The two failures are exactly the two the brief's own prose describes:
  1. the seed connects instead of refusing: stderr held `PrismaClientKnownRequestError: Can't reach database server at db.example.invalid` (code `P1001`), not the refusal;
  2. `playwright test --list --project=api` with the other machine's URL exits 0 (`expected +0 not to be +0`).
  Both controls (local URL: the seed fails at the connection with `ECONNREFUSED`, no "Refusing to run"; Playwright lists 100 tests in 14 files and prints `[api] › api/…`) passed before the guard existed, so there is no third failing test in this tree. I ran both control commands by hand to confirm they behave as the assertions say.
- Green: `Tests 4 passed (4)`. Matches.

## Step 11 — real flows

1. `env VERCEL=1 APP_ENV=test npx next build`, exit status 1, before any compilation:
   ```
   ▲ Next.js 16.3.5 (Turbopack)
   - Environments: .env.local
   ⨯ Failed to load next.config.ts, see more info here https://nextjs.org/docs/messages/next-config-error

   > Build error occurred
   Error: Refusing to run: APP_ENV=test on a Vercel deployment (VERCEL is set) would expose the unauthenticated /api/test/* reset and seed routes — unset APP_ENV there — TD-10
       at Object.<anonymous> (next.config.compiled.js:19:11)
   ```
2. `env APP_ENV=test DATABASE_URL=postgresql://user:password@db.example.invalid:5432/x npx next start -p 3114`, exit status 1. Full output:
   ```
   ▲ Next.js 16.3.5
   - Local:         http://localhost:3114
   - Network:       http://192.168.1.103:3114
   ✓ Ready in 53ms
   ⨯ Failed to load next.config.ts, see more info here https://nextjs.org/docs/messages/next-config-error
   Error: Refusing to run: APP_ENV=test with a DATABASE_URL that does not name this machine (localhost, 127.0.0.1 or [::1]) would expose the unauthenticated /api/test/* reset and seed routes on that database — TD-10
       at Object.<anonymous> (next.config.compiled.js:19:11)
   ```
   Afterwards `lsof -nP -iTCP:3114 -sTCP:LISTEN` printed nothing (exit 1): nothing is listening. Observation (not blocking): `next start` printed `Ready` and the port before it loaded the config, then exited 1. For that window (milliseconds, and the process dies without serving) `isTestEnv` is the second line of defence: it is false for this environment, so no `/api/test/*` route exists.
3. `env PORT=3113 npx playwright test --project=api tests/api/test-support.spec.ts` built (`✓ Running next.config.ts took 56ms`, route table includes `/api/test/[...path]`), started the app with `APP_ENV=test` against the local database, and ended with `9 passed (5.6s)`. `lsof` on 3113 afterwards: nothing listening.

## Files changed (commit c1ef26d, 12 files, +407 / -7)

`src/shared/env.ts`, `src/server/env.ts`, `next.config.ts`, `prisma/seed.ts`, `playwright.config.ts`, `tests/unit/shared/env.test.ts` (new), `tests/unit/database-guard.test.ts` (new), `tests/unit/server/env.test.ts`, `tests/unit/test-support.test.ts`, `tests/unit/next-config.test.ts`, `.env.example`, `README.md`.

## Secret scan

`sh scripts/secret-scan.sh staged` after `git add`: exit 0, silent. The pre-commit hook passed (no `--no-verify`). Test URLs use password `password` or a `${SECRET}` variable, as the brief has them. No allowlist entry was added.

## Final check totals

- `npx prettier --check .`: `All matched files use Prettier code style!`
- `npx tsc --noEmit`: clean (no output)
- `npm run lint` (`eslint . --max-warnings 0 && stylelint …`): clean
- `npx vitest run`: `Test Files 80 passed (80)`, `Tests 1029 passed (1029)` = 963 + 46 + 9 + 2 + 5 + 4, as the brief computed.

## CI check (does the guard refuse CI?)

- `grep -rn "DATABASE_URL" .github/workflows`: only `ci.yml:69` and `ci.yml:140`, both `postgresql://postgres:postgres@localhost:5432/personal_finance`. Host is `localhost`; CI is not refused.
- `grep -rn -e BASE_URL -e db:reset -e "db seed" -e playwright .github/workflows`: only those two lines plus `npx playwright install` (line 165), `npx playwright test --project=${{ matrix.browser }}` (line 171) and report-artifact names. No job runs Playwright against a deployed preview (no `BASE_URL`), and none seeds or resets a non-local database.
- `package.json` scripts: `db:reset`, `test:api`, `test:e2e`, `test:e2e:ui` are the only seed/Playwright entry points; `scripts/seed-figures.ts` does not touch the database (no `createDb`, `DATABASE_URL` or `resetToSeed`). `vercel.json` only declares the daily cron on `/api/admin/reset`.

## Self-review

- Layer rule: `src/shared/env.ts` has no imports; ESLint boundaries and tsc pass. `next.config.ts` imports it by the relative path the existing test helper (`configCopy`) already rewrites.
- The secret-bearing URL never reaches a message: tested for `localDatabaseRefusal` and `testEnvRefusal`, and end-to-end for the seed and Playwright child processes (`not.toContain(SECRET)`).
- The violation fixture (`unchecked` config) proves the `next.config.ts` test would catch the guard being removed.
- `.next` (git-ignored) now holds a build made with `APP_ENV=test`; the brief does not say to delete it, so it stays.

## Concerns

1. Step 9's red count differs from the brief: measured `2 failed | 2 passed`, brief says `3 failed | 1 passed`. The two failures are the two the brief's prose describes (seed connects; `playwright --list` exits 0); both controls pass without the guard. Nothing was edited to fit; the controller may want to correct the brief's number.
2. Step 7's "14 passed" is derived from `(17 tests | 3 failed)`, not read off a summary line (truncated output).
3. `next start` announces `Ready` and the port before loading the config, then exits 1 (see Step 11.2). `isTestEnv` covers that window; no route can exist.
4. Cosmetic, mandated by the brief: the Vercel refusal says "(VERCEL is set)" even when only `VERCEL_ENV` triggers it.
5. `LOCAL_DATABASE_HOSTS` is exactly `localhost`, `127.0.0.1`, `[::1]` as the brief fixes it; CI uses `localhost`, so nothing needed widening.

## Fix round 1 (review finding, Important) — commit `c316e3b fix(env): read a database URL the way node-postgres does (TD-10)`

### The defect

`isLocalDatabaseUrl` parsed the raw string with `new URL(url)`, but `pg-connection-string` (node_modules, read this round) does `if (/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(str)) str = encodeURI(str)...` and then `new URL(str, 'postgres://base')`. For a special scheme a backslash is a path separator in the raw parse, but `encodeURI` turns it into `%5C` (userinfo), so the guard and the driver read different hosts. Before the fix the probe showed: `"http://localhost\\@evil.example.com/db "` (trailing space) guard local, pg host `evil.example.com`; the same with `?x=%zz` instead of the space, guard local, pg host `evil.example.com`; a leading space, guard local, pg host `base`.

### What changed

- `src/shared/env.ts` (still no imports, only the global `URL`):
  1. `isLocalDatabaseUrl` returns `false` first for `/\s|%(?![0-9a-f]{2})/i.test(url)` (whitespace, or a `%` not followed by two hex digits). This is a superset of pg's own re-encode trigger (a space, `%` + non-hex, `%` + hex + non-hex), so any value pg would re-encode is refused.
  2. After the parse it accepts only `parsed.protocol === "postgres:" || "postgresql:"` (both non-special: a backslash is never a delimiter).
  3. Docblock rewritten to say this (fails closed; why the whitespace/escape and scheme rules exist, citing pg re-encoding, measured 2026-09-25).
  4. Text fix: the Vercel refusal now says `(VERCEL or VERCEL_ENV is set)`; the string is re-wrapped across the two literals, the message text is otherwise unchanged. Re-run: `env VERCEL_ENV=preview APP_ENV=test npx next build` exits 1 with `Refusing to run: APP_ENV=test on a Vercel deployment (VERCEL or VERCEL_ENV is set) would expose the unauthenticated /api/test/* reset and seed routes — unset APP_ENV there — TD-10`.
- `.env.example`: now reads "The seed step of `npm run db:reset` and every Playwright run reset this database, so they refuse a URL whose host is not localhost, 127.0.0.1 or [::1] (TD-10; `prisma migrate deploy`, db:reset's other half, does not)." README.md already said it correctly and is untouched.
- `tests/unit/shared/env.test.ts`: four rows added to `NOT_LOCAL_URLS`, each with a comment and each isolating one condition: `"http://localhost/personal_finance"` (scheme only), `" postgresql://user:password@localhost:5432/personal_finance"` (leading space only), `"postgresql://user:password@localhost/personal_finance?x=%zz"` (malformed escape only), `"http://localhost\\@evil.example.com/db "` (the bypass). Each row is used twice (`isLocalDatabaseUrl` and `localDatabaseRefusal`), so +8 tests. Gitleaks shape kept: postgresql rows use password `password` and host `localhost`; the `http:` rows are outside the rule.

### RED (rows added, `src/shared/env.ts` still the committed version)

`npx vitest run tests/unit/shared/env.test.ts` -> `Tests 8 failed | 46 passed (54)`. Failures: for each of the four rows `isLocalDatabaseUrl(...)`: `AssertionError: expected true to be false` (the guard calls it local), and `localDatabaseRefusal(...)`: `TypeError: .toMatch() expects to receive a string, but got object` (it returned `null`, no refusal). That is the expected failure for all four rows: the guard let each through.

### GREEN

Same command after the change -> `Test Files 1 passed (1)`, `Tests 54 passed (54)`.

### Mutation check (each new condition removed in turn, then restored)

| Mutation | Result | Rows that went red |
| --- | --- | --- |
| whitespace/escape line removed | `4 failed \| 50 passed` | leading-space row and `%zz` row (2 tests each); the bypass row stays green because the scheme rule still catches it |
| scheme line removed | `2 failed \| 52 passed` | `http://localhost/personal_finance` (2 tests); the bypass row stays green because the whitespace rule still catches it |

Both lines were restored; `git diff` showed exactly the intended change before the commit.

### Probe against node-postgres (scratch script, run with `npx tsx`, deleted afterwards)

`createRequire(<worktree>/package.json)("pg-connection-string").parse(url).host` against the real `isLocalDatabaseUrl`, after the fix (the "before" column is from the same script run before the fix):

| url (as TS source) | guard before | guard after | pg host |
| --- | --- | --- | --- |
| `"http://localhost\\@evil.example.com/db "` | local | **refused** | `evil.example.com` |
| `"http://localhost\\@evil.example.com/db?x=%zz"` | local | **refused** | `evil.example.com` |
| `" postgresql://user:password@localhost:5432/personal_finance"` | local | **refused** | `base` |
| `"http://localhost/personal_finance"` | local | refused | `localhost` |
| `"postgresql://user:password@localhost/personal_finance?x=%zz"` | local | refused | `localhost` |
| control `"postgresql://postgres:postgres@localhost:5432/personal_finance"` | local | local | `localhost` |
| control `"postgres://postgres:postgres@127.0.0.1:5432/personal_finance"` | local | local | `127.0.0.1` |
| control `"postgresql://postgres:password@[::1]:5432/personal_finance"` | local | local | `[::1]` |

Every url that pg would send to a non-local host (`evil.example.com`, `base`) is refused; the two rows where pg does reach `localhost` are refused too (the guard is deliberately stricter than pg there: fail closed); the three controls are still local.

### Covering test files and totals

- `npx vitest run tests/unit/shared/env.test.ts tests/unit/server/env.test.ts tests/unit/test-support.test.ts tests/unit/next-config.test.ts tests/unit/database-guard.test.ts` -> `Test Files 5 passed (5)`, `Tests 139 passed (139)`. (`next-config.test.ts` matches `/APP_ENV=test on a Vercel deployment/` and `/Vercel deployment/`; still valid.)
- Full suite: `Test Files 80 passed (80)`, `Tests 1037 passed (1037)` = 1029 + 4 rows x 2.
- `npx prettier --check .` clean; `npx tsc --noEmit` clean; `npm run lint` (ESLint + Stylelint) clean.
- `sh scripts/secret-scan.sh staged` silent, exit 0; pre-commit hook passed, no `--no-verify`. New commit (not an amend), not pushed. Files: `src/shared/env.ts`, `tests/unit/shared/env.test.ts`, `.env.example` (3 files, +32 / -9).

### Residual notes

- pg's `unix socket` branch (a value starting with `/`) is not reachable as local: `new URL("/…")` throws, so the guard says not local.
- The guard now refuses any whitespace (tab, newline) although pg's own trigger is only a space; WHATWG strips tab/newline in both parses, so this is only stricter, never looser.
