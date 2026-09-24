# 0006 — Authentication and session: single demo account, signed httpOnly cookie, 7-day sliding session

- Status: **Accepted** (amended 2026-09-24; amendment (5) proposed, not yet accepted) · Date: 2026-09-13
- Amendment 2026-09-24 (5) — **Proposed by the agent, awaiting the owner's acceptance** (T-13
  plan finding F1): the response headers gain `Origin-Agent-Cluster: ?1`. Firefox and WebKit
  report `originAgentCluster === false` for a document served without it, and
  `@mcp-b/webmcp-polyfill@5.1.0` refuses to run there (`validateOriginAgentCluster` throws
  `SecurityError` from `registerTool`, `getTools` and `executeTool`), so US-38, US-39 and US-41
  fail in both browsers; Chromium's default is already true. Consequence: the document's origin
  gets its own agent cluster and can no longer share a process with same-site documents through
  `document.domain` — nothing in this app does. Set by `middleware.ts` on every response it sees
  and pinned by `tests/api/middleware.spec.ts`. Related, in SPEC-webmcp-tools v1.0.5: a failed
  tool registration is reported (indicator, `data-webmcp-error`, `console.warn`) instead of
  passing silently as `ready`.
- Amendment 2026-09-24 (4) — **Accepted by the owner, 2026-09-24** ("Hamısını accept et" —
  "accept all"; drafted by the agent, accepted after it was explained that a PR is not an
  acceptance). Owner decision 2026-09-24: TD-6 option (b) — under `next dev`
  the CSP is relaxed, so the development console stops filling with violations that come from
  Next's own tooling and a real violation from this repository's code is not lost in them.
  **In development only** (`process.env.NODE_ENV === "development"`, exact match), `script-src`
  gains `'unsafe-eval'` (React reconstructs server error stacks in the browser with `eval`) and
  `style-src` becomes `'self' 'unsafe-inline'` instead of `'self' 'nonce-<value>'` (Next's
  overlay injects `<style>` tags without a nonce, and a nonce in the list would make browsers
  ignore `'unsafe-inline'`). Both follow Next's content-security-policy guide, "Development vs
  Production Considerations". **Everything else is unchanged:** the production policy is the
  one above, byte for byte; `test`, `production`, unset and any other `NODE_ENV` value get it
  too (the relaxation is opt-in, so it fails closed). The policy is built by
  `buildCsp` in `src/server/csp.ts`; `tests/unit/server/csp.test.ts` pins both variants and
  `tests/api/middleware.spec.ts` pins the production one on a real response of the production
  build (ADR-0003: the API and E2E suites never run against `next dev`, so the CSP guard keeps
  guarding the shipped policy). Alternative not chosen: TD-6 option (a) — leave the policy and
  document the noise in the README. Consequence to watch: the development policy no longer
  catches an un-nonced inline `<style>` of our own; the production-build suites still do.
- Amendment 2026-09-23 (3) (owner decision, T-07 plan gate, Q1 (a)): **a logout whose request
  fails still ends the session.** US-03 AC2 says logout always completes client-side, but the
  session cookie is `httpOnly`, so only a response can clear it, and the middleware sends a
  logged-in visitor away from `/login` (SPEC-auth §2.8) — a failed `POST /api/auth/logout`
  would leave the user on Overview, still logged in. Now: the client logs the failure and
  navigates to `/login?reason=logout` (a full page load); for that URL only, when the browser
  marks the navigation `Sec-Fetch-Site: same-origin`, the middleware clears `pf_session`
  (`Max-Age=0`) and renders the login page instead of redirecting. Any other `Sec-Fetch-Site`
  (`cross-site`, `same-site`, `none`, or absent) keeps the redirect and the session, so a link
  on another site cannot log anyone out (logout CSRF). Alternatives not taken: **(b)** amend
  US-03 AC2 to "the failure is logged and the user stays logged in" — a user on a shared
  computer would believe they had logged out; **(c)** show an error and keep the session —
  with the server down the user could not leave. Consequence: one `GET` can now clear a
  session, from a same-origin navigation only. SPEC-auth v1.0.6 carries the behaviour.
- Note 2026-09-23 (Copilot review of PR #19; accepted by the controller/agent, not an owner
  decision): amendment (3) said the middleware clears the session when the browser marks the
  navigation `Sec-Fetch-Site: same-origin`. That admitted any same-origin request to
  `/login?reason=logout` — a `fetch()`, an XHR, an iframe — not only a navigation. The
  middleware now also requires `GET`, `Sec-Fetch-Mode: navigate` and `Sec-Fetch-Dest: document`;
  an absent header fails closed. Nothing else in amendment (3) changes. SPEC-auth v1.0.7.
- Correction 2026-09-23 (T-06 plan finding F2, recorded by owner decision as tech debt **TD-1**
  in `docs/03-specs/tech-debt.md`, linked from backlog v1.17): the amendment below says Next
  reads the nonce "via the `x-nonce` request header". It does not: Next 16.3.5 takes it from the
  **request's** `Content-Security-Policy` header
  (`node_modules/next/dist/server/app-render/app-render.js:209-210`). `middleware.ts` sets the CSP on
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
  `tools` stays `self` (S6), `Origin-Agent-Cluster: ?1` (2026-09-24 (5) amendment, proposed).

## Alternatives considered
**A. This — chosen.**
**B. NextAuth/Auth.js with a Credentials provider.** More machinery than one account needs; its session model is opinionated and harder to test at the API layer.
**C. No auth, demo data open.** Fails the brief's bonus and US-01; also leaves tools callable without any session boundary.
**D. Per-visitor sandboxes (cookie-scoped datasets).** Better demo isolation, but contradicts the "one shared dataset" decision (Q1) and multiplies reset logic.

## Consequences
Easier: stateless sessions, trivial E2E `storageState`, tools need no extra auth code. Harder: a leaked cookie secret invalidates all sessions (rotate via env). To watch: Vercel preview URLs are different origins — cookies are per deployment, which is fine.

## Review
Owner decision: **Accepted**, 2026-09-13. Owner chose alternative A as proposed.
