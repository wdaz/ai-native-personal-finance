# T-13d execution — subagent report: INFO, CONF, TRAN (condensed)

Dispatched: Agent tool, `subagent_type: Explore`, `model: opus` (Q6), read-only, background.
Condensed from the full SubagentHandback (findings, tables and evidence preserved; some
repeated narrative trimmed). The main session's live verification is noted inline and in the
published report's Findings section.

**Basis.** Commit `aad142358930df2e15bb108fe398a10ab325243d`, `.next/` BUILD_ID
`ZvzeRNj_JdswJEE8Mv-bj`. `.next/required-server-files.json`: `poweredByHeader: true`,
`productionBrowserSourceMaps: false`, `env.NEXT_PUBLIC_APP_ENV: "production"`. No tests, no HTTP
requests, no git commands run by this subagent (it disclosed the plan file was initially missing
from its working tree — fixed by the main session merging the plan branch in immediately after).

## Candidate findings

- **F-a: `X-Powered-By: Next.js` is sent** (Low; requirement: none written; INFO-06, CONF-05).
  `next.config.ts` has no `poweredByHeader: false`. No test asserts its absence. **Main session
  confirmed live, repeatedly, on this commit** — promoted to a Finding in the published report.
- **F-b: security headers exist only on responses the proxy handles** (Low; NFR-S6 doesn't say
  "every response"; CONF-05). The matcher's `.*\..*` exclusion skips the proxy for any dotted
  path, so 404s for e.g. `/robots.txt`, `/x.php`, `/.env` carry no CSP/nosniff/Referrer-Policy/
  Origin-Agent-Cluster. For avatars this is pinned on purpose (review finding M6). Impact is small
  (fixed error pages, no reflected input). **Main session confirmed live** (K3 batch: all dotted
  probe paths 404, headers not independently re-checked on every one but the mechanism — the
  matcher regex — was already read directly in `proxy.ts`).
