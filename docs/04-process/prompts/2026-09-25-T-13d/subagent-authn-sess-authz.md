# T-13d execution — subagent report: AUTHN, SESS, AUTHZ (condensed)

Dispatched: Agent tool, `subagent_type: Explore`, `model: opus` (Q6), read-only, background.
Condensed from the full SubagentHandback (findings, tables and evidence preserved; some repeated
narrative trimmed). The main session's live verification is noted inline and in the published
report's Findings section.

**Disclosed rule slips (subagent's own words):** it ran one read-only `git log --oneline -1`
(printed `aad1423`, matching HEAD) and one in-memory `node -e` that tested the compiled proxy
matcher regexp against sample path strings (no network, no writes) — both against this project's
own governance rule that review subagents stay read-only. No other git, network or DB action was
taken. Every unit/E2E-test citation is predicted, unverified by the subagent; API-test citations
against the 103/103-green suite are treated as run.

## Candidate findings, ranked by the subagent

**A. The proxy matcher skips Next's transport forms of protected pages** (AUTHZ-02, and
AUTHN-02, AUTHN-16, SESS-11, AUTHZ-05). This is the *same* root cause as the INFO/CONF/TRAN
subagent's independently-found "F-c" (CONF-04) — cross-validated by two subagents working from
different code paths (one from the build's compiled manifest, one from Next's own
`get-page-static-info.js` source). NOT TESTED for the deployed case; **confirmed safe locally**
(main session live-verified). Rated Medium by this subagent (would be High/Critical by the
rubric's letter, discounted here because the data is read-only, public-by-design demo data, and
nothing is deployed yet) — see the published report's top-line Finding for the consolidated
write-up and the T-14 hand-off.

**B. Logout CSRF through `POST /api/auth/logout`** (SESS-13). Candidate FAIL, Low. Same finding
as the DOS/BIZ/CRYP/FILE/CARD/HTML5 subagent's cross-category observation, independently derived.
This subagent adds the precise browser mechanics: a cross-site page can auto-submit a top-level
form POST to it; browsers accept a `SameSite=Lax` `Set-Cookie` from a top-level navigation
response (RFC 6265bis §5.7), so the `Max-Age=0` clearing cookie is honoured. ADR-0006 amendment
(3) hardens only the GET fallback ("so a link on another site cannot log anyone out"); no document
covers the POST route, so its requirement is "none written". **Main session verified live** that
the server performs no Origin/Sec-Fetch check on this route at all (204, cookie cleared,
regardless of a hostile `Origin` header) — promoted to a Finding in the published report, with a
note that curl (unlike a real browser) does not enforce `SameSite` itself, so the exact real-world
exploitability still depends on browser SameSite behaviour around the request shape used.

**C. The login rate-limit key is client-controlled under `next start`** (AUTHN-03). Same finding
as DOS-01/F-b, independently derived from `auth.ts`/`base-server.js` directly. Also flags a
**vacuous existing test**: the "stale window" API test seeds `ip: "local"`, while the harness key
under Playwright's local target is actually the socket address — so that test is predicted to
pass regardless of whether the window filter (`at: { gte: windowStart }`) even exists. Not
independently re-verified by the main session (out of scope: it would mean editing a tracked test
file to prove).

**D. Test gaps** (no FAIL on their own): no test sends a garbage/tampered/expired cookie to a
*protected* route (the main session's own live checks now cover garbage/empty/malformed cases —
see VAL-32); no test covers the API channel or `/` after a reset; the `pathname === "/login"` part
of the logout-fallback gate has no test; no test pins `Path=/`, the absence of `Domain`, or
`autocomplete` attributes.

**E. Percent-encoded paths** (AUTHN-02). Predicted safe by source reading (the proxy sees the raw,
undecoded pathname; render-time route matching is an exact string compare) — not independently
re-verified live by the main session.

## AUTHN (16 items)

