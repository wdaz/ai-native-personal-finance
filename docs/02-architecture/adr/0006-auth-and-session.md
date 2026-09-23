# 0006 — Authentication and session: single demo account, signed httpOnly cookie, 7-day sliding session

- Status: **Accepted** (amended 2026-09-23) · Date: 2026-09-13
- Correction 2026-09-23 (T-06 plan finding F2, recorded by owner decision as tech debt **TD-1**
  in `docs/03-specs/tech-debt.md`, linked from backlog v1.17): the amendment below says Next reads the nonce "via the `x-nonce` request
  header". It does not: Next 16.3.5 takes it from the **request's** `Content-Security-Policy`
  header (`next/dist/server/app-render/app-render.js:209-210`). `middleware.ts` sets the CSP on
  the response only; the nonce reaches the renderer because Next's router also copies
  middleware response headers onto the request — undocumented behaviour. The decision itself
  (a per-request nonce on `script-src` and `style-src`, dynamic rendering) is unchanged;
  `x-nonce` is still forwarded, so a `<Script>` can read it with `headers()`. TD-1 sets the CSP
  on the forwarded request headers too.
- Amendment 2026-09-23 (2) (owner decision, T-05 whole-branch review finding C2): the CSP
  nonce is **restored**, superseding the same-day amendment below. That amendment's premise
  — "R1's App Router pages have no inline `<script>` tag" — was wrong: Next.js emits its own
  RSC-payload data as inline `<script>` tags, and inline `<style>` tags, on every
  server-rendered page, whether or not the app writes one itself. Verified live during
  review (Chromium and Firefox both logged 5 blocked inline scripts and 5 blocked inline
  styles on a page rendered under the no-nonce CSP; a client component's `onClick` handler
  was confirmed dead). `middleware.ts` now generates one nonce per request, forwards it to
  Server Components via the `x-nonce` request header (Next.js applies it automatically to
  its own inline scripts/styles and to any `<Script nonce={...}>` — no other per-tag wiring
  needed), and sets `script-src 'self' 'nonce-<value>'; style-src 'self' 'nonce-<value>'`.
  Cost: any page relying on this must render dynamically (no static generation, ISR, or
  PPR) — immaterial here, since every session-aware page already reads the session cookie
  and is dynamic by Next's own default; only the public `/login`/`/signup` pages (T-06) lose
  static generation, at this app's traffic. `frame-ancestors`, `Referrer-Policy`,
  `X-Content-Type-Options` are unaffected, as before.
- Amendment 2026-09-23 (owner decision, T-05 plan gate Q3, tech debt) — **superseded by the
  amendment above; kept for the record.** The CSP shipped as `script-src 'self'`, no inline
  nonce — R1's App Router pages have no inline `<script>` tag, so the nonce machinery
  (per-request token, `x-nonce` header) has nothing to protect yet and is deferred rather
  than built unused. If a later task adds an inline script, that task adds the nonce then.
  `frame-ancestors`, `Referrer-Policy`, `X-Content-Type-Options` are unaffected.
- Amendment 2026-09-20 (owner decision S-16/S-17/S-18): sessions **end on demo reset** via a `resetEpoch` claim compared with the latest `ResetLog.at` (still stateless); the middleware public list also includes `POST /api/auth/signup` and `GET /api/auth/session`, and `POST /api/auth/logout` requires no session; the rate limit counts **failed** attempts only. · Author(s): Agent, Owner (decisions Q1/OQ-1/R-25)
- Driven by: US-01–US-03, US-39 AC4, NFR-S1/S2/S6, PRD OQ-1

## Context
Exactly one demo account; the sign-up screen is UI-complete but creates nothing; sessions must survive reload, expire, and be required by every API route and every tool.

## Decision
- Credentials from env (`DEMO_EMAIL`, `DEMO_PASSWORD_HASH`, bcrypt); shown in plain text on the login page from `DEMO_EMAIL` / `DEMO_PASSWORD_DISPLAY` (S1).
- `POST /api/auth/login` verifies and sets a signed, encrypted httpOnly `Secure` `SameSite=Lax` cookie (`iron-session`), TTL 7 days, refreshed on any authenticated request (sliding). `POST /api/auth/logout` clears it. No server-side session table (stateless; serverless-friendly). ~~Reset does not invalidate cookies~~ — superseded by the 2026-09-20 amendment: sessions end on reset.
- Middleware protects `(app)/*` routes (redirect to `/login?next=…`) and `api/*` except `auth/login`, `meta`, `admin/reset` (own secret) and `test/*` (test env only). Tools inherit the cookie because they call the same API (`credentials: "include"` is implicit same-origin).
- Sign-up: `POST /api/auth/signup` validates with the shared schema and always returns `{ code: "demo_instance" }` (OQ-1).
- Rate limit: 10 login attempts / 15 min per IP via an Upstash-free approach — a small `LoginAttempt` table with a cleanup on reset (S4).
- Headers: CSP (`default-src 'self'; script-src 'self' 'nonce-<value>'; style-src 'self'
  'nonce-<value>'`, one nonce per request via `middleware.ts` and the `x-nonce` request
  header — 2026-09-23 (2) amendment; no third-party), `frame-ancestors 'none'`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` left default so
  `tools` stays `self` (S6).

## Alternatives considered
**A. This — chosen.**
**B. NextAuth/Auth.js with a Credentials provider.** More machinery than one account needs; its session model is opinionated and harder to test at the API layer.
**C. No auth, demo data open.** Fails the brief's bonus and US-01; also leaves tools callable without any session boundary.
**D. Per-visitor sandboxes (cookie-scoped datasets).** Better demo isolation, but contradicts the "one shared dataset" decision (Q1) and multiplies reset logic.

## Consequences
Easier: stateless sessions, trivial E2E `storageState`, tools need no extra auth code. Harder: a leaked cookie secret invalidates all sessions (rotate via env). To watch: Vercel preview URLs are different origins — cookies are per deployment, which is fine.

## Review
Owner decision: **Accepted**, 2026-09-13. Owner chose alternative A as proposed.
