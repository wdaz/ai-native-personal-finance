# 0007 — Hosting and delivery: Vercel + Neon, GitHub Actions CI, preview deployments, origin trial on production only

- Status: **Accepted** (amended 2026-09-20) · Date: 2026-09-13
- Amendment 2026-09-20 (owner, raised by the T-01 plan gate): the `main` pipeline runs **no visual snapshots** — that line predated the ADR-0003 amendment that withdrew NFR-T9. Lighthouse CI stays. · Author(s): Agent, Owner (constraint: public deploy, all browsers)
- Driven by: NFR-D4–D6, NFR-P1, NFR-T4/T5, NFR-W8, PS §5

## Context
Solo owner, free tiers, public URL required, reset job required, WebMCP origin-trial token bound to an origin.

## Decision
- **Production:** Vercel project connected to the GitHub repo, `main` → production; production env holds `DATABASE_URL` (Neon pooled), `SESSION_SECRET`, demo credentials, `RESET_SECRET`, `WEBMCP_ORIGIN_TRIAL_TOKEN`, `WEBMCP_MODE=polyfill` (native is opportunistic when the browser has it). Custom domain optional; the OT token is registered for the production hostname.
- **Previews:** every PR gets a preview deployment pointing at a Neon **branch** created by the CI workflow and deleted on PR close; `WEBMCP_MODE=polyfill`, no OT token.
- **CI (GitHub Actions):** on PR — install, lint, typecheck, unit + component, API tests and E2E against a local Postgres service container with `next build && next start`, axe, traceability script; on `main` — the same plus Lighthouse CI against the production URL after deploy (warm-up request first). ~~visual snapshots~~ (withdrawn, see amendment).
- **Cron:** `vercel.json` cron `0 3 */10 * *` → `/api/admin/reset` with the secret header. Hobby-plan cron granularity (daily) is sufficient.
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