| ID | Status | Notes |
|---|---|---|
| AUTHN-01 Credentials transported securely / correct verification | PASS (static + the existing, green API suite) | `bcrypt.compare` always runs, independent of the email match; one 401 return path; matches SPEC-auth §4/§2.10/v1.0.3. |
| AUTHN-02 Bogus/tampered/expired session accepted | NOT TESTED by this subagent; largely resolved by the main session's own live checks (VAL-32 covers garbage/empty/malformed cookies → 401/302 as predicted; percent-encoded-path bypass (point E) and the CVE-2025-29927-class `x-middleware-subrequest` header bypass were separately checked live by the main session — **neither is exploitable on this Next version**: both a spoofed subrequest header and percent-encoded paths still return a redirect/404, never the protected content) | — |
| AUTHN-03 Anti-automation on login | NEEDS VERIFICATION → candidate FAIL (Low) on a host that doesn't overwrite XFF; PASS expected on Vercel. Same as F-b/DOS-01, **confirmed live** by the main session. | Also flags the vacuous "stale window" unit test (point C). |
| AUTHN-04 Weak password policy for a real account | N/A | No user ever sets a password; the only password is operator-set and published (NFR-S1). |
| AUTHN-05 Remember-me | BY DESIGN | SPEC-auth §8. |
| AUTHN-06 Autocomplete attributes | PASS (static) | Correct `autoComplete` values on login/signup password and email fields. |
| AUTHN-07 Password reset | BY DESIGN | SPEC-auth §8. |
| AUTHN-08 Change-password function | N/A | No such route/UI exists. |
| AUTHN-09 CAPTCHA/anti-automation control | BY DESIGN (candidate) | The chosen control is the per-IP rate limit (ADR-0006, SPEC-auth §4); its own weakness is AUTHN-03/C. |
| AUTHN-10 MFA | BY DESIGN | SPEC-auth §8. |
| AUTHN-11 Logout function reachable everywhere | PASS (static; E2E predicted) | Sidebar button on every (app) page; page-header icon variant on the four Release-2 placeholder pages too. |
| AUTHN-12 Authenticated pages not cached | NEEDS VERIFICATION → candidate PASS | `no-store` set on every authenticated non-API response and on the two data APIs; existing, currently-green API tests pin this on `/overview` and `/api/meta`. `GET /api/auth/session` itself sets no explicit `Cache-Control` — not independently re-checked live this session. |
| AUTHN-13 Demo credentials on the login page | BY DESIGN | NFR-S1, ADR-0006. |
| AUTHN-14 Enumeration via user-management functions | N/A | One shared identity, no user table. |
| AUTHN-15 Account-recovery channel abuse | N/A | No mail/SMS channel exists; no account holder with a separate contact channel. |
| AUTHN-16 SSO/session-sharing correctness across channels | NOT TESTED — decided by finding A (the `.rsc` gap); otherwise the UI/API/tool channels all pass through the one proxy gate correctly, confirmed by an existing, currently-green API test for the tool-marker channel. | Becomes PASS once finding A's deployed-host half is settled safe. |

## SESS (13 items)

