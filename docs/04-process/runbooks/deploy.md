# Runbook — deploy (Vercel, Neon, secrets, first seed, rotation, origin trial)

Status: **Draft — executed by T-14 (2026-09-25/26) and corrected by that run, see the Record; the headed native check and the relay demo (step 7) have not been run** (written before the first deployment, 2026-09-25) · Author(s): Agent ·
Executed by: the agent for every command that needs no dashboard, the owner for the rest (the
Vercel import, Deployment Protection, the Neon integration, the origin-trial registration).
Plan: `docs/04-process/plans/2026-09-25-T-14.md` (findings F1–F17 are cited below). ADR-0007
names this runbook: "env setup, first seed, rotating secrets, renewing the OT token before Chrome
156, headed native-mode check, relay demo".

## Why this exists

Merging to `main` deploys production (ADR-0007). Anything that is not code — the accounts, the
variables, the first seed, the origin-trial token, a secret's rotation — is done by hand, once, and
then forgotten. This page keeps what was learned the first time, with its source, so the second
time is a checklist.

## What is known and where it comes from

Sources were read on 2026-09-25 unless a date is given.

### The platform map

| Piece               | Value                                                                                                                                                                                     | Source                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Vercel project      | `personal-finance` (owner's choice, T-14 plan Q4), Hobby plan                                                                                                                             | plan Q4                                                                                         |
| Production URL      | `https://personal-finance-cyan-kappa.vercel.app` — the project's own domain (`personal-finance.vercel.app` was taken: `vercel.app` names are global). The team alias `personal-finance-ruslan-496a.vercel.app` is behind Vercel Authentication, so it is **not** the public URL | plan Q4; measured 2026-09-26 (T-14 steps 5.2, 6.4); ADR-0007 amendment 2026-09-25, line 5 |
| Functions region    | `fra1` (`vercel.json` `regions`), next to the database; Vercel's default is `iad1`                                                                                                        | `vercel.json`, `tests/unit/vercel-config.test.ts`; vercel.com/docs/functions/configuring-functions/region |
| Node                | 24.x (`.nvmrc`, `engines.node`); Vercel offers 24.x, 22.x, 20.x                                                                                                                           | plan F1; vercel.com/docs/functions/runtimes/node-js/node-js-versions                            |
| Neon project        | `solitary-truth-56663324`, `aws-eu-central-1` (Frankfurt), Postgres 18; a Neon region cannot change after creation                                                                        | plan F2 (Neon CLI)                                                                              |
| Production branch   | Neon branch `production` (the default branch)                                                                                                                                             | plan F2                                                                                         |
| Connection          | The **Neon-managed Vercel integration** (installed from Neon's side, linking this existing project to the Vercel project) sets `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct) | plan F3; neon.com/docs/guides/neon-managed-vercel-integration                                   |
| Preview databases   | Each preview deployment gets a Neon branch `preview/<git-branch>`, created from its parent **with the parent's data**                                                                     | plan F3; neon.com/docs/guides/vercel-overview                                                   |
| Development branch  | `vercel-dev` (optional integration setting, on) backs Vercel's Development values, so they never point at `production`                                                                    | plan F3, Q1                                                                                     |
| Branch limit        | Neon Free allows 10 branches: `production`, `vercel-dev` and one per **branch that has a preview deployment** — Vercel previews every pushed non-production branch, a Dependabot branch included (vercel.com/docs/environment-variables), not only pull requests | plan Q1; T-14 review |                                                                                       |
| Branch clean-up     | "Automatically delete obsolete Neon branches" is opt-in (on here) and **runs the next time a preview deployment is created**, so a merged PR's branch lingers until then                  | plan F3; neon.com/docs/guides/vercel-branch-cleanup                                             |
| Migrations          | `buildCommand` = `npx prisma migrate deploy && npm run build`; Prisma's CLI connects through `DATABASE_URL_UNPOOLED` when set (`prisma.config.ts`, `migrationDatabaseUrl`)                 | `vercel.json`; plan F5, Q2                                                                      |
| Why the direct URL  | Neon's pooler is PgBouncer in transaction mode and has no session-level advisory locks; schema migrations need a direct connection                                                       | neon.com/docs/connect/connection-pooling                                                        |
| Deployment Protection | **Standard**: Vercel Authentication on every deployment URL **and the team alias**, but not the project's own production domain (measured 2026-09-26); "Protection Bypass for Automation" sends `x-vercel-protection-bypass: <secret>` | plan F10; vercel.com/docs/deployment-protection                                                 |
| Cron                | `0 3 * * *` (UTC) → `GET /api/admin/reset`, production only, once a day within the hour, not retried, redirects not followed                                                             | `vercel.json`; SPEC-reset-and-test-support §2.3; plan F11                                       |

### The environment

`.env.example` is the list; this table adds who sets each value and the rule that goes with it.
**Secrets are distinct per scope**: a preview's `RESET_SECRET` or `SESSION_SECRET` must never open
production (plan Review Focus 3).

| Variable                                                     | Production | Preview | Set by               | Rule                                                                                                                                                                       |
| ------------------------------------------------------------ | :--------: | :-----: | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                               |     ✔      |    ✔    | the Neon integration | Pooled URL, the application's. Never set by hand (the integration **fails if it already exists**, plan F3).                                                                |
| `DATABASE_URL_UNPOOLED`                                      |     ✔      |    ✔    | the Neon integration | Direct URL, used by `prisma migrate deploy` only. Leave empty locally. TD-10 refuses a non-local value on a local `db:reset`.                                              |
| `SESSION_SECRET`                                             |     ✔      |    ✔    | the agent (Secret)   | At least 32 characters, or **every request throws** (`src/server/session.ts`). Distinct per scope.                                                                         |
| `DEMO_EMAIL`                                                 |     ✔      |    ✔    | the agent (Config)   | The demo account's login.                                                                                                                                                  |
| `DEMO_PASSWORD_HASH`                                         |     ✔      |    ✔    | the agent (Secret)   | A **raw** bcrypt hash (`$2b$10$…`), never `\$`-escaped: with no `.env*` file the platform's value reaches the app untouched (README, "Demo credentials"). Cost 10, `bcryptjs`. |
| `DEMO_PASSWORD_DISPLAY`                                      |     ✔      |    ✔    | the agent (Config)   | The same password in plain text; the login page prints it (NFR-S1, ADR-0006). A throwaway the owner approved, used nowhere else.                                           |
| `RESET_SECRET`                                               |     ✔      |    ✔    | the agent (Secret)   | Bearer secret of `POST /api/admin/reset`. Distinct per scope.                                                                                                              |
| `CRON_SECRET`                                                |     ✔      |    —    | the agent (Secret)   | Production only; at least 16 random characters (backlog T-08). Vercel sends it as `Authorization: Bearer` on the cron call.                                                |
| `WEBMCP_MODE`                                                |     ✔      |    ✔    | the agent (Config)   | `polyfill`. Inlined into the client bundle as `NEXT_PUBLIC_WEBMCP_MODE` **at build**: a change needs a new deployment.                                                     |
| `WEBMCP_ORIGIN_TRIAL_TOKEN`                                  |     ✔      |    —    | the agent (Config)   | Production only, empty elsewhere (ADR-0007). It is printed into every page as a `<meta>` tag, so it is not a secret.                                                       |
| `APP_ENV`                                                    |     —      |    —    | **nobody**           | **Never set on Vercel.** `test` there is refused at build and start (TD-10) because it would expose the unauthenticated `/api/test/*` reset and seed routes.                |
| `RESET_INTERVAL_DAYS`, `RESET_ROW_THRESHOLD`, `RESET_BYTES_THRESHOLD` | — | —    | nobody               | Unset: the documented defaults (10 days, 2000 rows, 50 MB) apply (SPEC-reset-and-test-support §2.3–2.4).                                                                   |
| `VERCEL_AUTOMATION_BYPASS_SECRET`                            |     ✔      |    ✔    | Vercel               | Present in a deployment once "Protection Bypass for Automation" exists (plan F10). The agent's own copy is `VERCEL_BYPASS` in the 0600 files below.                        |

The Vercel setting "Automatically expose System Environment Variables" must stay **on**: TD-10's
`VERCEL` / `VERCEL_ENV` refusal of `APP_ENV=test` needs it (plan step 5.3; both lines exist, the
second refuses a non-local `DATABASE_URL` whatever the platform says).

### Where the values live

The agent generates each value (`openssl rand -base64 48`) and writes each scope's set to
`~/.config/personal-finance-deploy/production.env` and `…/preview.env` — mode `0600`, **outside the
repository** (plan Q3 = a). The owner keeps the files or moves them into a password manager.
Every check below reads them without printing. A file holds `NAME='value'` lines — **every value
single-quoted**, so a shell that sources the file does not expand the `$` characters of a bcrypt
hash (`DEMO_PASSWORD_HASH='$2b$10$…'`) — and it is read **one way only**: sourced by a shell
(`set -a; . file; set +a`), which strips the quotes. Never `grep '^NAME=' | cut -d= -f2-`: that
keeps the quotes, and a quoted hash stored in Vercel makes bcrypt reject it, so every login on
the deployment fails (and a Secret cannot be read back to notice).

## Rules that do not bend

1. **Never run `vercel env pull`, `neon link` or `neon env pull` inside this repository.** The
   first writes `.env.local` by default (`vercel env pull --help`, CLI 60.0.1, "default:
   .env.local"), the second `.env` if it exists, else `.env.local` (Neon CLI README); `.env*` is
   git-ignored, so nothing would be committed — the danger is local: a production URL in
   `.env.local` makes a plain `next dev` use the production database, which TD-10 does not guard,
   and `npm run db:reset` would then meet a remote `DATABASE_URL`. If a pull is ever needed, run it
   from a scratch directory outside the checkout (`cd "$(mktemp -d)" && vercel env pull
   --environment preview .env.preview --project personal-finance`, deleted afterwards; the flags are
   those of `vercel env pull --help`, CLI 60.0.1 — the command itself was not run). `.neon` and
   `.vercel` are git-ignored too (plan F13).
2. **No secret value in any output, log, commit, pull-request text or process-log entry.** Setting
   a value reads it from stdin, not from `--value` (a command-line value shows in `ps` and in shell
   history).
3. **`vercel env ls --json` (or `--format json`) prints readable values** for variables stored as
   Config (`vercel env ls --help`, CLI 60.0.1). Use the plain `vercel env ls`: names, types and
   scopes — its value column shows `Hidden` for a Secret and, for a Config value, only the start of
   Vercel's encrypted `eyJ2Ijoi…` envelope (measured 2026-09-26), never the value.
4. **The production database is never seeded, reset or redeployed by hand before the pull request
   that first deploys with a database has merged** (plan invariant, F4 — see step 1).
5. **A TD-14-style finding on a live host goes into a private GitHub security advisory draft**, not
   a pull request or the log, until its fix is merged (backlog T-13d, owner decision).

## Steps

### 1. First deploy and the invariant

- The first deployment of a new Vercel project is **always** production, even from a branch that is
  not the production branch (vercel.com/docs/deployments/environments; plan F4). So the project is
  imported from `main` in the dashboard with **no environment variables** (plan Q5 = a): that
  deployment builds and runs without a database, pages that read data answer 500, and the
  production database (an empty Neon branch) holds no seed data until the T-14 pull request has
  merged and passed its checks on its own preview.
- **Vercel's import screen pre-fills the environment variables from `.env.example`** (measured
  2026-09-25: 13 Secret variables for Production and Preview, created with the project) — empty the
  list before creating the project, or delete them afterwards, once per name:
  `vercel env rm NAME --project personal-finance --yes`. `vercel env ls --project personal-finance`
  must then say "No Environment Variables found". While `DATABASE_URL` exists the Neon integration
  fails.
- **A data-free production answers `/` with 302 to `/login` and `/login` with 500** (measured on the
  project domain, 2026-09-26, and on the CLI deployment's alias the day before): the login page
  prints the demo credentials, and `DEMO_EMAIL` / `DEMO_PASSWORD_DISPLAY` are unset (an environment
  change never reaches an existing deployment). That is the invariant working, not a fault; nobody
  redeploys it by hand before the pull request has merged.
- If the dashboard shows "No Production Deployment … push to main, or run vercel --prod" (as it did
  here, the import having created the project without a build), make the first deployment from a
  clean export, never from the checkout: `git archive --format=tar --output=<tmp>/main.tar origin/main`,
  extract it into an empty scratch directory outside the repository, then
  `vercel deploy <scratch-dir> --prod --project personal-finance --yes`. It is a `cli`-source
  deployment (no Git commit) and gets only the team alias `personal-finance-<team>.vercel.app`, which
  is SSO-protected. The project's own domain is attached with
  `vercel alias set <deployment-url> <project-domain>` — the owner ran it in a terminal outside the
  agent session, because the agent's harness rejects every command line containing the word "alias".
- **The project domain does not follow a new production deployment on its own.** The first Git
  production deployment (PR #60's merge) got only the team alias and `…-git-main-…`; the project
  domain kept serving the old CLI deployment (a data-free `/login` 500 for the public) because the
  project's `autoAssignCustomDomains` was `false` (`vercel api /v9/projects/<project>`). The owner
  ran `vercel promote <new-deployment-url> --scope <team> --yes` from an empty scratch directory
  (`cd "$(mktemp -d)"`, so nothing is linked in the checkout), which moved the domain — Vercel's
  rollback page says promoting "restores auto-assignment of production domains", but the API still
  said `false` afterwards, so switch it on (Settings → Environments → Production, or `vercel api
  /v9/projects/<project> -X PATCH -F autoAssignCustomDomains=true`) and **check after every
  production deployment** that the domain answers from the new one (the same `/login` 200 check as
  in step 5, or the deployment's `alias` list from `vercel api /v13/deployments/<id>`). Confirmed
  2026-09-26: with the setting on (the owner switched it on in the dashboard; the API then said
  `true`), PR #61's production deployment carried the project domain in its `alias` list on its own.
- **Under Claude Code's auto mode the agent may not write to the secret store or deploy to
  production**: `vercel env add`/`rm` and `vercel deploy --prod` were refused as agent commands
  ("Secret-Store Writes", "Production Deploy") and are run by the owner with `!` — for the
  variables, a script that sources the 0600 files and prints names only. Reads, `gh variable set`,
  a scratch preview deployment and `vercel remove` of it were allowed.
- Creating the project with `vercel` from a laptop would make an unmerged branch production. Never
  do that; deploy a scratch directory with `--project personal-finance` (an unlinked directory
  offers to create a new project).
- The Neon integration needs a Vercel project that is already linked to Git, and fails if
  `DATABASE_URL` (or `PGHOST`, `PGUSER`, `PGDATABASE`, `PGPASSWORD`) already exists there — which is
  why the import has no variables (plan F3). It sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED` for
  Production and Development only (Preview values are injected per deployment) and creates the
  `vercel-dev` branch. After installing it, check that no new production deployment appeared
  (`vercel ls personal-finance`; measured 2026-09-26: none did).

### 2. Setting a value without printing it

The form, from `vercel env add --help` (CLI 60.0.1): `vercel env add NAME [environment]
[--git-branch NAME] [--sensitive | --no-sensitive] [--project NAME] [--force] [--yes]`; "`--value`
… for non-interactive use; otherwise use stdin or the prompt". So the value comes from the 0600
file through a pipe, and only the variable's name appears on the command line:

```sh
set -a; . ~/.config/personal-finance-deploy/production.env; set +a   # quotes stripped by the shell
# Secret (Vercel does not show the value again): from the variable, never echoed.
printf '%s' "$SESSION_SECRET" | vercel env add SESSION_SECRET production --sensitive --project personal-finance
# Config (readable in the dashboard): for values that are not secret.
printf '%s' polyfill | vercel env add WEBMCP_MODE production --no-sensitive --project personal-finance
vercel env ls --project personal-finance            # names, types and scopes (rule 3)
```

**Before the demo hash is set** (a Secret cannot be read back, so this is the only check), from the
repository root, with the file sourced as above — booleans only, nothing printed:

```sh
node -e 'const b=require("bcryptjs");const h=process.env.DEMO_PASSWORD_HASH;console.log({rawBcrypt:/^\$2[aby]\$\d\d\$/.test(h),matchesDisplayedPassword:b.compareSync(process.env.DEMO_PASSWORD_DISPLAY,h)})'
```

Both must be `true`.

For Preview, plan step 5.6 *predicted* that `vercel env add NAME preview` asks for a Git branch
(empty = every non-production branch). With `--yes` and the value on stdin no prompt appeared —
the prompt itself was never observed — and the API then showed `gitBranch: null`, i.e. every
non-production branch; the form used is in the record table. Changing a value **never** changes a deployment that already exists:
"Any change you make to environment variables are not applied to previous deployments, they only
apply to new deployments" (vercel.com/docs/environment-variables, `last_updated` 2026-09-17), so
every rotation below ends with a redeployment.

### 3. Migrations

They run in the Vercel build, before `next build`, through the direct URL: every preview migrates
its own Neon branch, production migrates on each deployment, and a failed migration fails the
build, so no deployment runs against an older schema (plan Q2). The build log must show
`prisma migrate deploy` applying the pending migrations to the unpooled host. A rollback (below)
does not run them again and does not undo them: a migration must stay compatible with the previous
deployment's code (inference: Prisma's `migrate deploy` applies forward only).

### 4. The first seed

After the T-14 pull request has merged and production has built with its database: `POST
/api/admin/reset` with `Authorization: Bearer <production RESET_SECRET>` and an empty body
(SPEC-reset-and-test-support §2.2, §2.5) calls `resetToSeed(db, "manual")` and answers 204;
`GET /api/meta` then returns a `lastResetAt`, and the function log shows `reset reason=manual
rows=<n> requestId=<id>` (BIZ-02, `src/server/admin-reset.ts`). Note the other way in: a database with no `ResetLog` row is **due**
(§2.2), so the first scheduled cron call would seed it as well, with `reason: "scheduled"`.

```sh
set -a; . ~/.config/personal-finance-deploy/production.env; set +a
# The header goes to curl through a config on stdin, not on the command line (`ps`, shell history).
printf 'header = "Authorization: Bearer %s"\n' "$RESET_SECRET" \
  | curl -sS -K - -o /dev/null -w '%{http_code}\n' -X POST "https://personal-finance-cyan-kappa.vercel.app/api/admin/reset"   # 204
```

The host is the project's own production domain, the one in the platform map — **never
`personal-finance.vercel.app`**: that name belongs to someone else, and the command sends a secret.
(On a preview, use the preview's URL and `preview.env`, and send `x-vercel-protection-bypass:
$VERCEL_BYPASS` in the same stdin config; `prompts/2026-09-25-T-14/scripts/preview-seed.sh` does
exactly that.)

### 5. Checks after a deploy

Use the deployment's URL and, for a preview, the bypass header (Standard protection answers 401 or
a Vercel login without it — that is check zero). What each result must be is in the plan's steps;
the commands are:

- **TD-14, the proxy and `.rsc`** (plan 6.5). With a session (`POST /api/auth/login`, demo
  credentials, keep the `pf_session` cookie), `GET /overview` with `RSC: 1` gives the marker — a
  string only the page's data produces, taken from that body. Then, **without** a cookie: `GET
  /overview.rsc`, `/overview.segments/_tree.segment.rsc`, `/api/overview.json` and `/overview`
  with `RSC: 1`. Record, for each, the status, whether `X-Request-Id` is present (the proxy sets it
  on every response it handles, `tests/api/proxy.spec.ts`), the `Content-Type` and whether the
  body holds the marker. Safe = no body holds it. Exposed = one does: rule 5.
- **Headers** (plan 6.6): `GET /` without a session → 302 `/login`; `/login`, `/overview`
  (signed in) and `/api/meta` carry `Content-Security-Policy` with a fresh nonce,
  `Referrer-Policy`, `X-Content-Type-Options`, `X-Request-Id` and no `X-Powered-By`. On production
  also `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (plan F8). The
  URL forms that skip the proxy — `/overview.segments/*` (200) and `/api/overview.json` (404) —
  carry **none** of these headers (measured 2026-09-26, TD-19).
- **Lighthouse** (plan 8.6): the workflow's first automatic run after a merge comes **before** the
  first seed, so its "The deployment must be seeded" step fails on purpose — seed (step 4), then run
  it by hand (Actions → Lighthouse → Run workflow). It judges the median of three runs, and it does
  **not** assert NFR-P2's INP: Lighthouse's INP audit supports only `timespan` mode and `lhci
  autorun` runs `navigation` mode. Owner decision, 2026-09-26: INP stays unasserted;
  `total-blocking-time` is read from the first production run and decided on with that data — the
  first real run's reports were never uploaded (`.lighthouseci` is hidden and `upload-artifact`
  skips hidden files unless `include-hidden-files: true`; fixed in the close-out pull request), so
  read TBT from the next run's artifact. `gh workflow run lighthouse.yml --ref main` starts it
  from a terminal. Its first real run (2026-09-26, GitHub's runner, mobile preset): `/overview`
  median-run LCP 2623.9 ms failed the 2500 ms assertion (TD-21); `/transactions` passed. The second
  run (the automatic one after PR #61's deployment, its artifact now uploaded and free of the cookie)
  gave `/overview` 2593.8 ms again, so the miss repeats; **the owner accepted it as a documented
  exception (2026-09-26, TD-21)** and the assertion stays at 2500 ms, which means **the workflow is
  red after every production deployment** until TD-21 is fixed or the limit is changed — a red run
  is not a fault (it is not a required check). Read the reports from the run's artifact
  (`gh run download <id> -n lighthouse -D <dir>`; the per-run LCP, TBT and the LCP element are in
  the `*.report.json` files).
- **Cron** (plan 8.4): `GET /api/admin/reset` with `Authorization: Bearer $CRON_SECRET` and no body
  answers 200 `{ "reset": false, "dueAt": … }` when the interval has not passed, 204 when it has
  (SPEC-reset-and-test-support §2.2); it must not redirect (`curl -sS -o /dev/null -w
  '%{http_code} %{redirect_url}\n'`). The scheduled run's own log line is `reset skipped
  reason=scheduled dueAt=<time> requestId=<id>` or `reset reason=scheduled rows=<n> requestId=<id>`
  (`src/server/admin-reset.ts`). **Hobby keeps runtime logs for one hour** (vercel.com/docs/limits,
  `last_updated` 2026-09-16), so "the day after" reads nothing: read the line within the hour after
  03:00 UTC (`vercel logs`, or the dashboard), or infer the run from `GET /api/meta` — `lastResetAt`
  moves only when a reset happened. The same limit applies to step 4's `reset reason=manual` line.
  Vercel does not retry a failed run (plan F11). **To test the cron right after a deployment**,
  Settings → Cron Jobs → **Run** in the dashboard starts the same call: on 2026-09-26 (05:01:58 UTC,
  PR #61's deployment) it reached the deployment's own host — the per-deployment URL, which Vercel
  Authentication protects — with the `CRON_SECRET` header and got 200 with `reset skipped
  reason=scheduled dueAt=…` in the log, so Deployment Protection does not block Vercel's cron call
  (`vercel logs -d <deployment-url> --since 30m --json`, inside the one-hour window). The cron
  definition lives on the latest production deployment (`vercel api /v9/projects/<project>`,
  `.crons.definitions[].host`), so run this test after each deployment. The 03:00 UTC schedule
  itself had not been observed when T-14 closed (the first window was over before anyone looked).
- **A preview's secret does not open production** (plan Review Focus 3): the preview's
  `RESET_SECRET` against production's `/api/admin/reset` → 401.
- **Login lockout** (TD-17): after ten failed logins from one address the eleventh is 429. Any
  check that spoofs `X-Forwarded-For` runs **last**, because it can lock out the machine's real
  address for 15 minutes.

### 6. The origin-trial token (WebMCP native mode)

1. In Chrome's origin-trial console (developer.chrome.com/origintrials), register the WebMCP
   trial for the exact origin `https://personal-finance-cyan-kappa.vercel.app` — the project's own
   production domain, as in the platform map and the record table. A token is bound to one origin,
   and `vercel.app` is on the Public Suffix List, so there are no subdomain tokens for `vercel.app`
   itself: every preview URL is another origin and gets none (plan F14).
2. Add the token to `~/.config/personal-finance-deploy/production.env` with an editor, then set
   `WEBMCP_ORIGIN_TRIAL_TOKEN` for **Production** only, `--no-sensitive` (step 2; the CLI warns
   "This name or value looks like a credential. Config values can be revealed after saving" — expected:
   the token is printed into every page). It reaches production with the **next production
   deployment** (step 2's rule); redeploy if none is coming.
3. Check, signed in: `GET /api/meta` says `webmcp.originTrial: true`, and the HTML of `/overview`
   holds exactly one `<meta http-equiv="origin-trial" content="…">` whose content is the token. The
   tag is rendered by the `(app)` layout (SPEC-app-shell §2.1), so **`/login` has none, by design**
   — this page said `/login` until 2026-09-26, and that check was wrong. A preview has none
   (`/api/meta` → `originTrial: false`). `prompts/2026-09-25-T-14/scripts/t8-ot.sh` does the check
   with the demo account and prints counts and booleans only.
4. **Renew before Chrome 156 and before 2026-11-17** (ADR-0007). Chrome's console (2026-09-26): "Up to
   Chrome 156 (ends with the rollout of next Chrome release), no later than Nov 17, 2026". The
   token itself decodes to origin `https://personal-finance-cyan-kappa.vercel.app:443`, feature
   `WebMCP`, `isSubdomain: true` and expiry **2026-11-17T00:00:00Z** (its payload starts after a
   one-byte version, a 64-byte signature and a four-byte length — `prompts/…/scripts/ot-expiry.sh`
   prints only those fields). Renewal is the same registration, the same variable (remove and add,
   or `--force`), and a production deployment.

### 7. The headed native check and the relay demo

- The headed native-mode check is `docs/04-process/runbooks/webmcp-native-check.md` (T-12's
  hand-off). Do not copy it here. On production, with the token from step 6, no flag is needed;
  everywhere else it still needs `chrome://flags/#enable-webmcp-testing`.
- The relay demo — the deployed app's tools reaching Claude Code through
  `@mcp-b/webmcp-local-relay` — is named by ADR-0004 (Runbook, "relay demo"). **Its commands are
  not recorded here because nobody has run it yet** (as `webmcp-native-check.md` says of its own
  labels): after the first run, write the exact steps and what was seen into the record table.

### 8. Rotating a secret

Each rotation is: generate a new value into the 0600 file, `vercel env add … --force` for that
scope (step 2), redeploy that scope (a new commit, or "Redeploy" on the latest deployment), check.
What breaks in between:

| Secret                                   | While it rotates                                                                                                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SESSION_SECRET`                         | Every existing session stops opening: everyone (the demo account) signs in again. Nothing else breaks.                                                                     |
| `RESET_SECRET`                           | Nothing scheduled uses it (the cron uses `CRON_SECRET`); manual resets and the runbook checks must use the new value.                                                        |
| `CRON_SECRET`                            | Vercel sends whatever value the deployment has. A cron call landing between the change and the redeploy meets the other value: 401, **no retry**; the next day's call catches up, because the reset is interval-based (§2.3). Rotate away from 03:00 UTC. |
| Demo password (hash **and** display)     | Change both variables together and redeploy; change the repository variable `DEMO_PASSWORD` (Lighthouse's sign-in) at the same time or the workflow's login step fails.       |
| Protection-bypass secret                 | Create the new one in the dashboard, update `VERCEL_BYPASS` in both files. Nothing in the repository uses it (Lighthouse measures the project's own domain, which needs no bypass). |
| Neon database password                   | Belongs to the Neon integration. Rotate in Neon; **whether the integration then rewrites `DATABASE_URL*` on its own is not documented** (untested) — check `vercel env ls`, then redeploy. |

See also vercel.com/docs/environment-variables/rotating-secrets (linked from the environment-variables page, not read for this runbook).

### 9. Rollback

- **Instant Rollback** points the production domains back at a previous production deployment.
  "Hobby users can roll back to the immediately previous deployment" (vercel.com/docs/instant-rollback,
  `last_updated` 2026-07-07). From the CLI: `vercel rollback <deployment-url-or-id>`;
  `vercel rollback status` shows a pending rollback.
- After a rollback Vercel **turns off auto-assignment of production domains**: new pushes to `main`
  no longer go live until you undo it with `vercel promote <deployment>` (same page).
- It restores the deployment, **not** the world around it: environment variables are not changed
  ("Vercel won't update environment variables …"), cron jobs revert to the rolled-back
  deployment's state, and the database is untouched — a migration already applied stays applied
  (step 3). If a bad migration is the cause, a rollback alone does not fix it; a forward fix
  migration does.
- A rollback is a way to stop bleeding, not a step of a normal release. Record it in the process log.

## Record (fill in after each run)

| Date       | What                                                      | Result | Notes |
| ---------- | --------------------------------------------------------- | ------ | ----- |
| 2026-09-25 | Production domain Vercel assigned (plan step 5.2)         | `personal-finance-cyan-kappa.vercel.app` (project domain; the team alias `personal-finance-ruslan-496a.vercel.app` is SSO-protected) | `personal-finance.vercel.app` taken; the project domain was attached by `vercel alias set` (step 1) |
| 2026-09-26 | `vercel env add` form used for Preview (plan step 5.6)    | `printf '%s' "$VALUE" \| vercel env add NAME preview --sensitive\|--no-sensitive --project personal-finance --yes` — no branch prompt; the API shows `gitBranch: null` (all non-production branches) | run by the owner through `set-env.sh`; `--yes` was enough |
| 2026-09-26 | First Git production deployment (PR #60's merge, `44ff1b6`): migrations applied, seed 204 | `prisma migrate deploy` applied both migrations to the production Neon host (`ep-patient-shadow-…`); `POST /api/admin/reset` → 204, `/api/meta` → `lastResetAt`; the function log had `reset reason=manual rows=59` (read within the hour) | the project domain still pointed at the old CLI deployment until the owner ran `vercel promote <deployment-url> --scope <team> --yes` from a scratch directory; `autoAssignCustomDomains` was `false` (step 1) |
| 2026-09-26 | Production checks after the seed (plan 8.3, 8.4)          | smoke on the public domain all as expected (headers, HSTS `preload`, `Secure` cookie, the seed's balance in `/overview`); the preview's `RESET_SECRET` → 401; `GET /api/admin/reset` with `CRON_SECRET` → 200 `{"reset":false,"dueAt":"2026-10-05T…"}`, no redirect | run through `prompts/2026-09-25-T-14/scripts/` (`task8-secrets.sh` by the owner, `t8-smoke.sh` by the agent) |
| 2026-09-26 | Lighthouse (plan 8.6): the first automatic run, then `workflow_dispatch` after the seed | the automatic run started on the production `deployment_status` (environment `Production`, as predicted) and stopped at "The deployment must be seeded", as designed; the dispatched run's Chrome started on the GitHub runner without `--no-sandbox`; `/overview` median-run LCP **2623.9 ms** (> 2500, NFR-P2) failed the assertion, `/transactions` passed every assertion | the reports were not uploaded (`.lighthouseci` is hidden; fixed by `include-hidden-files: true`, `docs/T-14-close-out`); TD-21 |
| 2026-09-26 | Lighthouse, second run (automatic, after PR #61's deployment; seeded database) | `/overview`: performance 0.92 / 0.97 / 0.97, LCP 2325 / 2593 / 2594 ms (median-run 2593.8 — over 2500), CLS 0, TBT 252 / 86 / 62 ms, server response 20 ms; `/transactions`: performance 0.99 / 0.99 / 0.98, LCP 1986 / 1990 / 2291 ms, CLS 0, TBT 108 / 92 / 87 ms. The `/overview` LCP element is the reset banner's text; its phases (median run): TTFB 644 ms (simulated), load delay 0, load time 0, **render delay 1950 ms**. The artifact uploaded, 26 files, none with the session cookie (24 with `[redacted]`) | run 36219369143; the assertion failed on `/overview` LCP only — accepted as an exception by the owner (TD-21, 2026-09-26); the workflow stays red after each production deployment |
| 2026-09-26 | The project domain after the next production deployment | PR #61's deployment carried `personal-finance-cyan-kappa.vercel.app` in its `alias` list and served it (`/login` 200, `/api/meta` 200) | `autoAssignCustomDomains` had been switched on by the owner first (step 1) |
| 2026-09-26 | Cron: the dashboard's "Run" on PR #61's deployment (05:01:58 UTC) | `GET /api/admin/reset` → 200; log `reset skipped reason=scheduled dueAt=2026-10-05T20:27:20.051Z`; host = the per-deployment URL (SSO-protected), no user agent | Vercel's cron call passes Deployment Protection and carries `CRON_SECRET` (Review Focus 5's open question). |
|            | The first scheduled cron run (03:00 UTC, Hobby: any time in that hour) |        | not observed by T-14: logs last one hour — read at 03:00–04:00 UTC, or infer from `lastResetAt` (it moves only when a reset happens, so "not due" leaves no trace) |
| 2026-09-26 | Origin-trial token registered and set (plan 8.5) | origin `https://personal-finance-cyan-kappa.vercel.app:443`, feature `WebMCP`, `isSubdomain: true`, token expiry **2026-11-17T00:00:00Z** (Chrome: "Up to Chrome 156 …, no later than Nov 17, 2026"); `/api/meta` → `originTrial: true`; one `<meta http-equiv="origin-trial">` on the signed-in `/overview` with the configured token, none on `/login` (outside the `(app)` layout) | set by the owner with `set-ot.sh` (Config, Production); the step-6 check said `/login` until now |
|            | Relay demo — exact steps and what was seen                |        |       |
