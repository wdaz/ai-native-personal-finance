# T-13d execution — subagent report: DOS, BIZ, CRYP, FILE, CARD, HTML5 (condensed)

Dispatched: Agent tool, `subagent_type: Explore`, `model: opus` (Q6), read-only, background.
Condensed from the full SubagentHandback (findings, tables and evidence preserved; some
repeated narrative trimmed for length). The main session's live verification of several claims
is noted inline and in the published report's Findings section.

## Read first: gaps and safety notes (from the subagent)

1. The plan file was not yet on the branch when this agent ran (fixed immediately after by
   merging `claude/13d-planning-6rnuap` into `task/T-13d-security-review`) — this agent worked
   from the backlog row, the skill, and NFR/SPEC/ADR/tech-debt documents directly.
2. A permission denial: it could not read the bcrypt cost prefix of `DEMO_PASSWORD_HASH` in
   `.env.local` (classified "Credential Materialization"). The main session generated that hash
   itself this session with an explicit bcrypt cost of 10 (`bcryptjs.hash(pw, 10)`), matching the
   README's guidance and CI's `$2b$10$` fixture.
3. It ran no HTTP request and no test; every cited test result is a prediction.

## Candidate findings (severity for this app)

- **F-a (BIZ-01 / DOS-01), Low.** Successful logins are unthrottled, and each persists a
  `LoginAttempt` success row that nothing reads and nothing prunes before the next reset. With
  credentials public (NFR-S1), anyone can grow the table without bound. **Main session verified
  live 2026-09-25:** a successful login from a fresh IP added one `success=true` row (`5 → 6`);
  nothing removes it. Promoted to a Finding in the published report.
- **F-b (DOS-01 / DOS-02 / BIZ-03), Low, host-dependent.** The rate-limit key is the client-
  supplied first `X-Forwarded-For` entry under bare `next start` (`auth.ts:25`; Next's
  `base-server.js` only fills the header when absent, `??=`). Off-Vercel, rotating the header
  bypasses the throttle and allows targeted lockouts of any key, including the shared `"local"`
  bucket. On Vercel the header is overwritten, per a code comment only ("review finding M4") —
  not yet verified against Vercel's own docs. **Main session verified live 2026-09-25:** 10
  failed logins under `X-Forwarded-For: 198.51.100.23` correctly tripped 429 with
  `Retry-After: 900`; a different `X-Forwarded-For` (198.51.100.24) got 401, not 429 — confirming
  the key is fully client-controlled under this session's bare `next start` target.
- **F-c (BIZ-04 / DOS-01), Info.** Check-then-record race in the throttle (no transaction/lock
  between the count check and the insert). Not independently verified live (would need concurrent
  requests, out of scope under the no-flood rule).
- **F-d (CRYP-03), Info.** No bcrypt minimum cost enforced in code (`env.ts:34`'s regex accepts
  `$2b$04$`). This session's own review-target hash uses cost 10 (main session's own generation);
  the *code* still accepts a weaker one.
- **F-e (CRYP-01), Info.** `SESSION_SECRET` ≥ 32 chars is enforced only at use time (fails closed:
  every visitor looks logged out, login 500s); no test pins the under-32 branch.
- **F-f (CRYP-01), Info / owner question.** `LoginAttempt.ip` stores client IPs in clear for up to
  10 days, including successful logins — in tension with NFR-S1's "no personal data is collected
  or stored" (ADR-0006 and `data-model.md` accept the table's existence, but the wording
  disagrees). Raised as an explicit owner question in the published report.
- **F-g (BIZ-02), Info.** A reset truncates `ResetLog` itself, so the database keeps only the
  latest reset — history lives only in host log retention. The spec'd log line's emission is
  untested (not independently verified live this session).
