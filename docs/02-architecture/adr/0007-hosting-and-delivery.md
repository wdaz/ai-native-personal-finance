# 0007 — Hosting and delivery: Vercel + Neon, GitHub Actions CI, preview deployments, origin trial on production only

- Status: **Accepted** (amended 2026-09-20; 2026-09-23) · Date: 2026-09-13
- Amendment 2026-09-23 (owner, raised by the review of PR #20, T-08, finding 2 — "Bu pr-da düzəlt. Tövsiyyə ilə davam et"): the cron runs **daily**, `0 3 * * *`, and `/api/admin/reset` resets only once `RESET_INTERVAL_DAYS` have passed since the last reset of any kind. `0 3 */10 * *` fired on days 1, 11, 21 and 31 of each month — one day apart at the end of a 31-day month, 8–9 days across February — so it could not mean "every 10 days" (US-37 AC1), and it ignored `RESET_INTERVAL_DAYS`, which the banner states. Alternatives: keep `*/10` and reword AC1 and the banner; `1,11,21` (gaps of 8–11 days). The daily check allows one hour of slack, since Hobby runs a cron anywhere within its hour. Consequence: one function invocation per day instead of three a month, still within Hobby's limits; a manual or threshold reset restarts the interval.
- Amendment 2026-09-20 (owner, raised by the T-01 plan gate): the `main` pipeline runs **no visual snapshots** — that line predated the ADR-0003 amendment that withdrew NFR-T9. Lighthouse CI stays. · Author(s): Agent, Owner (constraint: public deploy, all browsers)
- Driven by: NFR-D4–D6, NFR-P1, NFR-T4/T5, NFR-W8, PS §5

## Context
Solo owner, free tiers, public URL required, reset job required, WebMCP origin-trial token bound to an origin.

## Decision
- **Production:** Vercel project connected to the GitHub repo, `main` → production; production env holds `DATABASE_URL` (Neon pooled), `SESSION_SECRET`, demo credentials, `RESET_SECRET`, `WEBMCP_ORIGIN_TRIAL_TOKEN`, `WEBMCP_MODE=polyfill` (native is opportunistic when the browser has it). Custom domain optional; the OT token is registered for the production hostname.
- **Previews:** every PR gets a preview deployment pointing at a Neon **branch** created by the CI workflow and deleted on PR close; `WEBMCP_MODE=polyfill`, no OT token.
- **CI (GitHub Actions):** on PR — install, lint, typecheck, unit + component, API tests and E2E against a local Postgres service container with `next build && next start`, axe, traceability script; on `main` — the same plus Lighthouse CI against the production URL after deploy (warm-up request first). ~~visual snapshots~~ (withdrawn, see amendment).
- **Cron:** `vercel.json` cron ~~`0 3 */10 * *`~~ `0 3 * * *` (daily, amendment 2026-09-23) → `/api/admin/reset` with the secret header; the route resets when `RESET_INTERVAL_DAYS` have passed since the last reset. Hobby-plan cron granularity (daily) is sufficient.
- **Runbook** (`docs/04-process/runbooks/deploy.md`, written in Phase 5): env setup, first seed, rotating secrets, renewing the OT token before Chrome 156, headed native-mode check, relay demo.

## Alternatives considered
**A. Vercel + Neon — chosen.** Native Next.js support, cron, previews, free tier that does not sleep the web tier.
**B. Fly.io or Render with a Docker image + managed Postgres.** Full control, one container; free tiers sleep (cold starts of seconds vs P1), cron needs an extra service, previews are manual.
**C. Cloudflare Pages/Workers + D1.** Attractive edge latency; Next.js support via adapters is less complete, Prisma on D1 is limited, and D1 size limits complicate the reset threshold.
**D. Self-hosted VPS.** Cheapest long-term, most operational work for one person; no.

## Consequences
Easier: push-to-deploy, PR previews for review, cron for free. Harder: vendor lock for cron and env (mitigated: reset is a plain HTTP route; env is a `.env.example`). To watch: Neon branch quota on the free tier (delete branches on PR close), Vercel hobby limits on build minutes.

## Review
Owner decision: **Accepted**, 2026-09-13. Owner accepted the recommendation (alternative A).
