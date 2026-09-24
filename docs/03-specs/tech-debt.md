# Tech debt — Release 1

Status: **Approved** (v1.11 — 2026-09-24: TD-11, `next build` fetches Public Sans from Google Fonts, found by a failed CI leg on PR #36; fixed in T-13c, owner decision; v1.10 — 2026-09-24, owner decision before T-14: every open entry is fixed before the deploy, each as a backlog task of its own — TD-2 by T-13a, TD-3 by T-13b — and four known items that had no entry become TD-7–TD-10, fixed by T-13c; v1.9 — 2026-09-24: TD-4's evidence note names the right lines and says CI now runs Firefox and WebKit; v1.8 — 2026-09-24: TD-4 closed by T-13; v1.7 — 2026-09-24: TD-6 closed by PR #23; v1.6 — 2026-09-24: TD-5 closed by T-11; v1.5 — 2026-09-24: TD-6 fix in review, owner chose option (b) and accepted ADR-0006 amendment (4); v1.4 — 2026-09-23: TD-6, the dev-mode CSP console noise, owner request during T-07's execution; v1.3 — 2026-09-23: TD-1 closed by T-07; v1.2 — 2026-09-23: TD-1 assigned to T-07, owner decision at the T-07 plan gate; v1.1 — 2026-09-23: TD-4 and TD-5 from T-06's whole-branch review, owner decision; v1.0 — 2026-09-23, owner decision at the T-06 plan gate: tech debt lives in its own file, linked from `backlog.md`, so the link is never lost) · Author(s): Agent · Date: 2026-09-23

Known shortcuts and fragilities the owner has decided to keep for now. Every entry has an id
(`TD-n`), where it was found, the owner's decision, the risk, what guards it meanwhile, the
fix, and the task expected to pick it up. `backlog.md` links here from its Notes. A task that
touches a file an entry names reads the entry first; the task that fixes an entry marks it
**Closed** here — with the date and the PR — and never deletes it.

| Id | Title | Status | Picked up by |
|----|-------|--------|--------------|
| TD-1 | The CSP nonce reaches Next through an undocumented header copy | **Closed** | T-07 |
| TD-2 | `middleware.ts` uses a deprecated file convention (`proxy`) | Open | T-13a (v1.10) |
| TD-3 | `/_global-error` is prerendered, without the CSP nonce | Open | T-13b (v1.10) |
| TD-4 | Two "submit is focused after an error" E2E assertions prove nothing on Chromium | **Closed** | T-13 |
| TD-5 | Zod's `jitless` setting rides on importing `src/shared/schemas.ts` | **Closed** | T-11 |
| TD-6 | `next dev` fills the console with CSP violations (the policy has no dev variant) | **Closed** | `fix/td-6-dev-csp` (PR #23) |
| TD-7 | The WebMCP status indicator can keep saying `unavailable` while a new registration runs | Open | T-13c |
| TD-8 | The keyboard login walkthrough's comment says "Shift+Tab back"; the test focuses the field directly | Open | T-13c |
| TD-9 | The `minmax(0, 1fr)` rule for card grids is a comment, not a check | Open | T-13c |
| TD-10 | Nothing stops `APP_ENV=test`, `db:reset` or `test:api` from running against a non-local database | Open | T-13c (moved from T-14's T-02 hand-off) |
| TD-11 | Every `next build` downloads Public Sans from Google Fonts, so a network hiccup fails the build | Open | T-13c (v1.11) |

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
