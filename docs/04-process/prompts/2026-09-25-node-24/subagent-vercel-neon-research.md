# Before T-14 — subagent brief and report: Vercel, Neon and Prisma documentation research

Dispatched: Agent tool, `subagent_type: general-purpose` (the session's model, Opus 5.5),
background, from the session recorded in `process-log.md` "Phase 5: before T-14 — the deploy
accounts, and Node 24". A research task, not a review: the brief asked it to write nothing, and it
was not given read-only tools (governance.md's read-only rule is for review and verification
subagents). Brief and report are copied word for word below, re-wrapped to the repository's line
width, with the report's title set in bold instead of as a heading; its conclusions are its own and were not all
re-checked — the main session re-read the Node versions page and the region pages itself before
relying on them. This report is the documentation input the T-14 plan starts from.

## Brief (verbatim)

Research task, read-only. Do NOT modify any files, do NOT run git commands that write. Use
WebFetch/WebSearch (load them via ToolSearch "select:WebFetch,WebSearch" first). Cite every fact
with the exact URL and today's date (2026-09-25) as "read 2026-09-25". If a doc page does not
state something, say "not stated" — never guess.

Context: a Next.js 16 app (App Router, `proxy.ts`), Prisma 7 with Postgres, to be deployed on
Vercel Hobby (personal GitHub account `wdaz`, public repo `wdaz/ai-native-personal-finance`) with
Neon Postgres. Production = `main` branch. Every PR should get a preview deployment pointing at its
own Neon database branch, deleted on PR close. There's a daily Vercel cron (`0 3 * * *`) hitting
`/api/admin/reset`. The repo's GitHub Actions only allow GitHub-owned actions pinned by full SHA
(`allowed_actions: selected`, `sha_pinning_required`).

Answer these questions from official Vercel / Neon / Prisma docs:

1. Vercel Git integration: what's needed to connect a GitHub repo on the Hobby plan; which branch
   becomes production; are previews automatic for every PR; any restriction for Hobby (commercial
   use, org repos, build minutes, function duration limits).
2. Node.js version on Vercel: which versions are supported now (is Node 26 available?), how it's
   chosen (`engines.node` in package.json vs project setting). Which npm version ships with the
   build image for that Node version, if stated.
3. Install/build: default install command when package-lock.json exists (`npm install` or
   `npm ci`?), can it be overridden; does Vercel honour `.npmrc`; is there anything about npm
   `allowScripts`/`strict-allow-scripts`.
4. Environment variables: scopes (Production / Preview / Development), branch-specific preview
   vars, "Sensitive" env vars, size limits. The "Automatically expose System Environment
   Variables" project setting — what it does, is it on by default, which vars (`VERCEL`,
   `VERCEL_ENV`, `VERCEL_URL`, etc.) are available at build vs runtime regardless of that setting.
5. `vercel env pull`: which file does it write by default (`.env.local`? `.env`?), and does it
   include system vars like `VERCEL`, `VERCEL_ENV`.
6. Cron jobs on Hobby: how often allowed, timing precision (within the hour?), how `CRON_SECRET`
   works (Authorization: Bearer header), whether crons run on preview deployments, whether
   redirects are followed.
7. Neon + Vercel: the Neon integration on the Vercel Marketplace (native "Neon Postgres"
   integration vs the older "Neon Vercel integration" / connected account) — does it automatically
   create a Neon branch per Vercel preview deployment and inject `DATABASE_URL` (and
   `DATABASE_URL_UNPOOLED` or similar) into that preview? Does it delete branches on PR
   close/branch delete? Hobby/free-tier branch limits. Contrast with the GitHub Actions approach
   (`neondatabase/create-branch-action`) — note that this is a third-party action.
8. Prisma 7 + Neon: does `prisma migrate deploy` need the direct (non-pooled) connection string,
   and how Prisma 7's `prisma.config.ts` handles the migration URL vs the runtime URL (e.g.
   `directUrl` removed? datasource url in config?). Does Prisma 7 need `prisma generate` to run
   explicitly in the Vercel build (no automatic postinstall generate)?
9. Deployment Protection on Hobby: are preview deployments protected by Vercel Authentication by
   default (which would block an unauthenticated `curl` against a preview URL)? How to bypass for
   automation (Protection Bypass for Automation header) and whether that's available on Hobby.
10. Lighthouse CI against a Vercel deployment: official or common approaches (GitHub Action
    `treosh/lighthouse-ci-action` is third-party; `@lhci/cli` via npm), anything Vercel documents
    about it.

Return a concise structured report: one section per question, each bullet a fact + URL + "read
2026-09-25". Mark anything uncertain. Keep it under ~900 words.

## Report (verbatim)

**Vercel / Neon / Prisma research report (all sources read 2026-09-25)**

**1. Git integration on Hobby**

- By default Vercel deploys every push, including pushes and PRs to any branch. The latest push to
  each PR gets its own preview URL, posted as a PR comment. PRs from forks need your authorization
  before they deploy. https://vercel.com/docs/git/vercel-for-github
