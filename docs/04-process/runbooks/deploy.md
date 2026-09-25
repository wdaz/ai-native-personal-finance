# Runbook — deploy (Vercel, Neon, secrets, first seed, rotation, origin trial)

Status: **Draft — written before the first deployment** (T-14, 2026-09-25) · Author(s): Agent ·
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
| Branch limit        | Neon Free allows 10 branches: `production`, `vercel-dev` and one per open preview                                                                                                         | plan Q1                                                                                         |
| Branch clean-up     | "Automatically delete obsolete Neon branches" is opt-in (on here) and **runs the next time a preview deployment is created**, so a merged PR's branch lingers until then                  | plan F3; neon.com/docs/guides/vercel-branch-cleanup                                             |
| Migrations          | `buildCommand` = `npx prisma migrate deploy && npm run build`; Prisma's CLI connects through `DATABASE_URL_UNPOOLED` when set (`prisma.config.ts`, `migrationDatabaseUrl`)                 | `vercel.json`; plan F5, Q2                                                                      |
| Why the direct URL  | Neon's pooler is PgBouncer in transaction mode and has no session-level advisory locks; schema migrations need a direct connection                                                       | neon.com/docs/connect/connection-pooling                                                        |
| Deployment Protection | **Standard**: Vercel Authentication on every deployment URL except production domains; "Protection Bypass for Automation" sends `x-vercel-protection-bypass: <secret>`                  | plan F10; vercel.com/docs/deployment-protection                                                 |
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
   --environment preview .env.preview --project personal-finance`, deleted afterwards). `.neon` and `.vercel` are git-ignored too
   (plan F13).
2. **No secret value in any output, log, commit, pull-request text or process-log entry.** Setting
   a value reads it from stdin, not from `--value` (a command-line value shows in `ps` and in shell
   history).
3. **`vercel env ls --json` (or `--format json`) prints readable values** for variables stored as
   Config (`vercel env ls --help`, CLI 60.0.1). Use the plain `vercel env ls`: names and scopes.
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
- **A data-free production answers `/` with 302 to `/login` and `/login` with 500**: the login page
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
vercel env ls --project personal-finance            # names and scopes only (rule 3)
```

**Before the demo hash is set** (a Secret cannot be read back, so this is the only check), from the
repository root, with the file sourced as above — booleans only, nothing printed:

```sh
node -e 'const b=require("bcryptjs");const h=process.env.DEMO_PASSWORD_HASH;console.log({rawBcrypt:/^\$2[aby]\$\d\d\$/.test(h),matchesDisplayedPassword:b.compareSync(process.env.DEMO_PASSWORD_DISPLAY,h)})'
```

Both must be `true`.

For Preview, `vercel env add NAME preview` asks for a Git branch; leaving it empty means every
non-production branch. The exact non-interactive form used the first time is recorded in the
record table (plan step 5.6). Changing a value **never** changes a deployment that already exists:
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
curl -sS -o /dev/null -w '%{http_code}\n' -X POST "https://personal-finance.vercel.app/api/admin/reset" \
  -H "Authorization: Bearer $RESET_SECRET"     # 204
```

(On a preview, add `-H "x-vercel-protection-bypass: $VERCEL_BYPASS"` and use `preview.env`. The
secret is briefly visible in this process's arguments on this machine; the file stays the only
place it is stored.)

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
  also `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (plan F8).
- **Cron** (plan 8.4): `GET /api/admin/reset` with `Authorization: Bearer $CRON_SECRET` and no body
  answers 200 `{ "reset": false, "dueAt": … }` when the interval has not passed, 204 when it has
  (SPEC-reset-and-test-support §2.2); it must not redirect (`curl -sS -o /dev/null -w
  '%{http_code} %{redirect_url}\n'`). The scheduled run's own log line is `reset skipped
  reason=scheduled dueAt=<time> requestId=<id>` or `reset reason=scheduled rows=<n> requestId=<id>`
  (`src/server/admin-reset.ts`). **Hobby keeps runtime logs for one hour** (vercel.com/docs/limits,
  `last_updated` 2026-09-16), so "the day after" reads nothing: read the line within the hour after
  03:00 UTC (`vercel logs`, or the dashboard), or infer the run from `GET /api/meta` — `lastResetAt`
  moves only when a reset happened. The same limit applies to step 4's `reset reason=manual` line.
  Vercel does not retry a failed run (plan F11).
- **A preview's secret does not open production** (plan Review Focus 3): the preview's
  `RESET_SECRET` against production's `/api/admin/reset` → 401.
- **Login lockout** (TD-17): after ten failed logins from one address the eleventh is 429. Any
  check that spoofs `X-Forwarded-For` runs **last**, because it can lock out the machine's real
  address for 15 minutes.

### 6. The origin-trial token (WebMCP native mode)

1. In Chrome's origin-trial console (developer.chrome.com/origintrials), register the WebMCP
   trial for the exact origin `https://personal-finance.vercel.app` (or the domain in the record
   table). A token is bound to one origin, and `vercel.app` is on the Public Suffix List, so there
   are no subdomain tokens: every preview URL is another origin and gets none (plan F14).
2. Set `WEBMCP_ORIGIN_TRIAL_TOKEN` for **Production** only (step 2, `--no-sensitive`), then
   **redeploy** production (step 2's rule).
3. Check: the production page's HTML holds `<meta http-equiv="origin-trial" content="…">`, and a
   preview's does not (`curl -sS <url>/login | grep -c 'http-equiv="origin-trial"'` → 1 and 0).
4. **Renew before Chrome 156** (ADR-0007). The trial runs in Chrome 149–156 (plan F14); the exact
   expiry date is not on Chrome's pages, so read it in the console when registering and write it
   in the record table. Renewal is the same registration, the same variable, a redeploy.

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
| Protection-bypass secret                 | Create the new one in the dashboard, update `VERCEL_BYPASS` in both files. Nothing in the repository uses it (Lighthouse measures the production alias).                     |
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
|            | First production deployment: migrations applied, seed 204 |        |       |
|            | Origin-trial token registered — expiry date read          |        |       |
|            | Relay demo — exact steps and what was seen                |        |       |
