# T-13d execution — subagent report: VAL (Data Validation)

Dispatched: Agent tool, `subagent_type: Explore`, `model: opus` (Q6), read-only, background.
Returned via SubagentHandback. Reproduced verbatim below (the main session's own live
verification of a sample of its claims is in `docs/04-process/plans/2026-09-25-T-13d.md`'s
execution entry and the published report, not repeated here).

---

# T-13d — VAL (Data Validation) walk: candidate statuses for VAL-01 to VAL-32

This was a read-only static review. I ran no tests, sent no HTTP requests and ran no git commands. Every cited test is **predicted, unverified**.

## Before the table: three things you need to know

1. **The plan file is missing.** `docs/04-process/plans/2026-09-25-T-13d.md` is not in the working tree. The plans directory ends at `2026-09-25-T-13b.md`, and a grep for `T-13d` finds only `backlog.md`, `tech-debt.md`, `process-log.md` and the T-13a, T-13b and T-13c plans/prompts. `.git/HEAD` reads `ref: refs/heads/task/T-13d-security-review` (I read the file directly, no git command). So I could **not** read F1–F12, the Review Focus or the owner's Q1–Q8 decisions. I worked from:
   - the T-13d backlog row (`docs/03-specs/backlog.md:187`);
   - the skill;
   - AGENTS.md, NFR-S, SPEC-auth, SPEC-webmcp-tools and tech-debt.md (all read in full).

   If a Q-decision changes the scope or severity of an item, re-map these rows against it.
2. **The scope is Release 1 only: Auth + Overview.**
   - Nothing in R1 writes user data. `src/server/threshold.ts:25-26` says so: "Release 1 wires this but nothing calls it yet: the write endpoints that will call it after every write arrive in Release 2."
   - The API routes are `auth/{login,signup,logout,session}`, `meta`, `overview`, `admin/reset` and `test/[...path]`.
   - The R1 WebMCP tools are `get_balance` and `get_overview_summary`. Neither takes input; both call `GET /api/overview`.
   - Consequence: several items have **no attack surface in R1** but will have one in R2. For those I applied the skill's rule "Specified but not built yet → NOT TESTED, 'not built yet'".
3. **Budget your dynamic checks against the login rate limit.**
   - Every failed login probe below counts toward the limit of 10 failures per IP per 15 minutes (`src/server/rate-limit.ts`, SPEC-auth §4). A successful login clears the counter (`rate-limit.ts:58-60`).
   - `POST /api/test/reset` truncates `LoginAttempt` (`reset.ts:11-18`), but only when the :3900 build has `APP_ENV=test`. I did not check which build it is.

## Checking your claim about `src/shared/schemas.ts` in `src/webmcp`

**WebMCP tool *input* validation does not use `schemas.ts`.**
- `src/webmcp/tools/overview.ts:1` imports `z` from `"zod"` directly, and `:16` defines `const NO_INPUT = z.object({})` locally.
- `defineTool.ts:85` validates with `input.safeParse(rawInput)` against that local schema.
- The WebMCP polyfill does no schema validation of its own. It only `JSON.parse`s the input and requires an object or array (`node_modules/@mcp-b/webmcp-polyfill/dist/schema.js:111-117`, `dist/index.js:802-812`). So `defineTool`'s Zod parse is the only input gate.

**What `src/webmcp` does import from `schemas.ts`:**
- `WebMcpModeSchema` (`adapter.ts:1`) — TD-5's closing import.
- `toErrorIssues` and the `ErrorIssue` type (`defineTool.ts:2`).
- `OverviewDtoSchema` (`tools/overview.ts:3`), used to validate the *response* through `apiGet` (`src/shared/api-client.ts:53`).
- The `ErrorIssue` type (`tool-result.ts:2`, `types.ts:7`).
- `api-client.ts:2` imports `ErrorEnvelopeSchema`.