- **F-h (DOS-03), Info.** No app-level body-size or timeout limit; the proxy truncates request
  bodies at 10 MB (Next's own default); the login password has no max length; `/_next/image` is
  live but unused by the app. Host limits (Vercel) are T-14's to confirm.
- **F-i (CRYP-05), Info.** Nonce entropy is 122 bits (base64 of a v4 UUID) against CSP3's
  recommended ≥128. Not exploitable; a `/_global-error` edge-cache replay question is deferred to
  T-14 (TD-3's own note already flags the `s-maxage` header there).

## Cross-category observations (feeding SESS-13, TRAN-05)

- **SESS-13, logout CSRF:** `POST /api/auth/logout` needs no session and clears `pf_session`
  unconditionally, with no Origin or `Sec-Fetch-Site` check (unlike the GET fallback, which is
  fully gated by ADR-0006 amendment 3). A cross-site top-level form POST could trigger it in a
  real browser if `SameSite=Lax` did not block it (see the published report's Finding write-up for
  the SameSite caveat this session added). **Main session verified live 2026-09-25** that the
  server itself performs no such check (204, cookie cleared, regardless of `Origin`) — promoted to
  a Finding.
- **Login CSRF via a `text/plain` form:** `request.json()` ignores `Content-Type`; harmless here
  since the only account is public.
- **TRAN-05:** the cookie's `Secure` flag depends on `request.url.startsWith("https://")`; confirm
  on Vercel at T-14 that `request.url` reports `https`.

## Category tables (candidate statuses; see the full handback for the complete evidence and the
proposed bounded live commands — reproduced in summary form)

### DOS

| ID | Status | Notes |
|---|---|---|
| DOS-01 Anti-automation | FAIL (Low) — confirmed live (F-b) | Rate limit exists and works exactly as spec'd for a fixed key; the key itself is client-controlled off-Vercel. |
| DOS-02 Account lockout | PASS, with the same Low residual as DOS-01 | No account-level lockout exists (keyed on IP only, not identity) — correct by design; the residual is F-b. |
| DOS-03 HTTP protocol DoS | NOT TESTED — host limits pending T-14 | No app-level body/timeout limit; Next's own 10 MB proxy default applies locally. |
| DOS-04 SQL wildcard DoS | N/A | No search/filter input exists in R1; only raw SQL is constant. |

### BIZ

| ID | Status | Notes |
|---|---|---|
| BIZ-01 Feature misuse | FAIL (Low) — confirmed live (F-a) | Unbounded `LoginAttempt` success-row growth. |
| BIZ-02 Non-repudiation | NOT TESTED | The spec'd reset log line's emission is not independently confirmed this session. |
| BIZ-03 Trust relationships | PASS, cross-referencing F-b | `X-Forwarded-For` is the only client-trusted input of consequence; everything else server-computed or stripped. |
| BIZ-04 Integrity of data | PASS | Reset runs in one transaction under a Postgres advisory lock, covered by the existing (green) `tests/api/reset.spec.ts`. |
| BIZ-05 Segregation of duties | N/A | One role; reset gated by operator/cron secrets only. |

### CRYP

| ID | Status | Notes |
|---|---|---|
| CRYP-01 Data that should be encrypted | PASS, with the Info owner question (F-f) | Password bcrypt-hashed; session sealed (AES-256-CBC + HMAC-SHA256); no plaintext secrets found. |
| CRYP-02 Wrong algorithm for context | PASS | Slow KDF for the password; AEAD-equivalent for the cookie; `timingSafeEqual` for admin secrets. |
| CRYP-03 Weak algorithms | PASS for this review's hash (cost 10, confirmed by the main session, which generated it); code itself accepts as low as cost 4 (F-d) | Whole-repo grep for MD5/SHA1/RC4/DES/ECB: no hits. |
| CRYP-04 Proper salting | PASS | bcrypt and iron-webcrypto both draw fresh random salts per hash/seal. |
| CRYP-05 Randomness functions | PASS for source and per-request freshness — confirmed live by the main session (two `/login` requests, two distinct valid-format nonces) | No `Math.random` anywhere; nonce is `crypto.randomUUID()`, minted fresh per request with no module-level state. |

### FILE (all N/A — no upload handler anywhere; category-wide grep found no hits for
multipart/FormData/file input/upload across `app/`, `src/`, `proxy.ts`)

FILE-01 through FILE-08: **N/A**.

### CARD (all N/A — no payment SDK, no card fields in the schema, no PCI-relevant code anywhere)

CARD-01 through CARD-11: **N/A**.

### HTML5

| ID | Status | Notes |
|---|---|---|
| HTML5-01 Web messaging | N/A | No `postMessage`/`onmessage` anywhere, app or the one third-party runtime (the WebMCP polyfill). |
| HTML5-02 Web storage | PASS | Only `sessionStorage`, two non-sensitive keys, never rendered or queried. |
| HTML5-03 CORS | PASS — confirmed live by the main session (no `Access-Control-*` header on a cross-origin `GET`/`OPTIONS` probe against `/api/auth/session` and `/api/auth/login`) | No CORS configuration anywhere in the app. |
| HTML5-04 Offline web application | N/A | No service worker, manifest, or app-cache reference anywhere. |

## Live checks the main session ran from this group's proposed commands (bounded, no floods)

- DOS-01/F-b: 12 login requests (10 failures + the 11th 429 + one different-key 401) — matches
  prediction exactly.
- BIZ-01/F-a: 1 successful login + 2 read-only `psql` counts — matches prediction exactly.
- CRYP-05: 2 `/login` requests, nonce freshness — matches prediction.
- HTML5-03: 2 CORS probes — matches prediction (no headers).
- The off-schedule-reset-without-a-secret probe and BIZ-02's log-line check were not run this
  session (left for a future pass or the owner, since they add no new severity beyond what is
  already documented in TD-10 and this report).