- The production branch defaults to `main`, then `master`, then the repo's default branch. For a
  repo on a personal account you must be its Owner to connect it. Hobby can't connect repos owned
  by a GitHub organization. This doesn't affect `wdaz`, which is a personal account.
  https://vercel.com/docs/git , https://vercel.com/docs/limits
- A new project's first deployment is always a production deployment.
  https://vercel.com/docs/deployments/environments
- Hobby is for non-commercial personal use only.
  https://vercel.com/docs/limits/fair-use-guidelines
- Hobby limits: 45-minute build limit, 1 concurrent build, 100 deployments/day, functions default
  and max 300s (Fluid compute). https://vercel.com/docs/limits ,
  https://vercel.com/docs/functions/configuring-functions/duration

**2. Node.js version**

- Builds and functions offer only 24.x (the default), 22.x and 20.x. Node 20 will be deprecated on
  2026-10-01. https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
- Node 26 is available for Vercel Sandbox only (changelog 2026-05-12). Nothing says when it will
  reach builds or functions.
  https://vercel.com/changelog/node-js-26-x-now-available-on-vercel-sandboxes
- `engines.node` in package.json overrides the Project Setting. The docs' example maps
  `>=20.0.0` to the latest 24.x. What happens with a range no available version satisfies (such as
  `>=26`) is not stated.
- Node 24 ships with npm v11 (changelog 2025-11-25). The exact npm minor version is not stated.
  The package-managers table has rows only for Node 20 and 22 (both npm 10) and none for Node 24.
  https://vercel.com/changelog/node-js-24-lts-is-now-generally-available-for-builds-and-functions ,
  https://vercel.com/docs/package-managers

**3. Install and build**

- When `package-lock.json` is present, the install command is `npm install`, not `npm ci`. You
  can override it in Project Settings or with `installCommand` in vercel.json.
  https://vercel.com/docs/package-managers
- Whether a committed `.npmrc` is honoured: not stated. If the `NPM_RC` or `NPM_TOKEN` env vars
  are set, Vercel creates a `.npmrc` at build time. How that interacts with a committed one: not
  stated. https://vercel.com/kb/guide/using-private-dependencies-with-vercel
- `allowScripts` and `strict-allow-scripts`: Vercel's docs don't mention them. npm's own docs
  (v11.20.0 page) define `strict-allow-scripts` (default false; true turns uncovered install
  scripts into a hard error). https://docs.npmjs.com/cli/v11/using-npm/config/

**4. Environment variables**

- Scopes are Production, Preview and Development; custom environments are Pro and above. A Preview
  variable can target one Git branch, and that value overrides the general Preview value. Changes
  apply only to new deployments. Limits: 64 KB total per deployment, 1000 variables per
  environment. https://vercel.com/docs/environment-variables , https://vercel.com/docs/limits
- "Sensitive" variables work in Production and Preview only, not Development. `vercel env add` now
  defaults to sensitive for those two.
  https://vercel.com/docs/environment-variables/sensitive-environment-variables ,
  https://vercel.com/docs/cli/env
- A changelog dated 2026-08-24 says the Sensitive toggle has been replaced by "Config" and
  "Secret" types, and existing Sensitive variables are treated as Secrets.
  https://vercel.com/changelog/environment-variables-now-use-config-and-secret-types
- The setting is labelled "Enable access to System Environment Variables". It has been on by
  default for new projects since 2020-11-20. Turning it off disables Skew Protection.
  https://vercel.com/docs/environment-variables/system-environment-variables ,
  https://vercel.com/changelog/system-environment-variables-are-now-available-by-default
- `VERCEL`, `VERCEL_ENV`, `VERCEL_URL` and most `VERCEL_GIT_*` are available at build and runtime.
  `CI` and `VERCEL_OIDC_TOKEN` are build-time only; `VERCEL_REGION` is runtime only. Which
  variables exist regardless of the setting: not stated.

**5. `vercel env pull`**

- The default file is `.env.local`: the CLI source has `rawFilename || '.env.local'`. The
  environments page and the KB agree.
  https://raw.githubusercontent.com/vercel/vercel/main/packages/cli/src/commands/env/pull.ts ,
  https://vercel.com/docs/deployments/environments ,
  https://vercel.com/kb/guide/how-to-add-vercel-environment-variables
- One page conflicts and is likely stale: it says the command writes `.env`.
  https://vercel.com/docs/environment-variables
- Whether the pulled file includes `VERCEL` or `VERCEL_ENV` is uncertain; I found no current
  documentation of it. The KB says deployment-only variables "stay empty locally". Running one
  real pull would settle it.

**6. Cron on Hobby**

- One run per day at most; an expression that runs more often fails the deployment. Timing is per
  hour (±59 min), so `0 3 * * *` fires somewhere between 03:00 and 03:59 UTC.
  https://vercel.com/docs/cron-jobs/usage-and-pricing
- If `CRON_SECRET` is set, Vercel sends it as `Authorization: Bearer <CRON_SECRET>`. Failed runs
  are not retried, redirects (3xx) are not followed, and delivery is best effort (runs can be
  missed or duplicated). https://vercel.com/docs/cron-jobs/manage-cron-jobs
