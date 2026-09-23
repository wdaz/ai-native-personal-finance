# 0006 — Authentication and session: single demo account, signed httpOnly cookie, 7-day sliding session

- Status: **Accepted** (amended 2026-09-23) · Date: 2026-09-13
- Amendment 2026-09-23 (owner decision, T-05 plan gate Q3, tech debt): the CSP ships as
  `script-src 'self'`, **no inline nonce** — R1's App Router pages have no inline `<script>`
  tag, so the nonce machinery (per-request token, `x-nonce` header) has nothing to protect
  yet and is deferred rather than built unused. If a later task adds an inline script, that
  task adds the nonce then. `frame-ancestors`, `Referrer-Policy`, `X-Content-Type-Options`
  are unaffected.
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
- Headers: CSP (`default-src 'self'; script-src 'self'`; no inline nonce — 2026-09-23
  amendment, tech debt; no third-party), `frame-ancestors 'none'`, `Referrer-Policy:
  strict-origin-when-cross-origin`, `Permissions-Policy` left default so `tools` stays `self`
  (S6).

## Alternatives considered
**A. This — chosen.**
**B. NextAuth/Auth.js with a Credentials provider.** More machinery than one account needs; its session model is opinionated and harder to test at the API layer.
**C. No auth, demo data open.** Fails the brief's bonus and US-01; also leaves tools callable without any session boundary.
**D. Per-visitor sandboxes (cookie-scoped datasets).** Better demo isolation, but contradicts the "one shared dataset" decision (Q1) and multiplies reset logic.

## Consequences
Easier: stateless sessions, trivial E2E `storageState`, tools need no extra auth code. Harder: a leaked cookie secret invalidates all sessions (rotate via env). To watch: Vercel preview URLs are different origins — cookies are per deployment, which is fine.

## Review
Owner decision: **Accepted**, 2026-09-13. Owner chose alternative A as proposed.
