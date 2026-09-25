# T-14 planning — subagent brief and report: the open Vercel and Neon facts

Dispatched: Agent tool, `subagent_type: general-purpose` (the session's model, Opus 5.5),
background, from the T-14 planning session (`prompts/2026-09-25-T-14.md`). A research task, not a
review: the brief forbade writes and any use of the authenticated `vercel`/`neon` CLIs; it was not
given read-only tools. Brief and report are copied word for word below, re-wrapped to the
repository's line width, with the report's headings one level down. Its conclusions are its own;
the plan (`plans/2026-09-25-T-14.md`, Findings F3–F16) marks which ones it relies on and which it
leaves to execution.

## Brief (verbatim)

Research task for a deployment plan. Do NOT modify any files, do NOT run any command that writes,
deploys, logs in, or calls the Vercel/Neon CLIs or APIs (the machine has authenticated `vercel` and
`neon` CLIs — do not use them at all). Use only WebFetch/WebSearch (load them via ToolSearch
"select:WebFetch,WebSearch" first) and, if useful, read-only `npm view <pkg> readme` / `curl -s` of
public docs. Cite every fact with the exact URL and "read 2026-09-25". If a page does not state
something, write "not stated" — never guess. Mark your own inferences as inference.

Context: Next.js 16.3.5 app (App Router, a `proxy.ts` — Next 16's renamed middleware), Prisma 7.10
with `@prisma/adapter-pg` (node-postgres), deployed to Vercel **Hobby** from a public repo on a
**personal** GitHub account; production = `main`. Postgres is **Neon** (Free plan); the Neon project
was created directly on neon.com (not through the Vercel Marketplace), region aws-eu-central-1; its
default branch is named `production`. Vercel functions will run in `fra1`. The repo's GitHub
Actions may only use GitHub-owned actions pinned by SHA. The repo deletes a PR's head branch
automatically on merge.

Answer:

1. **Neon-managed Vercel integration ("Connectable Account" / "Neon-managed integration")** — exact
   setup steps (where it is started: Neon console or Vercel Marketplace; what the owner clicks; can
   it connect an *existing* Neon project; does it work with a Vercel Hobby account); which env vars
   it writes, in which Vercel scopes (Production vs Preview, branch-specific?) — does it overwrite a
   Production `DATABASE_URL` or only set Preview ones; the branch naming (`preview/<git-branch>`),
   what the preview branch is created from (parent/default branch, data included?), whether it runs
   any migration, and the "delete on Git branch deletion" option (how it's enabled, what triggers
   it). Contrast briefly with the Vercel-managed native integration (can it be used with a project
   already created on neon.com? likely not — confirm). Sources:
   neon.com/docs/guides/neon-managed-vercel-integration, neon.com/docs/guides/vercel-overview, and
   related.
2. **Creating a Vercel project without an immediate production deployment of `main`.** Vercel docs
   say a new project's first deployment is a production deployment. Is there a documented way to
   create the project and connect the GitHub repo such that the first deployment is a *preview*
   from a PR branch (e.g. `vercel project add` then `vercel git connect`; or the dashboard import —
   does import always deploy the production branch immediately?). Check vercel.com/docs/cli/project,
   vercel.com/docs/cli/git, vercel.com/docs/deployments/environments, and the import docs. Also: can
   env vars be set at import time.
3. **X-Forwarded-For on Vercel** — does Vercel overwrite a client-supplied `X-Forwarded-For` (so
   the first entry is the real client IP and cannot be spoofed)? Quote the docs sentence
   (vercel.com/docs/headers/request-headers or similar). Also `x-real-ip`, `x-vercel-forwarded-for`.
4. **HSTS and TLS on `*.vercel.app`** — does Vercel send `Strict-Transport-Security` by default on
   vercel.app domains / custom domains? Quote.
5. **Vercel CDN caching of a Next.js response carrying `Cache-Control: s-maxage=31536000`** (Next 16
   App Router, a prerendered/static route such as `/_global-error`) — would Vercel's edge cache and
   replay it (same HTML, same nonce) to later visitors? Anything documented about Next.js
   ISR/static pages + CSP nonces on Vercel.
6. **Next.js `.rsc` / `.segments/...segment.rsc` requests and middleware/proxy on Vercel** — does
   Vercel ("minimal mode") route `/<page>.rsc` or RSC requests without running the
   middleware/proxy when the proxy matcher excludes paths containing a dot? Anything in Next.js docs
   on matcher and RSC/prefetch/`_rsc` requests, `missing`/`has` for `next-router-prefetch`, or how
   Next 16 appends `(\.json|\.rsc|...)` to matchers. Cite nextjs.org docs (proxy/middleware matcher
   section).
7. **Lighthouse CI against an authenticated page on a Vercel deployment**: (a) how `@lhci/cli`
   (npm) can send a cookie or header — `collect.settings.extraHeaders`, `puppeteerScript`; (b)
   triggering a GitHub Actions workflow when Vercel finishes a deployment: does Vercel create GitHub
   Deployments / `deployment_status` events with `environment` "Production"/"Preview" and
   `target_url`/`environment_url`? Is the `repository_dispatch` `vercel.deployment.success` event
   available on Hobby? (c) passing Vercel's Deployment Protection bypass header through LHCI. Cite.
8. **Vercel project settings to check**: "Enable access to System Environment Variables" (default
   on?), Deployment Protection defaults on Hobby (Vercel Authentication on previews only?),
   "Protection Bypass for Automation" (Hobby?), Git fork protection. Also whether Vercel honours a
   committed `.npmrc` for `npm ci` (search the Vercel docs and KB; "not stated" if absent), and
   whether `installCommand` in vercel.json can be `npm ci`.
9. **Neon + Prisma 7 + pooled connections**: does Neon's pooled (PgBouncer, transaction mode)
   connection support (a) transaction-level advisory locks `pg_advisory_xact_lock`, (b)
   session-level `pg_advisory_lock`, (c) prepared statements from node-postgres? Cite
   neon.com/docs/connect/connection-pooling.
10. **Chrome WebMCP origin trial token**: where it is registered (Chrome Origin Trials console),
    whether it is bound to an exact origin (e.g. `https://my-app.vercel.app`) or can match
    subdomains, and its expiry (Chrome 156?). Cite developer.chrome.com.

Return a structured report: one section per question, bullets of fact + URL + read date, uncertain
items marked. Under ~1200 words.

## Report (verbatim)

All 10 questions have answers from public docs. I read every URL below on 2026-09-25. **NS** means
the page doesn't state it; **(inf)** marks my own inference. I changed no files and did not use the
Vercel or Neon CLIs.

**Main findings**

- **Q1 and Q2 force an order of setup.** The Neon integration needs a Vercel project that is
  already linked to Git, and Vercel always makes a new project's first deployment a production
  one. The integration does not overwrite an existing `DATABASE_URL`: it fails until you remove it.
- **Q6 is a real gap in this repo.** I ran the repo's own matcher through Next's local matcher
  builder. `/overview` matches, but `/overview.rsc` and `/overview.segments/_tree.segment.rsc` do
  not, so the proxy skips them.

### 1. Neon-managed integration

Main page: https://neon.com/docs/guides/neon-managed-vercel-integration

- **Prerequisite:** "A Vercel account with a project linked to GitHub, GitLab, or Bitbucket."
- **Existing variables block it.** If setup reports "Failed to set environment variables", the doc
  says: "Remove or rename existing `DATABASE_URL`, `PGHOST`, `PGUSER`, `PGDATABASE`, or
  `PGPASSWORD` variables", then retry. (inf) A `DATABASE_URL` set when the project is imported must
  be deleted before the integration is installed.
- **Where to start:** either path works.
  - Neon Console → Integrations → **Add** under Vercel → **Install from Vercel Marketplace** →
    **Install** → **Link Existing Neon Account** → **Continue**.
  - Or Vercel Marketplace → **Connectable Accounts** → Neon → **Add**.
- **What the owner then chooses:**
  - Vercel account and project scope.
  - The Vercel project.
  - The Neon project, database and role.
  - Optional: a `vercel-dev` branch.
  - Optional: **Automatically delete obsolete Neon branches**.
  - Then **Connect** → **Done**.
- **Existing Neon project:** yes, that is what this integration is for.
- **Hobby plan:** NS.
- **Limits:** one Neon project connects to exactly one Vercel project, and it "Cannot coexist with
  the Vercel-Managed Integration in the same Vercel project."
- **Environment variables:** it "sets both modern (`DATABASE_URL`, `DATABASE_URL_UNPOOLED`) and
  legacy PostgreSQL variables (`POSTGRES_URL`, `PGHOST`, etc.) for Production and Development
  environments. Preview variables are injected dynamically per deployment."
  - `DATABASE_URL` is the pooled connection; `DATABASE_URL_UNPOOLED` is direct.
  - Which Neon branch the Production variables point at: NS. (inf) Probably the default branch,
    here `production`; the doc's `vercel-dev` note calls the default branch "`main`".
- **Preview branches:** a Vercel webhook makes Neon create `preview/<git-branch>`, and the
  connection string is injected "for that specific deployment only".
  - Parent branch: NS on this page (inf: the default branch).
  - Data: "Neon branches share storage with the parent and start with the parent's full dataset"
    (https://neon.com/faqs/isolated-postgres-databases-preview-deployments-vercel-netlify).
- **Migrations:** the integration runs none. The doc says to override the build command, for
  example `npx prisma generate && npx prisma migrate deploy && npm run build`.
- **Branch cleanup:** turned on during setup. It deletes the Neon branch when the Git branch no
  longer exists, but "Cleanup runs the next time a preview deployment is created."
  - Renaming a Git or Neon branch may cause unintended deletions.
  - Child branches of a preview branch block deletion.
  - See also https://neon.com/docs/guides/vercel-branch-cleanup.
- **Vercel-managed (native) integration:** its "Neon account" is "Created automatically via
  Vercel", and the doc says to use Neon-managed if you already have a Neon project
  (https://neon.com/docs/guides/vercel-overview). Existing Neon users get a new organisation
  `Vercel: <team-name>` (https://neon.com/docs/guides/vercel-managed-integration). So it can't
  attach the project created on neon.com.

### 2. First deployment

- "The first deployment of a new project is always a production deployment. This happens even when
  you: Import a Git repository in the dashboard; Run `vercel`… without `--prod`; Deploy from a
  branch that is not your production branch" (https://vercel.com/docs/deployments/environments).
  There is no documented way to make the first deployment a preview.
- `vercel project add <name>` is documented only as "Create a new project"
  (https://vercel.com/docs/cli/project). `vercel git connect` connects the repo from the local
  `.git` config (https://vercel.com/docs/cli/git). Whether either one triggers a deployment: NS.
- **Documented ways to soften it:**
  - Turn off **Auto-assign Custom Production Domains**. Production deployments then wait for
    manual promotion (environments page; https://vercel.com/docs/deployments/promoting-a-deployment).
  - Set `git.deploymentEnabled`, per branch or `false` for all, in `vercel.json`
    (https://vercel.com/docs/project-configuration/git-configuration).
  - `vercel project pause` stops production traffic (cli/project).
- **Environment variables at import:** yes. The configure page offers "Set Environment Variables"
  before **Deploy** (https://vercel.com/docs/git). The production branch defaults to `main`.

### 3. X-Forwarded-For

Source: https://vercel.com/docs/headers/request-headers

- `x-forwarded-for` is "The public IP address of the client that made the request."
- "…we currently overwrite the `X-Forwarded-For` header and **do not forward external IPs**. This
  restriction is in place to prevent IP spoofing."
- `x-vercel-forwarded-for` is "identical to the `x-forwarded-for` header. However,
  `x-forwarded-for` could be overwritten if you're using a proxy on top of Vercel."
- `x-real-ip` is "identical to the `x-forwarded-for` header."
- A custom `X-Forwarded-For` (trusted proxy) is Enterprise only.

### 4. HSTS and TLS

Source: https://vercel.com/docs/cdn-security/encryption

- "The `.vercel.app` domain (and therefore all of its sub domains…) support HSTS automatically and
  are preloaded": `max-age=63072000; includeSubDomains; preload`.
- "Custom domains use HSTS, but only for the particular subdomain": `max-age=63072000`.
- "HTTPS redirection… can't be disabled."
- TLS 1.2 and 1.3.

### 5. CDN caching with `s-maxage`

- **Documented facts:**
  - To cache a Function response on the CDN you must send `Cache-Control` with `s-maxage=N`
    (https://vercel.com/docs/caching/cdn-cache).
  - Next.js: "Static pages are generated at build time… no nonce can be injected", and with nonces
    "all pages must be dynamically rendered"
    (https://nextjs.org/docs/app/guides/content-security-policy).
  - Vercel: "Routing Middleware runs before the CDN cache and cannot modify the body". Adding a
    nonce while rendering "prevents the completed document from being reused by a CDN"
    (https://vercel.com/kb/guide/csp-nonces-with-cdn-cache).
- (inf) Yes, the CDN would store `/_global-error` and replay the same HTML to everyone. That HTML
  has no nonce or a stale one, and the proxy's fresh per-request CSP header won't match it.

### 6. `.rsc` and segment requests versus the proxy

- **Next.js docs** (https://nextjs.org/docs/app/api-reference/file-conventions/proxy):
  - Matchers support negative lookaheads and `has`/`missing` (for example `next-router-prefetch`).
  - Next strips the `rsc`, `next-router-state-tree` and `next-router-prefetch` headers inside the
    proxy.
  - The proxy still runs for `_next/data` even when a matcher excludes it.
  - The `.rsc` suffix: NS in the docs.
- **Next.js 16.3.5 source** (local `node_modules/next/dist/build/analysis/get-page-static-info.js`
  and `dist/lib/constants.js`):
  - Next appends `(\.json|\.rsc|\.segments/.+\.segment\.rsc)?` after your matcher source.
  - The repo's matcher `/((?!_next/static|_next/image|favicon\.ico|.*\..*).*)` gives `/overview`
    true, `/overview.rsc` false, `/overview.segments/_tree.segment.rsc` false.
  - (inf) The `.*\..*` lookahead sees the added suffix and rejects it, so the proxy is skipped.
- **The advisory is the same class of bug**
  (https://github.com/vercel/next.js/security/advisories/GHSA-267c-6grr-h53f, fixed in 16.2.5):
  "specially crafted `.rsc` and segment-prefetch URLs can resolve to the same page without being
  matched by the intended middleware rule." Workaround: "enforce authorization in the underlying
  route or page logic instead of relying solely on middleware."
- How Vercel's minimal mode routes these requests: NS.

### 7. Lighthouse CI

Source for (a): https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md

**(a) Sending a cookie or header**

- `collect.settings.extraHeaders` takes a JSON string, for example
  `JSON.stringify({Cookie:'token=1234'})`, and goes to the audited page.
- The top-level `--extraHeaders` is only for requests to the LHCI server.
- `puppeteerScript` exports `async (browser, context)` and needs `puppeteer` installed. The browser
  stays open across URLs, so cookies persist; use `disableStorageReset` for auth kept in
  `localStorage`.

**(b) Triggering on a finished Vercel deployment** (https://vercel.com/docs/git/vercel-for-github)

- Vercel sends `deployment_status` by default; it can be switched off in Git settings. The
  environment names ("Production"/"Preview") and `target_url`: NS. The example uses
  `deployment_status.environment_url`.
- `repository_dispatch` types include `vercel.deployment.success`, `.ready` and `.promoted`. The
  payload carries `url`, `environment` and `git.sha`. It "will only trigger a workflow run if the
  workflow file exists on the default branch."
- Hobby availability: NS.
- **The sources disagree on `success`:**
  - The README says `success` means the deployment was "automatically been promoted to
    production" and `ready` means "not been promoted" (https://github.com/vercel/repository-dispatch).
  - The KB E2E guide uses `success` for preview deployments
    (https://vercel.com/kb/guide/how-can-i-run-end-to-end-tests-after-my-vercel-preview-deployment).
  - `types.ts` omits `ready` altogether.
  - This decides the LHCI trigger.

**(c) Bypass header**
(https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)

- Send header or query parameter `x-vercel-protection-bypass`. Adding
  `x-vercel-set-bypass-cookie: true` sets a cookie through a redirect (SameSite=Lax by default).
- The secret is also available as the `VERCEL_AUTOMATION_BYPASS_SECRET` system variable.
- (inf) Put it in the `extraHeaders` JSON next to `Cookie`.
- Under Standard Protection "the production generated deployment URL becomes restricted"
  (https://vercel.com/docs/deployment-protection). (inf) `client_payload.url` therefore needs the
  bypass even for production runs.
- (inf) `neondatabase/delete-branch-action` and Vercel's checkout action are not GitHub-owned, so
  they break the repo's actions rule. Use `run:` steps instead (curl, `npx @lhci/cli`).

### 8. Project settings

- **System environment variables:** exposed by default for projects created since 2020-11-20
  (https://vercel.com/changelog/system-environment-variables-are-now-available-by-default).
  Disabling the setting also disables Skew Protection
  (https://vercel.com/docs/environment-variables/system-environment-variables).
- **Deployment Protection:**
  - Enabled by default for new projects since 2023-11-02
    (https://vercel.com/changelog/deployment-protection-is-now-enabled-by-default-for-new-projects).
  - Current docs describe a team default of All, Standard or None. Standard protects "all domains
    except production domains".
  - On Hobby, Vercel Authentication, Standard, All Deployments and Protection Bypass for
    Automation are "Included". Password Protection is not available. Shareable Links are limited
    to one per account (https://vercel.com/docs/deployment-protection/usage-and-pricing).
- **Git fork protection:** for pull requests from a fork, Vercel "will require authorization"; it
  can be disabled (https://vercel.com/docs/project-configuration/security-settings).
- **Committed `.npmrc`:** NS. With `NPM_RC` or `NPM_TOKEN` set, Vercel "will dynamically create a
  `.npmrc`" (https://vercel.com/kb/guide/using-private-dependencies-with-vercel). Whether that
  overwrites a committed file: NS.
- **`installCommand`:** type `string | null`; it overrides the project's Install Command. The
  example is `npm install` (https://vercel.com/docs/project-configuration/vercel-json). (inf)
  `npm ci` is allowed.
- **npm version:** the default for a `package-lock.json` is `npm install`. The version table lists
  Node 20 and 22 → npm 10; Node 24 is NS (https://vercel.com/docs/package-managers).

### 9. Neon pooling

Source: https://neon.com/docs/connect/connection-pooling

- Neon's pooler is PgBouncer in transaction mode.
- Not supported on pooled connections: `SET`/`RESET`, SQL-level `PREPARE`/`DEALLOCATE`, and
  "Session-level advisory locks". So (b) `pg_advisory_lock` does not work.
- (a) `pg_advisory_xact_lock`: NS. It is not on the list, and PgBouncer's feature table also names
  only session-level locks (https://www.pgbouncer.org/features.html). (inf) It works.
- (c) Protocol-level prepared statements are supported (PgBouncer ≥1.22,
  `max_prepared_statements=1000`), and the doc gives a `pg` named-query example.
- Neon says to use a direct connection for schema migrations. (inf) `prisma migrate deploy` should
  use `DATABASE_URL_UNPOOLED`.

### 10. WebMCP origin trial

- **Where to register:** https://developer.chrome.com/origintrials/#/register_trial/4163014905550602241
  (https://developer.chrome.com/blog/ai-webmcp-origin-trial, published 2026-06-09).
- **Milestones:** the trial runs on desktop and Android from Chrome 149 to 156, with third-party
  support (https://chromestatus.com/api/v0/features?q=webmcp).
- **Origin binding:** "By default, an origin trial feature is only available on the origin
  registered for the trial." The token goes in a meta tag or an `Origin-Trial` header
  (https://developer.chrome.com/docs/web-platform/origin-trials).
- **Subdomains:** matching all subdomains is an optional choice at registration, but "Subdomain
  tokens are not issued for origins in the Public Suffix List"
  (https://developer.chrome.com/docs/web-platform/origin-trial-troubleshooting). `vercel.app` is on
  that list (https://publicsuffix.org/list/public_suffix_list.dat).
  - (inf) A token for `https://my-app.vercel.app` covers that exact origin only.
  - (inf) Preview URLs are sibling hosts, not subdomains of it, so each needs its own token.
- **Exact expiry date:** NS on the Chrome pages I read. A third-party GitHub issue says 2026-11-17;
  that is unverified.
