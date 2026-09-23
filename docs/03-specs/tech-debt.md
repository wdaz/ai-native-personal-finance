# Tech debt — Release 1

Status: **Approved** (v1.3 — 2026-09-23: TD-1 closed by T-07; v1.2 — 2026-09-23: TD-1 assigned to T-07, owner decision at the T-07 plan gate; v1.1 — 2026-09-23: TD-4 and TD-5 from T-06's whole-branch review, owner decision; v1.0 — 2026-09-23, owner decision at the T-06 plan gate: tech debt lives in its own file, linked from `backlog.md`, so the link is never lost) · Author(s): Agent · Date: 2026-09-23

Known shortcuts and fragilities the owner has decided to keep for now. Every entry has an id
(`TD-n`), where it was found, the owner's decision, the risk, what guards it meanwhile, the
fix, and the task expected to pick it up. `backlog.md` links here from its Notes. A task that
touches a file an entry names reads the entry first; the task that fixes an entry marks it
**Closed** here — with the date and the PR — and never deletes it.

| Id | Title | Status | Picked up by |
|----|-------|--------|--------------|
| TD-1 | The CSP nonce reaches Next through an undocumented header copy | **Closed** | T-07 |
| TD-2 | `middleware.ts` uses a deprecated file convention (`proxy`) | Open | a small follow-up task, before Next removes the old convention |
| TD-3 | `/_global-error` is prerendered, without the CSP nonce | Open | whichever task first gives the app an error UI of its own |
| TD-4 | Two "submit is focused after an error" E2E assertions prove nothing on Chromium | Open | T-13 (WebKit joins CI), or any task that touches those tests |
| TD-5 | Zod's `jitless` setting rides on importing `src/shared/schemas.ts` | Open | T-11/T-12, the first task that parses with Zod on the client outside the auth forms |

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
- **Closed:** T-07 (`task/T-07-app-shell`) — `middleware.ts` sets the policy on the forwarded
  request headers and its comment says so; the nonce API tests and the E2E CSP guard stayed
  green.

## TD-2 — `middleware.ts` uses a deprecated file convention

- **Found:** 2026-09-23, during T-05 — every `next build` prints a deprecation warning for the
  `middleware` file convention: "Please use 'proxy' instead" (codemod: `npx @next/codemod@canary
  middleware-to-proxy`). Recorded then only in the process log (T-05 entry, "Next"); moved here
  when this file was created, so it has a home.
- **Owner decision:** none yet beyond T-05's "worth a follow-up task" — listed here so it is not
  lost.
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
- **Owner decision:** none yet — listed here so it is not lost.
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
  and CI runs Chromium only until T-13.
- **Risk:** someone removes the focus call; CI stays green; a keyboard user on Safari lands on
  `<body>` after the error and restarts from the top of the page. `npm run test:all` (WebKit
  included) would still catch it locally.
- **Guarded meanwhile by:** the WebKit project in `npm run test:e2e` / `test:all`, run locally
  before every PR (DoD).
- **Fix:** submit those four tests with Enter in the last field instead of `.click()` — focus then
  sits in the input, which the form disables, so only the code's focus call can put it on the
  button (the reviewer measured this). T-13's WebKit CI job also closes the gap.

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