**Verdict:**
- **TD-5's claim still holds.** `tools/overview.ts` imports `schemas.ts` itself, so `z.config({ jitless: true })` (`schemas.ts:19`) runs before any tool parse.
- **"Shared schemas for tool input" is only vacuously true.** The API these tools call takes no input, so there is no rule to share or duplicate. NFR-Q2's "no duplicate rules" holds.
- ADR-0004:15's wording ("built from the shared Zod schemas") does not literally match the local `{}` literal. That is an observation, not a finding.

## VAL table

| ID | Candidate status | Evidence (file:line / test name / exact command) | Notes (severity, channel, what live verification is still needed) |
|---|---|---|---|
| VAL-01 Reflected XSS | NEEDS VERIFICATION (static: no reflection sink found) | Entry points checked: `next`/`reason` query params serialized via Next's `htmlEscapeJsonString`, never as markup; proxy writes `?next=` only into the Location header via `URLSearchParams`; API errors carry fixed strings/codes; signup `issues[].path` holds schema keys only (unknown keys stripped by `z.object`); 404 page renders no request data; no tool echoes input. Defence in depth: nonce CSP with no `unsafe-inline`, `nosniff`. | Covers UI (login page, 404), API (all routes) and tools. One JSON echo exists: admin-reset's 400 names an unknown key in `issues[].path`, secret-gated. Observation, not XSS. **Main session verified live 2026-09-25: reflected payloads in `next=`/`reason=`/an unknown path all return zero matches.** |
| VAL-02 Stored XSS | NOT TESTED — not built yet (no user-writable free-text field in R1) | No write path in R1 (see note 2 above). Seed names are static JSON, no `<`,`>`,backtick. Render path is React text/attributes; no raw-HTML sink (VAL-03). Tool path is JSON text with `untrustedContentHint` set. | Channels: UI, API and tool all read the same DB rows. Divergence to carry into R2: tool validates DTO bounds; UI/API do not parse output; DB columns are unbounded `String`. An R2 write path must enforce NFR-S3 bounds at write time. |
| VAL-03 DOM-based XSS | PASS (candidate, static) | Grep of `app/`, `src/`, `proxy.ts`, `next.config.ts` for dangerous DOM sinks (`dangerouslySetInnerHTML`, `innerHTML`, `eval`, etc.) has only 3 hits, all benign (`location.replace`/`.assign` to constants, one comment). Zod jitless is on. E2E CSP-violation guard fails any test whose page reports a violation. | UI and the tool runtime in the page. |
| VAL-04 Cross Site Flashing | N/A | No `.swf`/Flash anywhere; grep hits only prose. | — |
| VAL-05 HTML Injection | NEEDS VERIFICATION (same entry points as VAL-01/02; no HTML output of request data found) | Output encoding per channel: React text, `Response.json`, `JSON.stringify`, `URLSearchParams`. | Also UI stored-HTML via the VAL-02 local probe. **Main session verified live 2026-09-25: no reflection.** |
| VAL-06 SQL Injection | PASS (candidate, static) | Only tagged `$queryRaw`/`$executeRaw`/`Prisma.raw` with constants (`threshold.ts:33`, `reset.ts:39,41,43`); no `$queryRawUnsafe`/`$executeRawUnsafe`; no direct `pg` queries. | **Main session spot-checked the citations against the source — accurate.** |
| VAL-07 SOQL Injection | N/A | No Salesforce dependency. | — |
| VAL-08 LDAP Injection | N/A | No LDAP; auth is an env comparison. | — |
| VAL-09 ORM Injection | PASS (candidate, static) | Every Prisma call with `where`/`orderBy`/`data` reviewed; `ip` is always a string, never an object; request bodies never reach a query directly (email is `===` compared, `reason` is an enum, `variant` is allow-listed). | Side note for AUTHN-03/DOS-01: `LoginAttempt.ip` is unbounded `String`; a client-supplied `X-Forwarded-For` picks the rate-limit bucket. |
| VAL-10 XML Injection | N/A | No XML parser dependency; bodies parsed only with `request.json()`/`JSON.parse`. | — |
| VAL-11 XXE Injection | N/A | Same as VAL-10. | — |
| VAL-12 SSI Injection | N/A | Node/Next only. | — |
| VAL-13 XPath Injection | N/A | No XML stack. | — |
| VAL-14 XQuery Injection | N/A | No XML stack. | — |
| VAL-15 IMAP/SMTP Injection | N/A | No mail library. | — |
| VAL-16 Code Injection | N/A (no sink) | No `eval`/`new Function`/`node:vm`/`child_process`; only dynamic `import()` has a constant specifier. Zod jitless; production CSP has no `unsafe-eval`. | **Main session spot-checked the citation — accurate.** |
| VAL-17 Expression Language Injection | N/A | No template engine. | — |
| VAL-18 Command Injection | N/A | No `child_process`/`exec`/`spawn` anywhere. | — |
| VAL-19 Overflow (Stack, Heap, Integer) | NOT TESTED — not built yet | No numeric request field exists in R1. Output-side guards exist (`Cents = z.int()` safe-integer range, `sumCents` refuses overflow, 64-bit columns). | For R2: one shared `AmountSchema`. Latent gap: balance values pass `Number(bigint)` with no `isSafeInteger` check — unreachable in R1 (seed only). |
| VAL-20 Format String | PASS (candidate, static) | Request-derived values reach logs only as single-argument JSON lines (escaped) or generated ids. | Worst case in JS is log forging, not memory corruption. |
| VAL-21 Incubated vulnerabilities | PASS (candidate, static) for R1 | Stored `LoginAttempt.ip` never rendered/logged/returned; tool outputs bounded and flagged `untrustedContentHint`; no HTML reaches a tool (proven by existing unit tests for HTML/non-envelope error handling). | NFR-S7 satisfied in R1. Prompt-injection-shaped content can only come from DB names (seed-only in R1); confirmed by the VAL-02 local probe design. |
| VAL-22 HTTP Splitting/Smuggling | NEEDS VERIFICATION (static: no unencoded request value in a response header) | Response headers built from request data are all either constant-composed (`new URL`+`searchParams.set`) or server-generated (`X-Request-Id`, `Retry-After`). | Smuggling is a host concern (Vercel). **Main session verified live 2026-09-25: CRLF in query/path is percent-encoded/rejected; a spoofed `X-Request-Id` is overwritten by the server.** |
| VAL-23 HTTP Verb Tampering | NEEDS VERIFICATION (static: authentication does not depend on the method) | `needsSession` depends on pathname only; each route exports only its own methods; no method-override header honoured. | Caution: HEAD runs the GET handler on `/api/admin/reset` — never send it with `CRON_SECRET` set. **Main session verified live 2026-09-25: PUT/PATCH/DELETE on /api/overview → 401; GET/PUT/DELETE on /api/auth/login → 405. TRACE, however, returns a bare 500 with NONE of the app's security headers on every route — the request never reaches proxy.ts. Recorded as Finding F-02 in the published report (this was NOT predicted correctly by the agent — corrected per governance's "reported output is copied from the run").** |
| VAL-24 Open Redirection | PASS (candidate) | `sanitizeNextPath` (anchored allow-list regex) used by both the proxy and the client; every other redirect target is a constant; Host header not used for redirect URLs under `next start` (no `trustHostHeader`). | The unit table lacks backslash/encoded/absolute/tab-CRLF variants — cheap follow-up. **Main session spot-checked the citation — accurate.** |
| VAL-25 Local File Inclusion | N/A | No `fs` read of request-derived paths anywhere. | Framework static serving of `public/` belongs to AUTHZ-01. |
| VAL-26 Remote File Inclusion | N/A | No server-side `fetch`/HTTP client with a request-controlled URL. | — |
| VAL-27 Client vs server validation | PASS (candidate); includes one BY DESIGN divergence | One schema object used on both sides (`LoginSchema`/`SignupSchema`). BY DESIGN divergence: login password input has `maxLength=128` client-side but the schema has no max (SPEC-auth §4: "login only checks presence"); login answers invalid data with 401 never 400 (owner decision, security, no oracle). | **Main session confirmed the LoginForm.tsx:122 `maxLength={PASSWORD_MAX}` and `LoginSchema`'s missing `.max()` directly against the source — accurate.** For R2: tool input schemas must come from `schemas.ts`. |
| VAL-28 NoSQL Injection | N/A | PostgreSQL only; no NoSQL dependency. | — |
| VAL-29 HTTP Parameter Pollution | FAIL (candidate, Low) for a repeated session cookie; query/body PASS candidates | Two parsers disagree on duplicate `pf_session` cookies: the proxy (Next's own parser) keeps the LAST, `GET /api/auth/session`'s own `readCookie` keeps the FIRST. No test covers it. | **Main session verified live 2026-09-25, exactly as predicted both orderings — promoted to Finding F-01 in the published report.** Severity Low: no auth bypass (both still require a valid seal); effect is a possible disagreement between the shell's bfcache re-check and the page/API layer. |
| VAL-30 Auto-binding | PASS (candidate, static) for R1 | No request body is spread into a model anywhere; all persisted fields are explicit. | R2's create/update endpoints must bind whitelisted fields only. |
| VAL-31 Mass Assignment | PASS (candidate) for R1; R2 write endpoints NOT TESTED — not built yet | `LoginSchema`/`SignupSchema` are `z.object` (strip unknown keys); `AdminResetSchema` is `strictObject` (rejects them, with an existing test). Ids/timestamps are DB defaults. | — |
| VAL-32 NULL/Invalid session cookie | NEEDS VERIFICATION (static reading says clean 401/302; no existing test sends a garbage/empty/truncated/oversized cookie) | `readSession` returns null for empty; `unsealData` never throws on a bad seal (catches, returns `{}`); Next's cookie parser swallows decode errors. | **Main session verified live 2026-09-25: empty/garbage/malformed/percent-broken cookies all → 401 on the API, 302 on pages, matching prediction exactly.** |

## Observations (no change needed, or R2 carry-overs; not findings)

1. Tool validation errors are more verbose than API errors (Zod's default English messages + issue path in `message`/`content[0].text`). R1 tools use non-strict `z.object({})` so no key name is echoed; a future `strictObject` tool would reflect caller-chosen key names — a note for R2, not a finding.
2. Only the tool channel validates the Overview DTO at runtime; harmless while data is seed-only.
3. Admin reset's 400 names an unknown key in `issues[].path` — a deliberate choice (T-08 plan v0.5, correction 3), secret-gated.
4. Login reads the whole body and password before rejecting; no length cap (bcryptjs truncates to 72 bytes only after converting the whole string). Hand to DOS-03.
5. `request.json()` ignores `Content-Type`, so a cross-site `text/plain` form POST reaches `/api/auth/login` (a login-CSRF shape); only account is the shared demo account. Hand to SESS-13.
6. The proxy matcher skips any path containing a dot; the only dynamic route today (`/api/test/[...path]`) needs no session and 404s outside test. R2 dynamic segments must not accept dots. Hand to AUTHZ-02.

## Existing tests relevant to VAL

(all predicted, unverified by this subagent) — see the full list in the original handback; omitted here for length. The main session separately confirmed the overall API suite is 103/103 green on this commit.

## Status tally (candidates, before main-session verification)

| Status | Count | Items |
|---|---|---|
| PASS (candidate) | 10 | VAL-03, 06, 09, 20, 21, 24, 27, 30, 31 (R1), plus the query/body part of 29 |
| NEEDS VERIFICATION | 5 | VAL-01, 05, 22, 23, 32 |
| NOT TESTED — not built yet | 2 | VAL-02, 19 |
| N/A | 14 | VAL-04, 07, 08, 10, 11, 12, 13, 14, 15, 16, 17, 18, 25, 26, 28 |
| FAIL (candidate) | 1 | VAL-29 (Low) |