- **F-c: the same `.*\..*` exclusion also cancels Next's own `.rsc`/`.segments` request-variant
  coverage** (NOT TESTED; CONF-04, cross-links AUTHZ-02/AUTHN-02). Next 16.3.5 appends
  `(\.json|\.rsc|\.segments\/.+\.segment\.rsc)?` to every proxy matcher so that a proxy also
  covers the RSC transport forms of a path; the project's own `.*\..*` lookahead sees that
  suffix's dot first and excludes it too. A `node -e` evaluation of the *compiled* matcher regex
  (from `.next/server/functions-config-manifest.json`) confirmed the proxy is skipped for
  `/overview.rsc`, `/overview.segments/_tree.segment.rsc`, `/overview.json` and
  `/api/overview.json`, and still runs for `/overview` and `/api/overview`. Locally this is masked
  — the `.rsc` path normalizer is off under bare `next start` (it exists only in Next's "minimal
  mode"), which **the main session confirmed live**: every one of those paths answered a plain 404
  with `text/x-component`/`text/html`, not the page. **On Vercel, Next runs in minimal mode, where
  the normalizer is on** — whether Vercel then routes `/overview.rsc` to the Overview render
  without ever invoking the proxy could not be determined from this checkout (`@vercel/next` is
  not in `node_modules`). Neither `app/(app)/overview/page.tsx` nor its layout checks the session
  itself — the proxy is the only gate. **If real, this is an unauthenticated-data-exposure /
  authentication-bypass class issue** (High by the skill's rubric), though its actual impact in
  Release 1 is Low (read-only, shared demo dataset, no server actions exist). **This is the single
  most important open item this review produced — see the published report's top-line Finding and
  its explicit hand-off into T-14's first-preview checklist.**
- **F-d: the `/_next/image` optimizer is enabled, unused, and outside the proxy** (Low/
  Observation; CONF-01, INFO-09). No code imports `next/image`. `images-manifest.json` shows
  `unoptimized: false` with permissive `localPatterns`. **Main session confirmed live**: the
  avatar path returns `200 image/jpeg`; a non-image path (`url=/overview`) correctly refuses
  (`400`) rather than leaking the page.

## Observations (no change needed, or owned elsewhere)

- The client bundle exposes `window.next={version:"16.3.5",…}` — framework-standard, not this
  app's own leak.
- `_clientMiddlewareManifest.js` publishes the compiled matcher regex to any visitor — by
  framework design; the repository is already public, so this discloses nothing `proxy.ts` itself
  does not.
- **33 committed files under `docs/`, `.claude/` and `.github/` contain `/Users/ruslan/` (64
  occurrences, the owner's local macOS username).** Confirmed by the main session with a direct
  grep (`33` files, `64` occurrences). This is a minor information-disclosure item now that the
  repository is public; it matches a "go-public" redaction item the T-16 backlog row already owns
  (not a new, separate finding).
- No `SECURITY.md` existed when this subagent ran; the T-13d row's item (2) already covered
  raising it. **Since resolved**: the owner directed `SECURITY.md` be written during this task's
  plan gate (Q4), and it now exists at the repo root.
- `LoginAttempt` stores the client IP; NFR-S1 says "no personal data is collected or stored" —
  the same tension the DOS/BIZ/CRYP group's F-f raises; not duplicated as a second finding.
- Stack traces in production: none by construction (handled errors return generic envelopes;
  uncaught errors in a route handler give Next's own empty-body 500 — this is the same mechanism
  behind Finding F-02/VAL-23's TRACE discovery). One aside: such an uncaught 500 carries no
  `ErrorEnvelope`, though SPEC-auth §2.10 says "all API errors" use one — worth a line in the
  report's Observations, not raised to a separate finding (no such 500 was actually triggered by
  any normal input during this review; it is a code-reading inference).

## Category tables (condensed; full per-item evidence and proposed commands are in the original
handback, most of it independently re-run by the main session — see K2/K3/K4/K5/K7/K8/K9 in the
published report's Method section)

### INFO (14 items)

| ID | Status | Notes |
|---|---|---|
| INFO-01 Inventory routes/flows | PASS (route inventory confirmed via `.next/app-path-routes-manifest.json` and live K2 probing) | No browser walk performed; status codes for every listed route confirmed by curl. |
| INFO-02 Discover unlinked entry points | PASS — confirmed live (K2) | `/admin`, `/debug`, `/api` → 404; `/api/admin`, `/api/admin/x` → 401 (session check, not the secret path); dev endpoints 404; `/_next/image` live but bounded (F-d). |
| INFO-03 Discover hidden files/dirs | PASS — confirmed live (K3) | `robots.txt`, `sitemap.xml`, `.env*`, `.git/*`, backup/editor files, source maps: all 404/absent. |
| INFO-04 Search-engine discovery | NOT TESTED — not built yet | No deployed host exists (T-14 has not run). |
| INFO-05 Fingerprint app/framework via UA | PASS — confirmed live (K4) | Same status code (302) for Chrome, mobile Safari and a declared Googlebot UA on `/overview`; body differences are Next's own bot-aware streaming, framework-standard. |
| INFO-06 Fingerprint via error/response | FAIL (Low) — Finding F-a, confirmed live | `X-Powered-By: Next.js` on every response. |
| INFO-07 Identify tech stack | PASS (inventory) | Next 16.3.5, React 19.3, Postgres 18.6, Node ≥26 — all public via `package.json` in this public repo anyway. |
| INFO-08 Identify user roles | PASS (inventory) | Anonymous, one demo identity, operator/cron secret holders. |
| INFO-09 Identify app entry points | PASS (inventory) | Full route/tool inventory built; cross-referenced by CONF-01/AUTHZ-02. |
| INFO-10 Map execution paths | PASS (inventory) | 18 client modules; ESLint import boundaries enforce the layering; built bundle carries no secret name. |
| INFO-11 Fingerprint every data channel | PASS (inventory), with the channel note that feeds F-c | UI page, JSON API and the two WebMCP tools all reach the same `getOverview` through the one proxy gate; a fourth, Vercel-only `.rsc` transport form is F-c/CONF-04. |
| INFO-12 Deployment inventory | NOT TESTED — not built yet | No preview/production host, no runbook exists yet. |
| INFO-13 Host inventory | NOT TESTED (worst-of rule: local part PASS, production part pending T-14) | — |
| INFO-14 Third-party hosted content | PASS (static, backed by existing tests) | No external script/style/font/image origin anywhere; CSP is `default-src 'self'` with no third-party source, pinned by an existing, currently-green API test. |

### CONF (8 items)

| ID | Status | Notes |
|---|---|---|
| CONF-01 Non-production endpoints reachable | PASS (route matrix), the framework-endpoint half confirmed live (K2) | `/api/test/*` 404 outside test (main session's own F1 finding, Task 1); `/api/admin/*` other than the exact reset path gets the session check. |
| CONF-02 Backup/config file exposure | PASS — confirmed live (K3) | No backup/editor files, no `.env*`, no source maps served. |
| CONF-03 HTTP methods/TRACE | NOT TESTED by this subagent; **resolved by the main session's own live check** | See VAL-23/Finding F-02: TRACE bypasses the proxy entirely (bare 500, no headers) on every route tested; other unexported methods correctly 401/405. |
| CONF-04 Old/backup/unreferenced files reachable via a different transport form | NOT TESTED (deployed-host half); local half PASS — confirmed live (K7) | This is Finding F-c above — the `.rsc` matcher gap. Locally safe (normalizer off); Vercel behaviour unverified. |
| CONF-05 Infrastructure/app config | FAIL (Low) — Findings F-a and F-b | Documented headers (CSP, Referrer-Policy, nosniff, Origin-Agent-Cluster) are present and correctly pinned where the proxy runs; `X-Powered-By` leaks the framework; headers are absent on the (small number of, harmless) paths the proxy's own matcher skips. BY DESIGN: no `Permissions-Policy` and no `X-Frame-Options` (NFR-S6 names only `frame-ancestors`, which the CSP already carries). |
| CONF-06 Old/default files (crossdomain.xml etc.) | N/A — confirmed live (K3) | No such file exists; nothing requests one. |
| CONF-07 Test data / real data separation | BY DESIGN | Live data is the fictional seed (NFR-D3, NFR-S1); test-only variants are gated by `APP_ENV=test` plus TD-10's guard. Caveat carried to CRYP/BIZ's F-f: `LoginAttempt.ip` sits in tension with NFR-S1's wording, though the row itself is by-design and truncated on reset. |
| CONF-08 Sensitive data exposed to the client | PASS (static, on this build) | Grep of the built client bundle for every secret name finds nothing; only two non-secret `NEXT_PUBLIC_*` values are inlined. The demo password's display on the page is BY DESIGN (NFR-S1). |

### TRAN (6 items)

Severity context noted by the subagent: the demo credentials are public (NFR-S1), and a stolen
session gives nothing those credentials do not already give — TLS here protects mainly integrity,
less secrecy.

| ID | Status | Notes |
|---|---|---|
| TRAN-01 TLS in use | NOT TESTED — not built yet | No deployed host exists (T-14). |
| TRAN-02 Valid certificate | NOT TESTED — not built yet | Same. |
| TRAN-03 HTTP → HTTPS redirect | NOT TESTED — not built yet | The app itself enforces no HTTPS redirect and has no `upgrade-insecure-requests`; entirely host-dependent. |
| TRAN-04 HTTPS on every page | NOT TESTED — not built yet | Same. |
| TRAN-05 Secure cookie flag | PASS for the http branch (main session confirmed live: no `Secure` over `http://localhost`, matching SPEC-auth's documented exception); NOT TESTED for the https branch | The three governing documents (ADR-0006, SPEC-auth, the code) word the rule slightly differently but behave the same in practice under `next start`; T-14 must confirm the https branch on a real login. |
| TRAN-06 HSTS | NOT TESTED — not built yet; predicted FAIL unless the host adds it | Nothing in the app sets `Strict-Transport-Security`; no requirement names it ("requirement: none written" if it becomes a finding after T-14). Browsers ignore HSTS over http, so its local absence is not itself a finding. |

## Existing tests and files cited

Omitted here for length — the original handback lists every relevant test file and every source
file read (both repo code and installed Next internals); available in this task's full transcript
if a future session needs it.
