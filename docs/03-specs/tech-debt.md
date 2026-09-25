# Tech debt — Release 1

Status: **Approved** (v1.21 — 2026-09-26: T-14 measured the Vercel-related entries on the task's own
preview (PR #60, in review): TD-14 closed — no data reachable without a session; TD-17 closed —
Vercel overwrites `X-Forwarded-For`; TD-3 gains the measured cache headers; TD-19 opened — the proxy
does not run for Next's `.segments/*` URLs on Vercel (harmless today); TD-20 opened — `pg`'s
`sslmode=require` warning; v1.20 — 2026-09-25: TD-12, TD-15, TD-16 and TD-18 closed by PR #47 (T-13d);
TD-13, TD-14 and TD-17 stay Open; v1.19 — 2026-09-25: owner decision — fix TD-12, TD-15, TD-16, TD-18 now
(nothing Vercel-related); TD-13 investigated — no application-level fix exists (`TRACE` is a
Fetch-spec forbidden method, undici/Next's own rejection before any app code runs), stays Open as
a documented platform limit; TD-14 and TD-17 stay untouched (Vercel-related, owner's instruction);
v1.18 — 2026-09-25: T-13d's security review adds TD-12–TD-18, one per
finding (F-01–F-07); none fixed here — "review, don't fix" (skill ground rule) — and nothing in
this task is pushed to `origin` until the owner has reviewed the full report and decided,
finding by finding, how to handle each one (plan Q5); v1.17 — 2026-09-25: TD-3's v1.16 paragraph corrected by the Opus 5.5
whole-branch review — the component Next renders for `/_global-error` is `AppError`, not
`DefaultGlobalError` (different builtin files), and the response carries two inline `<script>` tags,
not three; v1.16 — 2026-09-25: TD-3 investigated at T-13b — no fix exists in Next 16.3.5 (measured), the entry's "not reachable by a normal request" claim corrected, pinned by `tests/api/proxy.spec.ts`; v1.15 — 2026-09-25: TD-2 closed by PR #44 (T-13a); v1.14 — 2026-09-25: TD-2 fixed in T-13a, in review on `task/T-13a-proxy`; its Fix line's `runtime` advice is corrected (Next 16.3.5 refuses the option); v1.13 — 2026-09-25: TD-7–TD-11 closed by PR #39 (T-13c); v1.12 — 2026-09-25: TD-7–TD-11 fixed in T-13c, in review on `task/T-13c-tech-debt`; TD-10's `db:reset` refusal also comes before `prisma migrate deploy`, the owner's choice B; v1.11 — 2026-09-24: TD-11, `next build` fetches Public Sans from Google Fonts, found by a failed CI leg on PR #36; fixed in T-13c, owner decision; v1.10 — 2026-09-24, owner decision before T-14: every open entry is fixed before the deploy, each as a backlog task of its own — TD-2 by T-13a, TD-3 by T-13b — and four known items that had no entry become TD-7–TD-10, fixed by T-13c; v1.9 — 2026-09-24: TD-4's evidence note names the right lines and says CI now runs Firefox and WebKit; v1.8 — 2026-09-24: TD-4 closed by T-13; v1.7 — 2026-09-24: TD-6 closed by PR #23; v1.6 — 2026-09-24: TD-5 closed by T-11; v1.5 — 2026-09-24: TD-6 fix in review, owner chose option (b) and accepted ADR-0006 amendment (4); v1.4 — 2026-09-23: TD-6, the dev-mode CSP console noise, owner request during T-07's execution; v1.3 — 2026-09-23: TD-1 closed by T-07; v1.2 — 2026-09-23: TD-1 assigned to T-07, owner decision at the T-07 plan gate; v1.1 — 2026-09-23: TD-4 and TD-5 from T-06's whole-branch review, owner decision; v1.0 — 2026-09-23, owner decision at the T-06 plan gate: tech debt lives in its own file, linked from `backlog.md`, so the link is never lost) · Author(s): Agent · Date: 2026-09-23

Known shortcuts and fragilities the owner has decided to keep for now. Every entry has an id
(`TD-n`), where it was found, the owner's decision, the risk, what guards it meanwhile, the
fix, and the task expected to pick it up. `backlog.md` links here from its Notes. A task that
touches a file an entry names reads the entry first; the task that fixes an entry marks it
**Closed** here — with the date and the PR — and never deletes it.

| Id | Title | Status | Picked up by |
|----|-------|--------|--------------|
| TD-1 | The CSP nonce reaches Next through an undocumented header copy | **Closed** | T-07 |
| TD-2 | `middleware.ts` uses a deprecated file convention (`proxy`) | **Closed** | T-13a (PR #44; v1.10) |
| TD-3 | `/_global-error` is prerendered, without the CSP nonce | **Open — no fix in Next 16.3.5** | T-13b (investigated; v1.16) |
| TD-4 | Two "submit is focused after an error" E2E assertions prove nothing on Chromium | **Closed** | T-13 |
| TD-5 | Zod's `jitless` setting rides on importing `src/shared/schemas.ts` | **Closed** | T-11 |
| TD-6 | `next dev` fills the console with CSP violations (the policy has no dev variant) | **Closed** | `fix/td-6-dev-csp` (PR #23) |
| TD-7 | The WebMCP status indicator can keep saying `unavailable` while a new registration runs | **Closed** | T-13c (PR #39) |
| TD-8 | The keyboard login walkthrough's comment says "Shift+Tab back"; the test focuses the field directly | **Closed** | T-13c (PR #39) |
| TD-9 | The `minmax(0, 1fr)` rule for card grids is a comment, not a check | **Closed** | T-13c (PR #39) |
| TD-10 | Nothing stops `APP_ENV=test`, `db:reset` or `test:api` from running against a non-local database | **Closed** | T-13c (PR #39; moved from T-14's T-02 hand-off) |
| TD-11 | Every `next build` downloads Public Sans from Google Fonts, so a network hiccup fails the build | **Closed** | T-13c (PR #39; v1.11) |
| TD-12 | Duplicate `pf_session` cookies are read inconsistently between the proxy and the session-probe route | **Closed** | T-13d (PR #47; F-01) |
| TD-13 | `TRACE` bypasses the proxy entirely on every route: a bare 500 with none of the app's security headers | **Open — no fix possible (Fetch-spec forbidden method, undici/Next)** | T-13d (investigated; F-02) |
| TD-14 | The proxy's dotted-path exclusion may also skip Next's `.rsc`/`.json` transport forms of protected pages on Vercel | **Closed** (PR #60, in review — measured on Vercel: no data reachable without a session; the residual gap is TD-19) | T-13d (F-03); T-14 (6.5) |
| TD-15 | `POST /api/auth/logout` has no CSRF check of its own beyond `SameSite=Lax` | **Closed** | T-13d (PR #47; F-04) |
| TD-16 | `X-Powered-By: Next.js` is sent on every response | **Closed** | T-13d (PR #47; F-05) |
| TD-17 | The login rate-limit key is client-controlled `X-Forwarded-For` unless the host overwrites it | **Closed** (PR #60, in review — Vercel overwrites the header, measured) | T-13d (F-06); T-14 (6.7) |
| TD-18 | Successful logins persist an unbounded, never-pruned `LoginAttempt` row | **Closed** | T-13d (PR #47; F-07) |
| TD-19 | The proxy does not run for Next's `.segments/*` transport URLs on Vercel | **Open** — harmless while every route is dynamic; owner decides the hardening | T-14 (6.5; residual of TD-14) |
| TD-20 | `pg` treats `sslmode=require` as `verify-full` today; `pg` 9 will not, and Neon's URL carries `sslmode=require` | **Open** — owner decides | T-14 (6.2, the Vercel build log) |

## TD-1 — The CSP nonce reaches Next through an undocumented header copy

- **Found:** 2026-09-23, T-06 plan finding F2 — by the subagent that prepared F1 (PR #15), and
  checked by the planning session in Next's own source.
- **Owner decision:** 2026-09-23 — recorded as tech debt and kept in the backlog; not fixed
  before T-06 ("F2 tapıntısı techdeptdə yazılır. Və backlogda saxlanılır.").
- **What:** Next 16.3.5 takes the nonce it puts on its own inline `<script>`/`<style>` tags from
  the **request's** `Content-Security-Policy` header
  (`node_modules/next/dist/server/app-render/app-render.js:209-210`: `headers['content-security-policy']` →
  `getScriptNonceFromHeader`). `middleware.ts` sets that header on the **response** only, and
  forwards `x-nonce`, which the renderer never reads. It works today because Next's router also
  copies middleware response headers onto the request — behaviour Next does not document.
- **Risk:** a Next upgrade that stops the copy renders every page without the nonce; the CSP then
  blocks Next's inline scripts and styles and client-side JavaScript is dead — the failure T-05's
  review found as C2.
- **Guarded meanwhile by:** `tests/api/middleware.spec.ts` (F1, PR #15: every inline tag of a 404
  page carries the response's nonce) and T-06's `tests/api/auth-pages.spec.ts` and E2E CSP
  guard — all fail the day the copy stops.
- **Fix:** also set the `Content-Security-Policy` on the forwarded request headers, as Next's own
  content-security-policy guide does; keep forwarding `x-nonce` for any `<Script>` that reads it
  with `headers()`; correct the comment in `middleware.ts`. ADR-0006's wording was already
  corrected (dated note of 2026-09-23).
- **Closed:** 2026-09-23, T-07 (`task/T-07-app-shell`, PR #19) — `middleware.ts` sets the policy
  on the forwarded request headers and its comment says so; the nonce API tests and the E2E CSP
  guard stayed green. No test isolates the forwarded-header line itself: Next still copies the
  response header onto the request, so removing the line alone would not fail one (whole-branch
  review, M6).

## TD-2 — `middleware.ts` uses a deprecated file convention

- **Found:** 2026-09-23, during T-05 — every `next build` prints a deprecation warning for the
  `middleware` file convention: "Please use 'proxy' instead" (codemod: `npx @next/codemod@canary
  middleware-to-proxy`). Recorded then only in the process log (T-05 entry, "Next"); moved here
  when this file was created, so it has a home.
- **Owner decision:** none yet beyond T-05's "worth a follow-up task" — listed here so it is not
  lost. 2026-09-24: fixed before T-14, as backlog task T-13a ("T14 keçməzdən öncə Tech deptləri
  düzəltmək. Onlarda Tasklar kimi prosess-log-da öz əksini tapmalıdır." — fix the tech debt
  before T-14, each reflected in the process log as a task).
- **Risk:** a Next major that removes the old convention breaks the route matrix, the session
  check, the reset-epoch check and the CSP at once.
- **Guarded meanwhile by:** the API suite (`tests/api/middleware.spec.ts`, `auth.spec.ts`) and the
  E2E suite, which fail on any of those.
- **Fix:** run the codemod, keep `runtime: "nodejs"` and the matcher, re-run the API and E2E
  suites; fold TD-1's fix into the same change.
- **Correction to the Fix above (2026-09-25, T-13a plan):** "keep `runtime: "nodejs"`" fails — Next
  16.3.5 refuses the option in a proxy: `Route segment config is not allowed in Proxy file`. The
  codemod removes it; a proxy always runs on Node.js. "Fold TD-1's fix into the same change" had
  nothing to fold: TD-1 was closed by T-07.
- **Fix in review:** 2026-09-25, branch `task/T-13a-proxy` — `proxy.ts`; `next build` prints no
  deprecation warning; `tests/api/proxy.spec.ts` holds the old suite and two new tests (the
  `Referrer-Policy` and `X-Content-Type-Options` headers on every branch; the matcher's exclusion of
  files with an extension); API 102, unit 1 046, and the four E2E legs green.
- **Closed:** 2026-09-25, PR #44 (`task/T-13a-proxy`, merge `00e39e9`) — the owner merged it (2026-09-25,
  10:27 UTC); CI on the PR's last head (`374c853`) was green.

## TD-3 — `/_global-error` is prerendered, without the CSP nonce

- **Found:** 2026-09-23, F1 (PR #15) — its known limitation. Next's `/_global-error` page is built
  at build time with inline `<script>`/`<style>` tags and `style` attributes that carry no
  nonce, so under ADR-0006's CSP it would render unstyled and without client JavaScript. A
  `global-error.tsx` has to be a client component and cannot call `connection()`, and
  `connection()` in the root layout did not change it.
- **Owner decision:** none yet — listed here so it is not lost. 2026-09-24: fixed before T-14, as
  backlog task T-13b (same message as TD-2). The fix is still to be found, so T-13b may end with
  a measured reason why Next 16.3.5 allows none, for the owner to decide on, instead of a fix.
- **Risk:** low — the page renders only when the root layout itself throws; the user sees an
  unstyled error instead of a styled one.
- **Guarded meanwhile by:** nothing automatic; it is not reachable by a normal request.
- **Fix:** to be found — an `app/global-error.tsx` without `style` attributes still leaves the
  prerendered inline scripts; worth a look when a task first adds an error UI.
- **Investigated (T-13b, 2026-09-25):** no application-level fix exists in Next 16.3.5.
  `/_global-error` is `UNDERSCORE_GLOBAL_ERROR_ROUTE`
  (`node_modules/next/dist/shared/lib/entry-constants.js:33`), forced static unconditionally by
  `isPageStatic()` (`node_modules/next/dist/build/utils.js:595-609`) regardless of `connection()`
  or `export const dynamic = "force-dynamic"` — measured on a scratch rebuild. A custom
  `app/global-error.tsx` is not even rendered for this specific artifact: a scratch
  `app/global-error.tsx` with `force-dynamic` still produced Next's own bundled `DefaultGlobalError`
  body byte for byte after a clean `next build`. Also corrected: **the route is directly reachable**
  by a plain `GET /_global-error` — not "not reachable by a normal request" as the entry above said
  — the proxy runs on it like any other page (no file extension, so the matcher does not exclude
  it) and mints a fresh nonce on its response header every time; only the prerendered body stays
  fixed, carrying no nonce on its one `<style>` or its three inline `<script>` tags, and
  `style="…"` attributes throughout, which no nonce covers regardless. `tests/api/proxy.spec.ts`'s
  new TD-3 test pins this exact shape, so it — not the paragraphs above — is what catches a future
  Next release that changes it. The owner may still want the gap filed upstream (with Vercel/Next);
  nothing here does that.
- **Correction to the paragraph above (Opus 5.5 whole-branch review, 2026-09-25):** the component
  Next actually renders for `/_global-error` is **`AppError`**
  (`node_modules/next/dist/client/components/builtin/app-error.js`, its own comment: "This is the
  static 500.html page for App Router apps. Always a server error, rendered at build time"), not
  `global-error.js`'s `DefaultGlobalError` as the paragraph above said — the two are different
  builtin files. The app-loader hardcodes `AppError` as this synthetic route's page module and
  strips its `layout` entry (`node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js:109,358-375,389-391`),
  gated only on the route id (`:124,765`) — nothing about what `app/global-error.tsx` contains
  enters that decision, which is *why* the scratch probe's markup never appeared, a stronger reason
  than "still produced the stock body." `DefaultGlobalError` is a separate builtin every page's
  client bundle does carry, for a client-side error after hydration — never for this route. Also:
  the response has **two** inline `<script>` tags, not three (re-measured, a fresh
  `rm -rf .next && npx next build`), and `AppError` has no second ("Back") button at all — that
  button belongs to `DefaultGlobalError`, which this route never renders.
- **Measured on Vercel (T-14, 2026-09-26, the preview of PR #60, plan 6.8):** `GET /_global-error`
  twice answers HTTP 500 both times, 8993 bytes, the HTML byte-identical; `x-vercel-cache` is
  `PRERENDER` and then `HIT`, with `cache-control: public, max-age=0, must-revalidate` — not the
  `s-maxage=31536000` the T-14 plan assumed (F9) — so the CDN does store and replay the prerendered
  body. The proxy still runs (the response has `X-Request-Id`) and the two responses' CSP headers
  carry **different nonces**, so the header is fresh on every request while the cached body carries
  no nonce at all: the page behaves as it does locally (unstyled where a nonce would be needed), and
  the cache changes what the *header* says, not whether the page works. Nothing new to fix; the
  entry stays Open as a Next 16.3.5 limit.

## TD-4 — Two "submit is focused after an error" E2E assertions prove nothing on Chromium

- **Found:** 2026-09-23, T-06's whole-branch review, finding M1.
- **Owner decision:** 2026-09-23 — tech debt ("M1 və M4 tech dept əlavə olunsun").
- **What:** after a 429 or a network error, `LoginForm` and `SignupForm` move focus to the submit
  button (`submitRef.current?.focus()`, SPEC-auth §3 "Error", plan D7). The E2E tests that pin
  it — `tests/e2e/login.spec.ts` (429, network) and `tests/e2e/signup.spec.ts` (server error, no
  response) — submit with `.click()`. In Chromium and Firefox a clicked button keeps focus while
  it is disabled, so it is still focused when the form re-enables, and the assertion passes
  whether or not the code moves focus. Only WebKit, where focus drops to `<body>`, tests the call —
  and CI runs Chromium only until T-13. (Update 2026-09-24: since T-13's Task 10, CI runs Firefox
  and WebKit as well; the first CI run of those legs is the evidence for Linux, because only
  macOS was measured locally.)
- **Risk:** someone removes the focus call; CI stays green; a keyboard user on Safari lands on
  `<body>` after the error and restarts from the top of the page. `npm run test:all` (WebKit
  included) would still catch it locally.
- **Guarded meanwhile by:** the WebKit project in `npm run test:e2e` / `test:all`, run locally
  before every PR (DoD).
- **Fix:** submit those four tests with Enter in the last field instead of `.click()` — focus then
  sits in the input, which the form disables, so only the code's focus call can put it on the
  button (the reviewer measured this). T-13's WebKit CI job also closes the gap.
- **Closed:** 2026-09-24, T-13 (`task/T-13-ci-hardening`, PR #29) — the four tests submit with `press("Enter")` in the password field. Proven: with
  the three focus calls neutralised (`LoginForm.tsx` — the network-failure
  `submitRef.current?.focus()` (line 78) deleted and the 401-vs-other ternary (line 94, which
  serves the 429) made `passwordRef : passwordRef` — and `SignupForm.tsx`'s
  `submitRef.current?.focus()` deleted), all four fail on Chromium with `Expected: focused` /
  `Received: inactive` on the Login and Create Account buttons; restored, all four pass on
  Chromium, Firefox and WebKit.

## TD-5 — Zod's `jitless` setting rides on importing `src/shared/schemas.ts`

- **Found:** 2026-09-23, T-06's whole-branch review, finding M4.
- **Owner decision:** 2026-09-23 — tech debt (same message as TD-4).
- **What:** `z.config({ jitless: true })` runs as a side effect when `src/shared/schemas.ts` is
  imported. It stops Zod's JIT from probing `new Function("")` on the first parse, which the
  browser reports as a CSP violation under ADR-0006's policy (no `'unsafe-eval'`). A client module
  that parses with Zod without importing `schemas.ts` first — `src/shared/tool-schema.ts` imports
  `zod` directly and is not on the client yet — would probe eval again.
- **Risk:** a CSP violation report in the console, and Zod's slower non-JIT path would then not
  apply; nothing breaks for the user, since Zod catches the probe's throw.
- **Guarded meanwhile by:** the unit test in `tests/unit/shared/auth-schemas.test.ts` (the setting
  is on once `schemas.ts` loads) and the E2E fixtures' automatic CSP-violation guard, which fails
  any E2E test whose page reports the probe.
- **Fix:** set `jitless` in one module every client entry imports, or import `schemas.ts` from
  `tool-schema.ts`, when the WebMCP tools (T-11/T-12) first parse with Zod in the browser.
- **Closed:** 2026-09-24, T-11 (`claude/t-11-planlamasi-xmew0s`) — `src/webmcp/adapter.ts` imports
  `WebMcpModeSchema` from `src/shared/schemas.ts` (for `NEXT_PUBLIC_WEBMCP_MODE` validation) as an
  ordinary part of its own job, not a fix added for this entry; `adapter.ts` is itself imported by
  `WebMcpProvider.tsx`, mounted in `app/(app)/layout.tsx` ahead of anything in `src/webmcp` that
  parses with Zod (`defineTool.ts`'s `input.safeParse`, T-12's tool registries), so `jitless` is
  already set by the time any of them runs. `tests/unit/webmcp/adapter.test.ts` pins the import.

## TD-6 — `next dev` fills the console with CSP violations

- **Found:** 2026-09-23, during T-07's execution — the owner pasted the browser console of a
  `next dev` session (~20:41 +04): an `eval() is not supported` error from React and a run of
  "Applying inline style violates … `style-src 'self' 'nonce-…'`" errors. The stacks name
  Next's own development tooling (`next-devtools`, `dev-overlay.browser.tsx`, `font-styles.tsx`,
  `style-loader`'s `styleTagTransform`); none names a file of this repository, and neither
  `app/` nor `src/` has a `style` prop. The last two violations (`react-dom-client.production.js:9252`)
  show no devtools frame and were assumed, not verified, to come from the same overlay.
- **Owner decision:** 2026-09-23 — asked for the entry ("Zəhmət olmasa TD-6 qeydini yarat.");
  whether and how to fix is not decided. Any change to the policy is an ADR-0006 amendment,
  which only the owner accepts.
- **What:** `middleware.ts` builds one policy for every environment: `script-src 'self'
  'nonce-…'; style-src 'self' 'nonce-…'` (`middleware.ts:58`). In development, React needs
  `eval` to reconstruct server error stacks in the browser, and Next's overlay injects
  `<style>` tags of its own, without this response's nonce. Next's content-security-policy
  guide (`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`, "Development
  vs Production Considerations") says so and relaxes the policy in development only:
  `'unsafe-eval'` in `script-src`, `'unsafe-inline'` instead of the nonce in `style-src`.
- **Risk:** dev-only. The console is noisy enough that a real CSP violation from the
  application's own code is easy to miss while developing, and the overlay itself may render
  unstyled. Nothing reaches production: E2E and the CSP guard run against the production build.
- **Guarded meanwhile by:** the E2E fixtures' automatic CSP-violation guard and
  `tests/api/app-pages.spec.ts` / `auth-pages.spec.ts` (every inline tag carries the response's
  nonce), all against `next build && next start` (ADR-0003: E2E never runs on `next dev`).
- **Fix (options, for the owner):** (a) leave it and note in the README that CSP errors from
  `next-devtools` are expected under `npm run dev`; (b) build a development variant of the policy
  in `middleware.ts`, as Next's guide does, with API tests that pin the production policy
  byte for byte so the relaxation can never ship. (b) needs a dated ADR-0006 amendment first
  (the app's policy would then differ per environment) and is a change to `middleware.ts`, so
  it reads TD-2 (the `proxy` rename) first.
- **Owner decision (b):** 2026-09-24 — chose option (b) ("b"). TD-2 read first: the file stays
  `middleware.ts`, so the rename, when it comes, moves `buildCsp`'s one call site and nothing
  else; the policy lives in `src/server/csp.ts`.
- **Fix in review:** 2026-09-24, branch `fix/td-6-dev-csp` — `buildCsp` (`src/server/csp.ts`)
  relaxes the policy only for `NODE_ENV === "development"`; ADR-0006 amendment (4) is **Accepted**
  (owner, 2026-09-24); `tests/unit/server/csp.test.ts` pins both variants and
  `tests/api/middleware.spec.ts` pins the production policy on a production build's response.
  Checked by hand: `next dev` answers `script-src … 'unsafe-eval'; style-src 'self'
  'unsafe-inline'`, `next build && next start` answers the unchanged production policy.
- **Closed:** 2026-09-24, PR #23 (`fix/td-6-dev-csp`, merge `dc2dba3`) — the owner accepted ADR-0006
  amendment (4) and merged; `npm run dev` now sends the relaxed policy, the production policy is
  pinned by unit and API tests. Still open, as recorded in the process log: whether an amendment
  inside an Accepted ADR meets `governance.md` line 40 (a superseding ADR is the alternative).

## TD-7 — The WebMCP status indicator can keep saying `unavailable` while a new registration runs

- **Found:** 2026-09-24, PR-A's final review (process log, "PR-A, Origin-Agent-Cluster for Firefox
  and WebKit"), deferred as minor: "`clearFailure()` in `register` does not notify status
  listeners".
- **Owner decision:** 2026-09-24 — an entry, fixed before T-14 in T-13c (owner's answer to the
  pre-T-14 planning questions).
- **What:** `register()` (`src/webmcp/adapter.ts:123`) calls `clearFailure()`, which resets
  `registrationFailed`, but calls `notify()` only at its end (`:156`), after the polyfill has
  loaded and every `registerTool` has settled. `mode()` reads the flag directly and is right at
  once; the listener `WebMcpProvider` registers through `onStatus`
  (`src/webmcp/WebMcpProvider.tsx:20`), which feeds the indicator, keeps the last pushed status,
  `unavailable`, until then.
- **Risk:** low — the indicator shows `unavailable` for the length of one registration after a
  page whose every registration was rejected. The app's effect cleanup calls `unregisterAll()`
  first, which does notify, so the window opens only when `register()` runs twice without it.
- **Guarded meanwhile by:** nothing that checks the pushed status between the two points;
  `tests/unit/webmcp/adapter.test.ts` checks it after `register()` resolves.
- **Fix:** notify once the failure is cleared (or push the status that `mode()` already reports),
  with a unit test that reads the listener's value while `registerTool` is still pending — red
  on today's code.
- **Fix in review:** 2026-09-25, `task/T-13c-tech-debt` (`7b37e18`) — `register()`
  (`src/webmcp/adapter.ts`) calls `notify()` right after `clearFailure()` when a failure was
  cleared. `tests/unit/webmcp/adapter.test.ts` reads the listener's value while `registerTool` is
  still pending — red on the old code (the last pushed status was `unavailable`, `mode()` said
  `polyfill`), green now — and pins that a `register()` after no failure pushes nothing. Known and
  not fixed: the first test checks the last pushed status, not that `notify()` fired exactly once.
- **Closed:** 2026-09-25, PR #39 (`task/T-13c-tech-debt`, merge `8ffe0b1`) — the owner merged it (2026-09-25,
  07:24 UTC); CI on the PR's last head (`f5e7a1c`) was green.

## TD-8 — The keyboard login walkthrough's comment says "Shift+Tab back"

- **Found:** 2026-09-23, T-06's whole-branch review, finding M2 (process log, "Build (T-06): Auth
  UI"), deferred: "the login walkthrough's comment says 'Shift+Tab back', but the test focuses the
  field programmatically".
- **Owner decision:** 2026-09-24 — an entry, fixed before T-14 in T-13c.
- **What:** the doc comment of `tests/e2e/auth-accessibility.spec.ts`'s "keyboard-only login"
  (`:11-16`) describes "Shift+Tab back to the fields, type the demo credentials, Enter submits".
  The test types the credentials on the way forward and then calls `password.focus()` (`:39`)
  before Enter — no Shift+Tab is pressed.
- **Risk:** a reader believes reverse tab order is covered on `/login`; it is not.
- **Guarded meanwhile by:** nothing; the test itself passes either way.
- **Fix:** make the comment say what the test does, or make the test do what the comment says
  (Shift+Tab from "Sign Up" back to the password field). Which one is a test-design choice for
  T-13c's plan; the second one adds a reverse-order check SPEC-auth §6 does not ask for.
- **Fix in review:** 2026-09-25, `task/T-13c-tech-debt` (`b9805e4`) — the doc comment of the
  keyboard-only login test says what the test does — forward order, the field focused directly,
  Enter — and that reverse order is not walked, because SPEC-auth §6 documents the forward order
  only. No test changed; the owner waived the failing-first line for a comment (T-13c plan, Q1
  (a)). The unchanged test passes on Chromium, Firefox and WebKit (3 passed).
- **Closed:** 2026-09-25, PR #39 (`task/T-13c-tech-debt`, merge `8ffe0b1`) — the owner merged it (2026-09-25,
  07:24 UTC); CI on the PR's last head (`f5e7a1c`) was green.

## TD-9 — The `minmax(0, 1fr)` rule for card grids is a comment, not a check

- **Found:** 2026-09-24, T-10's process-log entry, lesson 1: a grid or flex track's default
  `min-width: auto` lets one fixed-size item (Budgets' donut) force every card in its column wider
  than the page at 320 px; "worth a standing note (or a lint/test rule, considered but not added
  here)".
- **Owner decision:** 2026-09-24 — an entry, fixed before T-14 in T-13c.
- **What:** `app/(app)/overview/page.module.css` (`:1-9`, the comment) and
  `src/ui/overview/PotsCard.module.css:57` use `minmax(0, 1fr)` instead of `1fr`, and
  `min-inline-size: 0` on flex items of `Shell`'s `<main>`. Nothing fails if a new grid writes
  `1fr`.
- **Risk:** a Release 2 page with a new card grid overflows at 320 px (US-33 AC2). The E2E check
  below finds it only once the page is in its list and only as a page-level scroll; a card that
  clips its overflowing content inside itself passes.
- **Guarded meanwhile by:** `tests/e2e/app-shell.spec.ts:98` — US-33 AC2, no page in its `PAGES`
  list scrolls sideways at 320, 375, 768, 1024 or 1440 px.
- **Fix:** a check that fails on a bare `fr` track in `grid-template-columns` of any
  `*.module.css` — a unit test over the CSS files, or a lint rule if the project adopts a CSS
  linter. Which one is decided at T-13c's plan gate; the check needs a violation fixture
  (DoD v1.1).
- **Fix in review:** 2026-09-25, `task/T-13c-tech-debt` (`bb6e2fe`) — `stylelint.config.mjs`
  (Stylelint's `declaration-property-value-disallowed-list` on `grid-template-columns`) fails a
  `fr` track that is not the maximum of a `minmax(<definite>, …)`; `npm run lint:css` runs it over
  every `.css` under `app/` and `src/`, and `npm run lint` runs it after ESLint.
  `tests/unit/css-grid.test.ts` runs the shipped config over a violation fixture and a control
  (`tests/fixtures/css-grid/`) and over the real tree; changing `PotsCard.module.css` and
  `page.module.css` to `1fr 1fr` turned `lint:css` and the real-tree test red, and removing the
  regex's first lookbehind turned the control fixture red (its `1.5fr` and `11fr` tracks read as
  bare).
  Owner decision (Q4): a linter, not the unit test the plan recommended; it adds the dev
  dependency `stylelint` 17.15.0 (75 packages, `npm audit` 0, the install-script test still
  passes). Not read: rows, `grid-auto-columns`, the `grid` shorthands, a track list held in a
  `var()`. Known and not fixed: the property name is matched in lower case only (Prettier
  lowercases it in `format:check`).
- **Closed:** 2026-09-25, PR #39 (`task/T-13c-tech-debt`, merge `8ffe0b1`) — the owner merged it (2026-09-25,
  07:24 UTC); CI on the PR's last head (`f5e7a1c`) was green.

## TD-10 — Nothing stops `APP_ENV=test`, `db:reset` or `test:api` from running against a non-local database

- **Found:** 2026-09-22, T-02 — written as a hand-off into T-14's row ("startup guard so
  `APP_ENV=test` can never run in production; … guard `test:api`/`db:reset` against a non-local
  `DATABASE_URL`").
- **Owner decision:** 2026-09-24 — an entry, fixed before T-14 in T-13c rather than in T-14, so
  the security review (T-13d) reads the guard and not its absence.
- **What:** `/api/test/reset`, `/api/test/seed` and `/api/test/log` exist when `APP_ENV` is exactly
  `test` (`src/server/env.ts:16`, `src/server/test-support.ts:50-52`) and need no session.
  `npm run db:reset` (`prisma migrate deploy && prisma db seed`) and `npm run test:api` use whatever
  `DATABASE_URL` the shell or `.env*` gives them.
- **Risk:** `APP_ENV=test` set on the production project by mistake makes the unauthenticated
  reset and seed routes live on the public demo; a shell holding the production `DATABASE_URL`
  resets production data from a laptop. Neither has happened: no production environment exists
  before T-14.
- **Guarded meanwhile by:** `isTestEnv`'s exact match (`Test`, `test ` and an unset variable are
  not test) and its unit tests; nothing about where the process runs.
- **Fix:** designed at T-13c's plan gate. The guard cannot key on `NODE_ENV`: CI and every local
  API/E2E run start a production build with `APP_ENV=test` (`playwright.config.ts:68-74`, ADR-0003).
  Candidates: refuse `APP_ENV=test` when the platform says it is a deployment (Vercel sets
  `VERCEL` and `VERCEL_ENV`), and refuse `db:reset`/`test:api` when the `DATABASE_URL` host is not
  local — each with a test that fails first.
- **Fix in review:** 2026-09-25, `task/T-13c-tech-debt` (`c1ef26d`, fix round `c316e3b`) —
  `src/shared/env.ts` — `isLocalDatabaseUrl`, `localDatabaseRefusal`, `testEnvRefusal`.
  `next.config.ts` refuses `APP_ENV=test` on Vercel (`VERCEL`, `VERCEL_ENV`) and with a
  `DATABASE_URL` that is not `localhost`, `127.0.0.1` or `[::1]` (or carries `host`/`hostaddr`);
  `isTestEnv` refuses the same at runtime; `prisma/seed.ts` and `playwright.config.ts` refuse a
  non-local `DATABASE_URL` after their `.env.local` load, and `prisma.config.ts` refuses it for
  `npm run db:reset` before `prisma migrate deploy`, that script's first step, applies any
  migration (the owner's choice B, below). A direct `npx prisma migrate deploy` is not guarded,
  by design: T-14 runs it against Neon, and CI against its own database. Not keyed on
  `NODE_ENV`. The `VERCEL` line depends on Vercel's project setting 'Enable access to System
  Environment Variables'; the database line does not. The guard fails closed: it also
  refuses a scheme other than `postgres:`/`postgresql:`, a value with whitespace and a value with
  a malformed percent escape. The first version parsed the raw string with `new URL`; the Opus
  review of Task 4 found that node-postgres (`pg-connection-string`) re-encodes a value with a
  space or a malformed `%` and parses the result against a base, so
  `http://localhost\@evil.example.com/db` plus a trailing space was local to the guard and
  `evil.example.com` to pg (a leading space gave the host `base`). The fix round added four rows
  to the unit table: one isolates the scheme, one a leading space, one a malformed escape, and
  the fourth is the bypass itself, which either of two conditions catches; removing a condition
  turned its own rows red. The re-review's differential fuzz — 1.4 million random URLs against
  `pg-connection-string` — found no URL the guard accepts that pg sends to a non-local host (the
  reviewer's run, not repeated here). The refusal messages (`b041b16`) and `.env.example`'s
  comment name the whole rule. Known and not fixed: the seed and Playwright guards have no
  standing cut-out fixture (only `next.config.ts` has one), and the seed's control test asserts
  a non-zero exit and no `Refusing` line, not that a connection was tried. The `prisma.config.ts`
  guard of the owner's choice B has the same first gap (the `db:resett` mutation was a one-off
  run, not a fixture) and a second: no test pins its position after the `.env.local` load. Every
  test sets `DATABASE_URL` in the environment, which wins over the file, so moving the guard above
  `loadEnvFile` would leave all seven tests of `database-guard.test.ts` green while a
  `DATABASE_URL` held only in `.env.local` — the case `vercel env pull` would create — went
  unrefused (read from the code, not run). Two more items from the Opus 5.5 review of the
  follow-up are left as they are: the refusal message says "this step resets or seeds that
  database" though it now also fires at `prisma migrate deploy` — acceptable, "this command"
  would be exact; and the control test for `localhost:1` asserts `toContain("localhost")`, which
  the refusal's own text also matches, where `localhost:1` would be sharper.
- **Owner's choice B, `db:reset` before `migrate deploy`:** 2026-09-25, after PR #39 was opened.
  The seed refused another machine's database, but `prisma migrate deploy`, the first step of
  `db:reset` (`prisma migrate deploy && prisma db seed`), would already have applied every
  pending migration of the checkout to whatever `DATABASE_URL` named — an unmerged
  feature-branch migration could reach Neon before the seed refused. The whole-branch review
  raised it (its Minor 2); the owner chose among A leave it, B check in `prisma.config.ts`, C a
  separate guard script and D drop `migrate deploy` from `db:reset`, and answered "B".
  `prisma.config.ts` now calls `localDatabaseRefusal` after its `.env.local` load when
  `npm_lifecycle_event` is `db:reset`, prints the refusal and exits 1 (a thrown error would be
  wrapped by Prisma in "Failed to load config file <absolute path> as a TypeScript/JavaScript
  module"). It is keyed on the npm script's name, not on the Prisma command, because T-14 runs
  `npx prisma migrate deploy` on the deployed database directly and CI runs it too. The seed's
  own check stays as the second line, and is the only one for `npx prisma db seed`. Three
  child-process tests in `tests/unit/database-guard.test.ts`: `npm run db:reset` against
  another machine's URL is refused and Prisma never names its host, so no migration ran; the
  same command against `localhost:1` is not refused and reaches the connection; a direct
  `npx prisma migrate deploy` against the other machine's URL is not refused either. Not
  guarded, still: a direct `prisma migrate deploy`, by design, and the stock reset commands
  (T-13d, item 3).
- **Closed:** 2026-09-25, PR #39 (`task/T-13c-tech-debt`, merge `8ffe0b1`) — the owner merged it (2026-09-25,
  07:24 UTC); CI on the PR's last head (`f5e7a1c`) was green.

## TD-11 — Every `next build` downloads Public Sans from Google Fonts

- **Found:** 2026-09-24, PR #36's CI (a docs-only change): `E2E (WebKit, polyfill)` failed at
  `next build` after 1m15s. Turbopack reported "Module not found: Can't resolve
  '@vercel/turbopack-next/internal/font/google/font'" for the six `src: url(…)` entries of the
  font CSS, whose URLs point at `https://fonts.gstatic.com`. The other three E2E legs and the API
  job built the same commit. In the same minute (18:15–18:16 UTC), PR #37's `E2E (Chromium, off)`
  failed at its build with the same error, so this was an outage window, not one flaky runner.
- **Owner decision:** 2026-09-24 — "a": an entry, fixed in T-13c. The owner first asked whether
  the font was not installed locally ("Google font local install olmayıb?"). It is not.
- **What:** `app/layout.tsx:2` imports `Public_Sans` from `next/font/google`, as
  `design-tokens.md` §Typography says ("`next/font/google`, weights 400 and 700"). No font file is
  in the repository. `next/font/google` serves the font from the app itself at runtime, so
  browsers never contact Google and the CSP stays `'self'`. It downloads the files **at build
  time**, though, so every build needs Google Fonts to be reachable.
- **Risk:** a red check unrelated to the change whenever Google Fonts is slow or unreachable. That
  is five builds per CI push (the API job and four E2E legs), plus Vercel's build from T-14 on,
  where a failed build is a failed deploy.
- **Guarded meanwhile by:** nothing — re-running the failed job.
- **Fix:**
  - Serve Public Sans with `next/font/local`, keeping `variable: "--font-public-sans"` and
    `display: "swap"`, so `tokens.css` does not change.
  - Commit the `.woff2` files for weights 400 and 700, latin subset, with their source and version
    recorded.
  - Put the font's licence beside the files and list it in T-16's third-party notices. Upstream
    names it SIL OFL 1.1; T-13c's plan confirms this from the source, with the date.
  - Change `design-tokens.md` §Typography's `next/font/google` to the local loader (owner
    decision "a").
  - Add a check that fails if `next/font/google` comes back, e.g. a unit test on `app/layout.tsx`'s
    imports, with a violation fixture.
- **Fix in review:** 2026-09-25, `task/T-13c-tech-debt` (`3c57648`, fix round `5d015bf`) —
  `app/layout.tsx` uses `next/font/local` over `app/fonts/` (`@fontsource/public-sans` 5.3.0, latin
  400 and 700, sha256 in `app/fonts/README.md`, `OFL.txt` beside them); `eslint.config.mjs`
  restricts `next/font/google` in `app/` and in every `src/` layer except `server`, and
  `tests/unit/fonts.test.ts` checks the files' hashes, use and licence. With outbound requests
  sent to a dead proxy (`HTTPS_PROXY=http://127.0.0.1:9`), `next build` failed before with
  "Failed to fetch Public Sans from Google Fonts" and passes now; the built CSS has no Google URL.
  On Chromium, Firefox and WebKit the page loads two font files from its own origin and none from
  another (Firefox lists each request twice). Screenshots of the login and Overview pages at 1440,
  768 and 375 px, against the build that used Google Fonts, differ by 46 / 6 / 6 (login) and
  49 / 41 / 28 (Overview) pixels, at identical image sizes; that is Chromium on macOS only, and
  only the login 1440 px diff image was opened (a few glyph edges marked), so "anti-aliasing" is
  read from that one image and from the small counts, not seen in the other five. The files are
  not byte-identical to what `next/font/google` fetched (one variable
  file there, two static weights here); `app/fonts/README.md` says so. Known and not fixed: nothing
  checks the hash of `OFL.txt` (the test reads only its title), and the layout check matches by
  substring, so a commented-out reference would satisfy it. T-16 lists the font in the third-party
  notices (backlog v1.27).
- **Closed:** 2026-09-25, PR #39 (`task/T-13c-tech-debt`, merge `8ffe0b1`) — the owner merged it (2026-09-25,
  07:24 UTC); CI on the PR's last head (`f5e7a1c`) was green.

## TD-12 — Duplicate `pf_session` cookies are read inconsistently

- **Found:** 2026-09-25, T-13d (security review), Finding F-01 — the proxy (`proxy.ts:85`, Next's
  own cookie parser, keeps the **last** of several same-named cookies) and `GET /api/auth/session`
  (`src/server/session.ts:73-80`'s `readCookie`, keeps the **first**) can disagree on which of two
  duplicate `pf_session` cookies is authoritative.
- **Owner decision:** 2026-09-25 — fix now ("Vercelle bağlı heç nəyə toxunma. Qalanlarını
  düzəlt" — don't touch anything Vercel-related, fix the rest; this one is not Vercel-related).
- **What:** verified live: with a valid cookie first and a garbage one second, the session-probe
  route says authenticated but the page/API layer says not; with the order reversed, the opposite.
- **Risk:** low — no authentication bypass (both readers still require a genuinely valid, sealed
  session); the shell's back/forward-cache re-check could disagree with the page/API layer if a
  browser or intermediary ever sends `pf_session` twice, which nothing in this app currently does.
- **Guarded meanwhile by:** nothing; no existing test covers a duplicate cookie.
- **Fix:** make both readers use the same cookie-parsing rule (first-wins or last-wins,
  consistently), with a failing-first test.
- **Fix in review:** 2026-09-25, `task/T-13d-security-review` — `readCookie`
  (`src/server/session.ts`) now keeps the LAST of several same-named cookie pairs
  (`.reverse().find(...)`, not `.findLast(...)`: the project's `tsconfig.json` lib target is
  ES2022, one short of `Array.prototype.findLast`, ES2023), matching `proxy.ts`'s own
  `request.cookies.get`. A new unit test in `tests/unit/server/session.test.ts` failed red
  (`"first"` received, `"second"` expected) before the fix and passes now; the other 11
  `readCookie`/session tests are unaffected (every existing case has exactly one `pf_session`
  occurrence, where `.reverse().find()` and the old `.find()` agree).
- **Closed:** 2026-09-25, PR #47 (`task/T-13d-security-review`, merge `40c27f8`) — the owner merged it
  (2026-09-25, 14:56 UTC); CI on the PR's last head (`ece2791`) was green (GitHub's own "code
  scanning AI findings" run, which this repository does not configure and which did not stop
  the merge, failed on a model-availability error).

## TD-13 — `TRACE` bypasses the proxy entirely on every route

- **Found:** 2026-09-25, T-13d (security review), Finding F-02 — measured live: `TRACE` to
  `/api/overview`, `/login` and `/api/auth/session` all answer a bare `500 Internal Server Error`,
  `text/plain`, with none of `proxy.ts`'s response headers (no CSP, no `nosniff`, no
  `Referrer-Policy`, no `X-Request-Id`) — the request never reaches the code that sets them.
- **Owner decision:** 2026-09-25 — investigated in the same session (below); no application-level
  fix exists, so this stays open as a documented, accepted platform limitation rather than a task
  to fix (owner's "fix the rest" after excluding Vercel-only items; this one turned out to need no
  further code work either way).
- **What:** traced to its exact cause. `next start` logs, for every `TRACE` request on this Next
  16.3.5 / Node 22.22 build:
  ```
  TypeError: 'TRACE' HTTP method is unsupported.
      at new P (.next/server/chunks/[root-of-the-server]__0z62pfp._.js:15:5699)
      ...
  ```
  This is undici's own Fetch-spec `Request` constructor rejecting `TRACE` as a "forbidden method"
  (the WHATWG Fetch standard explicitly forbids `CONNECT`, `TRACE` and `TRACK` from ever
  constructing a `Request`). Next's App Router builds a standards `Request` object from the
  incoming connection before it ever reaches `proxy.ts` or any route handler, so the throw happens
  inside Next's own compiled server code — no application code runs at all for this method, which
  is exactly why none of `proxy.ts`'s headers appear. The body is a fixed, generic string; nothing
  is reflected, so this is not a Cross-Site-Tracing (XST) risk.
- **Risk:** low — the method is already effectively denied (a 500, not a 200), just not through the
  app's own security-header layer; it means "every response carries the pinned headers" has one
  platform-level exception that no code in this repository can change.
- **Guarded meanwhile by:** nothing; no existing test sends `TRACE`. Not worth adding one either —
  the behaviour is Next/undici's own, not this app's, and would break on any upgrade that changes
  undici's wording rather than this app's own logic.
- **Fix:** none available in application code — `TRACE` cannot reach a Next.js App Router route at
  all on this stack, by the Fetch standard's own design. Not carried into T-14 as a deploy check:
  the same undici/Next behaviour applies on Vercel too, since it is not host-specific.

## TD-14 — The proxy's dotted-path exclusion may also skip Next's `.rsc`/`.json` transport forms
of protected pages on Vercel

- **Found:** 2026-09-25, T-13d (security review), Finding F-03 — independently found by two of the
  four review subagents from different evidence. `proxy.ts:27-29`'s matcher excludes any path
  containing a dot (`.*\..*`), meant for static assets; Next 16.3.5 appends
  `(\.json|\.rsc|\.segments\/.+\.segment\.rsc)?` to every proxy matcher it compiles so a proxy also
  covers the RSC/data transport forms of a path — the project's own exclusion swallows that suffix
  too. A `node -e` evaluation of the compiled matcher confirmed the proxy is skipped for
  `/overview.rsc`, `/overview.segments/_tree.segment.rsc` and `/api/overview.json`.
- **Owner decision:** pending — **this is the review's top item; verify it against the T-14
  preview before anything else at that task.**
- **What:** locally **confirmed safe** (`http://localhost:3900`, `next start`, 2026-09-25): every
  one of those paths answers a plain 404, because Next's `.rsc`/data-path normalizer is only active
  in "minimal mode", which `next start` does not use. **Vercel runs Next in minimal mode** — whether
  it then routes `/overview.rsc` to the Overview render without invoking `proxy.ts` could not be
  determined from this checkout (`@vercel/next` is not in `node_modules`). Neither
  `app/(app)/overview/page.tsx` nor its layout checks the session itself.
- **Risk:** if real on Vercel, unauthenticated access to the Overview page's RSC payload — an
  authentication-bypass-class defect (High/Critical by the review skill's rubric). Actual impact in
  Release 1 is Low-to-Medium (the data is the one shared, fictional demo dataset whose credentials
  are already printed on the login page; no server actions exist to reach this way). **Severity
  rises sharply for Release 2**, whose pages will carry the same matcher.
- **Guarded meanwhile by:** nothing; not reachable from this checkout without a Vercel deployment.
- **Fix:** confirm first (one `curl` against the T-14 preview, no cookie, for `/overview.rsc`). If
  exposed, narrow the matcher's exclusion so it no longer swallows Next's own appended suffix, with
  a regression test asserting the RSC/data-path forms of a protected page still require a session.
- **Verified on Vercel (T-14 plan 6.5, 2026-09-26, the seeded preview of PR #60, commit `1bbf028`;
  Deployment Protection's bypass header sent on every request, no session cookie unless stated):**
  - *Positive control, so a leak would have been recognised:* signed in as the demo account,
    `GET /overview` with `RSC: 1` → 200, `text/x-component`, 22 546 bytes, and the body holds the
    page's balance exactly once, formatted as `$4,836.00` — the marker.
  - *Probes without a cookie:* `/overview.rsc` → 302 to `/login?next=%2Foverview` **with**
    `X-Request-Id` (the proxy ran: Next/Vercel normalise the `.rsc` suffix before matching, unlike
    the local `node -e` evaluation above); `/overview` with `RSC: 1` → the same 302;
    `/api/overview.json` → 404 (no request id); `/overview.segments/_tree.segment.rsc` → **200,
    no `X-Request-Id` (the proxy did not run)**, `text/x-component`, 322 bytes — the static route
    tree `(app) → overview → __PAGE__` plus the build id, no data, marker absent.
  - *The other segment forms* (`_full`, `_head`, `_index`, `__PAGE__`, `overview/__PAGE__`,
    `(app)/overview/__PAGE__`, `(app)/__PAGE__`), with and without a session: all 200, 322 bytes,
    no `X-Request-Id`, marker absent, identical in both cases — even for paths that name nothing —
    so on this dynamic route `.segments/*` serves only the static skeleton, whoever asks.
  - *The header form a real Next client sends* (`RSC: 1`, `Next-Router-Prefetch: 1`,
    `Next-Router-Segment-Prefetch: /overview/__PAGE__` on `/overview`): without a cookie → 302 with
    `X-Request-Id` (proxied); signed in → 200, 322 bytes, marker absent.
  - Baselines: `/overview` → 302 to `/login`; `/api/overview` → 401.
- **Verdict (plan Q6 = a):** not exposed. No data is reachable without a session on Vercel, so no
  matcher fix was needed in T-14 and the disclosure rule (a private advisory draft, backlog T-13d)
  did not apply. What the measurement did confirm is the *matcher gap itself* for one URL form —
  `/overview.segments/*` does skip the proxy on Vercel — recorded as TD-19.
- **Closed:** 2026-09-26, by the T-14 measurement above, in review on PR #60 (`task/T-14-deploy`);
  the merge and its date are added when the owner merges (as for TD-12).

## TD-15 — `POST /api/auth/logout` has no CSRF check of its own beyond `SameSite=Lax`

- **Found:** 2026-09-25, T-13d (security review), Finding F-04 — `proxy.ts:82` exempts this route
  from the session check (SPEC-auth §2.10: "logout requires no session"), and
  `src/server/auth.ts:82-89` clears the cookie unconditionally, checking neither `Origin` nor any
  `Sec-Fetch-*` header — unlike the GET `/login?reason=logout` fallback, which ADR-0006 amendment
  (3) gates on exactly `Sec-Fetch-Site: same-origin`, `Sec-Fetch-Mode: navigate`,
  `Sec-Fetch-Dest: document`.
- **Owner decision:** 2026-09-25 — fix now (owner: "fix the rest", not Vercel-related).
- **What:** verified live: a cross-site-shaped `POST` (a hostile `Origin` header, real prior
  session cookie) still answers 204 and clears the session; the *same* shape against the documented
  GET fallback correctly keeps the session. Caveat: `curl` does not enforce `SameSite` the way a
  real browser does, so this proves the server performs no check of its own, not that every modern
  browser is exploitable by a simple cross-site form today.
- **Risk:** low — at most a nuisance logout of the public demo account; no data exposure, no
  privilege change.
- **Guarded meanwhile by:** nothing beyond `SameSite=Lax` itself.
- **Fix:** add the same `Sec-Fetch-Site`/`Origin` check to the POST route, with a failing-first
  test mirroring `tests/api/logout-fallback.spec.ts`'s existing bypass-condition matrix.
- **Fix in review:** 2026-09-25, `task/T-13d-security-review` — `proxy.ts` refuses
  `POST /api/auth/logout` with a 403 (`{"message": "This request must be same-origin"}`, no
  `Set-Cookie`) when `Sec-Fetch-Site: cross-site`; a same-origin request, or one with no
  `Sec-Fetch-Site` header at all (an older client — `SameSite=Lax` is that case's own defence, as
  it always was), is unaffected. Narrower than the GET fallback's strict allow-list on purpose:
  the app's own `logOut()` sends a same-origin `fetch()`, not a navigation, so it never carries
  `Sec-Fetch-Mode: navigate`/`Sec-Fetch-Dest: document`, and the three existing API tests that call
  `POST /api/auth/logout` with no Sec-Fetch header at all stayed green unmodified. Two new tests in
  `tests/api/logout-fallback.spec.ts`: the cross-site case failed red (204 received, 403 expected)
  before the fix and passes now; the same-origin/no-header case already passed (proving it wasn't
  vacuously broken by the fix). Not run through `ErrorEnvelope`/SPEC-auth §2.10 — logout has no
  documented error shape, and this is a proxy-level rejection, not a route-handler answer, so no
  spec amendment was needed either. Full API suite (`tests/api/logout-fallback.spec.ts`,
  `auth.spec.ts`, `proxy.spec.ts`, 43 tests) green together with TD-12/TD-16/TD-18's fixes.
- **Closed:** 2026-09-25, PR #47 (`task/T-13d-security-review`, merge `40c27f8`) — the owner merged it
  (2026-09-25, 14:56 UTC); CI on the PR's last head (`ece2791`) was green (see TD-12 for the one
  GitHub-side run that was not).

## TD-16 — `X-Powered-By: Next.js` is sent on every response

- **Found:** 2026-09-25, T-13d (security review), Finding F-05 — `next.config.ts` sets no
  `poweredByHeader: false` (Next's own default is `true`); confirmed live, repeatedly, on every
  response probed this session.
- **Owner decision:** 2026-09-25 — fix now (owner: "fix the rest", not Vercel-related).
- **What:** a plain framework-fingerprinting header; no requirement asks for its absence.
- **Risk:** low — confirms the framework to an outsider, no more than `package.json` already does
  in this public repository.
- **Guarded meanwhile by:** nothing; no test asserts its absence.
- **Fix:** set `poweredByHeader: false`; add a header-absence assertion alongside the existing
  pinned-header tests in `tests/api/proxy.spec.ts`.
- **Fix in review:** 2026-09-25, `task/T-13d-security-review` — `next.config.ts` sets
  `poweredByHeader: false`. A new API test, "T-13d F-05: no response carries X-Powered-By"
  (`tests/api/proxy.spec.ts`), checks the same four response branches the existing pinned-header
  test uses (a public page, a public API answer, a redirect, a 401); it failed red (`"Next.js"`
  received) before the fix and passes now.
- **Closed:** 2026-09-25, PR #47 (`task/T-13d-security-review`, merge `40c27f8`) — the owner merged it
  (2026-09-25, 14:56 UTC); CI on the PR's last head (`ece2791`) was green (see TD-12).

## TD-17 — The login rate-limit key is client-controlled `X-Forwarded-For` unless the host overwrites it

- **Found:** 2026-09-25, T-13d (security review), Finding F-06 — `src/server/auth.ts:19-26` takes
  the rate-limit key from the first `X-Forwarded-For` entry if present; Next's bare `next start`
  only fills that header when it is absent (`??=`), never overwriting a client-supplied value.
- **Owner decision:** pending.
- **What:** verified live, bounded to 12 requests: 10 failed logins under one spoofed
  `X-Forwarded-For` correctly trip 429 with `Retry-After: 900`; a different spoofed value is
  unaffected — the key is fully client-chosen on this target. A code comment (`auth.ts:20-22`,
  "review finding M4") asserts Vercel overwrites the header for real traffic; **not independently
  verified against Vercel's own documentation or a real deployment in this review.**
- **Risk:** low here specifically because the protected credential is public by design (NFR-S1) —
  the limit guards bcrypt CPU cost and table growth, not a secret. Would be Medium on a host that
  does not overwrite the header, or once a real credential exists behind this mechanism.
- **Guarded meanwhile by:** nothing beyond the (spoofable) per-key limit itself.
- **Fix:** confirm Vercel's own behaviour and cite the source here or in SPEC-auth; if it cannot be
  confirmed, key the limiter on something the app can trust more directly.
- **Confirmed on Vercel (T-14, 2026-09-26):**
  - *Source* (vercel.com/docs/headers/request-headers, read 2026-09-25): "we currently overwrite the
    `X-Forwarded-For` header and do not forward external IPs. This restriction is in place to prevent
    IP spoofing"; `x-real-ip` and `x-vercel-forwarded-for` carry the same value.
  - *Measurement* (plan 6.7, the preview of PR #60, 13 requests): ten failed logins under
    `X-Forwarded-For: 198.51.100.7` → 401 ×10; the 11th under a **different** spoofed value
    (`203.0.113.9`) → **429** with `Retry-After: 896` — the key is the real client address, not a
    value the client chooses. A preview reset (204, which clears `LoginAttempt`) then a correct
    login (200) left no lasting lockout.
- **Closed:** 2026-09-26, by the source and the measurement above, in review on PR #60
  (`task/T-14-deploy`); the merge and its date are added when the owner merges. The code comment
  at `auth.ts:20-22` may now cite the Vercel page. **Not changed:** the app still trusts the first
  `X-Forwarded-For` entry, so on any other host (`next start` behind no proxy, a local run) the key
  remains client-chosen — true of the demo deployment only.

## TD-18 — Successful logins persist an unbounded, never-pruned `LoginAttempt` row

- **Found:** 2026-09-25, T-13d (security review), Finding F-07 — `src/server/rate-limit.ts:55`
  inserts a row on every login, success included; `:58-60` deletes only the failure rows for that
  key on a success. Nothing reads a `success: true` row and nothing prunes them before the next
  full reset.
- **Owner decision:** 2026-09-25 — fix now (owner: "fix the rest", not Vercel-related).
- **What:** verified live: one successful login from a fresh key added one row (`5 → 6`); since
  credentials are public (NFR-S1) and successful logins are never rate-limited, any client can grow
  this table without bound between resets.
- **Risk:** low — demo data, and the scheduled 10-day reset (once T-14's cron runs) truncates the
  table regardless; worst case before a reset is storage/compute pressure on Neon's free tier, and
  each success costs one bcrypt compare.
- **Guarded meanwhile by:** nothing; the scheduled reset is the only bound.
- **Fix:** skip the insert on the success path (it only needs the existing `deleteMany` call), or
  prune rows older than the rate-limit window on write.
- **Fix in review:** 2026-09-25, `task/T-13d-security-review` — `recordAttempt`
  (`src/server/rate-limit.ts`) no longer calls `loginAttempt.create` on the success path; a
  success still deletes the IP's failure rows (SPEC-auth §4: "a successful login clears the IP's
  counter"), unchanged. A new API test, "T-13d F-07/TD-18: a successful login persists no
  LoginAttempt row at all" (`tests/api/auth.spec.ts`), failed red (1 row received, 0 expected)
  before the fix and passes now; the existing rate-limit sequence, stale-window, and
  failure-count tests (which only ever assert on `success: false` rows) and the threshold tests
  (`tests/api/threshold.spec.ts`, including "2,001 failed logins alone never trip it") are
  unaffected.
- **Closed:** 2026-09-25, PR #47 (`task/T-13d-security-review`, merge `40c27f8`) — the owner merged it
  (2026-09-25, 14:56 UTC); CI on the PR's last head (`ece2791`) was green (see TD-12).

## TD-19 — The proxy does not run for Next's `.segments/*` transport URLs on Vercel

- **Found:** 2026-09-26, T-14 plan 6.5 — the measurement that closed TD-14 also showed its
  mechanism is real for one URL form. `proxy.ts`'s matcher excludes any path containing a dot
  (`.*\..*`), which swallows Next's appended `\.segments\/.+\.segment\.rsc` suffix; on Vercel a
  cookie-less `GET /overview.segments/_tree.segment.rsc` answers 200 **without** `X-Request-Id`, so
  the proxy never ran (the `.rsc` and `.json` forms do reach the proxy; see TD-14).
- **Owner decision:** pending.
- **What:** today the response is the same 322-byte static route skeleton for every `.segments/*`
  path, with or without a session, because every route is dynamic (`ƒ` in the build output) and a
  dynamic route has no prerendered segment payload. Nothing behind a session is served.
- **Risk:** none today; **latent**. A route that becomes prerendered or cached (partial
  prerendering, `cacheComponents`, `generateStaticParams` on a protected page) would have its
  segment payloads served at these URLs without any session check, and nothing in the repository
  would fail. Release 2's pages carry the same matcher.
- **Guarded meanwhile by:** every route being dynamic; the measurement in TD-14's entry (re-run
  `/overview.segments/*` cookie-less against a preview whenever a route stops being dynamic).
- **Fix:** narrow the matcher's exclusion to static assets so the appended suffix is no longer
  swallowed — `_next/static`, `_next/image`, `favicon.ico` and real file extensions such as
  `\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|txt|xml)$` — keeping `tests/api/proxy.spec.ts`'s "file
  with an extension never reaches the proxy" test for real assets, and add a regression test that
  the `.segments/*` forms of a protected page require a session (it can only fail first on a
  deployment: `next start` answers 404 for them). Alternatively check the session in the `(app)`
  layout as well (T-14 plan Q6 (c)), which also covers a future matcher change. Its own small pull
  request, per the owner's out-of-scope rule.
- **Picked up by:** the owner decides.

## TD-20 — `pg` treats `sslmode=require` as `verify-full` today; `pg` 9 will not

- **Found:** 2026-09-26, T-14 plan 6.2 — the Vercel build log of the preview, during "Generating
  static pages", prints the warning from `pg-connection-string`: "SECURITY WARNING: The SSL modes
  'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'. In the next major
  version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq
  semantics, which have weaker security guarantees."
- **Owner decision:** pending.
- **What:** the Neon-managed integration's `DATABASE_URL` carries `sslmode=require`, and
  `src/server/db.ts` hands it to `PrismaPg` (`@prisma/adapter-pg` 7.10.0 → `pg` 8.23.0,
  `pg-connection-string` 2.14.0) unchanged. On `pg` 8 that means the certificate **is** verified.
  Under libpq semantics, `require` encrypts the connection but does not verify the server's
  certificate.
- **Risk:** low today, latent. A move to `pg` 9 (through `@prisma/adapter-pg` or an override) would
  silently drop certificate verification on the path to Neon, and no test would notice. Dependabot
  in this repository watches GitHub Actions only (`.github/dependabot.yml`), so such a bump would be
  a deliberate `npm` change.
- **Guarded meanwhile by:** `package-lock.json` (`pg` 8.23.0) and the warning itself in every
  Vercel build log.
- **Fix:** one of — pin `pg` below 9 with a commented `overrides` entry and a removal task (the
  owner's preference for `npm audit`, `package.json`'s `"//"` note); pass an explicit `ssl` option
  in `createDb` so the behaviour does not depend on the URL's `sslmode`; or append
  `uselibpqcompat=true` / `sslmode=verify-full` when the URL is read (the integration's URL cannot be
  edited by hand). A unit test on `createDb`'s options would pin it either way.
- **Picked up by:** the owner decides.