- Crons call the production deployment URL with an HTTP GET, user agent `vercel-cron/1.0`. They
  don't run on previews. https://vercel.com/docs/cron-jobs
- **Open question:** whether cron requests get past Deployment Protection when it covers the
  generated `*.vercel.app` URL is not stated.

**7. Neon + Vercel**

- Two integrations support preview branching: the Vercel-managed native one ("Neon Postgres") and
  the Neon-managed "Connectable Account". Both create one Neon branch per Git branch, named
  `preview/<git-branch>`, not one per deployment. https://neon.com/docs/guides/vercel-overview
- Both inject `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED` (direct) and `PG*` variables. The
  Neon-managed one sets them as branch-specific Preview variables.
  https://neon.com/docs/guides/vercel-managed-integration ,
  https://neon.com/docs/guides/neon-managed-vercel-integration
- Cleanup: the Vercel-managed integration deletes a branch only when Vercel's deployment retention
  expires (6 months by default; Neon warns this "can delay branch deletion by months"). The
  Neon-managed one can delete on Git-branch deletion (an opt-in toggle). Neither triggers on PR
  close as such. Whether either works with Vercel Hobby: not stated.
- The Neon Free plan allows 10 branches per project. https://neon.com/docs/introduction/plans
- `neondatabase/create-branch-action@v6` is a third-party action, so this repo's policy
  (GitHub-owned actions only) blocks it. It supports `expires_at`, and there is a separate delete
  action. https://github.com/neondatabase/create-branch-action

**8. Prisma 7 + Neon**

- `directUrl` is removed in v7. The CLI uses `datasource.url` in `prisma.config.ts`, so anyone who
  used `directUrl` for migrations must put that value in `url`. v7 no longer loads `.env`
  automatically. https://www.prisma.io/docs/orm/reference/prisma-config-reference ,
  https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7
- Neon: `migrate` and `db push` "need a direct connection". It recommends
  `url: env('DATABASE_URL_UNPOOLED')` in the config, with the pooled `DATABASE_URL` used at
  runtime. https://neon.com/docs/guides/prisma
- v7 removed the `PRISMA_GENERATE_IN_POSTINSTALL` and `PRISMA_SKIP_POSTINSTALL_GENERATE` env vars,
  which suggests there is no automatic generate on install (my inference). Prisma's Vercel guide
  says to add `"postinstall": "prisma generate"`, with an example `vercel-build` script of
  `prisma generate && prisma migrate deploy && next build`.
  https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel

**9. Deployment Protection**

- Vercel Authentication has been on by default for new projects since 2023-11-02. Standard
  Protection covers everything except production domains, so an unauthenticated `curl` to a
  preview is redirected to the Vercel login.
  https://vercel.com/changelog/deployment-protection-is-now-enabled-by-default-for-new-projects ,
  https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication
- Protection Bypass for Automation is included on Hobby. It uses the `x-vercel-protection-bypass`
  header (or a query parameter), plus an optional `x-vercel-set-bypass-cookie`. It is exposed to
  deployments as `VERCEL_AUTOMATION_BYPASS_SECRET`, and multiple secrets are allowed.
  https://vercel.com/docs/deployment-protection/usage-and-pricing ,
  https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation

**10. Lighthouse CI**

- Vercel's GitHub Actions KB (updated 2026-08-20) lists Lighthouse budgets as a job for GitHub
  Actions, run against the preview once it is live.
  https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel
- Vercel sends `repository_dispatch` events such as `vercel.deployment.success`, whose payload
  includes the deployment `url`. https://vercel.com/docs/git/vercel-for-github
- Lighthouse CI's own docs use `npm install -g @lhci/cli@0.15.x && lhci autorun`, with the URL set
  in `ci.collect.url`.
  https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md
- `treosh/lighthouse-ci-action@v12` is third-party, so the repo policy blocks it. How to pass the
  bypass header through LHCI is unverified; check `collect.settings.extraHeaders`.
  https://github.com/treosh/lighthouse-ci-action

**What this means for this repo (checked locally, read-only)**

1. `package.json` has `engines.node: ">=26"`, but Vercel builds offer at most Node 24. Expect a
   failure or a fallback; the owner needs to decide.
2. `.npmrc` sets `strict-allow-scripts=true` and the lockfile is `lockfileVersion: 3`. Whether the
   npm in Vercel's build image honours `strict-allow-scripts` is not stated. Confirm with a first
   build before relying on it.
3. `prisma.config.ts` passes `process.env.DATABASE_URL` to the CLI. Under the Neon integration
   that URL is pooled, so `migrate deploy` would need `DATABASE_URL_UNPOOLED`.
4. Neon branches are per Git branch and cleanup is not tied to PR close. With 10 branches on the
   Free plan and retention delays of months, the owner needs a cleanup plan. Neither third-party
   action is allowed, so the options are calling the Neon REST API with `curl` and running
   `@lhci/cli` from npm.