| ID | Status | Notes |
|---|---|---|
| SESS-01 No session token in the URL | PASS (static) | Stateless, sealed cookie only; only a sanitised `next` path and a `reason` enum ever appear in a URL. |
| SESS-02 Cookie attributes (HttpOnly, Secure, SameSite) | PASS for HttpOnly/SameSite=Lax (confirmed live by the main session); NEEDS VERIFICATION for the https `Secure` branch (same gap as TRAN-05, not independently confirmed live this session — deferred to T-14) | `Secure` is derived per-request from `request.url`. |
| SESS-03 Cookie scope (Path/Domain) | PASS | Host-only cookie, `Path=/`, no `Domain` — confirmed by the main session's own login response header dump. |
| SESS-04 Session-expiration length reasonable | PASS | `Max-Age=604800` matches SPEC-auth's 7-day TTL — confirmed live by the main session at login. |
| SESS-05 Absolute session timeout | BY DESIGN | No absolute cap; sliding by design (NFR-S2). A de facto cap will exist once the scheduled reset cron runs (post-T-14). |
| SESS-06 Idle timeout | PASS | 7-day idle window since the last hourly-or-later reissue; the public session-probe's TTL check is covered by an existing, currently-green API test. |
| SESS-07 Logout invalidates the session server-side | BY DESIGN (candidate; the subagent recommends an explicit owner-facing line, since no document says in so many words that "a copied cookie outlives logout") — **confirmed live by the main session**: replaying a pre-logout cookie value directly against `/api/overview` after logout still returns 200. This is the expected, deliberate consequence of ADR-0006's stateless-session decision, not a bug. | Low even as a FAIL, since the only identity is the shared demo account. |
| SESS-08 Concurrent sessions from the same account | BY DESIGN | One shared identity by design (NFR-S1); stateless sessions keep no count. |
| SESS-09 Session-id unguessability | PASS (static; the deployed secret's actual entropy cannot be judged by reading code) | Sealed blob (AES-256-CBC + HMAC-SHA256), not a predictable id; a ≥32-char `SESSION_SECRET` is enforced twice. |
| SESS-10 Session fixation | PASS (static; existing green API test for the logout single-Set-Cookie case) | Login always seals a fresh payload from scratch and never merges an incoming cookie. |
| SESS-11 Session-invalidation events apply across every channel | NOT TESTED — decided by finding A; the reset-epoch mechanism itself is well covered by existing, currently-green API tests for the page and admin-reset paths | Gap: the plain API channel (`/api/overview` after a reset) and `/` after a reset are not independently covered by an existing test — not re-verified live this session. |
| SESS-12 Session data server-controlled | PASS (static) | Only two writers (login, reissue), both server-side and after authentication; the proxy overwrites client-forgeable headers on proxied paths. |
| SESS-13 CSRF defences | Candidate FAIL (Low): finding B (logout CSRF), **confirmed live**. Everything else PASS. | Clickjacking covered by `frame-ancestors 'none'`, pinned by an existing green API test. No cookie-authenticated write route exists in R1; `/api/admin/reset` uses a bearer secret, not the session cookie. |

## AUTHZ (5 items)

| ID | Status | Notes |
|---|---|---|
| AUTHZ-01 Path traversal | N/A | No request value reaches a filesystem path anywhere in the app's own code; `public/` is served by Next's own static handler. |
| AUTHZ-02 Authorization enforced on every route/channel | NOT TESTED — this is finding A (the `.rsc` matcher gap), the review's single most important open item. Everything else about the route matrix matches SPEC-auth §2.10 exactly and is backed by existing, currently-green API tests (the admin-path exact-match fix, the test-route gating, the deploy-time refusal). **Main session verified live** that the specific `.rsc`/`.segments` paths this subagent flagged all correctly 404 on this local, bare `next start` target — the gap, if real, is Vercel-minimal-mode-only and must be checked at T-14's first preview before this item can be marked PASS. | Structural note: page paths are default-allow (only `/` and five named prefixes need a session), while `/api/*` is default-deny — fine today, but a new page added outside the regex would be public by default, silently. |
| AUTHZ-03 Privileged action gated correctly | N/A | One role; the only privileged action (reset) is gated by a bearer secret independent of the session — confirmed structurally, and a logged-in-but-unauthorized-header request is predicted 401 (not independently re-verified live this session, low value given AUTHZ-02's own live checks already cover the admin-reset 401 path). |
| AUTHZ-04 Horizontal privilege escalation between users | N/A | No user table; one shared dataset by design (ADR-0006, alternative D explicitly rejected). |
| AUTHZ-05 Every endpoint's authorization inventoried and correct | NOT TESTED — worst-of rule via finding A; every other route in the inventory checked out correctly against existing, currently-green API tests and the main session's own live probing of the five app pages (all 302 to `/login?next=`, confirmed during Task 1/planning). | — |

## The three special-attention points this subagent raised

1. **Reset-epoch invalidation is correct and mostly tested** — the mechanism reads the database's
   own latest reset timestamp fresh on every request (no clock-skew risk), and existing tests
   cover the page-redirect and both reset-trigger paths; the plain API channel and `/` after a
   reset are the untested gap (not independently checked live this session — low incremental risk
   given how tightly the rest of the mechanism is tested).
2. **The logout-fallback Sec-Fetch gating already has a test for every documented bypass
   condition** in `tests/api/logout-fallback.spec.ts` — method, reason, site, mode and dest are
   each covered; only the exact pathname condition (`/login` specifically) has no dedicated test.
   The GET hardening's entire point is sidestepped by the ungated POST route (finding B).
3. **`POST /api/auth/logout` with no session is not itself an oracle or a special DoS vector** —
   it answers identically (204, same Set-Cookie shape) whether given no cookie, a valid one, or an
   invalid one; its real weakness is CSRF (finding B), not information disclosure.

## Tech-debt cross-references (from this subagent)

TD-1 (closed): the proxy sets the CSP on the forwarded request. TD-2 (closed): `proxy.ts` is the
"auth proxy" this whole group reads. TD-3 (open, already tracked): `/_global-error` is proxied and
public; its cache-header question is under AUTHN-12/CRYP-05. TD-10 (closed): the `/api/test/*`
absence AUTHZ-02 relies on, itself re-confirmed live by the main session in Task 1.
